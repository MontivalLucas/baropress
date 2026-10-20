use crate::{
    auth::{self, AuthState, User},
    AppDb,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedUser {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub ra: Option<String>,
    pub active: bool,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UserInput {
    pub name: String,
    pub email: String,
    pub role: String,
    pub ra: String,
    pub active: bool,
}

pub fn validate_ra(ra: &str) -> Result<String, String> {
    let ra = ra.trim();
    if ra.is_empty() || ra.len() > 32 || !ra.bytes().all(|b| b.is_ascii_digit()) {
        return Err("Informe o RA com 1 a 32 dígitos, preservando zeros iniciais.".into());
    }
    Ok(ra.into())
}
pub fn confirm_admin(c: &Connection, a: &AuthState, password: &str) -> Result<User, String> {
    let user = auth::current(c, a)?;
    if user.role != "admin" {
        return Err("Esta operação exige administrador.".into());
    }
    a.check_password(c, password)?;
    Ok(user)
}
fn row(r: &rusqlite::Row<'_>) -> rusqlite::Result<ManagedUser> {
    Ok(ManagedUser {
        id: r.get(0)?,
        name: r.get(1)?,
        email: r.get(2)?,
        role: r.get(3)?,
        ra: r.get(4)?,
        active: r.get(5)?,
    })
}
pub fn list(c: &Connection, search: &str, offset: i64) -> Result<Vec<ManagedUser>, String> {
    if offset < 0 || search.len() > 254 {
        return Err("Busca inválida.".into());
    }
    let mut q = c.prepare("SELECT id,name,email,role,ra,active FROM users WHERE deleted_at IS NULL AND (name LIKE ?1 OR email LIKE ?1 OR ra LIKE ?1) ORDER BY name COLLATE NOCASE,id LIMIT 51 OFFSET ?2").map_err(|e|e.to_string())?;
    let result = q
        .query_map(params![format!("%{}%", search.trim()), offset], row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    result
}
pub fn update(c: &mut Connection, actor: i64, id: i64, data: UserInput) -> Result<(), String> {
    let (name, email) = auth::identity(&data.name, &data.email)?;
    let ra = validate_ra(&data.ra)?;
    if !["admin", "professional", "assistant"].contains(&data.role.as_str()) {
        return Err("Perfil inválido.".into());
    }
    let tx = c.transaction().map_err(|e| e.to_string())?;
    let old: Option<(String, bool, Option<String>)> = tx
        .query_row(
            "SELECT role,active,ra FROM users WHERE id=?1 AND deleted_at IS NULL",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let old = old.ok_or("Usuário não encontrado.")?;
    if actor == id && (data.role != "admin" || !data.active) {
        return Err("Você não pode retirar seu próprio acesso administrativo.".into());
    }
    if old.0 == "admin" && old.1 && (data.role != "admin" || !data.active) {
        let admins: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL",
                [],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if admins <= 1 {
            return Err("Mantenha pelo menos um administrador ativo.".into());
        }
    }
    if tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM users WHERE id<>?1 AND (lower(trim(email))=?2 OR ra=?3))",
            params![id, email, ra],
            |r| r.get::<_, bool>(0),
        )
        .map_err(|e| e.to_string())?
    {
        return Err("E-mail ou RA já cadastrado.".into());
    }
    tx.execute("UPDATE users SET name=?1,email=?2,role=?3,ra=?4,active=?5,session_version=session_version+1,updated_at=datetime('now') WHERE id=?6",params![name,email,data.role,ra,data.active,id]).map_err(|e|e.to_string())?;
    if old.2.as_deref() != Some(&ra) || !data.active {
        tx.execute(
            "DELETE FROM settings WHERE key IN (?1,?2)",
            params![auth::recovery_key(id), format!("auth.recovery.expiry.{id}")],
        )
        .map_err(|e| e.to_string())?;
    }
    crate::support::add_log(
        &tx,
        "info",
        "users_update",
        &format!(
            "Ator {actor}; conta {id}; perfil {}; ativo {}. Sessões revogadas.",
            data.role, data.active
        ),
    )?;
    tx.commit().map_err(|e| e.to_string())
}
pub fn delete(c: &mut Connection, actor: i64, id: i64) -> Result<(), String> {
    if actor == id {
        return Err("Não é possível excluir sua própria conta.".into());
    }
    let tx = c.transaction().map_err(|e| e.to_string())?;
    let admin: Option<bool> = tx
        .query_row(
            "SELECT role='admin' AND active=1 FROM users WHERE id=?1 AND deleted_at IS NULL",
            [id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if admin.is_none() {
        return Err("Usuário não encontrado.".into());
    }
    if admin == Some(true)
        && tx
            .query_row(
                "SELECT COUNT(*) FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL",
                [],
                |r| r.get::<_, i64>(0),
            )
            .map_err(|e| e.to_string())?
            <= 1
    {
        return Err("Mantenha pelo menos um administrador ativo.".into());
    }
    tx.execute("UPDATE users SET active=0,deleted_at=datetime('now'),session_version=session_version+1,updated_at=datetime('now') WHERE id=?1",[id]).map_err(|e|e.to_string())?;
    tx.execute(
        "DELETE FROM settings WHERE key IN (?1,?2)",
        params![auth::recovery_key(id), format!("auth.recovery.expiry.{id}")],
    )
    .map_err(|e| e.to_string())?;
    crate::support::add_log(
        &tx,
        "info",
        "users_delete",
        &format!("Ator {actor}; conta {id}; acesso excluído, identidade histórica preservada."),
    )?;
    tx.commit().map_err(|e| e.to_string())
}
#[tauri::command]
pub fn users_list(
    db: State<AppDb>,
    auth: State<AuthState>,
    search: String,
    offset: i64,
) -> Result<Vec<ManagedUser>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    if auth::current(&c, &auth)?.role != "admin" {
        return Err("Acesso restrito ao administrador.".into());
    }
    list(&c, &search, offset)
}
#[tauri::command]
pub fn users_update(
    db: State<AppDb>,
    auth: State<AuthState>,
    id: i64,
    data: UserInput,
    admin_password: String,
) -> Result<(), String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let actor = confirm_admin(&c, &auth, &admin_password)?;
    update(&mut c, actor.id, id, data)
}
#[tauri::command]
pub fn users_delete(
    db: State<AppDb>,
    auth: State<AuthState>,
    id: i64,
    admin_password: String,
) -> Result<(), String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let actor = confirm_admin(&c, &auth, &admin_password)?;
    delete(&mut c, actor.id, id)
}
#[tauri::command]
pub fn users_recovery(
    db: State<AppDb>,
    auth: State<AuthState>,
    id: i64,
    admin_password: String,
) -> Result<String, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let actor = confirm_admin(&c, &auth, &admin_password)?;
    let exists:bool=c.query_row("SELECT EXISTS(SELECT 1 FROM users WHERE id=?1 AND active=1 AND deleted_at IS NULL AND ra IS NOT NULL)",[id],|r|r.get(0)).map_err(|e|e.to_string())?;
    if !exists {
        return Err("Conta ativa com RA é necessária.".into());
    }
    let tx = c.unchecked_transaction().map_err(|e| e.to_string())?;
    let code = auth::random_code()?;
    tx.execute("INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",params![auth::recovery_key(id),auth::hash(&code)?]).map_err(|e|e.to_string())?;
    tx.execute("INSERT INTO settings(key,value) VALUES(?1,datetime('now','+30 minutes')) ON CONFLICT(key) DO UPDATE SET value=excluded.value",params![format!("auth.recovery.expiry.{id}")]).map_err(|e|e.to_string())?;
    crate::support::add_log(
        &tx,
        "info",
        "users_recovery",
        &format!(
            "Ator {}; conta {id}; código temporário emitido, validade 30 minutos.",
            actor.id
        ),
    )?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(code)
}
