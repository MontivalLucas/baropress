use crate::AppDb;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Professional {
    pub id: i64,
    pub name: String,
    pub profession: Option<String>,
    pub registration: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppointmentInput {
    pub patient_id: i64,
    pub professional_id: Option<i64>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub r#type: String,
    pub status: String,
    pub notes: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Appointment {
    pub id: i64,
    pub patient_id: i64,
    pub patient_name: String,
    pub professional_id: Option<i64>,
    pub professional_name: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub r#type: Option<String>,
    pub status: String,
    pub notes: Option<String>,
}

pub fn valid_date(s: &str) -> bool {
    let b = s.as_bytes();
    if b.len() != 10
        || b[4] != b'-'
        || b[7] != b'-'
        || b.iter()
            .enumerate()
            .any(|(i, c)| i != 4 && i != 7 && !c.is_ascii_digit())
    {
        return false;
    }
    let y: u32 = s[0..4].parse().unwrap_or(0);
    let m: u32 = s[5..7].parse().unwrap_or(0);
    let d: u32 = s[8..10].parse().unwrap_or(0);
    let max = match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if y % 4 == 0 && (y % 100 != 0 || y % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 0,
    };
    y > 0 && d > 0 && d <= max
}
fn valid_time(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 5
        && b[2] == b':'
        && b.iter()
            .enumerate()
            .all(|(i, c)| i == 2 || c.is_ascii_digit())
        && s[0..2].parse::<u8>().unwrap_or(99) < 24
        && s[3..5].parse::<u8>().unwrap_or(99) < 60
}
pub fn list_appointments(
    c: &Connection,
    from: &str,
    to: &str,
    patient_id: Option<i64>,
) -> Result<Vec<Appointment>, String> {
    if !valid_date(from) || !valid_date(to) || from > to {
        return Err("Período inválido.".into());
    }
    let mut stmt = c.prepare("SELECT a.id,a.patient_id,p.name,a.professional_id,pr.name,a.date,a.start_time,a.end_time,a.type,a.status,a.notes FROM appointments a JOIN patients p ON p.id=a.patient_id LEFT JOIN professionals pr ON pr.id=a.professional_id WHERE a.date BETWEEN ?1 AND ?2 AND (?3 IS NULL OR a.patient_id=?3) ORDER BY a.date,a.start_time,a.id").map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![from, to, patient_id], |r| {
            Ok(Appointment {
                id: r.get(0)?,
                patient_id: r.get(1)?,
                patient_name: r.get(2)?,
                professional_id: r.get(3)?,
                professional_name: r.get(4)?,
                date: r.get(5)?,
                start_time: r.get(6)?,
                end_time: r.get(7)?,
                r#type: r.get(8)?,
                status: r.get(9)?,
                notes: r.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
pub fn save_appointment(
    c: &Connection,
    id: Option<i64>,
    data: AppointmentInput,
) -> Result<Appointment, String> {
    if !valid_date(&data.date)
        || !valid_time(&data.start_time)
        || !valid_time(&data.end_time)
        || data.start_time >= data.end_time
    {
        return Err("Informe uma data válida e término posterior ao início, no mesmo dia.".into());
    }
    if !["scheduled", "confirmed", "done", "cancelled"].contains(&data.status.as_str()) {
        return Err("Status inválido.".into());
    }
    if data.r#type.trim().is_empty()
        || data.r#type.len() > 120
        || data.notes.as_ref().is_some_and(|s| s.len() > 10000)
    {
        return Err("Tipo ou observações inválidos.".into());
    }
    let patient: bool = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM patients WHERE id=?1 AND archived=0)",
            [data.patient_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !patient {
        return Err("Paciente não encontrado ou arquivado.".into());
    }
    if let Some(professional) = data.professional_id {
        let active: bool = c
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM professionals WHERE id=?1 AND active=1)",
                [professional],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if !active {
            return Err("Profissional não encontrado ou inativo.".into());
        }
    }
    if data.status != "cancelled" {
        let conflict: bool = c.query_row("SELECT EXISTS(SELECT 1 FROM appointments WHERE date=?1 AND status<>'cancelled' AND id<>COALESCE(?2,-1) AND (patient_id=?3 OR (?4 IS NOT NULL AND professional_id=?4)) AND start_time<?5 AND substr(COALESCE(end_time,time(start_time,'+30 minutes')),1,5)>?6)", params![data.date,id,data.patient_id,data.professional_id,data.end_time,data.start_time], |r| r.get(0)).map_err(|e| e.to_string())?;
        if conflict {
            return Err("Há uma consulta sobreposta para este paciente ou profissional.".into());
        }
    }
    let saved_id = if let Some(id) = id {
        let n = c.execute("UPDATE appointments SET patient_id=?1,professional_id=?2,date=?3,start_time=?4,end_time=?5,type=?6,status=?7,notes=?8,updated_at=datetime('now') WHERE id=?9", params![data.patient_id,data.professional_id,data.date,data.start_time,data.end_time,data.r#type.trim(),data.status,data.notes,id]).map_err(|e| e.to_string())?;
        if n == 0 {
            return Err("Consulta não encontrada.".into());
        }
        id
    } else {
        c.execute("INSERT INTO appointments(patient_id,professional_id,date,start_time,end_time,type,status,notes) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)", params![data.patient_id,data.professional_id,data.date,data.start_time,data.end_time,data.r#type.trim(),data.status,data.notes]).map_err(|e| e.to_string())?;
        c.last_insert_rowid()
    };
    list_appointments(c, &data.date, &data.date, None)?
        .into_iter()
        .find(|a| a.id == saved_id)
        .ok_or_else(|| "Consulta não encontrada.".into())
}
#[tauri::command]
pub fn appointments_list(
    db: State<AppDb>,
    from: String,
    to: String,
    patient_id: Option<i64>,
) -> Result<Vec<Appointment>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    list_appointments(&c, &from, &to, patient_id)
}
pub fn check_appointment_access(
    role: &str,
    id: Option<i64>,
    data: &AppointmentInput,
) -> Result<(), String> {
    if role == "assistant"
        && (id.is_some() || !["scheduled", "confirmed"].contains(&data.status.as_str()))
    {
        return Err("Seu perfil pode consultar e criar agendamentos; edição e cancelamento exigem profissional ou administrador.".into());
    }
    Ok(())
}
#[tauri::command]
pub fn appointments_save(
    auth: State<crate::auth::AuthState>,
    db: State<AppDb>,
    id: Option<i64>,
    data: AppointmentInput,
) -> Result<Appointment, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    check_appointment_access(&crate::auth::current(&c, &auth)?.role, id, &data)?;
    save_appointment(&c, id, data)
}
#[tauri::command]
pub fn appointments_delete(db: State<AppDb>, id: i64) -> Result<(), String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    if c.execute("DELETE FROM appointments WHERE id=?1", [id])
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err("Consulta não encontrada.".into());
    }
    Ok(())
}
#[tauri::command]
pub fn professionals_list(db: State<AppDb>) -> Result<Vec<Professional>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let mut q=c.prepare("SELECT id,name,profession,registration FROM professionals WHERE active=1 ORDER BY name").map_err(|e|e.to_string())?;
    let rows = q
        .query_map([], |r| {
            Ok(Professional {
                id: r.get(0)?,
                name: r.get(1)?,
                profession: r.get(2)?,
                registration: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub fn professionals_create(
    db: State<AppDb>,
    name: String,
    profession: Option<String>,
    registration: Option<String>,
) -> Result<Professional, String> {
    if name.trim().is_empty() || name.len() > 120 {
        return Err("Informe o nome do profissional (até 120 caracteres).".into());
    }
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    c.execute(
        "INSERT INTO professionals(name,profession,registration) VALUES(?1,?2,?3)",
        params![name.trim(), profession, registration],
    )
    .map_err(|e| e.to_string())?;
    Ok(Professional {
        id: c.last_insert_rowid(),
        name: name.trim().into(),
        profession,
        registration,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn setup() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&c).unwrap();
        c.execute(
            "INSERT INTO patients(id,name) VALUES(1,'Teste'),(2,'Outro')",
            [],
        )
        .unwrap();
        c.execute(
            "INSERT INTO professionals(id,name) VALUES(1,'Profissional')",
            [],
        )
        .unwrap();
        c
    }
    fn input() -> AppointmentInput {
        AppointmentInput {
            patient_id: 1,
            professional_id: Some(1),
            date: "2026-10-06".into(),
            start_time: "09:00".into(),
            end_time: "09:30".into(),
            r#type: "Avaliação".into(),
            status: "scheduled".into(),
            notes: Some("Teste".into()),
        }
    }
    #[test]
    fn date_validation() {
        assert!(valid_date("2024-02-29"));
        assert!(!valid_date("2026-02-29"));
        assert!(!valid_date("2026-13-01"));
        assert!(!valid_date("éééééé"));
    }
    #[test]
    fn crud_and_period() {
        let c = setup();
        let a = save_appointment(&c, None, input()).unwrap();
        let mut d = input();
        d.status = "done".into();
        save_appointment(&c, Some(a.id), d).unwrap();
        let found = list_appointments(&c, "2026-10-01", "2026-10-31", Some(1)).unwrap();
        assert_eq!(found[0].status, "done");
        assert!(list_appointments(&c, "2026-11-01", "2026-11-30", None)
            .unwrap()
            .is_empty());
        c.execute("DELETE FROM appointments WHERE id=?1", [a.id])
            .unwrap();
        assert!(list_appointments(&c, "2026-10-01", "2026-10-31", None)
            .unwrap()
            .is_empty());
    }
    #[test]
    fn rejects_conflicts_but_allows_adjacent_and_cancelled() {
        let c = setup();
        save_appointment(&c, None, input()).unwrap();
        let mut d = input();
        d.patient_id = 2;
        d.start_time = "09:15".into();
        d.end_time = "09:45".into();
        assert!(save_appointment(&c, None, d.clone())
            .unwrap_err()
            .contains("sobreposta"));
        d.start_time = "09:30".into();
        save_appointment(&c, None, d.clone()).unwrap();
        d.status = "cancelled".into();
        d.start_time = "09:15".into();
        save_appointment(&c, None, d).unwrap();
    }
    #[test]
    fn secretary_creates_and_reads_but_does_not_edit_cancel_or_complete_appointments() {
        let c = setup();
        let created = save_appointment(&c, None, input()).unwrap();
        assert!(check_appointment_access("assistant", None, &input()).is_ok());
        assert!(check_appointment_access("assistant", Some(created.id), &input()).is_err());
        for status in ["done", "cancelled"] {
            let mut d = input();
            d.status = status.into();
            assert!(check_appointment_access("assistant", None, &d).is_err());
        }
        assert_eq!(
            list_appointments(&c, "2026-10-01", "2026-10-31", None)
                .unwrap()
                .len(),
            1
        );
    }
    #[test]
    fn rejects_bad_times_and_missing_patient() {
        let c = setup();
        let mut d = input();
        d.start_time = "25:00".into();
        assert!(save_appointment(&c, None, d).is_err());
        let mut d = input();
        d.patient_id = 99;
        assert!(save_appointment(&c, None, d).is_err());
        let mut d = input();
        d.end_time = "08:00".into();
        assert!(save_appointment(&c, None, d).is_err());
    }
}
