use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppDb;

// Each foot retains its own matrix and raw series, but a paired acquisition
// occupies one entry in the history. Keep an orphaned stage visible.
pub(crate) const HISTORY_ENTRY_FILTER: &str = "NOT EXISTS (
    SELECT 1 FROM exams first_stage
    WHERE json_extract(e.analysis_json,'$.acquisition.stage')=2
      AND json_extract(first_stage.analysis_json,'$.acquisition.stage')=1
      AND json_extract(first_stage.analysis_json,'$.acquisition.sequenceId')=json_extract(e.analysis_json,'$.acquisition.sequenceId')
      AND first_stage.patient_id=e.patient_id AND first_stage.status=e.status
)";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopSample {
    pub timestamp_ms: f64,
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamInput {
    #[serde(default)]
    pub analysis: Option<crate::exam_analysis::Analysis>,
    #[serde(default)]
    pub series_frames: Option<Vec<crate::calibration::Frame>>,
    #[serde(default)]
    pub physical_profile_id: Option<String>,
    #[serde(default)]
    pub raw_frames: Option<Vec<crate::calibration::Frame>>,
    pub cop_trajectory: Option<Vec<CopSample>>,
    pub visualization_settings: Option<serde_json::Value>,
    pub patient_id: i64,
    pub professional_id: Option<i64>,
    pub clinic_id: Option<i64>,
    pub r#type: String, // "static"
    pub source: String, // "REAL" | "SIMULATION"
    pub status: String, // "completed"
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub duration: f64,
    pub frame_count: i64,
    pub fps: f64,
    pub threshold: f64,
    pub vmax: f64,
    pub gamma: f64,
    pub smoothing: f64,
    pub tare_applied: bool,
    pub matrix: Vec<f64>, // Exatamente 225 valores >= 0
    pub max_pressure: f64,
    pub mean_pressure: Option<f64>,
    pub contact_area_percent: f64,
    pub contact_sensors: i64,
    pub cop_x: Option<f64>,
    pub cop_y: Option<f64>,
    pub left_load: f64,
    pub right_load: f64,
    pub left_percent: Option<f64>,
    pub right_percent: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamSummary {
    pub acquisition: Option<crate::exam_analysis::Acquisition>,
    pub id: i64,
    pub patient_id: i64,
    pub patient_name: String,
    pub patient_cpf: Option<String>,
    pub r#type: String,
    pub source: String,
    pub status: String,
    pub started_at: Option<String>,
    pub duration: Option<f64>,
    pub frame_count: i64,
    pub fps: Option<f64>,
    pub max_pressure: Option<f64>,
    pub mean_pressure: Option<f64>,
    pub contact_area_percent: Option<f64>,
    pub contact_sensors: Option<i64>,
    pub cop_x: Option<f64>,
    pub cop_y: Option<f64>,
    pub left_percent: Option<f64>,
    pub right_percent: Option<f64>,
    pub professional_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamDetails {
    pub analysis: Option<crate::exam_analysis::Analysis>,
    pub patient_snapshot_preserved: bool,
    pub physical_result: Option<crate::calibration::PhysicalResult>,
    pub cop_trajectory: Option<Vec<CopSample>>,
    pub visualization_settings: Option<serde_json::Value>,
    pub id: i64,
    pub patient_id: i64,
    pub patient_name: String,
    pub patient_cpf: Option<String>,
    pub patient_birth_date: Option<String>,
    pub patient_height: Option<f64>,
    pub patient_weight: Option<f64>,
    pub patient_shoe_size: Option<f64>,
    pub professional_id: Option<i64>,
    pub professional_name: Option<String>,
    pub clinic_id: Option<i64>,
    pub r#type: String,
    pub source: String,
    pub status: String,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub duration: Option<f64>,
    pub frame_count: i64,
    pub fps: Option<f64>,
    pub threshold: Option<f64>,
    pub vmax: Option<f64>,
    pub gamma: Option<f64>,
    pub smoothing: Option<f64>,
    pub tare_applied: bool,
    pub max_pressure: Option<f64>,
    pub mean_pressure: Option<f64>,
    pub contact_area_percent: Option<f64>,
    pub contact_sensors: Option<i64>,
    pub cop_x: Option<f64>,
    pub cop_y: Option<f64>,
    pub left_load: Option<f64>,
    pub right_load: Option<f64>,
    pub left_percent: Option<f64>,
    pub right_percent: Option<f64>,
    pub matrix: Vec<f64>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PatientSnapshot {
    name: String,
    cpf: Option<String>,
    birth_date: Option<String>,
    height: Option<f64>,
    weight: Option<f64>,
    shoe_size: Option<f64>,
    professional_name: Option<String>,
}

pub fn validate_exam_input(data: &ExamInput) -> Result<(), String> {
    if !["static", "dynamic"].contains(&data.r#type.as_str())
        || !["draft", "acquiring", "completed", "discarded"].contains(&data.status.as_str())
    {
        return Err("Tipo ou estado do exame inválido.".into());
    }
    if !data.threshold.is_finite()
        || !(0.0..=1000.0).contains(&data.threshold)
        || !data.vmax.is_finite()
        || !(500.0..=4095.0).contains(&data.vmax)
        || !data.gamma.is_finite()
        || !(0.5..=3.0).contains(&data.gamma)
        || !data.smoothing.is_finite()
        || !(0.0..=1.0).contains(&data.smoothing)
        || !(0..=225).contains(&data.contact_sensors)
        || [data.left_load, data.right_load]
            .iter()
            .any(|n| !n.is_finite() || !(0.0..=921375.0).contains(n))
        || data
            .mean_pressure
            .is_some_and(|n| !n.is_finite() || !(0.0..=4095.0).contains(&n))
        || [data.left_percent, data.right_percent]
            .iter()
            .flatten()
            .any(|n| !n.is_finite() || !(0.0..=100.0).contains(n))
        || data.notes.as_ref().is_some_and(|n| n.len() > 40000)
    {
        return Err("Parâmetros ou métricas do exame fora dos limites permitidos.".into());
    }
    if let Some(value) = &data.visualization_settings {
        let v: crate::support::Visualization = serde_json::from_value(value.clone())
            .map_err(|_| "Configurações de visualização inválidas")?;
        crate::support::validate_visualization(&v)?;
        if v.gamma != data.gamma
            || v.vmax as f64 != data.vmax
            || v.threshold as f64 != data.threshold
            || v.smoothing != data.smoothing
        {
            return Err("Os parâmetros do exame e da visualização devem coincidir.".into());
        }
    }
    if let Some(samples) = &data.cop_trajectory {
        if samples.len() > 10000
            || samples.iter().any(|s| {
                !s.timestamp_ms.is_finite()
                    || s.timestamp_ms < 0.0
                    || s.timestamp_ms > data.duration * 1000.0
                    || !s.x.is_finite()
                    || !s.y.is_finite()
                    || !(0.0..=14.0).contains(&s.x)
                    || !(0.0..=14.0).contains(&s.y)
            })
        {
            return Err("Trajetória de CoP inválida.".into());
        }
    }
    if data.patient_id <= 0 {
        return Err("Paciente inválido.".into());
    }

    if data.matrix.len() != 225 {
        return Err(format!(
            "A matriz do exame deve possuir exatamente 225 valores. Recebidos: {}.",
            data.matrix.len()
        ));
    }

    for (i, &val) in data.matrix.iter().enumerate() {
        if !val.is_finite() || !(0.0..=4095.0).contains(&val) {
            return Err(format!(
                "O valor no sensor {} deve ser finito e não negativo (recebido: {}).",
                i, val
            ));
        }
    }

    if data.source != "REAL" && data.source != "SIMULATION" {
        return Err("Origem do exame deve ser REAL ou SIMULATION.".into());
    }

    if !data.duration.is_finite() || data.duration < 0.0 {
        return Err("Duração da aquisição inválida.".into());
    }

    if data.frame_count < 0 {
        return Err("Contagem de quadros não pode ser negativa.".into());
    }

    if !data.fps.is_finite() || data.fps < 0.0 {
        return Err("Taxa de amostragem (FPS) inválida.".into());
    }

    if !data.max_pressure.is_finite() || !(0.0..=4095.0).contains(&data.max_pressure) {
        return Err("Pressão máxima inválida.".into());
    }

    if !data.contact_area_percent.is_finite()
        || data.contact_area_percent < 0.0
        || data.contact_area_percent > 100.0
    {
        return Err("Percentual de área de contato deve estar entre 0% e 100%.".into());
    }

    if let Some(x) = data.cop_x {
        if !x.is_finite() || x < 0.0 || x > 14.0 {
            return Err("Coordenada CoP X fora da matriz 15x15 (esperado 0 a 14).".into());
        }
    }

    if let Some(y) = data.cop_y {
        if !y.is_finite() || y < 0.0 || y > 14.0 {
            return Err("Coordenada CoP Y fora da matriz 15x15 (esperado 0 a 14).".into());
        }
    }

    Ok(())
}

pub fn create_exam(conn: &mut Connection, data: ExamInput) -> Result<ExamDetails, String> {
    validate_exam_input(&data)?;
    let physical = if let Some(profile_id) = &data.physical_profile_id {
        let frames = data
            .raw_frames
            .as_ref()
            .ok_or("Exame físico exige quadros brutos")?;
        if frames.len() != data.frame_count as usize || data.r#type != "static" {
            return Err("Contagem ou protocolo físico incompatível".into());
        }
        Some(crate::calibration::process_physical(
            conn,
            profile_id,
            &data.source,
            frames,
        )?)
    } else {
        None
    };
    if data.raw_frames.is_some() && physical.is_none() {
        return Err("Quadros físicos exigem identificação do perfil".into());
    }
    if data.series_frames.is_some() && (data.analysis.is_none() || data.raw_frames.is_some()) {
        return Err("Série relativa exige metadados e armazenamento canônico único".into());
    }
    crate::exam_analysis::validate(
        &data,
        data.raw_frames
            .as_deref()
            .or(data.series_frames.as_deref())
            .unwrap_or(&[]),
    )?;

    // Valida existência do paciente
    let patient_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM patients WHERE id = ?1",
            params![data.patient_id],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .map_err(|e| format!("Erro ao verificar paciente: {e}"))?;

    if !patient_exists {
        return Err("Paciente não encontrado no banco de dados.".into());
    }

    let matrix_json = serde_json::to_string(&data.matrix)
        .map_err(|e| format!("Erro ao codificar matriz em JSON: {e}"))?;
    let visualization_json = data
        .visualization_settings
        .as_ref()
        .map(serde_json::to_string)
        .transpose()
        .map_err(|e| format!("Erro ao codificar ajustes do exame: {e}"))?;
    let trajectory_json = data
        .cop_trajectory
        .as_ref()
        .map(serde_json::to_string)
        .transpose()
        .map_err(|e| format!("Erro ao codificar trajetória: {e}"))?;

    let started_at = match data.started_at.clone() {
        Some(value) => value,
        None => conn
            .query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')", [], |r| {
                r.get::<_, String>(0)
            })
            .map_err(|e| format!("Erro ao registrar data do exame: {e}"))?,
    };
    let finished_at = data.finished_at.clone();
    let tare_num: i64 = if data.tare_applied { 1 } else { 0 };

    let tx = conn
        .savepoint()
        .map_err(|e| format!("Erro ao abrir transação: {e}"))?;

    tx.execute(
        "INSERT INTO exams (
            patient_id, professional_id, clinic_id, type, source, status,
            started_at, finished_at, duration, acquisition_frequency,
            sensor_rows, sensor_columns, threshold, vmax, gamma,
            smoothing, tare_applied, frame_count,
            max_pressure, mean_pressure, contact_area_percent, contact_sensors,
            cop_x, cop_y, left_load, right_load, left_percent, right_percent,
            matrix_json, notes, visualization_settings_json, cop_trajectory_json
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6,
            ?7, ?8, ?9, ?10,
            15, 15, ?11, ?12, ?13,
            ?14, ?15, ?16,
            ?17, ?18, ?19, ?20,
            ?21, ?22, ?23, ?24, ?25, ?26,
            ?27, ?28, ?29, ?30
        )",
        params![
            data.patient_id,
            data.professional_id,
            data.clinic_id,
            data.r#type,
            data.source,
            data.status,
            started_at,
            finished_at,
            data.duration,
            data.fps,
            data.threshold,
            data.vmax,
            data.gamma,
            data.smoothing,
            tare_num,
            data.frame_count,
            data.max_pressure,
            data.mean_pressure,
            data.contact_area_percent,
            data.contact_sensors,
            data.cop_x,
            data.cop_y,
            data.left_load,
            data.right_load,
            data.left_percent,
            data.right_percent,
            matrix_json,
            data.notes
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty()),
            visualization_json,
            trajectory_json,
        ],
    )
    .map_err(|e| format!("Erro ao gravar exame no banco: {e}"))?;

    let exam_id = tx.last_insert_rowid();
    if let Some(analysis) = &data.analysis {
        tx.execute(
            "UPDATE exams SET analysis_json=?2 WHERE id=?1",
            params![
                exam_id,
                serde_json::to_string(analysis).map_err(|e| e.to_string())?
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    let snapshot = tx.query_row(
        "SELECT p.name,p.cpf,p.birth_date,p.height,p.weight,p.shoe_size,pr.name FROM patients p LEFT JOIN professionals pr ON pr.id=?2 WHERE p.id=?1",
        params![data.patient_id, data.professional_id], |r| Ok(PatientSnapshot {
            name: r.get(0)?, cpf: r.get(1)?, birth_date: r.get(2)?, height: r.get(3)?,
            weight: r.get(4)?, shoe_size: r.get(5)?, professional_name: r.get(6)?,
        }),
    ).map_err(|e| format!("Erro ao preservar dados do paciente: {e}"))?;
    tx.execute(
        "UPDATE exams SET patient_snapshot_json=?2 WHERE id=?1",
        params![
            exam_id,
            serde_json::to_string(&snapshot).map_err(|e| e.to_string())?
        ],
    )
    .map_err(|e| e.to_string())?;
    if let Some(result) = physical {
        tx.execute(
            "UPDATE exams SET physical_result_json=?2 WHERE id=?1",
            params![
                exam_id,
                serde_json::to_string(&result).map_err(|e| e.to_string())?
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(frames) = data.raw_frames.as_ref().or(data.series_frames.as_ref()) {
        for (ordinal, chunk) in frames.chunks(60).enumerate() {
            tx.execute(
                "INSERT INTO exam_raw_chunks(exam_id,ordinal,frames_json) VALUES(?1,?2,?3)",
                params![
                    exam_id,
                    ordinal,
                    serde_json::to_string(chunk).map_err(|e| e.to_string())?
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    // Só confirma a gravação quando o resultado também puder ser lido.
    let saved = get_exam(&tx, exam_id)?;

    tx.commit()
        .map_err(|e| format!("Erro ao concluir salvamento do exame: {e}"))?;

    Ok(saved)
}

pub fn list_exams(conn: &Connection, search: Option<&str>) -> Result<Vec<ExamSummary>, String> {
    list_exams_page(conn, search, None, None)
}

pub fn list_exams_page(
    conn: &Connection,
    search: Option<&str>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<ExamSummary>, String> {
    list_exams_filtered(conn, search, limit, offset, None)
}

pub fn list_exams_filtered(
    conn: &Connection,
    search: Option<&str>,
    limit: Option<i64>,
    offset: Option<i64>,
    patient_id: Option<i64>,
) -> Result<Vec<ExamSummary>, String> {
    list_exams_access(conn, search, limit, offset, patient_id, false)
}

fn list_exams_access(
    conn: &Connection,
    search: Option<&str>,
    limit: Option<i64>,
    offset: Option<i64>,
    patient_id: Option<i64>,
    completed_only: bool,
) -> Result<Vec<ExamSummary>, String> {
    let (limit, offset) = crate::pagination::bounds(limit, offset)?;
    let base_sql = "
        SELECT
            e.id, e.patient_id,
            CASE WHEN e.patient_snapshot_json IS NULL THEN p.name ELSE json_extract(e.patient_snapshot_json,'$.name') END,
            CASE WHEN e.patient_snapshot_json IS NULL THEN p.cpf ELSE json_extract(e.patient_snapshot_json,'$.cpf') END,
            e.type, e.source, e.status, e.started_at, e.duration,
            e.frame_count, e.acquisition_frequency,
            e.max_pressure, e.mean_pressure, e.contact_area_percent, e.contact_sensors,
            e.cop_x, e.cop_y, e.left_percent, e.right_percent,
            CASE WHEN e.patient_snapshot_json IS NULL THEN pr.name ELSE json_extract(e.patient_snapshot_json,'$.professionalName') END, e.created_at, json_extract(e.analysis_json,'$.acquisition')
        FROM exams e
        INNER JOIN patients p ON e.patient_id = p.id
        LEFT JOIN professionals pr ON e.professional_id = pr.id
    ";

    let mut sql = format!("{base_sql} WHERE (?1 IS NULL OR e.patient_id=?1) AND {HISTORY_ENTRY_FILTER}");
    let mut params_vec: Vec<rusqlite::types::Value> = vec![patient_id
        .map(Into::into)
        .unwrap_or(rusqlite::types::Value::Null)];
    if let Some(term) = search.map(str::trim).filter(|s| !s.is_empty()) {
        sql.push_str(" AND (p.name LIKE ?2 OR p.cpf LIKE ?2 OR (?3<>'' AND REPLACE(REPLACE(p.cpf,'.',''),'-','') LIKE ?3) OR json_extract(e.patient_snapshot_json,'$.name') LIKE ?2 OR json_extract(e.patient_snapshot_json,'$.cpf') LIKE ?2)");
        params_vec.push(format!("%{term}%").into());
        let digits: String = term.chars().filter(|c| c.is_ascii_digit()).collect();
        params_vec.push(
            if digits.is_empty() {
                String::new()
            } else {
                format!("%{digits}%")
            }
            .into(),
        );
    }
    if patient_id.is_some() || completed_only {
        sql.push_str(" AND e.status='completed'");
    }
    sql.push_str(" ORDER BY e.started_at DESC, e.id DESC");

    sql.push_str(" LIMIT ? OFFSET ?");
    params_vec.push(limit.into());
    params_vec.push(offset.into());
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| format!("Erro ao preparar listagem de exames: {e}"))?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec), |r| {
            Ok(ExamSummary {
                acquisition: r
                    .get::<_, Option<String>>(21)?
                    .map(|json| serde_json::from_str(&json))
                    .transpose()
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            21,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?,
                id: r.get(0)?,
                patient_id: r.get(1)?,
                patient_name: r.get(2)?,
                patient_cpf: r.get(3)?,
                r#type: r.get(4)?,
                source: r.get(5)?,
                status: r.get(6)?,
                started_at: r.get(7)?,
                duration: r.get(8)?,
                frame_count: r.get::<_, Option<i64>>(9)?.unwrap_or(0),
                fps: r.get(10)?,
                max_pressure: r.get(11)?,
                mean_pressure: r.get(12)?,
                contact_area_percent: r.get(13)?,
                contact_sensors: r.get(14)?,
                cop_x: r.get(15)?,
                cop_y: r.get(16)?,
                left_percent: r.get(17)?,
                right_percent: r.get(18)?,
                professional_name: r.get(19)?,
                created_at: r.get(20)?,
            })
        })
        .map_err(|e| format!("Erro ao consultar exames: {e}"))?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| format!("Erro ao processar item do exame: {e}"))?);
    }

    Ok(items)
}

pub fn get_exam(conn: &Connection, id: i64) -> Result<ExamDetails, String> {
    let sql = "
        SELECT
            e.id, e.patient_id, p.name, p.cpf, p.birth_date, p.height, p.weight, p.shoe_size,
            e.professional_id, pr.name, e.clinic_id,
            e.type, e.source, e.status, e.started_at, e.finished_at, e.duration,
            e.frame_count, e.acquisition_frequency,
            e.threshold, e.vmax, e.gamma, e.smoothing, e.tare_applied,
            e.max_pressure, e.mean_pressure, e.contact_area_percent, e.contact_sensors,
            e.cop_x, e.cop_y, e.left_load, e.right_load, e.left_percent, e.right_percent,
            e.matrix_json, e.notes, e.created_at, e.visualization_settings_json, e.cop_trajectory_json, e.physical_result_json, e.patient_snapshot_json, e.analysis_json
        FROM exams e
        INNER JOIN patients p ON e.patient_id = p.id
        LEFT JOIN professionals pr ON e.professional_id = pr.id
        WHERE e.id = ?1
    ";

    let opt = conn
        .query_row(sql, params![id], |r| {
            let tare_num: i64 = r.get::<_, Option<i64>>(23)?.unwrap_or(0);
            let matrix_str: Option<String> = r.get(34)?;

            let snapshot = r
                .get::<_, Option<String>>(40)?
                .map(|s| serde_json::from_str::<PatientSnapshot>(&s))
                .transpose()
                .map_err(|e| {
                    rusqlite::Error::FromSqlConversionFailure(
                        40,
                        rusqlite::types::Type::Text,
                        Box::new(e),
                    )
                })?;
            let mut details = ExamDetails {
                analysis: r
                    .get::<_, Option<String>>(41)?
                    .map(|s| serde_json::from_str(&s))
                    .transpose()
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            41,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?,
                patient_snapshot_preserved: snapshot.is_some(),
                physical_result: r
                    .get::<_, Option<String>>(39)?
                    .map(|s| serde_json::from_str(&s))
                    .transpose()
                    .map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            39,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?,
                cop_trajectory: r
                    .get::<_, Option<String>>(38)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                visualization_settings: r
                    .get::<_, Option<String>>(37)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                id: r.get(0)?,
                patient_id: r.get(1)?,
                patient_name: r.get(2)?,
                patient_cpf: r.get(3)?,
                patient_birth_date: r.get(4)?,
                patient_height: r.get(5)?,
                patient_weight: r.get(6)?,
                patient_shoe_size: r.get(7)?,
                professional_id: r.get(8)?,
                professional_name: r.get(9)?,
                clinic_id: r.get(10)?,
                r#type: r.get(11)?,
                source: r.get(12)?,
                status: r.get(13)?,
                started_at: r.get(14)?,
                finished_at: r.get(15)?,
                duration: r.get(16)?,
                frame_count: r.get::<_, Option<i64>>(17)?.unwrap_or(0),
                fps: r.get(18)?,
                threshold: r.get(19)?,
                vmax: r.get(20)?,
                gamma: r.get(21)?,
                smoothing: r.get(22)?,
                tare_applied: tare_num != 0,
                max_pressure: r.get(24)?,
                mean_pressure: r.get(25)?,
                contact_area_percent: r.get(26)?,
                contact_sensors: r.get(27)?,
                cop_x: r.get(28)?,
                cop_y: r.get(29)?,
                left_load: r.get(30)?,
                right_load: r.get(31)?,
                left_percent: r.get(32)?,
                right_percent: r.get(33)?,
                matrix: match matrix_str {
                    Some(ref s) => serde_json::from_str::<Vec<f64>>(s).unwrap_or_default(),
                    None => Vec::new(),
                },
                notes: r.get(35)?,
                created_at: r.get(36)?,
            };
            if let Some(snapshot) = snapshot {
                details.patient_name = snapshot.name;
                details.patient_cpf = snapshot.cpf;
                details.patient_birth_date = snapshot.birth_date;
                details.patient_height = snapshot.height;
                details.patient_weight = snapshot.weight;
                details.patient_shoe_size = snapshot.shoe_size;
                details.professional_name = snapshot.professional_name;
            }
            Ok(details)
        })
        .optional()
        .map_err(|e| format!("Erro ao consultar detalhes do exame: {e}"))?;

    opt.ok_or_else(|| "Exame não encontrado.".into())
}

pub fn delete_exam(conn: &Connection, id: i64) -> Result<(), String> {
    let exam = get_exam(conn, id)?;
    let sequence_id = exam.analysis.as_ref().and_then(|a| a.acquisition.as_ref()).and_then(|a| a.sequence_id.as_deref());
    conn.execute("DELETE FROM exams WHERE id=?1 OR (patient_id=?2 AND json_extract(analysis_json,'$.acquisition.sequenceId')=?3)", params![id, exam.patient_id, sequence_id])
        .map_err(|e| format!("Erro ao excluir exame: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn exams_raw_frames(
    auth: State<crate::auth::AuthState>,
    db: State<AppDb>,
    id: i64,
    offset: Option<usize>,
    limit: Option<usize>,
) -> Result<Vec<crate::calibration::Frame>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let exam = get_exam(&c, id)?;
    if crate::auth::current(&c, &auth)?.role == "assistant" && exam.status != "completed" {
        return Err("Seu perfil consulta apenas resultados concluídos.".into());
    }
    crate::exam_analysis::read_frames(&c, id, offset.unwrap_or(0), limit.unwrap_or(20000))
}

#[tauri::command]
pub fn exams_add_region(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    id: i64,
    mut revision: crate::exam_analysis::Region,
) -> Result<ExamDetails, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    revision.operator = crate::auth::current(&c, &auth)?.name;
    let mut exam = get_exam(&c, id)?;
    let analysis = exam
        .analysis
        .as_mut()
        .ok_or("Análise versionada indisponível neste exame antigo")?;
    crate::exam_analysis::validate_region(&revision, analysis.series.frame_count)?;
    if analysis.regions.len() >= 100 {
        return Err("Limite de revisões atingido; histórico preservado".into());
    }
    analysis.regions.push(revision);
    c.execute(
        "UPDATE exams SET analysis_json=?2 WHERE id=?1",
        params![
            id,
            serde_json::to_string(analysis).map_err(|e| e.to_string())?
        ],
    )
    .map_err(|e| e.to_string())?;
    get_exam(&c, id)
}

// -------------------------------------------------------------------------------------------------
// COMANDOS TAURI
// -------------------------------------------------------------------------------------------------

#[tauri::command]
pub fn exams_list(
    auth: State<crate::auth::AuthState>,
    db: State<AppDb>,
    search: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
    patient_id: Option<i64>,
) -> Result<Vec<ExamSummary>, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    list_exams_access(
        &conn,
        search.as_deref(),
        limit,
        offset,
        patient_id,
        crate::auth::current(&conn, &auth)?.role == "assistant",
    )
}

#[tauri::command]
pub fn exams_get(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    id: i64,
) -> Result<ExamDetails, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    let exam = get_exam(&conn, id)?;
    if crate::auth::current(&conn, &auth)?.role == "assistant" && exam.status != "completed" {
        return Err("Seu perfil consulta apenas resultados concluídos.".into());
    }
    Ok(exam)
}

pub fn update_exam_notes(
    conn: &mut Connection,
    id: i64,
    notes: &str,
) -> Result<ExamDetails, String> {
    if notes.chars().count() > 10_000 {
        return Err("Observações limitadas a 10.000 caracteres.".into());
    }
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    if tx.execute("UPDATE exams SET notes=?2, updated_at=datetime('now') WHERE id=?1 AND status='completed'",
        params![id, notes.trim()]).map_err(|e| e.to_string())? == 0 {
        return Err("Exame concluído não encontrado.".into());
    }
    crate::support::add_log(
        &tx,
        "info",
        "exams_update_notes",
        "Observações do exame salvas.",
    )?;
    let saved = get_exam(&tx, id)?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(saved)
}

#[tauri::command]
pub fn exams_update_notes(db: State<AppDb>, id: i64, notes: String) -> Result<ExamDetails, String> {
    let mut conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    update_exam_notes(&mut conn, id, &notes)
}

#[tauri::command]
pub fn exams_create(db: State<AppDb>, data: ExamInput) -> Result<ExamDetails, String> {
    if data
        .analysis
        .as_ref()
        .and_then(|a| a.acquisition.as_ref())
        .is_some_and(|a| a.total_stages == 2)
    {
        return Err("Salve as duas etapas pelo comando de sequência".into());
    }
    let mut conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    create_exam(&mut conn, data)
}

pub fn create_exam_sequence(
    conn: &mut Connection,
    data: Vec<ExamInput>,
) -> Result<Vec<ExamDetails>, String> {
    if data.len() != 2 {
        return Err("A sequência exige os dois pés".into());
    }
    let first = data[0]
        .analysis
        .as_ref()
        .and_then(|a| a.acquisition.as_ref())
        .ok_or("Modalidade ausente")?;
    let second = data[1]
        .analysis
        .as_ref()
        .and_then(|a| a.acquisition.as_ref())
        .ok_or("Modalidade ausente")?;
    crate::exam_analysis::validate_acquisition(first)?;
    crate::exam_analysis::validate_acquisition(second)?;
    if first.total_stages != 2
        || second.total_stages != 2
        || first.stage != 1
        || second.stage != 2
        || first.sequence_id != second.sequence_id
        || first.order != second.order
        || data[0].patient_id != data[1].patient_id
        || data[0].source != data[1].source
        || data[0].duration != data[1].duration
        || data[0].physical_profile_id != data[1].physical_profile_id
    {
        return Err("Etapas incompatíveis na sequência".into());
    }
    let id = first.sequence_id.as_deref().unwrap();
    let existing: i64 = conn.query_row("SELECT count(*) FROM exams WHERE json_extract(analysis_json,'$.acquisition.sequenceId')=?1", [id], |r| r.get(0)).map_err(|e| e.to_string())?;
    if existing != 0 {
        return Err("Esta sequência já foi salva. Consulte o histórico.".into());
    }
    conn.execute_batch("SAVEPOINT exam_sequence")
        .map_err(|e| e.to_string())?;
    let result: Result<Vec<_>, _> = data
        .into_iter()
        .map(|input| create_exam(conn, input))
        .collect();
    match result {
        Ok(exams) => {
            conn.execute_batch("RELEASE exam_sequence")
                .map_err(|e| e.to_string())?;
            Ok(exams)
        }
        Err(error) => {
            conn.execute_batch("ROLLBACK TO exam_sequence; RELEASE exam_sequence")
                .map_err(|e| e.to_string())?;
            Err(error)
        }
    }
}
#[tauri::command]
pub fn exams_create_sequence(
    db: State<AppDb>,
    data: Vec<ExamInput>,
) -> Result<Vec<ExamDetails>, String> {
    let mut conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    create_exam_sequence(&mut conn, data)
}

#[tauri::command]
pub fn exams_sequence(db: State<AppDb>, id: i64) -> Result<Vec<ExamDetails>, String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    let exam = get_exam(&conn, id)?;
    if exam.status != "completed" {
        return Err("Sequência disponível apenas para resultados concluídos".into());
    }
    let Some(sequence) = exam
        .analysis
        .as_ref()
        .and_then(|a| a.acquisition.as_ref())
        .and_then(|a| a.sequence_id.as_ref())
    else {
        return Ok(vec![exam]);
    };
    let mut stmt = conn.prepare("SELECT id FROM exams WHERE patient_id=?1 AND status='completed' AND json_extract(analysis_json,'$.acquisition.sequenceId')=?2 ORDER BY json_extract(analysis_json,'$.acquisition.stage')").map_err(|e| e.to_string())?;
    let ids = stmt
        .query_map(params![exam.patient_id, sequence], |r| r.get::<_, i64>(0))
        .map_err(|e| e.to_string())?;
    ids.map(|id| get_exam(&conn, id.map_err(|e| e.to_string())?))
        .collect()
}

#[tauri::command]
pub fn exams_delete(db: State<AppDb>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|_| "Banco indisponível")?;
    delete_exam(&conn, id)
}

// -------------------------------------------------------------------------------------------------
// TESTES
// -------------------------------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrate;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        migrate(&conn).unwrap();

        // Insere paciente para testes
        conn.execute(
            "INSERT INTO patients (id, name, cpf, birth_date, height, weight, shoe_size)
             VALUES (1, 'João da Silva', '12345678901', '1990-05-15', 1.75, 78.0, 41.0)",
            [],
        )
        .unwrap();

        conn
    }

    #[test]
    fn secretary_history_excludes_unfinished_exams_before_pagination() {
        let mut c = setup_test_db();
        let first = create_exam(&mut c, sample_exam_input(1)).unwrap();
        let second = create_exam(&mut c, sample_exam_input(1)).unwrap();
        c.execute(
            "UPDATE exams SET status='discarded' WHERE id=?1",
            [first.id],
        )
        .unwrap();
        let allowed = list_exams_access(&c, None, Some(50), Some(0), None, true).unwrap();
        assert_eq!(allowed.len(), 1);
        assert_eq!(allowed[0].id, second.id);
        assert_eq!(
            list_exams_access(&c, None, None, None, None, false)
                .unwrap()
                .len(),
            2
        );
    }
    fn sample_exam_input(patient_id: i64) -> ExamInput {
        let mut matrix = vec![0.0; 225];
        // Simula pressão nos sensores centrais
        matrix[112] = 1200.0;
        matrix[113] = 1050.0;
        matrix[97] = 800.0;

        ExamInput {
            analysis: None,
            series_frames: None,
            physical_profile_id: None,
            raw_frames: None,
            cop_trajectory: Some(vec![
                CopSample {
                    timestamp_ms: 0.0,
                    x: 7.0,
                    y: 7.0,
                },
                CopSample {
                    timestamp_ms: 33.0,
                    x: 7.2,
                    y: 7.4,
                },
            ]),
            visualization_settings: Some(serde_json::json!({
                "gamma": 1.3, "vmax": 2200, "threshold": 150, "smoothing": 0.35,
                "renderFps": 20, "resolution": 450, "mode": "MANUAL", "showCop": false
            })),
            patient_id,
            professional_id: None,
            clinic_id: None,
            r#type: "static".into(),
            source: "SIMULATION".into(),
            status: "completed".into(),
            started_at: Some("2026-10-06T15:30:00".into()),
            finished_at: Some("2026-10-06T15:30:10".into()),
            duration: 10.0,
            frame_count: 300,
            fps: 30.0,
            threshold: 150.0,
            vmax: 2200.0,
            gamma: 1.3,
            smoothing: 0.35,
            tare_applied: true,
            matrix,
            max_pressure: 1200.0,
            mean_pressure: Some(1016.7),
            contact_area_percent: 1.33,
            contact_sensors: 3,
            cop_x: Some(7.2),
            cop_y: Some(7.4),
            left_load: 0.0,
            right_load: 3050.0,
            left_percent: Some(0.0),
            right_percent: Some(100.0),
            notes: Some("Teste de exame estático".into()),
        }
    }

    #[test]
    fn saved_demographics_survive_edit_and_keep_original_nulls() {
        let mut c = setup_test_db();
        c.execute(
            "UPDATE patients SET birth_date=NULL,height=NULL WHERE id=1",
            [],
        )
        .unwrap();
        let saved = create_exam(&mut c, sample_exam_input(1)).unwrap();
        c.execute("UPDATE patients SET name='Nome novo',birth_date='2000-01-01',height=180,weight=99 WHERE id=1", []).unwrap();
        let reopened = get_exam(&c, saved.id).unwrap();
        assert!(reopened.patient_snapshot_preserved);
        assert_eq!(reopened.patient_name, saved.patient_name);
        assert_eq!(reopened.patient_weight, saved.patient_weight);
        assert_eq!(reopened.patient_birth_date, None);
        assert_eq!(reopened.patient_height, None);
        assert_eq!(
            list_exams(&c, Some(&saved.patient_name)).unwrap()[0].patient_name,
            saved.patient_name
        );
        assert!(list_exams(&c, Some("inexistente")).unwrap().is_empty());
        c.execute(
            "UPDATE exams SET patient_snapshot_json=NULL WHERE id=?1",
            [saved.id],
        )
        .unwrap();
        let old = get_exam(&c, saved.id).unwrap();
        assert!(!old.patient_snapshot_preserved);
        assert_eq!(old.patient_name, "Nome novo");
    }

    #[test]
    fn notes_are_persistent_without_changing_sample_and_reject_invalid_writes() {
        let mut c = setup_test_db();
        let saved = create_exam(&mut c, sample_exam_input(1)).unwrap();
        update_exam_notes(&mut c, saved.id, " Observação sintética ").unwrap();
        let reopened = get_exam(&c, saved.id).unwrap();
        assert_eq!(reopened.notes.as_deref(), Some("Observação sintética"));
        assert_eq!(reopened.matrix, saved.matrix);
        assert_eq!(reopened.gamma, saved.gamma);
        assert_eq!(reopened.patient_name, saved.patient_name);
        assert!(update_exam_notes(&mut c, saved.id, &"a".repeat(10001)).is_err());
        assert!(update_exam_notes(&mut c, 999, "teste").is_err());
        assert_eq!(get_exam(&c, saved.id).unwrap().notes, reopened.notes);
    }

    #[test]
    fn comparison_reads_only_completed_exams_from_selected_patient() {
        let mut c = setup_test_db();
        c.execute(
            "INSERT INTO patients(id,name) VALUES(2,'Paciente sintético 2')",
            [],
        )
        .unwrap();
        create_exam(&mut c, sample_exam_input(1)).unwrap();
        let saved = create_exam(&mut c, sample_exam_input(2)).unwrap();
        let records = list_exams_filtered(&c, None, Some(51), Some(0), Some(2)).unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].id, saved.id);
        c.execute(
            "UPDATE exams SET status='discarded' WHERE id=?1",
            [saved.id],
        )
        .unwrap();
        assert!(list_exams_filtered(&c, None, Some(51), Some(0), Some(2))
            .unwrap()
            .is_empty());
    }
    #[test]
    fn rejects_out_of_range_adc_metrics_and_visualization_disagreement() {
        let mut input = sample_exam_input(1);
        input.matrix[0] = 4096.0;
        assert!(validate_exam_input(&input).is_err());
        input = sample_exam_input(1);
        input.contact_sensors = 226;
        assert!(validate_exam_input(&input).is_err());
        input = sample_exam_input(1);
        input.left_percent = Some(101.0);
        assert!(validate_exam_input(&input).is_err());
        input = sample_exam_input(1);
        input.gamma = 2.0;
        assert!(validate_exam_input(&input).is_err());
        input = sample_exam_input(1);
        input.mean_pressure = Some(f64::NAN);
        assert!(validate_exam_input(&input).is_err());
        input = sample_exam_input(1);
        input.visualization_settings.as_mut().unwrap()["resolution"] = serde_json::json!(999);
        assert!(validate_exam_input(&input).is_err());
    }

    #[test]
    fn test_create_and_get_exam() {
        let mut conn = setup_test_db();
        let input = sample_exam_input(1);

        let created = create_exam(&mut conn, input).expect("Falha ao criar exame");
        assert_eq!(created.patient_id, 1);
        assert_eq!(created.patient_name, "João da Silva");
        assert_eq!(created.source, "SIMULATION");
        assert_eq!(created.matrix.len(), 225);
        assert_eq!(created.max_pressure, Some(1200.0));
        assert!(created.tare_applied);

        let fetched = get_exam(&conn, created.id).expect("Falha ao buscar exame");
        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.matrix.len(), 225);
        assert_eq!(fetched.matrix[112], 1200.0);
        assert_eq!(fetched.cop_trajectory.as_ref().unwrap().len(), 2);
        let settings = fetched.visualization_settings.unwrap();
        assert_eq!(settings["resolution"], 450);
        assert_eq!(settings["renderFps"], 20);
        assert_eq!(settings["showCop"], false);
    }

    #[test]
    fn test_saved_exam_survives_database_reopen() {
        let suffix = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path =
            std::env::temp_dir().join(format!("baropress-exam-{}-{suffix}.db", std::process::id()));
        let exam_id;
        {
            let mut conn = Connection::open(&path).unwrap();
            migrate(&conn).unwrap();
            conn.execute(
                "INSERT INTO patients (id, name) VALUES (1, 'Paciente de teste')",
                [],
            )
            .unwrap();
            let mut input = sample_exam_input(1);
            input.frame_count = 303;
            exam_id = create_exam(&mut conn, input).unwrap().id;
        }
        {
            let conn = Connection::open(&path).unwrap();
            migrate(&conn).unwrap();
            let exam = get_exam(&conn, exam_id).unwrap();
            assert_eq!(exam.duration, Some(10.0));
            assert_eq!(exam.frame_count, 303);
            assert_eq!(exam.matrix[112], 1200.0);
            assert_eq!(exam.visualization_settings.unwrap()["resolution"], 450);
            assert_eq!(list_exams(&conn, None).unwrap().len(), 1);
        }
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn test_legacy_input_without_visualization_settings() {
        let mut conn = setup_test_db();
        let mut input = sample_exam_input(1);
        input.visualization_settings = None;
        input.started_at = None;
        let exam = create_exam(&mut conn, input).unwrap();
        assert!(exam.visualization_settings.is_none());
        assert_eq!(exam.gamma, Some(1.3));
        assert!(exam.started_at.unwrap().ends_with('Z'));
    }

    #[test]
    fn test_reject_matrix_size_different_than_225() {
        let mut conn = setup_test_db();
        let mut input = sample_exam_input(1);
        input.matrix = vec![0.0; 224]; // 224 em vez de 225

        let res = create_exam(&mut conn, input);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("225 valores"));
    }

    #[test]
    fn test_reject_negative_matrix_value() {
        let mut conn = setup_test_db();
        let mut input = sample_exam_input(1);
        input.matrix[5] = -10.0;

        let res = create_exam(&mut conn, input);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("não negativo"));
    }

    #[test]
    fn test_reject_nonexistent_patient() {
        let mut conn = setup_test_db();
        let input = sample_exam_input(999); // Paciente 999 não existe

        let res = create_exam(&mut conn, input);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Paciente não encontrado"));
    }

    #[test]
    fn test_list_exams_with_search() {
        let mut conn = setup_test_db();
        let input = sample_exam_input(1);
        create_exam(&mut conn, input).unwrap();

        let list_all = list_exams(&conn, None).unwrap();
        assert_eq!(list_all.len(), 1);
        assert_eq!(list_all[0].patient_name, "João da Silva");

        let search_match = list_exams(&conn, Some("João")).unwrap();
        assert_eq!(search_match.len(), 1);

        let search_nomatch = list_exams(&conn, Some("Inexistente")).unwrap();
        assert_eq!(search_nomatch.len(), 0);
    }

    #[test]
    fn test_delete_exam() {
        let mut conn = setup_test_db();
        let input = sample_exam_input(1);
        let created = create_exam(&mut conn, input).unwrap();

        delete_exam(&conn, created.id).expect("Falha ao deletar exame");
        let fetched = get_exam(&conn, created.id);
        assert!(fetched.is_err());
    }
}
