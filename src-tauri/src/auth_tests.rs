use super::*;
const PW: &str = "ContaTeste!2026";
const NEW: &str = "OutraSenha!2027";
fn setup() -> (Connection, AuthState) {
    let c = Connection::open_in_memory().unwrap();
    crate::db::migrate(&c).unwrap();
    (c, AuthState::new().unwrap())
}
#[test]
fn initial_account_is_admin_hashed_and_no_second_bootstrap() {
    let (mut c, a) = setup();
    let r = register_with_ra(
        &mut c,
        &a,
        "Teste",
        "TESTE@example.invalid",
        PW,
        "professional",
        true,
        Some("000001"),
    )
    .unwrap();
    assert_eq!(r.user.role, "admin");
    assert_eq!(r.user.ra.as_deref(), Some("000001"));
    assert_eq!(current(&c, &a).unwrap().role, "admin");
    assert!(crate::permissions::allows(&r.user.role, "users_list"));
    assert_eq!(r.user.email, "teste@example.invalid");
    let stored: String = c
        .query_row("SELECT password_hash FROM users", [], |r| r.get(0))
        .unwrap();
    assert!(stored.starts_with("$argon2id$"));
    assert_ne!(stored, PW);
    assert!(register(
        &mut c,
        &a,
        "Outra",
        "outro@example.invalid",
        PW,
        "admin",
        true
    )
    .is_err());
    // Existing inactive accounts still close public bootstrap registration.
    c.execute("UPDATE users SET active=0", []).unwrap();
    a.clear();
    assert!(register_with_ra(
        &mut c,
        &a,
        "Outra",
        "outra@example.invalid",
        PW,
        "admin",
        true,
        Some("000002")
    )
    .is_err());
    assert_eq!(
        c.query_row("SELECT COUNT(*) FROM users", [], |row| row.get::<_, i64>(0))
            .unwrap(),
        1
    );
}
#[test]
fn admin_registration_checks_role_identity_and_duplicates() {
    let (mut c, a) = setup();
    assert!(register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "professional",
        false
    )
    .is_err());
    register(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    let u = register(
        &mut c,
        &a,
        "Equipe",
        "equipe@example.invalid",
        PW,
        "professional",
        false,
    )
    .unwrap();
    assert_eq!(current(&c, &a).unwrap().role, "admin");
    assert!(register(
        &mut c,
        &a,
        "Equipe",
        "EQUIPE@example.invalid",
        PW,
        "assistant",
        false
    )
    .is_err());
    assert!(register(
        &mut c,
        &a,
        "Equipe",
        "outra@example.invalid",
        PW,
        "invalid",
        false
    )
    .is_err());
    a.clear();
    login(&c, &a, &u.user.email, PW).unwrap();
    assert!(register(
        &mut c,
        &a,
        "Outra",
        "outra@example.invalid",
        PW,
        "assistant",
        false
    )
    .is_err());
}
#[test]
fn password_and_identity_validation() {
    for pw in [
        "curta1",
        "semnumeroalgum",
        "123456789012",
        "password1234",
        " ContaTeste123",
    ] {
        assert!(validate_password(pw).is_err());
    }
    assert!(validate_password(PW).is_ok());
    assert!(identity("A", "a@b").is_err());
    assert!(identity("Teste", "a@@b.invalid").is_err());
}
#[test]
fn old_argon_account_works_but_storage_cannot_authenticate() {
    let (c, a) = setup();
    c.execute("INSERT INTO users(name,email,password_hash,role) VALUES('Legado','LEGADO@example.invalid',?1,'admin')",[hash("antiga123").unwrap()]).unwrap();
    assert!(authorize(&c, &a, "patients_list").is_err());
    assert!(login(&c, &a, "legado@example.invalid", "errada").is_err());
    login(&c, &a, "legado@example.invalid", "antiga123").unwrap();
    assert!(authorize(&c, &a, "patients_list").is_ok());
    a.clear();
    assert!(current(&c, &a).is_err());
}
#[test]
fn change_requires_current_and_invalidates_session() {
    let (mut c, a) = setup();
    register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    assert!(change(&c, &a, "errada", NEW).is_err());
    change(&c, &a, PW, NEW).unwrap();
    assert!(current(&c, &a).is_err());
    assert!(login(&c, &a, "teste@example.invalid", PW).is_err());
    login(&c, &a, "teste@example.invalid", NEW).unwrap();
}
#[test]
fn recovery_is_one_time_and_generic_for_unknown_or_wrong_code() {
    let (mut c, a) = setup();
    let r = register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    a.clear();
    let known = recover(&mut c, &a, "teste@example.invalid", "errado", NEW).unwrap_err();
    let unknown = recover(&mut c, &a, "ausente@example.invalid", "errado", NEW).unwrap_err();
    assert_eq!(known, unknown);
    recover(&mut c, &a, &r.user.email, &r.recovery_code, NEW).unwrap();
    assert!(recover(&mut c, &a, &r.user.email, &r.recovery_code, PW).is_err());
    assert!(login(&c, &a, &r.user.email, PW).is_err());
    login(&c, &a, &r.user.email, NEW).unwrap();
}
#[test]
fn provision_requires_password_and_rotates_old_code() {
    let (mut c, a) = setup();
    let r = register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    assert!(provision(&c, &a, "errada").is_err());
    let code = provision(&c, &a, PW).unwrap();
    assert_ne!(code, r.recovery_code);
    assert!(recover(&mut c, &a, &r.user.email, &r.recovery_code, NEW).is_err());
    recover(&mut c, &a, &r.user.email, &code, NEW).unwrap();
}
#[test]
fn throttles_five_failed_attempts_and_restores_after_cooldown() {
    let (c, a) = setup();
    for _ in 0..5 {
        assert!(login(&c, &a, "ausente@example.invalid", PW).is_err());
    }
    assert!(login(&c, &a, "ausente@example.invalid", PW)
        .unwrap_err()
        .contains("Aguarde"));
    a.inner.lock().unwrap().blocked_until = Some(Instant::now() - Duration::from_secs(1));
    assert!(!login(&c, &a, "ausente@example.invalid", PW)
        .unwrap_err()
        .contains("Aguarde"));
}
#[test]
fn backend_guards_every_nonpublic_command_and_admin_backups() {
    let (mut c, a) = setup();
    register(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    register(
        &mut c,
        &a,
        "Equipe",
        "equipe@example.invalid",
        PW,
        "assistant",
        false,
    )
    .unwrap();
    a.clear();
    for cmd in [
        "patients_get",
        "exams_create",
        "backups_export",
        "app_settings_get",
        "system_logs_list",
        "acquisition_start",
        "unknown_command",
    ] {
        assert!(authorize(&c, &a, cmd).is_err());
    }
    login(&c, &a, "equipe@example.invalid", PW).unwrap();
    assert!(authorize(&c, &a, "patients_get").is_ok());
    for cmd in ["backups_import", "backups_export", "auth_register_user"] {
        assert!(authorize(&c, &a, cmd).is_err());
    }
}
#[test]
fn database_changes_expiry_and_restart_invalidate_sessions() {
    let (mut c, a) = setup();
    register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    assert!(current(&c, &AuthState::new().unwrap()).is_err());
    a.inner.lock().unwrap().session.as_mut().unwrap().started =
        Instant::now() - Duration::from_secs(8 * 3600 + 1);
    assert!(current(&c, &a).is_err());
    login(&c, &a, "teste@example.invalid", PW).unwrap();
    c.execute("UPDATE users SET active=0", []).unwrap();
    assert!(current(&c, &a).is_err());
}
#[test]
fn credentials_and_recovery_persist_after_database_reopen() {
    let path = std::env::temp_dir().join(format!("baropress-auth-{}.db", random_code().unwrap()));
    {
        let mut c = crate::db::open(&path).unwrap();
        let a = AuthState::new().unwrap();
        register(
            &mut c,
            &a,
            "Teste",
            "teste@example.invalid",
            PW,
            "admin",
            true,
        )
        .unwrap();
    }
    {
        let c = crate::db::open(&path).unwrap();
        let a = AuthState::new().unwrap();
        login(&c, &a, "teste@example.invalid", PW).unwrap();
        let stored: String = c
            .query_row(
                "SELECT value FROM settings WHERE key='auth.recovery.1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert!(stored.starts_with("$argon2id$"));
    }
    std::fs::remove_file(path).unwrap();
}
#[test]
fn legacy_account_without_recovery_cannot_reset_with_email_only() {
    let (mut c, a) = setup();
    c.execute("INSERT INTO users(name,email,password_hash,role) VALUES('Legado','legado@example.invalid',?1,'admin')",[hash(PW).unwrap()]).unwrap();
    assert!(recover(&mut c, &a, "legado@example.invalid", "", NEW).is_err());
    login(&c, &a, "legado@example.invalid", PW).unwrap();
    let code = provision(&c, &a, PW).unwrap();
    recover(&mut c, &a, "legado@example.invalid", &code, NEW).unwrap();
}
#[test]
fn full_backup_preserves_recovery_but_external_hash_change_revokes_session() {
    let (mut c, a) = setup();
    let r = register(
        &mut c,
        &a,
        "Teste",
        "teste@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    let b = crate::backup::export_backup(&c, None).unwrap();
    let (mut restored, other) = setup();
    crate::backup::restore_backup(&mut restored, &b).unwrap();
    recover(&mut restored, &other, &r.user.email, &r.recovery_code, NEW).unwrap();
    c.execute("UPDATE users SET password_hash=?1", [hash(NEW).unwrap()])
        .unwrap();
    assert!(current(&c, &a).is_err());
}
#[test]
fn audit_events_do_not_contain_credentials_or_personal_identifiers() {
    let (c, _) = setup();
    let _: Result<(), String> = audit_result(
        &c,
        "auth_login",
        Err("teste@example.invalid senha-secreta codigo-secreto".into()),
    );
    let message: String = c
        .query_row("SELECT message FROM system_logs", [], |r| r.get(0))
        .unwrap();
    assert_eq!(message, "Operação de conta recusada.");
    assert!(!message.contains("secreta"));
    assert!(!message.contains('@'));
}

#[test]
fn ra_is_required_by_production_registration_unique_and_preserves_zeros() {
    let (mut c, a) = setup();
    assert!(register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("bad")
    )
    .is_err());
    let admin = register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("000123"),
    )
    .unwrap();
    assert_eq!(admin.user.ra.as_deref(), Some("000123"));
    assert!(register_with_ra(
        &mut c,
        &a,
        "Equipe",
        "other@example.invalid",
        PW,
        "professional",
        false,
        Some("000123")
    )
    .is_err());
    let other = register_with_ra(
        &mut c,
        &a,
        "Admin Dois",
        "other@example.invalid",
        PW,
        "admin",
        false,
        Some("000124"),
    )
    .unwrap();
    assert_eq!(other.user.role, "admin");
    assert_eq!(crate::users::list(&c, "00012", 0).unwrap().len(), 2);
    assert!(!authorize(&c, &a, "future_unknown_command").is_ok());
}
#[test]
fn all_registered_commands_have_explicit_access_rules() {
    let src = include_str!("lib.rs");
    let handlers = src
        .split("tauri::generate_handler![")
        .nth(1)
        .unwrap()
        .split("];")
        .next()
        .unwrap();
    let public = [
        "auth_has_users",
        "auth_register_first",
        "auth_login",
        "auth_current",
        "auth_logout",
        "auth_recover",
    ];
    for entry in handlers.split(',').map(str::trim).filter(|s| !s.is_empty()) {
        let command = entry.rsplit("::").next().unwrap();
        if !public.contains(&command) {
            assert!(
                crate::permissions::allows("admin", command),
                "Unmapped command {command}"
            );
        }
    }
    assert!(!crate::permissions::allows("bad", "patients_list"));
}
#[test]
fn role_permissions_block_privileged_and_secretary_clinical_operations() {
    for role in ["professional", "assistant"] {
        for cmd in [
            "users_list",
            "auth_register_user",
            "users_update",
            "users_delete",
            "users_recovery",
            "system_logs_list",
            "system_logs_add",
            "calibration_list",
            "calibration_begin",
            "calibration_import",
            "calibration_fit",
            "backups_preview",
            "backups_export",
            "backups_import",
            "acquisition_list_ports",
            "exams_delete",
            "patients_archive",
        ] {
            assert!(!crate::permissions::allows(role, cmd), "{role}: {cmd}");
        }
    }
    for cmd in [
        "exams_create",
        "exams_add_region",
        "exams_update_notes",
        "acquisition_connect",
        "acquisition_start",
        "appointments_delete",
        "questionnaires_answer",
        "clinical_profiles",
        "dashboard_stats",
    ] {
        assert!(crate::permissions::allows("professional", cmd));
        assert!(!crate::permissions::allows("assistant", cmd));
    }
    for cmd in [
        "patients_create",
        "appointments_list",
        "appointments_save",
        "professionals_list",
        "patients_update",
        "exams_list",
        "exams_get",
        "exams_raw_frames",
        "auth_change_password",
        "app_settings_save",
    ] {
        assert!(crate::permissions::allows("assistant", cmd));
    }
}
fn edit_input(u: &User, role: &str, active: bool) -> crate::users::UserInput {
    crate::users::UserInput {
        name: u.name.clone(),
        email: u.email.clone(),
        ra: u.ra.clone().unwrap_or_else(|| "123456".into()),
        role: role.into(),
        active,
    }
}
#[test]
fn user_update_revokes_sessions_and_protects_last_admin_and_self() {
    let (mut c, a) = setup();
    let admin = register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("1"),
    )
    .unwrap()
    .user;
    assert!(crate::users::update(
        &mut c,
        admin.id,
        admin.id,
        edit_input(&admin, "assistant", true)
    )
    .is_err());
    assert!(crate::users::delete(&mut c, admin.id, admin.id).is_err());
    assert!(crate::users::delete(&mut c, 999, admin.id).is_err());
    assert!(crate::users::update(
        &mut c,
        999,
        admin.id,
        edit_input(&admin, "professional", true)
    )
    .is_err());
    let u = register_with_ra(
        &mut c,
        &a,
        "Equipe",
        "team@example.invalid",
        PW,
        "professional",
        false,
        Some("2"),
    )
    .unwrap()
    .user;
    let other = AuthState::new().unwrap();
    login(&c, &other, &u.email, PW).unwrap();
    crate::users::update(&mut c, admin.id, u.id, edit_input(&u, "assistant", true)).unwrap();
    assert!(current(&c, &other).is_err());
    login(&c, &other, &u.email, PW).unwrap();
    assert_eq!(current(&c, &other).unwrap().role, "assistant");
    crate::users::delete(&mut c, admin.id, u.id).unwrap();
    assert!(current(&c, &other).is_err());
    assert!(login(&c, &other, &u.email, PW).is_err());
    assert_eq!(crate::users::list(&c, "", 0).unwrap().len(), 1);
    assert_eq!(
        c.query_row("SELECT COUNT(*) FROM users", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        2
    );
}
#[test]
fn admin_confirmation_cannot_be_forged_and_throttles_password_guesses() {
    let (mut c, a) = setup();
    register(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    assert!(crate::users::confirm_admin(&c, &a, "wrong").is_err());
    assert!(crate::users::confirm_admin(&c, &a, PW).is_ok());
    for _ in 0..5 {
        assert!(crate::users::confirm_admin(&c, &a, "wrong").is_err());
    }
    assert!(crate::users::confirm_admin(&c, &a, PW)
        .unwrap_err()
        .contains("Aguarde"));
}
#[test]
fn preference_fields_block_hardware_and_clinical_overwrite() {
    let (c, _) = setup();
    let mut p = crate::support::get_preferences(&c).unwrap();
    p.selected_port = "COM99".into();
    assert!(crate::support::save_preferences_for_role(&c, p, "professional").is_err());
    let mut p = crate::support::get_preferences(&c).unwrap();
    p.duration_seconds = 20;
    assert!(crate::support::save_preferences_for_role(&c, p, "assistant").is_err());
    let mut p = crate::support::get_preferences(&c).unwrap();
    p.visualization.gamma = 2.0;
    assert!(crate::support::save_preferences_for_role(&c, p, "professional").is_ok());
    let mut p = crate::support::get_preferences(&c).unwrap();
    p.theme = "dark".into();
    assert!(crate::support::save_preferences_for_role(&c, p, "assistant").is_ok());
}
#[test]
fn secretary_cannot_change_patient_clinical_fields() {
    let (c, _) = setup();
    let json = serde_json::json!({"name":"Paciente teste","socialName":null,"birthDate":null,"sex":null,"cpf":null,"phone":null,"email":null,"address":null,"profession":null,"height":null,"weight":null,"shoeSize":null,"observations":null});
    let mut input: crate::patients::PatientInput = serde_json::from_value(json).unwrap();
    assert!(crate::patients::restrict_clinical_fields(&c, "assistant", None, &input).is_ok());
    input.weight = Some(70.0);
    assert!(crate::patients::restrict_clinical_fields(&c, "assistant", None, &input).is_err());
    let p = crate::patients::create_patient(&c, input.clone()).unwrap();
    input.name = "Cadastro editado".into();
    assert!(crate::patients::restrict_clinical_fields(&c, "assistant", Some(p.id), &input).is_ok());
    input.weight = None;
    assert!(
        crate::patients::restrict_clinical_fields(&c, "assistant", Some(p.id), &input).is_err()
    );
}

#[test]
fn migration_assigns_supplied_ra_only_to_existing_admin_without_elevating_role() {
    for role in ["admin", "professional"] {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch(include_str!("../migrations/0001_init.sql"))
            .unwrap();
        c.execute("INSERT INTO users(id,name,email,password_hash,role) VALUES(12,'Montival','montivallucas@icloud.com','hash-preservado',?1)",[role]).unwrap();
        c.pragma_update(None, "user_version", 8).unwrap();
        crate::db::migrate(&c).unwrap();
        let (ra, stored_role, hash): (Option<String>, String, String) = c
            .query_row(
                "SELECT ra,role,password_hash FROM users WHERE id=12",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        assert_eq!(
            ra,
            if role == "admin" {
                Some("180386".into())
            } else {
                None
            }
        );
        assert_eq!(stored_role, role);
        assert_eq!(hash, "hash-preservado");
    }
}
#[test]
fn duplicate_ra_update_rolls_back_and_disabled_user_cannot_sign_in() {
    let (mut c, a) = setup();
    let admin = register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("1"),
    )
    .unwrap()
    .user;
    let u = register_with_ra(
        &mut c,
        &a,
        "Equipe",
        "team@example.invalid",
        PW,
        "professional",
        false,
        Some("2"),
    )
    .unwrap()
    .user;
    let mut input = edit_input(&u, "assistant", true);
    input.ra = "1".into();
    assert!(crate::users::update(&mut c, admin.id, u.id, input).is_err());
    assert_eq!(
        c.query_row("SELECT role FROM users WHERE id=?1", [u.id], |r| r
            .get::<_, String>(0))
            .unwrap(),
        "professional"
    );
    crate::users::update(
        &mut c,
        admin.id,
        u.id,
        edit_input(&u, "professional", false),
    )
    .unwrap();
    a.clear();
    assert!(login(&c, &a, &u.email, PW).is_err());
}

#[test]
fn temporary_recovery_expiry_is_checked_and_personal_provision_removes_expiry() {
    let (mut c, a) = setup();
    let r = register(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
    )
    .unwrap();
    c.execute(
        "INSERT INTO settings(key,value) VALUES(?1,datetime('now','-1 minute'))",
        [format!("auth.recovery.expiry.{}", r.user.id)],
    )
    .unwrap();
    assert!(recover(&mut c, &a, &r.user.email, &r.recovery_code, NEW).is_err());
    let code = provision(&c, &a, PW).unwrap();
    assert_eq!(
        c.query_row(
            "SELECT COUNT(*) FROM settings WHERE key=?1",
            [format!("auth.recovery.expiry.{}", r.user.id)],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
    recover(&mut c, &a, &r.user.email, &code, NEW).unwrap();
    assert!(recover(&mut c, &a, &r.user.email, &code, PW).is_err());
}

#[test]
fn ra_recovery_preserves_zeroes_changes_password_and_revokes_other_sessions() {
    let (mut c, a) = setup();
    let r = register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("00180386"),
    )
    .unwrap();
    let other = AuthState::new().unwrap();
    login(&c, &other, &r.user.email, PW).unwrap();
    let mismatch = recover_access(
        &mut c,
        &a,
        &r.user.email,
        Some("180386"),
        Some(&r.recovery_code),
        NEW,
    )
    .unwrap_err();
    let unknown = recover_access(
        &mut c,
        &a,
        "unknown@example.invalid",
        Some("00180386"),
        None,
        NEW,
    )
    .unwrap_err();
    assert_eq!(mismatch, unknown);
    assert!(current(&c, &other).is_ok());
    recover_access(
        &mut c,
        &a,
        " ADMIN@example.invalid ",
        Some("00180386"),
        None,
        NEW,
    )
    .unwrap();
    assert!(current(&c, &a).is_err());
    assert!(current(&c, &other).is_err());
    assert!(login(&c, &a, &r.user.email, PW).is_err());
    login(&c, &a, &r.user.email, NEW).unwrap();
    let ra: String = c
        .query_row("SELECT ra FROM users WHERE id=?1", [r.user.id], |r| {
            r.get(0)
        })
        .unwrap();
    assert_eq!(ra, "00180386");
    // The requested RA identifier remains reusable; old personal/temporary codes are consumed.
    assert!(recover(&mut c, &a, &r.user.email, &r.recovery_code, PW).is_err());
    recover_with_ra(&mut c, &a, &r.user.email, "00180386", PW).unwrap();
    login(&c, &a, &r.user.email, PW).unwrap();
}
#[test]
fn ra_recovery_denies_inactive_deleted_legacy_and_malformed_accounts_without_writes() {
    for state in ["inactive", "deleted", "legacy", "malformed"] {
        let (mut c, a) = setup();
        let r = register_with_ra(
            &mut c,
            &a,
            "Admin",
            "admin@example.invalid",
            PW,
            "admin",
            true,
            if state == "legacy" {
                None
            } else {
                Some("180386")
            },
        )
        .unwrap();
        if state == "inactive" {
            c.execute("UPDATE users SET active=0", []).unwrap();
        }
        if state == "deleted" {
            c.execute("UPDATE users SET deleted_at=datetime('now')", [])
                .unwrap();
        }
        let before: (String, i64) = c
            .query_row("SELECT password_hash,session_version FROM users", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        let ra = if state == "malformed" {
            "180386abc"
        } else {
            "180386"
        };
        assert!(recover_with_ra(&mut c, &a, &r.user.email, ra, NEW).is_err());
        let after: (String, i64) = c
            .query_row("SELECT password_hash,session_version FROM users", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        assert_eq!(before, after);
        if state == "legacy" {
            recover_access(&mut c, &a, &r.user.email, None, Some(&r.recovery_code), NEW).unwrap();
            login(&c, &a, &r.user.email, NEW).unwrap();
        }
    }
}
#[test]
fn ra_recovery_throttles_and_invalid_new_password_does_not_change_account() {
    let (mut c, a) = setup();
    let r = register_with_ra(
        &mut c,
        &a,
        "Admin",
        "admin@example.invalid",
        PW,
        "admin",
        true,
        Some("180386"),
    )
    .unwrap();
    assert!(recover_with_ra(&mut c, &a, &r.user.email, "180386", "curta").is_err());
    for _ in 0..5 {
        assert!(recover_with_ra(&mut c, &a, &r.user.email, "000", NEW).is_err());
    }
    assert!(recover_with_ra(&mut c, &a, &r.user.email, "180386", NEW)
        .unwrap_err()
        .contains("Aguarde um minuto"));
    let stored: String = c
        .query_row("SELECT password_hash FROM users", [], |r| r.get(0))
        .unwrap();
    assert!(verify(PW, &stored));
    assert!(!verify(NEW, &stored));
}
