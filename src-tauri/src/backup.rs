use crate::{db::SCHEMA_VERSION, AppDb};
use rusqlite::{
    types::{Value as SqlValue, ValueRef},
    Connection,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashMap, HashSet},
    fs::OpenOptions,
    io::Write,
    path::Path,
};
use tauri::{AppHandle, Manager, State};

// Limite atual do IPC de importacao/preview. Exportacao e copia de seguranca
// precisam obedecer ao mesmo limite ate existir importacao em fluxo.
const MAX_BACKUP_BYTES: usize = 64 * 1024 * 1024;

fn check_backup_size(bytes: usize) -> Result<(), String> {
    if bytes > MAX_BACKUP_BYTES {
        Err("Backup acima de 64 MiB: esta versao nao consegue restaura-lo. Exporte pacientes individualmente ou use uma versao com suporte a arquivos maiores.".into())
    } else {
        Ok(())
    }
}

const TABLES: &[&str] = &[
    "users",
    "clinics",
    "professionals",
    "patients",
    "questionnaires",
    "questionnaire_questions",
    "questionnaire_sessions",
    "questionnaire_answers",
    "exams",
    "exam_frames",
    "exam_metrics",
    "reports",
    "appointments",
    "settings",
    "system_logs",
    "calibration_mats",
    "calibration_trials",
    "calibration_frame_chunks",
    "calibration_profiles",
    "calibration_validations",
    "calibration_active",
    "exam_raw_chunks",
    "sqlite_sequence",
];
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum Cell {
    Null,
    Integer(i64),
    Real(f64),
    Text(String),
    Blob(Vec<u8>),
}
impl Cell {
    fn sql(&self) -> SqlValue {
        match self {
            Self::Null => SqlValue::Null,
            Self::Integer(v) => SqlValue::Integer(*v),
            Self::Real(v) => SqlValue::Real(*v),
            Self::Text(v) => SqlValue::Text(v.clone()),
            Self::Blob(v) => SqlValue::Blob(v.clone()),
        }
    }
    fn integer(&self) -> Option<i64> {
        if let Self::Integer(v) = self {
            Some(*v)
        } else {
            None
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TableDump {
    pub name: String,
    pub columns: Vec<String>,
    pub rows: Vec<Vec<Cell>>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BackupFile {
    pub format: String,
    pub format_version: u32,
    pub schema_version: usize,
    pub kind: String,
    pub generated_at: String,
    pub patient_id: Option<i64>,
    pub tables: Vec<TableDump>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupPreview {
    pub kind: String,
    pub generated_at: String,
    pub schema_version: usize,
    pub row_counts: BTreeMap<String, usize>,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    pub kind: String,
    pub patient_id: Option<i64>,
    pub safety_backup: String,
}

fn columns(c: &Connection, table: &str) -> Result<Vec<String>, String> {
    let mut q = c
        .prepare(&format!("PRAGMA table_info(\"{table}\")"))
        .map_err(|e| e.to_string())?;
    let result = q
        .query_map([], |r| r.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}
fn subset(table: &str) -> &str {
    match table{
    "patients"=>" WHERE id=?1", "appointments"|"exams"|"questionnaire_answers"|"questionnaire_sessions"=>" WHERE patient_id=?1",
    "exam_frames"|"exam_metrics"|"reports"|"exam_raw_chunks"=>" WHERE exam_id IN (SELECT id FROM exams WHERE patient_id=?1)",
    "questionnaires"=>" WHERE id IN (SELECT questionnaire_id FROM questionnaire_sessions WHERE patient_id=?1 UNION SELECT questionnaire_id FROM questionnaire_answers WHERE patient_id=?1)",
    "questionnaire_questions"=>" WHERE questionnaire_id IN (SELECT questionnaire_id FROM questionnaire_sessions WHERE patient_id=?1 UNION SELECT questionnaire_id FROM questionnaire_answers WHERE patient_id=?1)",
    "professionals"=>" WHERE id IN (SELECT professional_id FROM exams WHERE patient_id=?1 UNION SELECT professional_id FROM appointments WHERE patient_id=?1)",
    "clinics"=>" WHERE id IN (SELECT clinic_id FROM exams WHERE patient_id=?1 UNION SELECT clinic_id FROM appointments WHERE patient_id=?1 UNION SELECT clinic_id FROM professionals WHERE id IN (SELECT professional_id FROM exams WHERE patient_id=?1 UNION SELECT professional_id FROM appointments WHERE patient_id=?1))",
    _=>" WHERE 0",
}
}
pub fn export_backup(c: &Connection, patient_id: Option<i64>) -> Result<BackupFile, String> {
    if let Some(id) = patient_id {
        let exists: bool = c
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM patients WHERE id=?1)",
                [id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if !exists {
            return Err("Paciente não encontrado.".into());
        }
    }
    let mut tables = vec![];
    for table in TABLES {
        let cols = columns(c, table)?;
        let sql = format!(
            "SELECT * FROM \"{table}\"{}",
            if patient_id.is_some() {
                subset(table)
            } else {
                ""
            }
        );
        let mut q = c.prepare(&sql).map_err(|e| e.to_string())?;
        let args: Vec<SqlValue> = if patient_id.is_some() && sql.contains("?1") {
            vec![SqlValue::Integer(patient_id.unwrap())]
        } else {
            vec![]
        };
        let mut query = q
            .query(rusqlite::params_from_iter(args))
            .map_err(|e| e.to_string())?;
        let mut rows = vec![];
        while let Some(row) = query.next().map_err(|e| e.to_string())? {
            let mut values = vec![];
            for i in 0..cols.len() {
                values.push(match row.get_ref(i).map_err(|e| e.to_string())? {
                    ValueRef::Null => Cell::Null,
                    ValueRef::Integer(v) => Cell::Integer(v),
                    ValueRef::Real(v) => Cell::Real(v),
                    ValueRef::Text(v) => Cell::Text(
                        String::from_utf8(v.to_vec()).map_err(|_| "Texto inválido no banco")?,
                    ),
                    ValueRef::Blob(v) => Cell::Blob(v.to_vec()),
                });
            }
            rows.push(values);
        }
        tables.push(TableDump {
            name: table.to_string(),
            columns: cols,
            rows,
        });
    }
    let generated_at = c
        .query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |r| {
            r.get(0)
        })
        .map_err(|e| e.to_string())?;
    Ok(BackupFile {
        format: "BAROPRESS_BACKUP".into(),
        format_version: 1,
        schema_version: SCHEMA_VERSION,
        kind: if patient_id.is_some() {
            "patient"
        } else {
            "full"
        }
        .into(),
        generated_at,
        patient_id,
        tables,
    })
}
pub fn parse_backup(c: &Connection, content: &str) -> Result<BackupFile, String> {
    check_backup_size(content.len())?;
    let mut backup: BackupFile =
        serde_json::from_str(content).map_err(|e| format!("Arquivo de backup inválido: {e}"))?;
    // Version 5 archives have no calibration tables or physical-result column.
    // Upgrade only the known previous schema; unknown older formats stay rejected.
    if backup.schema_version == 5 && SCHEMA_VERSION >= 7 {
        let legacy: Vec<_> = TABLES
            .iter()
            .filter(|n| !n.starts_with("calibration_") && **n != "exam_raw_chunks")
            .collect();
        if backup.tables.len() != legacy.len()
            || legacy
                .iter()
                .any(|name| backup.tables.iter().filter(|t| &t.name == *name).count() != 1)
        {
            return Err("Backup legado incompleto".into());
        }
        for table in &mut backup.tables {
            if table.name == "exams" {
                let mut expected = columns(c, "exams")?;
                expected.retain(|n| {
                    n != "physical_result_json"
                        && n != "patient_snapshot_json"
                        && n != "analysis_json"
                });
                if table.columns != expected {
                    return Err("Colunas do backup legado incompatíveis".into());
                }
                table.columns.push("physical_result_json".into());
                for row in &mut table.rows {
                    row.push(Cell::Null);
                }
            }
        }
        for table in TABLES
            .iter()
            .filter(|n| n.starts_with("calibration_") || **n == "exam_raw_chunks")
        {
            backup.tables.push(TableDump {
                name: table.to_string(),
                columns: columns(c, table)?,
                rows: vec![],
            });
        }
        backup.schema_version = 6;
    }
    if backup.schema_version == 6 && SCHEMA_VERSION >= 7 {
        for table in &mut backup.tables {
            if table.name == "exams" {
                let mut expected = columns(c, "exams")?;
                expected.retain(|n| n != "patient_snapshot_json" && n != "analysis_json");
                if table.columns != expected {
                    return Err("Colunas do backup legado incompatíveis".into());
                }
                table.columns.push("patient_snapshot_json".into());
                for row in &mut table.rows {
                    row.push(Cell::Null);
                }
            }
        }
        backup.schema_version = 7;
    }
    if backup.schema_version == 7 && SCHEMA_VERSION >= 8 {
        for table in &mut backup.tables {
            if table.name == "exams" {
                let mut expected = columns(c, "exams")?;
                expected.retain(|n| n != "analysis_json");
                if table.columns != expected {
                    return Err("Colunas do backup legado incompatíveis".into());
                }
                table.columns.push("analysis_json".into());
                for row in &mut table.rows {
                    row.push(Cell::Null);
                }
            }
        }
        backup.schema_version = 8;
    }
    if backup.schema_version == 8 && SCHEMA_VERSION >= 9 {
        for t in &mut backup.tables {
            if t.name == "users" {
                let mut expected = columns(c, "users")?;
                expected.retain(|n| !["ra", "deleted_at", "session_version"].contains(&n.as_str()));
                if t.columns != expected {
                    return Err("Colunas de contas legadas incompatíveis".into());
                }
                t.columns
                    .extend(["ra".into(), "deleted_at".into(), "session_version".into()]);
                for r in &mut t.rows {
                    r.extend([Cell::Null, Cell::Null, Cell::Integer(0)]);
                }
            }
        }
        backup.schema_version = 9;
    }
    if backup.format != "BAROPRESS_BACKUP"
        || backup.format_version != 1
        || backup.schema_version != SCHEMA_VERSION
        || !["full", "patient"].contains(&backup.kind.as_str())
    {
        return Err("Formato ou versão incompatível com este aplicativo.".into());
    }
    let mut seen = HashSet::new();
    if backup.tables.len() != TABLES.len() {
        return Err("Backup incompleto: faltam tabelas.".into());
    }
    for t in &backup.tables {
        if !TABLES.contains(&t.name.as_str())
            || !seen.insert(t.name.clone())
            || t.columns != columns(c, &t.name)?
        {
            return Err("Tabelas ou colunas incompatíveis.".into());
        }
        if t.rows.len() > 1_000_000
            || t.rows.iter().any(|r| {
                r.len() != t.columns.len()
                    || r.iter()
                        .any(|v| matches!(v,Cell::Real(n) if !n.is_finite()))
            })
        {
            return Err("Registros inválidos no arquivo.".into());
        }
    }
    if backup.kind == "patient" {
        let p = backup.tables.iter().find(|t| t.name == "patients").unwrap();
        if p.rows.len() != 1
            || backup.patient_id.is_none()
            || p.rows[0][0].integer() != backup.patient_id
        {
            return Err("Backup individual deve conter um paciente.".into());
        }
        if backup.tables.iter().any(|t| {
            ["users", "settings", "system_logs", "sqlite_sequence"].contains(&t.name.as_str())
                && !t.rows.is_empty()
        }) {
            return Err(
                "Backup individual não pode conter contas ou configurações globais.".into(),
            );
        }
    }
    Ok(backup)
}
fn preview(b: &BackupFile) -> BackupPreview {
    BackupPreview {
        kind: b.kind.clone(),
        generated_at: b.generated_at.clone(),
        schema_version: b.schema_version,
        row_counts: b
            .tables
            .iter()
            .map(|t| (t.name.clone(), t.rows.len()))
            .collect(),
    }
}
fn foreign_table(column: &str) -> Option<&'static str> {
    match column {
        "patient_id" => Some("patients"),
        "professional_id" => Some("professionals"),
        "clinic_id" => Some("clinics"),
        "questionnaire_id" => Some("questionnaires"),
        "question_id" => Some("questionnaire_questions"),
        "session_id" => Some("questionnaire_sessions"),
        "exam_id" => Some("exams"),
        "frame_id" => Some("exam_frames"),
        _ => None,
    }
}
fn remap_json(
    text: &str,
    maps: &HashMap<String, HashMap<i64, i64>>,
    snapshot: bool,
) -> Result<String, String> {
    let mut value: serde_json::Value =
        serde_json::from_str(text).map_err(|_| "Snapshot histórico inválido")?;
    let mapped = |table: &str, id: i64| -> Result<i64, String> {
        maps.get(table)
            .and_then(|m| m.get(&id))
            .copied()
            .ok_or_else(|| "Referência histórica não encontrada.".into())
    };
    if snapshot {
        if let Some(id) = value["id"].as_i64() {
            value["id"] = mapped("questionnaires", id)?.into();
        }
        if let Some(questions) = value["questions"].as_array_mut() {
            for q in questions {
                if let Some(id) = q["id"].as_i64() {
                    q["id"] = mapped("questionnaire_questions", id)?.into();
                }
            }
        }
    } else if let Some(answers) = value.as_array_mut() {
        for a in answers {
            if let Some(id) = a["questionId"].as_i64() {
                a["questionId"] = mapped("questionnaire_questions", id)?.into();
            }
        }
    }
    serde_json::to_string(&value).map_err(|e| e.to_string())
}
pub fn restore_backup(c: &mut Connection, b: &BackupFile) -> Result<Option<i64>, String> {
    let full = b.kind == "full";
    if !full {
        let patient = b.tables.iter().find(|t| t.name == "patients").unwrap();
        let cpf_index = patient.columns.iter().position(|s| s == "cpf").unwrap();
        if let Cell::Text(cpf) = &patient.rows[0][cpf_index] {
            let exists: bool = c
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM patients WHERE cpf=?1)",
                    [cpf],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            if !cpf.is_empty() && exists {
                return Err(
                    "Já existe um paciente com este CPF. Nenhum dado foi substituído.".into(),
                );
            }
        }
    }
    let tx = c.transaction().map_err(|e| e.to_string())?;
    let previous_session_version: i64 = if full {
        tx.query_row(
            "SELECT COALESCE(MAX(session_version),0) FROM users",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?
    } else {
        0
    };
    if full {
        for table in TABLES.iter().rev() {
            tx.execute(&format!("DELETE FROM \"{table}\""), [])
                .map_err(|e| e.to_string())?;
        }
    }
    let mut maps: HashMap<String, HashMap<i64, i64>> = HashMap::new();
    for name in TABLES {
        let t = b
            .tables
            .iter()
            .find(|t| &t.name == name)
            .ok_or("Tabela ausente")?;
        if !full && ["users", "settings", "system_logs", "sqlite_sequence"].contains(name) {
            continue;
        }
        if full && *name == "sqlite_sequence" {
            tx.execute("DELETE FROM sqlite_sequence", [])
                .map_err(|e| e.to_string())?;
        }
        let id_index = t.columns.iter().position(|s| s == "id");
        let selected: Vec<usize> = (0..t.columns.len())
            .filter(|i| full || Some(*i) != id_index)
            .collect();
        let col_names = selected
            .iter()
            .map(|i| format!("\"{}\"", t.columns[*i]))
            .collect::<Vec<_>>()
            .join(",");
        let slots = (1..=selected.len())
            .map(|i| format!("?{i}"))
            .collect::<Vec<_>>()
            .join(",");
        let sql = format!("INSERT INTO \"{name}\"({col_names}) VALUES({slots})");
        for row in &t.rows {
            let mut values = vec![];
            for i in &selected {
                let mut cell = row[*i].clone();
                if !full {
                    if let Some(parent) = foreign_table(&t.columns[*i]) {
                        if let Some(old) = cell.integer() {
                            let new = maps
                                .get(parent)
                                .and_then(|m| m.get(&old))
                                .copied()
                                .ok_or("Referência ausente no backup individual")?;
                            cell = Cell::Integer(new);
                        }
                    }
                    if *name == "questionnaire_sessions"
                        && ["snapshot_json", "answers_json"].contains(&t.columns[*i].as_str())
                    {
                        if let Cell::Text(text) = cell {
                            cell = Cell::Text(remap_json(
                                &text,
                                &maps,
                                t.columns[*i] == "snapshot_json",
                            )?);
                        }
                    }
                }
                values.push(cell.sql());
            }
            tx.execute(&sql, rusqlite::params_from_iter(values))
                .map_err(|e| format!("Não foi possível importar {name}: {e}"))?;
            if !full {
                if let Some(i) = id_index {
                    let old = row[i].integer().ok_or("Identificador inválido")?;
                    maps.entry(t.name.clone())
                        .or_default()
                        .insert(old, tx.last_insert_rowid());
                }
            }
        }
    }
    let broken: bool = tx
        .prepare("PRAGMA foreign_key_check")
        .map_err(|e| e.to_string())?
        .exists([])
        .map_err(|e| e.to_string())?;
    if broken {
        return Err("Backup contém referências inconsistentes. A importação foi desfeita.".into());
    }
    if full {
        let users: i64 = tx
            .query_row("SELECT COUNT(*) FROM users", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        let admins: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if users > 0 && admins == 0 {
            return Err("Backup de contas sem administrador ativo. Restauração desfeita.".into());
        }
        let restored_session_version: i64 = tx
            .query_row(
                "SELECT COALESCE(MAX(session_version),0) FROM users",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        // Restoring an older database must also revoke sessions in other app windows.
        let next_session_version = previous_session_version
            .max(restored_session_version)
            .checked_add(1)
            .ok_or("Versão de sessão inválida no backup. Restauração desfeita.")?;
        tx.execute(
            "UPDATE users SET session_version=?1",
            [next_session_version],
        )
        .map_err(|e| e.to_string())?;
        crate::calibration::audit_database(&tx)?;
        tx.execute("DELETE FROM calibration_active", [])
            .map_err(|e| e.to_string())?;
        tx.execute("UPDATE calibration_trials SET state='INTERRUPTED',reason='Coleta incompleta restaurada' WHERE state='CAPTURING'", []).map_err(|e|e.to_string())?;
    }
    crate::exam_analysis::audit_database(&tx)?;
    let patient_id = b
        .patient_id
        .and_then(|old| maps.get("patients").and_then(|m| m.get(&old)).copied());
    tx.commit().map_err(|e| e.to_string())?;
    Ok(patient_id)
}
fn safety_copy(c: &Connection, dir: &Path) -> Result<String, String> {
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("Não foi possível criar pasta de segurança: {e}"))?;
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let path = dir.join(format!("BAROPRESS_antes_restauracao_{nonce}.json"));
    // A restauracao nao pode comecar se a copia preventiva nao puder
    // ser restaurada pelo proprio programa.
    let content = serialize_export(c, None)?;
    let mut f = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(|e| format!("Falha na cópia de segurança: {e}"))?;
    f.write_all(&content)
        .and_then(|_| f.sync_all())
        .map_err(|e| format!("Falha na cópia de segurança: {e}"))?;
    Ok(path.to_string_lossy().into())
}

fn serialize_export(c: &Connection, patient_id: Option<i64>) -> Result<Vec<u8>, String> {
    let content =
        serde_json::to_vec_pretty(&export_backup(c, patient_id)?).map_err(|e| e.to_string())?;
    check_backup_size(content.len())?;
    Ok(content)
}

#[tauri::command]
pub fn backups_export(db: State<AppDb>, patient_id: Option<i64>) -> Result<String, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    String::from_utf8(serialize_export(&c, patient_id)?).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn backups_preview(db: State<AppDb>, content: String) -> Result<BackupPreview, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    Ok(preview(&parse_backup(&c, &content)?))
}
#[tauri::command]
pub fn backups_import(
    app: AppHandle,
    db: State<AppDb>,
    acquisition: State<crate::acquisition::AcquisitionState>,
    auth: State<crate::auth::AuthState>,
    content: String,
    confirmed: bool,
) -> Result<RestoreResult, String> {
    if !confirmed {
        return Err("Confirme a importação antes de continuar.".into());
    }
    if crate::acquisition::acquisition_get_status(acquisition)?.acquiring {
        return Err("Pause a aquisição antes de restaurar o banco.".into());
    }
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let collecting: bool = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM calibration_trials WHERE state='CAPTURING')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if collecting {
        return Err("Conclua ou interrompa a coleta experimental antes de restaurar.".into());
    }
    let b = parse_backup(&c, &content)?;
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("backups");
    let safety_backup = safety_copy(&c, &dir)?;
    let patient_id = restore_backup(&mut c, &b)?;
    if b.kind == "full" {
        auth.clear();
    }
    Ok(RestoreResult {
        kind: b.kind,
        patient_id,
        safety_backup,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    #[test]
    fn export_and_safety_copy_use_restore_size_limit() {
        assert!(check_backup_size(MAX_BACKUP_BYTES).is_ok());
        assert!(check_backup_size(MAX_BACKUP_BYTES + 1).is_err());
        let mut isolated = setup();
        let encoded = serialize_export(&isolated, None).unwrap();
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("baropress-backup-test-{nonce}"));
        let safety_path = safety_copy(&isolated, &dir).unwrap();
        let saved = std::fs::read(&safety_path).unwrap();
        assert!(saved.len() <= MAX_BACKUP_BYTES);
        let decoded = parse_backup(&isolated, std::str::from_utf8(&saved).unwrap()).unwrap();
        let expected = parse_backup(&isolated, std::str::from_utf8(&encoded).unwrap()).unwrap();
        assert_eq!(decoded.kind, "full");
        assert_eq!(decoded.schema_version, expected.schema_version);
        assert_eq!(decoded.format_version, expected.format_version);
        assert_eq!(decoded.format, expected.format);
        assert_eq!(
            serde_json::to_value(&decoded.tables).unwrap(),
            serde_json::to_value(&expected.tables).unwrap(),
            "Copia preventiva deve preservar todas as tabelas e valores"
        );
        restore_backup(&mut isolated, &decoded).unwrap();
        std::fs::remove_file(safety_path).unwrap();
        std::fs::remove_dir(dir).unwrap();
    }
    #[test]
    fn schema_six_backup_restores_without_inventing_snapshots() {
        let mut c = setup();
        let mut dump = export_backup(&c, None).unwrap();
        dump.schema_version = 6;
        let users = dump.tables.iter_mut().find(|t| t.name == "users").unwrap();
        for n in ["session_version", "deleted_at", "ra"] {
            let i = users.columns.iter().position(|x| x == n).unwrap();
            users.columns.remove(i);
            for r in &mut users.rows {
                r.remove(i);
            }
        }
        let exams = dump.tables.iter_mut().find(|t| t.name == "exams").unwrap();
        let analysis_index = exams
            .columns
            .iter()
            .position(|v| v == "analysis_json")
            .unwrap();
        exams.columns.remove(analysis_index);
        for row in &mut exams.rows {
            row.remove(analysis_index);
        }

        let index = exams
            .columns
            .iter()
            .position(|v| v == "patient_snapshot_json")
            .unwrap();
        exams.columns.remove(index);
        for row in &mut exams.rows {
            row.remove(index);
        }
        let upgraded = parse_backup(&c, &serde_json::to_string(&dump).unwrap()).unwrap();
        restore_backup(&mut c, &upgraded).unwrap();
        assert!(
            !crate::exams::get_exam(&c, 1)
                .unwrap()
                .patient_snapshot_preserved
        );
        assert_eq!(upgraded.schema_version, crate::db::SCHEMA_VERSION);
    }
    fn setup() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&c).unwrap();
        c.execute(
            "INSERT INTO patients(id,name,cpf) VALUES(1,'Teste','123'),(2,'Outro','456')",
            [],
        )
        .unwrap();
        c.execute("INSERT INTO users(name,email,password_hash,role) VALUES('Admin','teste@example.invalid','hash-de-teste','admin')",[]).unwrap();
        c.execute("INSERT INTO exams(id,patient_id,type,source,status,matrix_json) VALUES(1,1,'static','REAL','completed','[100]'),(2,2,'static','SIMULATION','completed','[200]')",[]).unwrap();
        c.execute(
            "INSERT INTO exam_frames(exam_id,frame_number,timestamp,matrix_data) VALUES(1,0,0,?1)",
            params![vec![0u8, 255, 128]],
        )
        .unwrap();
        c
    }
    #[test]
    fn restore_without_active_admin_rolls_back_and_schema_eight_adds_unknown_ra() {
        let mut c = setup();
        let mut b = export_backup(&c, None).unwrap();
        b.schema_version = 8;
        let users = b.tables.iter_mut().find(|t| t.name == "users").unwrap();
        for n in ["session_version", "deleted_at", "ra"] {
            let i = users.columns.iter().position(|x| x == n).unwrap();
            users.columns.remove(i);
            for r in &mut users.rows {
                r.remove(i);
            }
        }
        let b = parse_backup(&c, &serde_json::to_string(&b).unwrap()).unwrap();
        restore_backup(&mut c, &b).unwrap();
        assert!(c
            .query_row("SELECT ra FROM users LIMIT 1", [], |r| r
                .get::<_, Option<String>>(0))
            .unwrap()
            .is_none());
        let mut bad = export_backup(&c, None).unwrap();
        let users = bad.tables.iter_mut().find(|t| t.name == "users").unwrap();
        let i = users.columns.iter().position(|x| x == "role").unwrap();
        for r in &mut users.rows {
            r[i] = Cell::Text("professional".into());
        }
        assert!(restore_backup(&mut c, &bad).is_err());
        assert_eq!(
            c.query_row("SELECT role FROM users LIMIT 1", [], |r| r
                .get::<_, String>(0))
                .unwrap(),
            "admin"
        );
    }
    #[test]
    fn full_restore_revokes_existing_sessions_even_with_identical_credentials() {
        for restored_version in [0_i64, 7] {
            let mut c = Connection::open_in_memory().unwrap();
            crate::db::migrate(&c).unwrap();
            let auth = crate::auth::AuthState::new().unwrap();
            crate::auth::register_with_ra(
                &mut c,
                &auth,
                "Admin",
                "admin@example.invalid",
                "ContaTeste!2026",
                "admin",
                true,
                Some("00123"),
            )
            .unwrap();
            let mut b = export_backup(&c, None).unwrap();
            let users = b.tables.iter_mut().find(|t| t.name == "users").unwrap();
            let version = users
                .columns
                .iter()
                .position(|s| s == "session_version")
                .unwrap();
            users.rows[0][version] = Cell::Integer(restored_version);
            assert!(crate::auth::current(&c, &auth).is_ok());
            restore_backup(&mut c, &b).unwrap();
            assert!(crate::auth::current(&c, &auth).is_err());
            let next: i64 = c
                .query_row("SELECT session_version FROM users", [], |r| r.get(0))
                .unwrap();
            assert_eq!(next, restored_version + 1);
        }
    }
    #[test]
    fn full_restore_session_version_exhaustion_rolls_back() {
        let mut c = setup();
        let b = export_backup(&c, None).unwrap();
        c.execute("UPDATE users SET session_version=?1", [i64::MAX])
            .unwrap();
        assert!(restore_backup(&mut c, &b).is_err());
        let unchanged: i64 = c
            .query_row("SELECT session_version FROM users", [], |r| r.get(0))
            .unwrap();
        assert_eq!(unchanged, i64::MAX);
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
    }
    #[test]
    fn unsupported_backup_version_is_not_upgraded_as_schema_eight() {
        let c = setup();
        let mut b = export_backup(&c, None).unwrap();
        b.schema_version = 4;
        assert!(parse_backup(&c, &serde_json::to_string(&b).unwrap()).is_err());
    }
    #[test]
    fn full_round_trip_preserves_blobs_and_ids() {
        let mut c = setup();
        let b = export_backup(&c, None).unwrap();
        let content = serde_json::to_string(&b).unwrap();
        let b = parse_backup(&c, &content).unwrap();
        c.execute("DELETE FROM patients WHERE id=1", []).unwrap();
        restore_backup(&mut c, &b).unwrap();
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        assert_eq!(
            c.query_row("SELECT matrix_data FROM exam_frames", [], |r| r
                .get::<_, Vec<u8>>(0))
                .unwrap(),
            vec![0, 255, 128]
        );
    }
    #[test]
    fn patient_backup_excludes_other_patient_and_accounts() {
        let c = setup();
        let b = export_backup(&c, Some(1)).unwrap();
        assert_eq!(
            b.tables
                .iter()
                .find(|t| t.name == "patients")
                .unwrap()
                .rows
                .len(),
            1
        );
        assert_eq!(
            b.tables
                .iter()
                .find(|t| t.name == "exams")
                .unwrap()
                .rows
                .len(),
            1
        );
        assert!(b
            .tables
            .iter()
            .find(|t| t.name == "users")
            .unwrap()
            .rows
            .is_empty());
    }
    #[test]
    fn malformed_schema_rejected_and_failed_restore_rolls_back() {
        let mut c = setup();
        let mut b = export_backup(&c, None).unwrap();
        b.tables[0].name = "users; DROP TABLE patients".into();
        assert!(parse_backup(&c, &serde_json::to_string(&b).unwrap()).is_err());
        let mut b = export_backup(&c, None).unwrap();
        let exams = b.tables.iter_mut().find(|t| t.name == "exams").unwrap();
        let index = exams
            .columns
            .iter()
            .position(|s| s == "patient_id")
            .unwrap();
        exams.rows[0][index] = Cell::Integer(999);
        assert!(restore_backup(&mut c, &b).is_err());
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
    }
    #[test]
    fn patient_import_remaps_ids_without_replacing_existing_patient() {
        let source = setup();
        let b = export_backup(&source, Some(1)).unwrap();
        let mut target = Connection::open_in_memory().unwrap();
        target.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&target).unwrap();
        target
            .execute(
                "INSERT INTO patients(id,name,cpf) VALUES(1,'Preservado','999')",
                [],
            )
            .unwrap();
        let new_id = restore_backup(&mut target, &b).unwrap().unwrap();
        assert_ne!(new_id, 1);
        assert_eq!(
            target
                .query_row("SELECT patient_id FROM exams", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            new_id
        );
        assert_eq!(
            target
                .query_row("SELECT name FROM patients WHERE id=1", [], |r| r
                    .get::<_, String>(0))
                .unwrap(),
            "Preservado"
        );
        assert!(restore_backup(&mut target, &b).is_err());
    }
    #[test]
    fn patient_import_preserves_questionnaire_snapshots() {
        use crate::questionnaires::*;
        let mut source = setup();
        let template = Questionnaire {
            id: None,
            name: "Modelo".into(),
            description: None,
            active: true,
            questions: vec![Question {
                id: None,
                group_name: "Geral".into(),
                question: "Queixa".into(),
                r#type: "text".into(),
                options: vec![],
                required: true,
                active: true,
            }],
        };
        let model = save_questionnaire(&mut source, template.clone()).unwrap();
        answer_questionnaire(
            &mut source,
            model.id.unwrap(),
            1,
            vec![Answer {
                question_id: model.questions[0].id.unwrap(),
                value: serde_json::json!("Registro original"),
            }],
        )
        .unwrap();
        let dump = export_backup(&source, Some(1)).unwrap();
        let mut target = Connection::open_in_memory().unwrap();
        target.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&target).unwrap();
        target
            .execute("INSERT INTO patients(id,name) VALUES(1,'Existente')", [])
            .unwrap();
        save_questionnaire(&mut target, template).unwrap();
        let patient = restore_backup(&mut target, &dump).unwrap().unwrap();
        let history = list_sessions(&target, patient).unwrap();
        assert_ne!(history[0].questionnaire.id, model.id);
        assert_ne!(
            history[0].questionnaire.questions[0].id,
            model.questions[0].id
        );
        assert_eq!(
            Some(history[0].answers[0].question_id),
            history[0].questionnaire.questions[0].id
        );
        assert_eq!(
            history[0].answers[0].value,
            serde_json::json!("Registro original")
        );
    }
    #[test]
    fn rejects_incompatible_version_and_incomplete_tables() {
        let c = setup();
        let mut b = export_backup(&c, None).unwrap();
        b.schema_version = 999;
        assert!(parse_backup(&c, &serde_json::to_string(&b).unwrap()).is_err());
        b.schema_version = SCHEMA_VERSION;
        b.tables.pop();
        assert!(parse_backup(&c, &serde_json::to_string(&b).unwrap()).is_err());
    }
    #[test]
    fn safety_copy_contains_current_data_and_does_not_modify_database() {
        let c = setup();
        let suffix = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("baropress-backup-test-{suffix}"));
        let filename = safety_copy(&c, &dir).unwrap();
        let path = std::path::PathBuf::from(&filename);
        assert!(path.starts_with(&dir));
        let text = std::fs::read_to_string(&path).unwrap();
        let dump = parse_backup(&c, &text).unwrap();
        assert_eq!(dump.kind, "full");
        assert_eq!(preview(&dump).row_counts["patients"], 2);
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        std::fs::remove_file(path).unwrap();
        std::fs::remove_dir(dir).unwrap();
    }
}
