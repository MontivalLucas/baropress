use crate::AppDb;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientSummary {
    pub id: i64,
    pub name: String,
    pub social_name: Option<String>,
    pub birth_date: Option<String>,
    pub sex: Option<String>,
    pub cpf: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub last_exam_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Patient {
    pub id: i64,
    pub name: String,
    pub social_name: Option<String>,
    pub birth_date: Option<String>,
    pub sex: Option<String>,
    pub cpf: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub profession: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub shoe_size: Option<f64>,
    pub observations: Option<String>,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientInput {
    pub name: String,
    pub social_name: Option<String>,
    pub birth_date: Option<String>,
    pub sex: Option<String>,
    pub cpf: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub profession: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub shoe_size: Option<f64>,
    pub observations: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientExamItem {
    pub acquisition: Option<crate::exam_analysis::Acquisition>,
    pub id: i64,
    pub r#type: String,
    pub source: String,
    pub status: String,
    pub started_at: Option<String>,
    pub duration: Option<f64>,
    pub professional_name: Option<String>,
    pub max_pressure: Option<f64>,
    pub contact_area_percent: Option<f64>,
}

/// Remove pontuações e espaços, mantendo apenas dígitos.
fn clean_digits(input: &str) -> String {
    input.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// Valida dígitos verificadores do CPF (módulo 11).
fn is_valid_cpf(cpf: &str) -> bool {
    let digits: Vec<u32> = clean_digits(cpf)
        .chars()
        .filter_map(|c| c.to_digit(10))
        .collect();
    if digits.len() != 11 {
        return false;
    }
    // Rejeita sequências repetidas como 11111111111
    if digits.iter().all(|&d| d == digits[0]) {
        return false;
    }
    let mut sum = 0;
    for i in 0..9 {
        sum += digits[i] * (10 - i as u32);
    }
    let mut rev = (sum * 10) % 11;
    if rev == 10 || rev == 11 {
        rev = 0;
    }
    if rev != digits[9] {
        return false;
    }

    sum = 0;
    for i in 0..10 {
        sum += digits[i] * (11 - i as u32);
    }
    rev = (sum * 10) % 11;
    if rev == 10 || rev == 11 {
        rev = 0;
    }
    rev == digits[10]
}

/// Valida e sanitiza os dados de entrada do paciente.
fn validate_patient_input(data: &PatientInput) -> Result<(), String> {
    let trimmed_name = data.name.trim();
    if trimmed_name.is_empty() {
        return Err("O nome do paciente é obrigatório.".into());
    }

    if let Some(ref em) = data.email {
        let t = em.trim();
        if !t.is_empty() && (!t.contains('@') || !t.contains('.')) {
            return Err("Informe um endereço de e-mail válido.".into());
        }
    }

    if let Some(ref c) = data.cpf {
        let cd = clean_digits(c);
        if !c.trim().is_empty() {
            if cd.len() != 11 || !is_valid_cpf(&cd) {
                return Err("CPF inválido. Verifique os dígitos informados.".into());
            }
        }
    }

    if let Some(h) = data.height {
        if !h.is_finite() || h <= 0.0 || h > 300.0 {
            return Err("A altura deve ser um valor positivo e menor que 300 cm.".into());
        }
    }

    if let Some(w) = data.weight {
        if !w.is_finite() || w <= 0.0 || w > 500.0 {
            return Err("O peso deve ser um valor positivo e menor que 500 kg.".into());
        }
    }

    if let Some(s) = data.shoe_size {
        if !s.is_finite() || s <= 0.0 || s > 70.0 {
            return Err("O tamanho do calçado deve ser um número válido.".into());
        }
    }

    Ok(())
}

// -------------------------------------------------------------------------------------------------
// FUNÇÕES DE LÓGICA PURA (TESTÁVEIS COM Connection DO RUSQLITE)
// -------------------------------------------------------------------------------------------------

pub fn list_patients(
    conn: &Connection,
    search: Option<&str>,
) -> Result<Vec<PatientSummary>, String> {
    list_patients_page(conn, search, None, None)
}

pub fn list_patients_page(
    conn: &Connection,
    search: Option<&str>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<PatientSummary>, String> {
    let (limit, offset) = crate::pagination::bounds(limit, offset)?;
    let clean_search = search.map(|s| s.trim()).filter(|s| !s.is_empty());

    let mut stmt = conn
        .prepare(
            "SELECT 
                p.id, p.name, p.social_name, p.birth_date, p.sex, p.cpf, p.phone, p.email,
                (SELECT MAX(e.started_at) FROM exams e WHERE e.patient_id = p.id AND e.status = 'completed') AS last_exam_at,
                p.created_at
            FROM patients p
            WHERE p.archived = 0
              AND (
                ?1 IS NULL
                OR p.name LIKE ?2
                OR (p.social_name IS NOT NULL AND p.social_name LIKE ?2)
                OR (p.cpf IS NOT NULL AND (p.cpf LIKE ?2 OR REPLACE(REPLACE(REPLACE(p.cpf, '.', ''), '-', ''), ' ', '') LIKE ?3))
                OR (p.phone IS NOT NULL AND (p.phone LIKE ?2 OR REPLACE(REPLACE(REPLACE(REPLACE(p.phone, '(', ''), ')', ''), '-', ''), ' ', '') LIKE ?3))
              )
            ORDER BY p.name COLLATE NOCASE ASC, p.id ASC LIMIT ?4 OFFSET ?5",
        )
        .map_err(|e| format!("Erro ao preparar consulta: {e}"))?;

    let search_pattern = clean_search.map(|s| format!("%{s}%"));
    let digits_pattern = clean_search.map(|s| {
        let d = clean_digits(s);
        if d.is_empty() {
            format!("%{s}%")
        } else {
            format!("%{d}%")
        }
    });

    let rows = stmt
        .query_map(
            params![clean_search, search_pattern, digits_pattern, limit, offset],
            |r| {
                Ok(PatientSummary {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    social_name: r.get(2)?,
                    birth_date: r.get(3)?,
                    sex: r.get(4)?,
                    cpf: r.get(5)?,
                    phone: r.get(6)?,
                    email: r.get(7)?,
                    last_exam_at: r.get(8)?,
                    created_at: r.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Erro ao consultar pacientes: {e}"))?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| format!("Erro ao ler registro de paciente: {e}"))?);
    }

    Ok(list)
}

pub fn get_patient(conn: &Connection, id: i64) -> Result<Patient, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, social_name, birth_date, sex, cpf, phone, email, address, profession,
                    height, weight, shoe_size, observations, archived, created_at, updated_at
             FROM patients WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let opt = stmt
        .query_row(params![id], |r| {
            let archived_num: i64 = r.get(14)?;
            Ok(Patient {
                id: r.get(0)?,
                name: r.get(1)?,
                social_name: r.get(2)?,
                birth_date: r.get(3)?,
                sex: r.get(4)?,
                cpf: r.get(5)?,
                phone: r.get(6)?,
                email: r.get(7)?,
                address: r.get(8)?,
                profession: r.get(9)?,
                height: r.get(10)?,
                weight: r.get(11)?,
                shoe_size: r.get(12)?,
                observations: r.get(13)?,
                archived: archived_num != 0,
                created_at: r.get(15)?,
                updated_at: r.get(16)?,
            })
        })
        .optional()
        .map_err(|e| format!("Erro ao consultar paciente: {e}"))?;

    opt.ok_or_else(|| "Paciente não encontrado.".into())
}

pub fn create_patient(conn: &Connection, data: PatientInput) -> Result<Patient, String> {
    validate_patient_input(&data)?;

    let clean_cpf_digits = data
        .cpf
        .as_deref()
        .map(clean_digits)
        .filter(|s| !s.is_empty());

    // Verifica duplicidade de CPF entre pacientes ativos
    if let Some(ref cpf_digits) = clean_cpf_digits {
        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM patients 
                 WHERE archived = 0 
                   AND (cpf = ?1 OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?1)",
                params![cpf_digits],
                |r| r.get::<_, i64>(0),
            )
            .map(|count| count > 0)
            .map_err(|e| format!("Erro ao verificar duplicidade de CPF: {e}"))?;

        if exists {
            return Err("Já existe um paciente ativo cadastrado com este CPF.".into());
        }
    }

    let name = data.name.trim();
    let social_name = data
        .social_name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let birth_date = data
        .birth_date
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let sex = data.sex.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let cpf = clean_cpf_digits.as_deref();
    let phone = data
        .phone
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let email = data
        .email
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let address = data
        .address
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let profession = data
        .profession
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let observations = data
        .observations
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    conn.execute(
        "INSERT INTO patients (name, social_name, birth_date, sex, cpf, phone, email, address, profession, height, weight, shoe_size, observations, archived)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 0)",
        params![
            name,
            social_name,
            birth_date,
            sex,
            cpf,
            phone,
            email,
            address,
            profession,
            data.height,
            data.weight,
            data.shoe_size,
            observations,
        ],
    )
    .map_err(|e| format!("Erro ao inserir paciente no banco: {e}"))?;

    let inserted_id = conn.last_insert_rowid();
    get_patient(conn, inserted_id)
}

pub fn update_patient(conn: &Connection, id: i64, data: PatientInput) -> Result<Patient, String> {
    validate_patient_input(&data)?;

    // Verifica se paciente existe
    let current_archived: Option<i64> = conn
        .query_row(
            "SELECT archived FROM patients WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| format!("Erro ao buscar paciente: {e}"))?;

    let is_archived = current_archived.ok_or_else(|| "Paciente não encontrado.".to_string())?;
    if is_archived != 0 {
        return Err("Não é possível alterar dados de um paciente arquivado.".into());
    }

    let clean_cpf_digits = data
        .cpf
        .as_deref()
        .map(clean_digits)
        .filter(|s| !s.is_empty());

    // Verifica duplicidade de CPF entre outros pacientes ativos
    if let Some(ref cpf_digits) = clean_cpf_digits {
        let exists: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM patients 
                 WHERE archived = 0 
                   AND id != ?1
                   AND (cpf = ?2 OR REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?2)",
                params![id, cpf_digits],
                |r| r.get::<_, i64>(0),
            )
            .map(|count| count > 0)
            .map_err(|e| format!("Erro ao verificar duplicidade de CPF: {e}"))?;

        if exists {
            return Err("Já existe um paciente ativo cadastrado com este CPF.".into());
        }
    }

    let name = data.name.trim();
    let social_name = data
        .social_name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let birth_date = data
        .birth_date
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let sex = data.sex.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let cpf = clean_cpf_digits.as_deref();
    let phone = data
        .phone
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let email = data
        .email
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let address = data
        .address
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let profession = data
        .profession
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let observations = data
        .observations
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    conn.execute(
        "UPDATE patients SET
            name = ?1,
            social_name = ?2,
            birth_date = ?3,
            sex = ?4,
            cpf = ?5,
            phone = ?6,
            email = ?7,
            address = ?8,
            profession = ?9,
            height = ?10,
            weight = ?11,
            shoe_size = ?12,
            observations = ?13,
            updated_at = datetime('now')
         WHERE id = ?14",
        params![
            name,
            social_name,
            birth_date,
            sex,
            cpf,
            phone,
            email,
            address,
            profession,
            data.height,
            data.weight,
            data.shoe_size,
            observations,
            id,
        ],
    )
    .map_err(|e| format!("Erro ao atualizar dados do paciente: {e}"))?;

    get_patient(conn, id)
}

pub fn archive_patient(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM patients WHERE id = ?1 AND archived = 0",
            params![id],
            |r| r.get::<_, i64>(0),
        )
        .map(|count| count > 0)
        .map_err(|e| format!("Erro ao buscar paciente: {e}"))?;

    if !exists {
        return Err("Paciente não encontrado ou já arquivado.".into());
    }

    conn.execute(
        "UPDATE patients SET archived = 1, updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .map_err(|e| format!("Erro ao arquivar paciente: {e}"))?;

    Ok(())
}

pub fn patient_exam_history(
    conn: &Connection,
    patient_id: i64,
) -> Result<Vec<PatientExamItem>, String> {
    let mut stmt = conn
        .prepare(
            &format!("SELECT e.id, e.type, e.source, e.status, e.started_at, e.duration, pr.name, e.max_pressure, e.contact_area_percent, json_extract(e.analysis_json,'$.acquisition')
             FROM exams e
             LEFT JOIN professionals pr ON e.professional_id = pr.id
             WHERE e.patient_id = ?1 AND {}
             ORDER BY e.started_at DESC, e.id DESC", crate::exams::HISTORY_ENTRY_FILTER),
        )
        .map_err(|e| format!("Erro ao preparar busca de exames: {e}"))?;

    let rows = stmt
        .query_map(params![patient_id], |r| {
            Ok(PatientExamItem {
                acquisition: r
                    .get::<_, Option<String>>(9)?
                    .map(|json| serde_json::from_str(&json))
                    .transpose()
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            9,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?,
                id: r.get(0)?,
                r#type: r.get(1)?,
                source: r.get(2)?,
                status: r.get(3)?,
                started_at: r.get(4)?,
                duration: r.get(5)?,
                professional_name: r.get(6)?,
                max_pressure: r.get(7)?,
                contact_area_percent: r.get(8)?,
            })
        })
        .map_err(|e| format!("Erro ao consultar exames: {e}"))?;

    let mut exams = Vec::new();
    for row in rows {
        exams.push(row.map_err(|e| format!("Erro ao ler exame: {e}"))?);
    }

    Ok(exams)
}

// -------------------------------------------------------------------------------------------------
// COMANDOS TAURI
// -------------------------------------------------------------------------------------------------

#[tauri::command]
pub fn patients_list(
    db: State<AppDb>,
    search: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<PatientSummary>, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    list_patients_page(&conn, search.as_deref(), limit, offset)
}

#[tauri::command]
pub fn patients_get(db: State<AppDb>, id: i64) -> Result<Patient, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    get_patient(&conn, id)
}

pub fn restrict_clinical_fields(
    c: &Connection,
    role: &str,
    id: Option<i64>,
    data: &PatientInput,
) -> Result<(), String> {
    if role != "assistant" {
        return Ok(());
    }
    let previous = id.map(|id| get_patient(c, id)).transpose()?;
    if data.height != previous.as_ref().and_then(|p| p.height)
        || data.weight != previous.as_ref().and_then(|p| p.weight)
        || data.shoe_size != previous.as_ref().and_then(|p| p.shoe_size)
        || data.observations != previous.as_ref().and_then(|p| p.observations.clone())
    {
        return Err("Seu perfil pode alterar apenas os dados cadastrais do paciente.".into());
    }
    Ok(())
}
#[tauri::command]
pub fn patients_create(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    data: PatientInput,
) -> Result<Patient, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    restrict_clinical_fields(
        &conn,
        &crate::auth::current(&conn, &auth)?.role,
        None,
        &data,
    )?;
    create_patient(&conn, data)
}

#[tauri::command]
pub fn patients_update(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    id: i64,
    data: PatientInput,
) -> Result<Patient, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    restrict_clinical_fields(
        &conn,
        &crate::auth::current(&conn, &auth)?.role,
        Some(id),
        &data,
    )?;
    update_patient(&conn, id, data)
}

#[tauri::command]
pub fn patients_archive(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    archive_patient(&conn, id)
}

#[tauri::command]
pub fn patients_exam_history(
    auth: State<crate::auth::AuthState>,
    db: State<AppDb>,
    patient_id: i64,
) -> Result<Vec<PatientExamItem>, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    let secretary = crate::auth::current(&conn, &auth)?.role == "assistant";
    Ok(patient_exam_history(&conn, patient_id)?
        .into_iter()
        .filter(|e| !secretary || e.status == "completed")
        .collect())
}

// -------------------------------------------------------------------------------------------------
// TESTES UNITÁRIOS DO BACKEND
// -------------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::migrate(&conn).unwrap();
        conn
    }

    fn sample_input(name: &str, cpf: Option<&str>) -> PatientInput {
        PatientInput {
            name: name.to_string(),
            social_name: None,
            birth_date: Some("1992-05-14".into()),
            sex: Some("M".into()),
            cpf: cpf.map(|s| s.to_string()),
            phone: Some("11987654321".into()),
            email: Some("teste@exemplo.com".into()),
            address: Some("Rua das Flores, 123".into()),
            profession: Some("Engenheiro".into()),
            height: Some(178.0),
            weight: Some(76.5),
            shoe_size: Some(41.0),
            observations: Some("Paciente sem queixas de dor.".into()),
        }
    }
    #[test]
    fn rejects_nonfinite_anthropometry_and_cpf_without_digits() {
        let mut input = sample_input("Teste", None);
        input.height = Some(f64::NAN);
        assert!(validate_patient_input(&input).is_err());
        input = sample_input("Teste", None);
        input.weight = Some(f64::INFINITY);
        assert!(validate_patient_input(&input).is_err());
        input = sample_input("Teste", Some("abc"));
        assert!(validate_patient_input(&input).is_err());
    }

    #[test]
    fn test_create_and_get_patient() {
        let conn = setup_test_db();
        // CPF válido para teste: 11144477735
        let input = sample_input("Carlos Alberto", Some("11144477735"));
        let created = create_patient(&conn, input).expect("Falha ao criar paciente");

        assert_eq!(created.name, "Carlos Alberto");
        assert_eq!(created.cpf, Some("11144477735".into()));
        assert_eq!(created.height, Some(178.0));
        assert!(!created.archived);

        let fetched = get_patient(&conn, created.id).expect("Falha ao buscar paciente");
        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Carlos Alberto");
    }

    #[test]
    fn test_name_required() {
        let conn = setup_test_db();
        let input = sample_input("   ", None);
        let res = create_patient(&conn, input);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "O nome do paciente é obrigatório.");
    }

    #[test]
    fn test_duplicate_cpf_prevented_on_create() {
        let conn = setup_test_db();
        // CPF válido: 11144477735
        let p1 = sample_input("Paciente Um", Some("11144477735"));
        create_patient(&conn, p1).unwrap();

        // Tenta cadastrar outro paciente com o mesmo CPF
        let p2 = sample_input("Paciente Dois", Some("11144477735"));
        let res = create_patient(&conn, p2);
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "Já existe um paciente ativo cadastrado com este CPF."
        );
    }

    #[test]
    fn test_duplicate_cpf_prevented_on_update() {
        let conn = setup_test_db();
        // CPFs válidos para teste: 11144477735 e 52998224725
        let _p1 = create_patient(&conn, sample_input("Paciente Um", Some("11144477735"))).unwrap();
        let p2 = create_patient(&conn, sample_input("Paciente Dois", Some("52998224725"))).unwrap();

        // Atualizar p2 com o CPF de p1 deve falhar
        let mut update_data = sample_input("Paciente Dois Atualizado", Some("11144477735"));
        let res = update_patient(&conn, p2.id, update_data.clone());
        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "Já existe um paciente ativo cadastrado com este CPF."
        );

        // Atualizar p2 mantendo o próprio CPF deve ter sucesso
        update_data.cpf = Some("52998224725".into());
        let updated = update_patient(&conn, p2.id, update_data).expect("Atualização falhou");
        assert_eq!(updated.name, "Paciente Dois Atualizado");
    }

    #[test]
    fn test_list_and_search() {
        let conn = setup_test_db();
        create_patient(&conn, sample_input("Ana Clara", Some("11144477735"))).unwrap();
        create_patient(&conn, sample_input("Bruno Souza", Some("52998224725"))).unwrap();

        // Listagem sem busca
        let all = list_patients(&conn, None).unwrap();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].name, "Ana Clara");
        assert_eq!(all[1].name, "Bruno Souza");

        // Busca por nome
        let search_name = list_patients(&conn, Some("bruno")).unwrap();
        assert_eq!(search_name.len(), 1);
        assert_eq!(search_name[0].name, "Bruno Souza");

        // Busca por CPF
        let search_cpf = list_patients(&conn, Some("11144477735")).unwrap();
        assert_eq!(search_cpf.len(), 1);
        assert_eq!(search_cpf[0].name, "Ana Clara");

        // Busca por telefone
        let search_phone = list_patients(&conn, Some("987654321")).unwrap();
        assert_eq!(search_phone.len(), 2);
    }

    #[test]
    fn test_archive_patient() {
        let conn = setup_test_db();
        let p = create_patient(&conn, sample_input("Paciente Arquivar", None)).unwrap();

        let list_before = list_patients(&conn, None).unwrap();
        assert_eq!(list_before.len(), 1);

        archive_patient(&conn, p.id).unwrap();

        let list_after = list_patients(&conn, None).unwrap();
        assert_eq!(list_after.len(), 0);

        // Registro ainda existe no banco
        let p_archived = get_patient(&conn, p.id).unwrap();
        assert!(p_archived.archived);
    }

    #[test]
    fn test_patient_not_found() {
        let conn = setup_test_db();
        let res = get_patient(&conn, 9999);
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Paciente não encontrado.");
    }

    #[test]
    fn test_exam_history_empty_and_with_records() {
        let conn = setup_test_db();
        let p = create_patient(&conn, sample_input("Paciente Com Exames", None)).unwrap();

        let history = patient_exam_history(&conn, p.id).unwrap();
        assert!(history.is_empty());

        // Inserir um exame real no banco para testar
        conn.execute(
            "INSERT INTO exams (patient_id, type, source, status, started_at, duration, max_pressure, contact_area_percent)
             VALUES (?1, 'static', 'REAL', 'completed', '2026-10-06 14:00:00', 10.5, 1209.0, 16.4)",
            params![p.id],
        )
        .unwrap();

        let history_after = patient_exam_history(&conn, p.id).unwrap();
        assert_eq!(history_after.len(), 1);
        assert_eq!(history_after[0].r#type, "static");
        assert_eq!(history_after[0].source, "REAL");
        assert_eq!(history_after[0].status, "completed");
        assert_eq!(history_after[0].duration, Some(10.5));
        assert_eq!(history_after[0].max_pressure, Some(1209.0));
        assert_eq!(history_after[0].contact_area_percent, Some(16.4));
    }
}
