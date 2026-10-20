use crate::AppDb;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use rand_core::{OsRng, RngCore};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::State;
#[cfg(test)]
#[path = "auth_tests.rs"]
mod tests;

#[derive(Debug, Clone, Serialize)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub ra: Option<String>,
    #[serde(skip)]
    pub session_version: i64,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Registration {
    pub user: User,
    pub recovery_code: String,
}
struct Session {
    user: User,
    fingerprint: String,
    started: Instant,
}
struct AuthInner {
    session: Option<Session>,
    failures: u32,
    blocked_until: Option<Instant>,
}
pub struct AuthState {
    inner: Mutex<AuthInner>,
    dummy_hash: String,
}
impl AuthState {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            inner: Mutex::new(AuthInner {
                session: None,
                failures: 0,
                blocked_until: None,
            }),
            dummy_hash: hash(&random_code()?)?,
        })
    }
    pub fn clear(&self) {
        if let Ok(mut s) = self.inner.lock() {
            s.session = None;
        }
    }
    pub(crate) fn check_password(&self, c: &Connection, password: &str) -> Result<(), String> {
        self.throttle()?;
        let user = current(c, self)?;
        let stored: String = c
            .query_row(
                "SELECT password_hash FROM users WHERE id=?1",
                [user.id],
                |r| r.get(0),
            )
            .map_err(|_| "Banco indisponível")?;
        let valid = password.len() <= 1024 && verify(password, &stored);
        self.attempt(valid);
        if valid {
            Ok(())
        } else {
            Err("Senha atual incorreta.".into())
        }
    }
    fn throttle(&self) -> Result<(), String> {
        let mut s = self.inner.lock().map_err(|_| "Autenticação indisponível")?;
        if s.blocked_until.is_some_and(|t| t > Instant::now()) {
            return Err("Muitas tentativas. Aguarde um minuto e tente novamente.".into());
        }
        if s.blocked_until.take().is_some() {
            s.failures = 0;
        }
        Ok(())
    }
    fn attempt(&self, success: bool) {
        if let Ok(mut s) = self.inner.lock() {
            if success {
                s.failures = 0;
                s.blocked_until = None;
            } else {
                s.failures += 1;
                if s.failures >= 5 {
                    s.blocked_until = Some(Instant::now() + Duration::from_secs(60));
                }
            }
        }
    }
}
pub(crate) fn hash(pw: &str) -> Result<String, String> {
    Argon2::default()
        .hash_password(pw.as_bytes(), &SaltString::generate(&mut OsRng))
        .map(|h| h.to_string())
        .map_err(|_| "Falha ao proteger a credencial.".into())
}
pub(crate) fn verify(value: &str, stored: &str) -> bool {
    PasswordHash::new(stored).ok().is_some_and(|p| {
        Argon2::default()
            .verify_password(value.as_bytes(), &p)
            .is_ok()
    })
}
pub(crate) fn random_code() -> Result<String, String> {
    let mut bytes = [0u8; 32];
    OsRng
        .try_fill_bytes(&mut bytes)
        .map_err(|_| "Gerador seguro indisponível")?;
    Ok(bytes
        .chunks(4)
        .map(|p| p.iter().map(|b| format!("{b:02X}")).collect::<String>())
        .collect::<Vec<_>>()
        .join("-"))
}
pub fn validate_password(password: &str) -> Result<(), String> {
    if !(12..=128).contains(&password.chars().count())
        || password.len() > 512
        || !password.chars().any(char::is_alphabetic)
        || !password.chars().any(|c| c.is_ascii_digit())
        || password.trim() != password
    {
        return Err(
            "Use de 12 a 128 caracteres, com letras e números, sem espaços nas extremidades."
                .into(),
        );
    }
    if [
        "password1234",
        "123456789abc",
        "baropress1234",
        "administrador123",
        "senha1234567",
    ]
    .contains(&password.to_lowercase().as_str())
    {
        return Err("Escolha uma senha menos previsível.".into());
    }
    Ok(())
}
pub(crate) fn identity(name: &str, email: &str) -> Result<(String, String), String> {
    let name = name.trim().to_string();
    let email = email.trim().to_lowercase();
    let parts: Vec<_> = email.split('@').collect();
    if !(2..=120).contains(&name.chars().count())
        || name.chars().any(char::is_control)
        || email.len() > 254
        || parts.len() != 2
        || parts[0].is_empty()
        || !parts[1].contains('.')
        || parts[1].starts_with('.')
        || parts[1].ends_with('.')
        || email.chars().any(char::is_whitespace)
    {
        return Err("Informe nome (2 a 120 caracteres) e e-mail válidos.".into());
    }
    Ok((name, email))
}
pub(crate) fn recovery_key(id: i64) -> String {
    format!("auth.recovery.{id}")
}
fn audit_result<T>(c: &Connection, category: &str, result: Result<T, String>) -> Result<T, String> {
    let (level, message) = if result.is_ok() {
        ("info", "Operação de conta concluída.")
    } else {
        ("warn", "Operação de conta recusada.")
    };
    let _ = crate::support::add_log(c, level, category, message);
    result
}
fn row_user(r: &rusqlite::Row<'_>) -> rusqlite::Result<User> {
    Ok(User {
        id: r.get(0)?,
        name: r.get(1)?,
        email: r.get(2)?,
        role: r.get(3)?,
        ra: r.get(4)?,
        session_version: r.get(5)?,
    })
}
pub fn current(c: &Connection, auth: &AuthState) -> Result<User, String> {
    let mut s = auth.inner.lock().map_err(|_| "Autenticação indisponível")?;
    let valid = s.session.as_ref().and_then(|session| {
        if session.started.elapsed() > Duration::from_secs(8 * 3600) {
            return None;
        }
        c.query_row(
            "SELECT id,name,email,role,ra,session_version,password_hash FROM users WHERE id=?1 AND active=1 AND deleted_at IS NULL",
            [session.user.id],
            |r| Ok((row_user(r)?, r.get::<_, String>(6)?)),
        )
        .ok()
        .filter(|(user, hash)| format!("{}:{}", hash, user.session_version) == session.fingerprint)
        .map(|(u, _)| u)
    });
    match valid {
        Some(user) => Ok(user),
        None => {
            s.session = None;
            Err("Sessão encerrada. Entre novamente.".into())
        }
    }
}
pub fn authorize(c: &Connection, auth: &AuthState, command: &str) -> Result<(), String> {
    if [
        "auth_has_users",
        "auth_register_first",
        "auth_login",
        "auth_recover",
        "auth_current",
        "auth_logout",
    ]
    .contains(&command)
    {
        return Ok(());
    }
    let user = current(c, auth)?;
    if !crate::permissions::allows(&user.role, command) {
        return Err("Seu perfil não tem permissão para esta operação.".into());
    }
    Ok(())
}
fn establish(auth: &AuthState, user: User, fingerprint: String) -> Result<User, String> {
    auth.inner
        .lock()
        .map_err(|_| "Autenticação indisponível")?
        .session = Some(Session {
        user: user.clone(),
        fingerprint: format!("{}:{}", fingerprint, user.session_version),
        started: Instant::now(),
    });
    Ok(user)
}
#[cfg(test)]
fn register(
    c: &mut Connection,
    auth: &AuthState,
    name: &str,
    email: &str,
    password: &str,
    role: &str,
    first: bool,
) -> Result<Registration, String> {
    register_with_ra(c, auth, name, email, password, role, first, None)
}
pub(crate) fn register_with_ra(
    c: &mut Connection,
    auth: &AuthState,
    name: &str,
    email: &str,
    password: &str,
    role: &str,
    first: bool,
    ra: Option<&str>,
) -> Result<Registration, String> {
    if !first && current(c, auth)?.role != "admin" {
        return Err("Cadastro permitido apenas ao administrador.".into());
    }
    let (name, email) = identity(name, email)?;
    let ra = ra.map(crate::users::validate_ra).transpose()?;
    validate_password(password)?;
    // The first account is always administrator, regardless of the caller's role input.
    let role = if first { "admin" } else { role };
    if !first && !["admin", "professional", "assistant"].contains(&role) {
        return Err("Papel inválido para cadastro de usuário.".into());
    }
    let tx = c.transaction().map_err(|_| "Banco indisponível")?;
    if first
        && tx
            .query_row("SELECT COUNT(*) FROM users", [], |r| r.get::<_, i64>(0))
            .map_err(|_| "Banco indisponível")?
            > 0
    {
        return Err(
            "O cadastro inicial já foi realizado. Solicite uma conta ao administrador.".into(),
        );
    }
    if tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=?1)",
            [&email],
            |r| r.get::<_, bool>(0),
        )
        .map_err(|_| "Banco indisponível")?
    {
        return Err("Este identificador já está cadastrado.".into());
    }
    let password_hash = hash(password)?;
    let code = random_code()?;
    tx.execute(
        "INSERT INTO users(name,email,password_hash,role,ra) VALUES(?1,?2,?3,?4,?5)",
        params![name, email, password_hash, role, ra],
    )
    .map_err(|_| "Não foi possível cadastrar a conta.")?;
    let user = User {
        id: tx.last_insert_rowid(),
        name,
        email,
        role: role.into(),
        ra,
        session_version: 0,
    };
    tx.execute(
        "INSERT INTO settings(key,value) VALUES(?1,?2)",
        params![recovery_key(user.id), hash(&code)?],
    )
    .map_err(|_| "Não foi possível provisionar a recuperação.")?;
    tx.commit().map_err(|_| "Falha ao confirmar cadastro")?;
    if first {
        establish(auth, user.clone(), password_hash)?;
    }
    Ok(Registration {
        user,
        recovery_code: code,
    })
}
fn login(c: &Connection, auth: &AuthState, email: &str, password: &str) -> Result<User, String> {
    auth.throttle()?;
    let mut q = c
        .prepare(
            "SELECT id,name,email,role,ra,session_version,password_hash FROM users WHERE lower(email)=?1 AND active=1 AND deleted_at IS NULL",
        )
        .map_err(|_| "Banco indisponível")?;
    let rows = q
        .query_map([email.trim().to_lowercase()], |r| {
            Ok((row_user(r)?, r.get::<_, String>(6)?))
        })
        .map_err(|_| "Banco indisponível")?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "Banco indisponível")?;
    let stored = if rows.len() == 1 {
        &rows[0].1
    } else {
        &auth.dummy_hash
    };
    let valid = password.len() <= 1024 && verify(password, stored) && rows.len() == 1;
    auth.attempt(valid);
    if !valid {
        return Err("E-mail ou senha incorretos.".into());
    }
    establish(auth, rows[0].0.clone(), stored.clone())
}
fn provision(c: &Connection, auth: &AuthState, password: &str) -> Result<String, String> {
    auth.throttle()?;
    let user = current(c, auth)?;
    let stored: String = c
        .query_row(
            "SELECT password_hash FROM users WHERE id=?1",
            [user.id],
            |r| r.get(0),
        )
        .map_err(|_| "Banco indisponível")?;
    let valid = password.len() <= 1024 && verify(password, &stored);
    auth.attempt(valid);
    if !valid {
        return Err("Senha atual incorreta.".into());
    }
    let code = random_code()?;
    let tx = c
        .unchecked_transaction()
        .map_err(|_| "Banco indisponível")?;
    tx.execute("INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", params![recovery_key(user.id), hash(&code)?]).map_err(|_| "Falha ao provisionar recuperação")?;
    tx.execute(
        "DELETE FROM settings WHERE key=?1",
        [format!("auth.recovery.expiry.{}", user.id)],
    )
    .map_err(|_| "Falha ao provisionar recuperação")?;
    tx.commit()
        .map_err(|_| "Falha ao provisionar recuperação")?;
    Ok(code)
}
fn change(
    c: &Connection,
    auth: &AuthState,
    password: &str,
    new_password: &str,
) -> Result<(), String> {
    auth.throttle()?;
    let user = current(c, auth)?;
    validate_password(new_password)?;
    let stored: String = c
        .query_row(
            "SELECT password_hash FROM users WHERE id=?1",
            [user.id],
            |r| r.get(0),
        )
        .map_err(|_| "Banco indisponível")?;
    let valid = password.len() <= 1024 && verify(password, &stored);
    auth.attempt(valid);
    if !valid {
        return Err("Senha atual incorreta.".into());
    }
    if password == new_password {
        return Err("A nova senha deve ser diferente da atual.".into());
    }
    c.execute(
        "UPDATE users SET password_hash=?1,session_version=session_version+1,updated_at=datetime('now') WHERE id=?2",
        params![hash(new_password)?, user.id],
    )
    .map_err(|_| "Falha ao alterar senha")?;
    auth.clear();
    Ok(())
}
fn recover(
    c: &mut Connection,
    auth: &AuthState,
    email: &str,
    code: &str,
    new_password: &str,
) -> Result<(), String> {
    auth.throttle()?;
    validate_password(new_password)?;
    let email = email.trim().to_lowercase();
    let code = code.trim().to_uppercase();
    let tx = c.transaction().map_err(|_| "Banco indisponível")?;
    let count: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM users WHERE lower(email)=?1 AND active=1",
            [&email],
            |r| r.get(0),
        )
        .map_err(|_| "Banco indisponível")?;
    let row: Option<(i64,String)> = tx.query_row("SELECT u.id,s.value FROM users u JOIN settings s ON s.key='auth.recovery.'||u.id WHERE lower(u.email)=?1 AND u.active=1 AND u.deleted_at IS NULL AND (NOT EXISTS(SELECT 1 FROM settings WHERE key='auth.recovery.expiry.'||u.id) OR (SELECT value FROM settings WHERE key='auth.recovery.expiry.'||u.id)>datetime('now'))", [&email], |r| Ok((r.get(0)?,r.get(1)?))).optional().map_err(|_| "Banco indisponível")?;
    let valid = code.len() <= 100
        && verify(
            &code,
            row.as_ref()
                .map(|r| r.1.as_str())
                .unwrap_or(&auth.dummy_hash),
        )
        && count == 1
        && row.is_some();
    auth.attempt(valid);
    if !valid {
        return Err("Não foi possível recuperar a conta com as credenciais fornecidas.".into());
    }
    finish_recovery(tx, auth, row.unwrap().0, new_password)
}
fn recover_access(
    c: &mut Connection,
    auth: &AuthState,
    email: &str,
    ra: Option<&str>,
    code: Option<&str>,
    new_password: &str,
) -> Result<(), String> {
    match ra {
        Some(ra) => recover_with_ra(c, auth, email, ra, new_password),
        None => recover(c, auth, email, code.unwrap_or(""), new_password),
    }
}
fn recover_with_ra(
    c: &mut Connection,
    auth: &AuthState,
    email: &str,
    ra: &str,
    new_password: &str,
) -> Result<(), String> {
    auth.throttle()?;
    validate_password(new_password)?;
    let email = email.trim().to_lowercase();
    let ra = crate::users::validate_ra(ra).ok();
    let tx = c.transaction().map_err(|_| "Banco indisponível")?;
    let candidates =
        {
            let mut query = tx.prepare(
            "SELECT id,ra FROM users WHERE lower(email)=?1 AND active=1 AND deleted_at IS NULL"
        ).map_err(|_| "Banco indisponível")?;
            let rows = query
                .query_map([&email], |r| {
                    Ok((r.get::<_, i64>(0)?, r.get::<_, Option<String>>(1)?))
                })
                .map_err(|_| "Banco indisponível")?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|_| "Banco indisponível")?;
            rows
        };
    // Keep the same bounded password-hash work for known and unknown identities.
    let _ = verify(ra.as_deref().unwrap_or(""), &auth.dummy_hash);
    let valid =
        email.len() <= 254 && candidates.len() == 1 && ra.is_some() && candidates[0].1 == ra;
    auth.attempt(valid);
    if !valid {
        return Err("Não foi possível recuperar a conta com as credenciais fornecidas.".into());
    }
    finish_recovery(tx, auth, candidates[0].0, new_password)
}
fn finish_recovery(
    tx: rusqlite::Transaction<'_>,
    auth: &AuthState,
    id: i64,
    new_password: &str,
) -> Result<(), String> {
    tx.execute(
        "UPDATE users SET password_hash=?1,session_version=session_version+1,updated_at=datetime('now') WHERE id=?2",
        params![hash(new_password)?, id],
    )
    .map_err(|_| "Falha ao recuperar conta")?;
    tx.execute(
        "DELETE FROM settings WHERE key IN (?1,?2)",
        params![recovery_key(id), format!("auth.recovery.expiry.{id}")],
    )
    .map_err(|_| "Falha ao consumir código")?;
    tx.commit().map_err(|_| "Falha ao confirmar recuperação")?;
    auth.clear();
    Ok(())
}
#[tauri::command]
pub fn auth_has_users(db: State<AppDb>) -> Result<bool, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    c.query_row("SELECT COUNT(*) FROM users", [], |r| r.get::<_, i64>(0))
        .map(|n| n > 0)
        .map_err(|_| "Banco indisponível".into())
}
#[tauri::command]
pub fn auth_register_first(
    db: State<AppDb>,
    auth: State<AuthState>,
    name: String,
    email: String,
    password: String,
    ra: String,
) -> Result<Registration, String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let result = register_with_ra(
        &mut c,
        &auth,
        &name,
        &email,
        &password,
        "admin",
        true,
        Some(&ra),
    );
    audit_result(&c, "auth_register_first", result)
}
#[tauri::command]
pub fn auth_register_user(
    db: State<AppDb>,
    auth: State<AuthState>,
    name: String,
    email: String,
    password: String,
    role: String,
    ra: String,
    admin_password: String,
) -> Result<Registration, String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    crate::users::confirm_admin(&c, &auth, &admin_password)?;
    let result = register_with_ra(
        &mut c,
        &auth,
        &name,
        &email,
        &password,
        &role,
        false,
        Some(&ra),
    );
    audit_result(&c, "auth_register_user", result)
}
#[tauri::command]
pub fn auth_login(
    db: State<AppDb>,
    auth: State<AuthState>,
    email: String,
    password: String,
) -> Result<User, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let result = login(&c, &auth, &email, &password);
    audit_result(&c, "auth_login", result)
}
#[tauri::command]
pub fn auth_current(db: State<AppDb>, auth: State<AuthState>) -> Result<Option<User>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    Ok(current(&c, &auth).ok())
}
#[tauri::command]
pub fn auth_logout(
    auth: State<AuthState>,
    acquisition: State<crate::acquisition::AcquisitionState>,
) -> Result<(), String> {
    auth.clear();
    crate::acquisition::acquisition_disconnect(acquisition)
}
#[tauri::command]
pub fn auth_provision_recovery(
    db: State<AppDb>,
    auth: State<AuthState>,
    password: String,
) -> Result<String, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let result = provision(&c, &auth, &password);
    audit_result(&c, "auth_provision_recovery", result)
}
#[tauri::command]
pub fn auth_change_password(
    db: State<AppDb>,
    auth: State<AuthState>,
    acquisition: State<crate::acquisition::AcquisitionState>,
    password: String,
    new_password: String,
) -> Result<(), String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let result = change(&c, &auth, &password, &new_password);
    audit_result(&c, "auth_change_password", result)?;
    drop(c);
    let _ = crate::acquisition::acquisition_disconnect(acquisition);
    Ok(())
}
#[tauri::command]
pub fn auth_recover(
    db: State<AppDb>,
    auth: State<AuthState>,
    acquisition: State<crate::acquisition::AcquisitionState>,
    email: String,
    ra: Option<String>,
    code: Option<String>,
    new_password: String,
) -> Result<(), String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let result = recover_access(
        &mut c,
        &auth,
        &email,
        ra.as_deref(),
        code.as_deref(),
        &new_password,
    );
    audit_result(&c, "auth_recover", result)?;
    drop(c);
    let _ = crate::acquisition::acquisition_disconnect(acquisition);
    Ok(())
}
