pub mod acquisition;
pub mod agenda;
mod auth;
pub mod backup;
pub mod calibration;
mod command_queue;
mod db;
pub mod exam_analysis;
#[cfg(test)]
mod exam_analysis_tests;
pub mod exams;
mod pagination;
pub mod patients;
mod permissions;
pub mod questionnaires;
pub mod support;
mod users;
#[cfg(test)]
mod workflow_tests;

use std::sync::Mutex;
use tauri::Manager;

pub struct AppDb(pub Mutex<rusqlite::Connection>);

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DashboardStats {
    patients: i64,
    exams: i64,
    appointments_today: i64,
    last_exam_at: Option<String>,
}

#[tauri::command]
fn dashboard_stats(state: tauri::State<AppDb>) -> Result<DashboardStats, String> {
    let c = state.0.lock().map_err(|_| "Banco indisponível")?;
    let n = |sql: &str| {
        c.query_row(sql, [], |r| r.get::<_, i64>(0))
            .map_err(|e| e.to_string())
    };
    Ok(DashboardStats {
        patients: n("SELECT COUNT(*) FROM patients WHERE archived = 0")?,
        exams: n(&format!("SELECT COUNT(*) FROM exams e WHERE e.status = 'completed' AND {}", exams::HISTORY_ENTRY_FILTER))?,
        appointments_today: n("SELECT COUNT(*) FROM appointments WHERE date = date('now','localtime') AND status <> 'cancelled'")?,
        last_exam_at: c.query_row("SELECT MAX(started_at) FROM exams WHERE status = 'completed'", [], |r| r.get(0)).map_err(|e| e.to_string())?,
    })
}

fn dispatch_command(invoke: tauri::ipc::Invoke<tauri::Wry>) {
    let app = invoke.message.webview_ref().app_handle();
    let authorization = {
        let db = app.state::<AppDb>();
        let auth = app.state::<auth::AuthState>();
        let result = match db.0.lock() {
            Ok(c) => {
                let command = invoke.message.command();
                let result = auth::authorize(&c, &auth, command);
                if let Ok(actor) = auth::current(&c, &auth) {
                    if result.is_err()
                        || [
                            "patients_create",
                            "patients_update",
                            "patients_archive",
                            "exams_create",
                            "exams_create_sequence",
                            "exams_update_notes",
                            "exams_add_region",
                            "exams_delete",
                            "appointments_save",
                            "appointments_delete",
                            "questionnaires_answer",
                            "questionnaires_save",
                            "auth_register_user",
                            "backups_import",
                            "backups_export",
                        ]
                        .contains(&command)
                    {
                        let _ = support::add_log(
                            &c,
                            if result.is_ok() { "info" } else { "warn" },
                            command,
                            &format!(
                                "Ator {}; solicitação {}.",
                                actor.id,
                                if result.is_ok() {
                                    "autorizada para execução"
                                } else {
                                    "recusada"
                                }
                            ),
                        );
                    }
                }
                result
            }
            Err(_) => Err("Banco indisponível".into()),
        };
        result
    };
    if let Err(error) = authorization {
        invoke.resolver.reject(error);
        return;
    }
    let handler: fn(tauri::ipc::Invoke<tauri::Wry>) -> bool = tauri::generate_handler![
        auth::auth_has_users,
        agenda::appointments_list,
        agenda::appointments_save,
        agenda::appointments_delete,
        agenda::professionals_list,
        agenda::professionals_create,
        questionnaires::questionnaires_list,
        questionnaires::questionnaires_save,
        questionnaires::questionnaires_answer,
        questionnaires::questionnaires_history,
        backup::backups_export,
        backup::backups_preview,
        backup::backups_import,
        support::app_settings_get,
        support::app_settings_save,
        support::system_logs_add,
        support::system_logs_list,
        auth::auth_register_first,
        auth::auth_login,
        auth::auth_current,
        auth::auth_logout,
        auth::auth_register_user,
        users::users_list,
        users::users_update,
        users::users_delete,
        users::users_recovery,
        calibration::clinical_profiles,
        auth::auth_provision_recovery,
        auth::auth_change_password,
        auth::auth_recover,
        dashboard_stats,
        patients::patients_list,
        patients::patients_get,
        patients::patients_create,
        patients::patients_update,
        patients::patients_archive,
        patients::patients_exam_history,
        acquisition::acquisition_list_ports,
        acquisition::acquisition_connect,
        acquisition::acquisition_disconnect,
        acquisition::acquisition_start,
        acquisition::acquisition_stop,
        acquisition::acquisition_get_status,
        exams::exams_list,
        exams::exams_get,
        exams::exams_sequence,
        exams::exams_update_notes,
        exams::exams_create,
        exams::exams_create_sequence,
        exams::exams_delete,
        exams::exams_raw_frames,
        exams::exams_add_region,
        calibration::calibration_list,
        calibration::calibration_save_mat,
        calibration::calibration_begin,
        calibration::calibration_append,
        calibration::calibration_finish,
        calibration::calibration_review,
        calibration::calibration_reclassify,
        calibration::calibration_frames,
        calibration::calibration_fit,
        calibration::calibration_validate,
        calibration::calibration_activate,
        calibration::calibration_deactivate,
        calibration::calibration_import,
    ];
    let resolver = invoke.resolver.clone();
    let command = invoke.message.command().to_owned();
    if !handler(invoke) {
        resolver.reject(format!("Comando desconhecido: {command}"));
    }
}

pub fn run() {
    let commands =
        command_queue::start(dispatch_command).expect("Falha ao iniciar o processamento");
    // Abrir uma porta COM pode esperar pelo driver. Essa espera não deve ocupar
    // a fila das consultas. Cada fila mantém sua ordem e a autorização em Rust.
    let serial_commands =
        command_queue::start(dispatch_command).expect("Falha ao iniciar o processamento serial");
    tauri::Builder::default()
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            #[cfg(debug_assertions)]
            let test_dir = std::env::var_os("BAROPRESS_TEST_DATA_DIR");
            #[cfg(not(debug_assertions))]
            let test_dir: Option<std::ffi::OsString> = None;
            let isolated = test_dir.is_some();
            let dir = test_dir.map(std::path::PathBuf::from).unwrap_or(dir);
            std::fs::create_dir_all(&dir)?;
            let db_path = dir.join("baropress.db");
            if !isolated && !db_path.exists() {
                if let Some(parent) = dir.parent() {
                    let old_db = parent.join("br.tcc.baropress").join("baropress.db");
                    if old_db.exists() {
                        db::copy_legacy(&old_db, &db_path)?;
                    }
                }
            }
            let conn = db::open(&db_path).map_err(|e| format!("Falha ao abrir o banco: {e}"))?;
            conn.execute("UPDATE calibration_trials SET state='INTERRUPTED',reason='Aplicativo encerrado durante a coleta' WHERE state='CAPTURING'", []).map_err(|e| e.to_string())?;
            app.manage(AppDb(Mutex::new(conn)));
            app.manage(auth::AuthState::new().map_err(std::io::Error::other)?);
            app.manage(acquisition::AcquisitionState::new());

            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }

            Ok(())
        })
        .invoke_handler(move |invoke| {
            let queue = if command_queue::is_serial(invoke.message.command()) {
                &serial_commands
            } else {
                &commands
            };
            if let Err(error) = queue.send(invoke) {
                error.0.resolver.reject("Processamento indisponível. Reabra o aplicativo.");
            }
            true
        })
        .run(tauri::generate_context!())
        .expect("erro ao executar o BAROPRESS");
}
