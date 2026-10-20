//! Raw experimental records are immutable; classification corrections are audited.
use crate::AppDb;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tauri::State;
const N: usize = 225;
const G: f64 = 9.80665;
type R<T> = Result<T, String>;
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn now(c: &Connection) -> R<String> {
    c.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |r| {
        r.get(0)
    })
    .map_err(err)
}
fn finite(v: f64) -> bool {
    v.is_finite()
}
fn positive(v: Option<f64>) -> bool {
    v.is_none_or(|x| finite(x) && x > 0.0 && x < 1e9)
}
fn ident(s: &str) -> R<()> {
    if s.is_empty() || s.len() > 128 || !s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        Err("Identificador inválido".into())
    } else {
        Ok(())
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Cell {
    pub x_mm: Option<f64>,
    pub y_mm: Option<f64>,
    pub area_mm2: Option<f64>,
    pub enabled: bool,
    pub reason: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Mat {
    pub id: String,
    pub identity: String,
    pub revision: String,
    pub firmware: String,
    pub width_mm: Option<f64>,
    pub height_mm: Option<f64>,
    pub pitch_x_mm: Option<f64>,
    pub pitch_y_mm: Option<f64>,
    pub strip_width_mm: Option<f64>,
    pub layers: String,
    pub capacity_kg: Option<f64>,
    pub orientation: String,
    pub cells: Vec<Cell>,
    pub created_at: Option<String>,
}
pub fn validate_mat(m: &Mat) -> R<()> {
    ident(&m.id)?;
    if m.identity.trim().is_empty()
        || m.revision.trim().is_empty()
        || m.firmware.trim().is_empty()
        || m.cells.len() != N
        || m.orientation != "RAW_FLIP_X"
        || m.layers.len() > 10000
        || [&m.identity, &m.revision, &m.firmware]
            .iter()
            .any(|s| s.len() > 200)
        || ![
            m.width_mm,
            m.height_mm,
            m.pitch_x_mm,
            m.pitch_y_mm,
            m.strip_width_mm,
            m.capacity_kg,
        ]
        .into_iter()
        .all(positive)
    {
        return Err("Configuração do tapete inválida".into());
    }
    for cell in &m.cells {
        if !positive(cell.area_mm2)
            || cell
                .x_mm
                .is_some_and(|x| !finite(x) || x < 0.0 || m.width_mm.is_none_or(|w| x > w))
            || cell
                .y_mm
                .is_some_and(|y| !finite(y) || y < 0.0 || m.height_mm.is_none_or(|h| y > h))
            || cell.reason.len() > 1000
            || (!cell.enabled && cell.reason.trim().is_empty())
        {
            return Err("Geometria ou máscara inválida".into());
        }
    }
    if let (Some(w), Some(h)) = (m.width_mm, m.height_mm) {
        if m.cells.iter().filter_map(|c| c.area_mm2).sum::<f64>() > w * h * 1.000001 {
            return Err("Área representada maior que superfície ativa".into());
        }
    }
    Ok(())
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Spec {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub classification_correction: Option<ClassificationCorrection>,
    pub kind: String,
    pub purpose: String,
    pub protocol: String,
    pub group: String,
    pub repetition: u32,
    pub cycle: String,
    pub direction: String,
    pub input_value: f64,
    pub input_unit: String,
    pub applicator_kg: f64,
    pub area_mm2: Option<f64>,
    pub uniform_confirmed: bool,
    pub region: Vec<usize>,
    pub position: String,
    pub instrument: String,
    pub reference_resolution: Option<f64>,
    pub reference_uncertainty: Option<f64>,
    pub participant_code: String,
    pub static_conditions_confirmed: bool,
    pub settle_seconds: f64,
    pub duration_seconds: f64,
    pub baseline_trial_id: Option<String>,
    pub notes: String,
    pub transport: String,
    pub port: String,
    pub baud_rate: u32,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClassificationCorrection {
    pub from_purpose: String,
    pub to_purpose: String,
    pub profile_id: String,
    pub reason: String,
    pub operator_id: i64,
    pub created_at: String,
}
fn reference(s: &Spec, scope: &str) -> R<f64> {
    let force = match s.input_unit.as_str() {
        "kg" => Some((s.input_value + s.applicator_kg) * G),
        "g" => Some((s.input_value / 1000.0 + s.applicator_kg) * G),
        "N" => Some(s.input_value),
        "kPa" | "kgf/cm2" => None,
        _ => return Err("Unidade inválida".into()),
    };
    if scope == "TOTAL_FORCE_ONLY" {
        force.ok_or("Referência de força necessária".into())
    } else if let Some(f) = force {
        Ok(f * 1000.0 / s.area_mm2.ok_or("Área de contato necessária")?)
    } else {
        Ok(if s.input_unit == "kPa" {
            s.input_value
        } else {
            s.input_value * 98.0665
        })
    }
}
fn validate_spec(s: &Spec, mat: &Mat) -> R<()> {
    if let Some(h) = &s.classification_correction {
        ident(&h.profile_id)?;
        if h.from_purpose != "FIT"
            || h.to_purpose != "VALIDATION"
            || s.purpose != h.to_purpose
            || s.kind == "BASELINE"
            || h.reason.trim().is_empty()
            || h.reason.len() > 2000
            || h.operator_id <= 0
            || h.created_at.is_empty()
            || h.created_at.len() > 40
        {
            return Err("Histórico de correção de conjunto inválido".into());
        }
    }
    if !["BASELINE", "TOTAL", "LOCAL", "UNIFORM", "PERSON"].contains(&s.kind.as_str())
        || !["CHARACTERIZATION", "FIT", "VALIDATION"].contains(&s.purpose.as_str())
        || !["UP", "DOWN", "HOLD"].contains(&s.direction.as_str())
        || !["kg", "g", "N", "kPa", "kgf/cm2"].contains(&s.input_unit.as_str())
        || s.protocol.trim().is_empty()
        || s.group.trim().is_empty()
        || s.repetition == 0
        || !finite(s.input_value)
        || s.input_value < 0.0
        || !finite(s.applicator_kg)
        || s.applicator_kg < 0.0
        || !positive(s.area_mm2)
        || !positive(s.reference_resolution)
        || s.reference_uncertainty
            .is_some_and(|v| !finite(v) || v < 0.0)
        || !finite(s.duration_seconds)
        || !(1.0..=600.0).contains(&s.duration_seconds)
        || !finite(s.settle_seconds)
        || !(0.0..=300.0).contains(&s.settle_seconds)
        || s.notes.len() > 10000
        || [
            &s.protocol,
            &s.group,
            &s.instrument,
            &s.position,
            &s.participant_code,
            &s.cycle,
            &s.transport,
            &s.port,
        ]
        .iter()
        .any(|v| v.len() > 500)
    {
        return Err("Protocolo ou referência inválidos".into());
    }
    let unique: HashSet<_> = s.region.iter().collect();
    if unique.len() != s.region.len() || s.region.iter().any(|i| *i >= N) {
        return Err("Região inválida".into());
    }
    if s.input_unit != "kg" && s.input_unit != "g" && s.applicator_kg != 0.0 {
        return Err("Referência em força/pressão já inclui aplicador; não duplicar massa".into());
    }
    if s.kind == "BASELINE"
        && (s.purpose != "CHARACTERIZATION" || s.input_value != 0.0 || s.applicator_kg != 0.0)
    {
        return Err("Zero deve ser caracterização sem carga".into());
    }
    if s.kind != "BASELINE" && s.baseline_trial_id.is_none() {
        return Err("Capture um baseline antes do ensaio".into());
    }
    if s.purpose != "CHARACTERIZATION" && s.instrument.trim().is_empty() {
        return Err("Identifique o instrumento de referência".into());
    }
    if ["LOCAL", "UNIFORM"].contains(&s.kind.as_str()) {
        if !s.uniform_confirmed
            || s.region.is_empty()
            || s.area_mm2.is_none()
            || s.notes.trim().is_empty()
        {
            return Err("Documente área, região e uniformidade da referência local".into());
        }
        let area: Option<f64> = s
            .region
            .iter()
            .try_fold(0.0, |sum, i| mat.cells[*i].area_mm2.map(|a| sum + a));
        if area.is_none_or(|a| (a - s.area_mm2.unwrap()).abs() > a * 0.001) {
            return Err("O aplicador deve cobrir células inteiras de área conhecida; contato parcial não calibra o modelo atual".into());
        }
    }
    if s.kind == "PERSON"
        && (!s.static_conditions_confirmed
            || s.participant_code.trim().is_empty()
            || s.input_unit != "kg"
            || s.applicator_kg != 0.0
            || s.purpose == "FIT")
    {
        return Err(
            "Pessoa: massa medida em kg, postura estática confirmada e finalidade de verificação"
                .into(),
        );
    }
    if s.kind == "PERSON" && mat.capacity_kg.is_none_or(|kg| s.input_value > kg) {
        return Err(
            "Cadastre capacidade mecânica verificada suficiente antes de ensaio com pessoa".into(),
        );
    }
    Ok(())
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Frame {
    pub received_ms: f64,
    pub sequence: Option<u64>,
    pub values: Vec<u16>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub count: usize,
    pub duration_ms: f64,
    pub fps: f64,
    pub interval_mean_ms: f64,
    pub interval_sd_ms: f64,
    pub means: Vec<f64>,
    pub sd: Vec<f64>,
    pub min: Vec<f64>,
    pub max: Vec<f64>,
    pub drift: Vec<f64>,
    pub saturated: Vec<usize>,
    pub sequence_gaps: usize,
    pub duplicates: usize,
}
pub fn summarize(frames: &[Frame]) -> R<Summary> {
    if frames.is_empty() || frames.len() > 20000 {
        return Err("Quantidade de quadros fora do limite (1 a 20000)".into());
    }
    let mut means = vec![0.0; N];
    let mut variance = vec![0.0; N];
    let mut min = vec![4095.0_f64; N];
    let mut max = vec![0.0_f64; N];
    let mut saturated = vec![0; N];
    let mut gaps = 0;
    let mut duplicates = 0;
    let mut intervals = vec![];
    for (k, f) in frames.iter().enumerate() {
        if f.values.len() != N
            || f.values.iter().any(|v| *v > 4095)
            || !finite(f.received_ms)
            || f.received_ms < 0.0
        {
            return Err("Quadro bruto inválido".into());
        }
        if k > 0 {
            let prev = &frames[k - 1];
            if f.received_ms < prev.received_ms {
                return Err("Timestamp não monotônico".into());
            }
            intervals.push(f.received_ms - prev.received_ms);
            if let (Some(a), Some(b)) = (prev.sequence, f.sequence) {
                if b <= a {
                    duplicates += 1;
                } else {
                    gaps += (b - a - 1) as usize;
                }
            }
        }
        for i in 0..N {
            let v = f.values[i] as f64;
            let d = v - means[i];
            means[i] += d / (k + 1) as f64;
            variance[i] += d * (v - means[i]);
            min[i] = min[i].min(v);
            max[i] = max[i].max(v);
            if v >= 4090.0 {
                saturated[i] += 1;
            }
        }
    }
    let count = frames.len();
    let window = (count / 4).max(1);
    let drift = (0..N)
        .map(|i| {
            (frames[count - window..]
                .iter()
                .map(|f| f.values[i] as f64)
                .sum::<f64>()
                - frames[..window]
                    .iter()
                    .map(|f| f.values[i] as f64)
                    .sum::<f64>())
                / window as f64
        })
        .collect();
    let duration_ms = frames.last().unwrap().received_ms - frames[0].received_ms;
    let interval_mean_ms = intervals.iter().sum::<f64>() / intervals.len().max(1) as f64;
    let interval_sd_ms = (intervals
        .iter()
        .map(|v| (v - interval_mean_ms).powi(2))
        .sum::<f64>()
        / intervals.len().saturating_sub(1).max(1) as f64)
        .sqrt();
    Ok(Summary {
        count,
        duration_ms,
        fps: if duration_ms > 0.0 {
            (count - 1) as f64 * 1000.0 / duration_ms
        } else {
            0.0
        },
        interval_mean_ms,
        interval_sd_ms,
        means,
        sd: variance
            .iter()
            .map(|v| (v / count.saturating_sub(1).max(1) as f64).sqrt())
            .collect(),
        min,
        max,
        drift,
        saturated,
        sequence_gaps: gaps,
        duplicates,
    })
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trial {
    pub imported_at: Option<String>,
    pub id: String,
    pub mat_id: String,
    pub source: String,
    pub state: String,
    pub spec: Spec,
    pub summary: Option<Summary>,
    pub reason: String,
    pub created_at: String,
    pub operator_id: Option<i64>,
}
pub fn get_mat(c: &Connection, id: &str) -> R<Mat> {
    let json: String = c
        .query_row(
            "SELECT spec_json FROM calibration_mats WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .map_err(err)?;
    serde_json::from_str(&json).map_err(err)
}
pub fn get_trial(c: &Connection, id: &str) -> R<Trial> {
    c.query_row("SELECT id,mat_id,source,state,spec_json,summary_json,reason,created_at,operator_id,imported_at FROM calibration_trials WHERE id=?1",[id],|r|Ok((r.get::<_,String>(0)?,r.get::<_,String>(1)?,r.get::<_,String>(2)?,r.get::<_,String>(3)?,r.get::<_,String>(4)?,r.get::<_,Option<String>>(5)?,r.get::<_,String>(6)?,r.get::<_,String>(7)?,r.get::<_,Option<i64>>(8)?,r.get::<_,Option<String>>(9)?))).map_err(err).and_then(|(id,mat_id,source,state,spec,summary,reason,created_at,operator_id,imported_at)| Ok(Trial { id,mat_id,source,state,spec:serde_json::from_str(&spec).map_err(err)?,summary:summary.map(|s|serde_json::from_str(&s)).transpose().map_err(err)?,reason,created_at,operator_id,imported_at }))
}
pub fn trial_frames(c: &Connection, id: &str) -> R<Vec<Frame>> {
    let mut q = c
        .prepare(
            "SELECT ordinal,frame_count,frames_json FROM calibration_frame_chunks WHERE trial_id=?1 ORDER BY ordinal",
        )
        .map_err(err)?;
    let chunks = q
        .query_map([id], |r| {
            Ok((
                r.get::<_, usize>(0)?,
                r.get::<_, usize>(1)?,
                r.get::<_, String>(2)?,
            ))
        })
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;
    let mut frames = vec![];
    for (expected, (ordinal, count, json)) in chunks.into_iter().enumerate() {
        let chunk: Vec<Frame> = serde_json::from_str(&json).map_err(err)?;
        if ordinal != expected || chunk.len() != count {
            return Err("Lotes brutos inconsistentes".into());
        }
        frames.extend(chunk);
        if frames.len() > 20000 {
            return Err("Ensaio excede limite de quadros".into());
        }
    }
    Ok(frames)
}
pub fn begin_trial(
    c: &Connection,
    id: &str,
    mat_id: &str,
    source: &str,
    spec: Spec,
    operator_id: Option<i64>,
) -> R<Trial> {
    ident(id)?;
    if spec.classification_correction.is_some() {
        return Err("Novas coletas não podem conter histórico de correção".into());
    }
    let mat = get_mat(c, mat_id)?;
    validate_spec(&spec, &mat)?;
    if !["REAL", "SIMULATION"].contains(&source) {
        return Err("Origem inválida".into());
    }
    let busy: bool = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM calibration_trials WHERE state='CAPTURING')",
            [],
            |r| r.get(0),
        )
        .map_err(err)?;
    if busy {
        return Err("Há uma coleta experimental ativa".into());
    }
    if let Some(b) = &spec.baseline_trial_id {
        let zero = get_trial(c, b)?;
        if zero.mat_id != mat_id
            || zero.source != source
            || zero.spec.kind != "BASELINE"
            || zero.state != "ACCEPTED"
            || zero
                .summary
                .as_ref()
                .is_none_or(|s| s.count < 10 || s.saturated.iter().any(|v| *v > 0))
        {
            return Err("Baseline incompatível, insuficiente ou não aceito".into());
        }
    }
    let mixed:bool=c.query_row("SELECT EXISTS(SELECT 1 FROM calibration_trials WHERE mat_id=?1 AND json_extract(spec_json,'$.group')=?2 AND json_extract(spec_json,'$.purpose')!=?3 AND json_extract(spec_json,'$.purpose') IN ('FIT','VALIDATION'))",params![mat_id,spec.group,spec.purpose],|r|r.get(0)).map_err(err)?;
    if mixed && spec.purpose != "CHARACTERIZATION" {
        return Err("O grupo já pertence ao outro conjunto de ajuste/validação".into());
    }
    c.execute("INSERT INTO calibration_trials(id,mat_id,source,state,spec_json,operator_id) VALUES(?1,?2,?3,'CAPTURING',?4,?5)",params![id,mat_id,source,serde_json::to_string(&spec).map_err(err)?,operator_id]).map_err(err)?;
    get_trial(c, id)
}
pub fn append_frames(c: &Connection, id: &str, ordinal: usize, frames: Vec<Frame>) -> R<()> {
    if frames.is_empty() || frames.len() > 60 {
        return Err("Lote deve ter de 1 a 60 quadros".into());
    }
    let trial = get_trial(c, id)?;
    if trial.state != "CAPTURING" {
        return Err("Ensaio não está capturando".into());
    }
    summarize(&frames)?;
    let json = serde_json::to_string(&frames).map_err(err)?;
    let existing: Option<String> = c
        .query_row(
            "SELECT frames_json FROM calibration_frame_chunks WHERE trial_id=?1 AND ordinal=?2",
            params![id, ordinal],
            |r| r.get(0),
        )
        .optional()
        .map_err(err)?;
    if let Some(s) = existing {
        return if s == json {
            Ok(())
        } else {
            Err("Lote repetido com conteúdo diferente".into())
        };
    }
    let expected: usize = c
        .query_row(
            "SELECT COUNT(*) FROM calibration_frame_chunks WHERE trial_id=?1",
            [id],
            |r| r.get(0),
        )
        .map_err(err)?;
    if ordinal != expected {
        return Err("Ordem de lote inválida".into());
    }
    let count: usize = c
        .query_row(
            "SELECT COALESCE(SUM(frame_count),0) FROM calibration_frame_chunks WHERE trial_id=?1",
            [id],
            |r| r.get(0),
        )
        .map_err(err)?;
    if count + frames.len() > 20000 {
        return Err("Limite de quadros atingido".into());
    }
    let previous:Option<String>=c.query_row("SELECT frames_json FROM calibration_frame_chunks WHERE trial_id=?1 ORDER BY ordinal DESC LIMIT 1",[id],|r|r.get(0)).optional().map_err(err)?;
    if let Some(json) = previous {
        let last_chunk: Vec<Frame> = serde_json::from_str(&json).map_err(err)?;
        if last_chunk
            .last()
            .is_none_or(|last| frames[0].received_ms < last.received_ms)
        {
            return Err("Tempo retrocedeu entre lotes".into());
        }
    }
    if frames.last().unwrap().received_ms
        > (trial.spec.settle_seconds + trial.spec.duration_seconds + 5.0) * 1000.0
    {
        return Err("Quadro fora da janela de aquisição".into());
    }
    c.execute(
        "INSERT INTO calibration_frame_chunks(trial_id,ordinal,frames_json,frame_count) VALUES(?1,?2,?3,?4)",
        params![id, ordinal, json,frames.len()],
    )
    .map_err(err)?;
    Ok(())
}
pub fn finish_trial(c: &Connection, id: &str, reason: &str) -> R<Trial> {
    let t = get_trial(c, id)?;
    if t.state != "CAPTURING" {
        return Err("Coleta já encerrada".into());
    }
    let frames = trial_frames(c, id)?;
    let accepted: Vec<_> = frames
        .iter()
        .filter(|f| {
            f.received_ms >= t.spec.settle_seconds * 1000.0
                && f.received_ms <= (t.spec.settle_seconds + t.spec.duration_seconds) * 1000.0
        })
        .cloned()
        .collect();
    let summary = if accepted.is_empty() {
        None
    } else {
        Some(summarize(&accepted)?)
    };
    let state = if reason.is_empty()
        && summary.as_ref().is_some_and(|s| {
            s.count >= 10
                && s.duration_ms >= t.spec.duration_seconds * 800.0
                && s.sequence_gaps == 0
                && s.duplicates == 0
        }) {
        "REVIEW"
    } else {
        "INTERRUPTED"
    };
    let why = if state == "INTERRUPTED" && reason.is_empty() {
        "Janela insuficiente, perdas ou duplicatas. Repita a coleta."
    } else {
        reason
    };
    c.execute(
        "UPDATE calibration_trials SET state=?2,summary_json=?3,reason=?4 WHERE id=?1",
        params![
            id,
            state,
            summary
                .map(|s| serde_json::to_string(&s))
                .transpose()
                .map_err(err)?,
            why
        ],
    )
    .map_err(err)?;
    get_trial(c, id)
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Knot {
    pub x: f64,
    pub y: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationRow {
    pub trial_id: String,
    pub sensor: Option<usize>,
    pub reference: f64,
    pub estimated: Option<f64>,
    pub error: Option<f64>,
    pub percent: Option<f64>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Validation {
    pub id: String,
    pub outcome: String,
    pub unit: String,
    pub count: usize,
    pub mae: Option<f64>,
    pub rmse: Option<f64>,
    pub bias: Option<f64>,
    pub max_error: Option<f64>,
    pub rows: Vec<ValidationRow>,
    pub reason: String,
    pub trial_ids: Vec<String>,
    pub created_at: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub mat_id: String,
    pub name: String,
    pub scope: String,
    pub source: String,
    pub algorithm: String,
    pub baseline_trial_id: String,
    pub baseline: Vec<f64>,
    pub noise: Vec<f64>,
    pub curves: Vec<Option<Vec<Knot>>>,
    pub fit_trial_ids: Vec<String>,
    pub max_error: f64,
    pub min_validation_trials: usize,
    pub min_fit_levels: usize,
    pub state: String,
    pub validations: Vec<Validation>,
    pub created_at: String,
    pub active: bool,
    pub mat: Mat,
}
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FitRequest {
    pub id: String,
    pub mat_id: String,
    pub name: String,
    pub scope: String,
    pub baseline_trial_id: String,
    pub trial_ids: Vec<String>,
    pub max_error: f64,
    pub min_validation_trials: usize,
    pub min_fit_levels: usize,
}
fn fit_knots(mut points: Vec<(f64, f64)>, min_levels: usize) -> R<Option<Vec<Knot>>> {
    points.sort_by(|a, b| a.1.total_cmp(&b.1));
    let mut groups: Vec<(f64, f64, usize)> = vec![];
    for (x, y) in points {
        if let Some(g) = groups.last_mut().filter(|g| g.1 == y) {
            g.0 += x;
            g.2 += 1;
        } else {
            groups.push((x, y, 1));
        }
    }
    if groups.len() < min_levels {
        return Ok(None);
    }
    let mut knots = vec![Knot { x: 0.0, y: 0.0 }];
    for (sum, y, n) in groups {
        let x = sum / n as f64;
        if y <= 0.0 || x <= knots.last().unwrap().x {
            return Err("Resposta não monotônica: revise carga, posição, ruído e saturação".into());
        }
        knots.push(Knot { x, y });
    }
    Ok(Some(knots))
}
fn build_profile(c: &Connection, req: FitRequest) -> R<Profile> {
    ident(&req.id)?;
    let mat = get_mat(c, &req.mat_id)?;
    if !["TOTAL_FORCE_ONLY", "LOCAL_PRESSURE"].contains(&req.scope.as_str())
        || req.name.trim().is_empty()
        || req.name.len() > 200
        || !finite(req.max_error)
        || req.max_error <= 0.0
        || req.max_error > 1e6
        || !(3..=100).contains(&req.min_validation_trials)
        || !(2..=100).contains(&req.min_fit_levels)
        || req.trial_ids.len() > 1000
    {
        return Err("Defina escopo, níveis e critério de erro antes da validação".into());
    }
    let zero = get_trial(c, &req.baseline_trial_id)?;
    let z = zero.summary.as_ref().ok_or("Baseline sem resumo")?;
    if zero.state != "ACCEPTED"
        || zero.spec.kind != "BASELINE"
        || zero.mat_id != mat.id
        || z.count < 10
        || z.saturated.iter().any(|s| *s > 0)
    {
        return Err("Baseline inválido".into());
    }
    if mat.cells.iter().any(|cell| !cell.enabled) {
        return Err("Perfil completo requer todos os pontos disponíveis; corrija a montagem ou mantenha diagnóstico parcial".into());
    }
    if req.scope == "LOCAL_PRESSURE"
        && mat
            .cells
            .iter()
            .any(|cell| cell.area_mm2.is_none() || cell.x_mm.is_none() || cell.y_mm.is_none())
    {
        return Err("Geometria incompleta para pressão local".into());
    }
    let noise: Vec<_> =
        z.sd.iter()
            .zip(&z.drift)
            .map(|(sd, d)| (sd * 3.0 + d.abs()).max(1.0))
            .collect();
    let mut points = vec![vec![]; if req.scope == "LOCAL_PRESSURE" { N } else { 1 }];
    let mut seen = HashSet::new();
    for id in &req.trial_ids {
        if !seen.insert(id) {
            return Err("Ensaio repetido na seleção".into());
        }
        let t = get_trial(c, id)?;
        if t.state != "ACCEPTED"
            || t.source != zero.source
            || t.mat_id != mat.id
            || t.spec.purpose != "FIT"
            || t.spec.protocol != zero.spec.protocol
            || t.spec.baseline_trial_id.as_deref() != Some(zero.id.as_str())
        {
            return Err(format!("Ensaio de ajuste incompatível: {} · repetição {} · estado {} · conjunto {}. Exige ACCEPTED, FIT, mesmo tapete, origem, protocolo e baseline.", t.spec.group, t.spec.repetition, t.state, t.spec.purpose));
        }
        if t.summary.as_ref().is_none_or(|s| {
            s.saturated.iter().any(|v| *v > 0) || s.sequence_gaps > 0 || s.duplicates > 0
        }) {
            return Err("Ajuste com saturação/perda não permitido".into());
        }
        let frames = window_frames(c, &t)?;
        let y = reference(&t.spec, &req.scope)?;
        if req.scope == "TOTAL_FORCE_ONLY" {
            if t.spec.kind != "TOTAL" {
                return Err("Ajuste total requer pesos, não pessoas ou pressão local".into());
            }
            let x = frames
                .iter()
                .map(|f| {
                    f.values
                        .iter()
                        .enumerate()
                        .map(|(i, v)| (*v as f64 - z.means[i] - noise[i]).max(0.0))
                        .sum::<f64>()
                })
                .sum::<f64>()
                / frames.len() as f64;
            points[0].push((x, y));
        } else {
            if !["LOCAL", "UNIFORM"].contains(&t.spec.kind.as_str()) {
                return Err("Pressão local requer referência de área/uniformidade".into());
            }
            for i in &t.spec.region {
                let x = frames
                    .iter()
                    .map(|f| (f.values[*i] as f64 - z.means[*i] - noise[*i]).max(0.0))
                    .sum::<f64>()
                    / frames.len() as f64;
                points[*i].push((x, y));
            }
        }
    }
    let curves = points
        .into_iter()
        .map(|p| fit_knots(p, req.min_fit_levels))
        .collect::<R<Vec<_>>>()?;
    if curves.iter().all(|c| c.is_none()) {
        return Err("Nenhum ponto tem níveis suficientes para ajuste".into());
    }
    let p = Profile {
        id: req.id,
        mat_id: mat.id.clone(),
        name: req.name,
        scope: req.scope,
        source: zero.source,
        algorithm: "piecewise-v1".into(),
        baseline_trial_id: zero.id,
        baseline: z.means.clone(),
        noise,
        curves,
        fit_trial_ids: req.trial_ids,
        max_error: req.max_error,
        min_validation_trials: req.min_validation_trials,
        min_fit_levels: req.min_fit_levels,
        state: "ADJUSTED".into(),
        validations: vec![],
        created_at: now(c)?,
        active: false,
        mat,
    };
    Ok(p)
}
pub fn fit_profile(c: &Connection, req: FitRequest) -> R<Profile> {
    let p = build_profile(c, req)?;
    c.execute(
        "INSERT INTO calibration_profiles(id,mat_id,profile_json) VALUES(?1,?2,?3)",
        params![p.id, p.mat_id, serde_json::to_string(&p).map_err(err)?],
    )
    .map_err(err)?;
    Ok(p)
}
fn window_frames(c: &Connection, t: &Trial) -> R<Vec<Frame>> {
    let frames: Vec<_> = trial_frames(c, &t.id)?
        .into_iter()
        .filter(|f| {
            f.received_ms >= t.spec.settle_seconds * 1000.0
                && f.received_ms <= (t.spec.settle_seconds + t.spec.duration_seconds) * 1000.0
        })
        .collect();
    if frames.is_empty() {
        Err("Janela sem dados".into())
    } else {
        Ok(frames)
    }
}
pub fn curve(knots: &Option<Vec<Knot>>, x: f64) -> Option<f64> {
    let k = knots.as_ref()?;
    if k.len() < 2 || !finite(x) || x < k.first()?.x || x > k.last()?.x {
        return None;
    }
    for pair in k.windows(2) {
        let a = &pair[0];
        let b = &pair[1];
        if b.x <= a.x || b.y < a.y {
            return None;
        }
        if x <= b.x {
            return Some(a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x));
        }
    }
    None
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhysicalFrame {
    pub pressure_k_pa: Vec<Option<f64>>,
    pub statuses: Vec<String>,
    pub total_force_n: Option<f64>,
    pub partial_force_n: Option<f64>,
    pub mean_pressure_k_pa: Option<f64>,
    pub max_pressure_k_pa: Option<f64>,
    pub contact_area_cm2: Option<f64>,
    pub cop_mm: Option<Cop>,
    pub complete: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Cop {
    pub x: f64,
    pub y: f64,
}
pub fn convert(values: &[u16], p: &Profile) -> PhysicalFrame {
    let mut r = PhysicalFrame {
        pressure_k_pa: vec![None; N],
        statuses: vec!["INVALID".into(); N],
        total_force_n: None,
        partial_force_n: None,
        mean_pressure_k_pa: None,
        max_pressure_k_pa: None,
        contact_area_cm2: None,
        cop_mm: None,
        complete: false,
    };
    if values.len() != N || values.iter().any(|v| *v > 4095) {
        return r;
    }
    if p.scope == "TOTAL_FORCE_ONLY" {
        if values.iter().any(|v| *v >= 4090)
            || values
                .iter()
                .enumerate()
                .any(|(i, v)| *v as f64 - p.baseline[i] < -p.noise[i])
        {
            return r;
        }
        let x = values
            .iter()
            .enumerate()
            .map(|(i, v)| (*v as f64 - p.baseline[i] - p.noise[i]).max(0.0))
            .sum();
        r.total_force_n = curve(&p.curves[0], x);
        r.complete = r.total_force_n.is_some();
        return r;
    }
    let (mut force, mut area, mut peak, mut mx, mut my) = (0.0, 0.0, 0.0_f64, 0.0, 0.0);
    r.complete = true;
    for (i, v) in values.iter().enumerate() {
        let cell = &p.mat.cells[i];
        let (Some(a), Some(xm), Some(ym)) = (cell.area_mm2, cell.x_mm, cell.y_mm) else {
            r.complete = false;
            continue;
        };
        if !cell.enabled || p.curves[i].is_none() {
            r.complete = false;
            continue;
        }
        let x = *v as f64 - p.baseline[i];
        if *v >= 4090 {
            r.statuses[i] = "SATURATED".into();
            r.complete = false;
            continue;
        }
        if x < -p.noise[i] {
            r.statuses[i] = "BASELINE_DRIFT".into();
            r.complete = false;
            continue;
        }
        let pressure = if x <= p.noise[i] {
            Some(0.0)
        } else {
            curve(&p.curves[i], x - p.noise[i])
        };
        let Some(pr) = pressure else {
            r.statuses[i] = "OUT_OF_RANGE".into();
            r.complete = false;
            continue;
        };
        r.pressure_k_pa[i] = Some(pr);
        r.statuses[i] = if pr > 0.0 { "VALID" } else { "NO_CONTACT" }.into();
        let f = pr * a / 1000.0;
        force += f;
        mx += xm * f;
        my += ym * f;
        if pr > 0.0 {
            area += a;
            peak = peak.max(pr);
        }
    }
    r.partial_force_n = Some(force);
    if r.complete {
        r.total_force_n = Some(force);
        r.contact_area_cm2 = Some(area / 100.0);
        r.max_pressure_k_pa = Some(peak);
        if area > 0.0 {
            r.mean_pressure_k_pa = Some(force * 1000.0 / area);
        }
        if force > 0.0 {
            r.cop_mm = Some(Cop {
                x: mx / force,
                y: my / force,
            });
        }
    }
    r
}
pub fn get_profile(c: &Connection, id: &str) -> R<Profile> {
    let json: String = c
        .query_row(
            "SELECT profile_json FROM calibration_profiles WHERE id=?1",
            [id],
            |r| r.get(0),
        )
        .map_err(err)?;
    let mut p: Profile = serde_json::from_str(&json).map_err(err)?;
    let mut q = c
        .prepare(
            "SELECT result_json FROM calibration_validations WHERE profile_id=?1 ORDER BY rowid",
        )
        .map_err(err)?;
    let rows = q
        .query_map([id], |r| r.get::<_, String>(0))
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;
    p.validations = rows
        .into_iter()
        .map(|s| serde_json::from_str(&s).map_err(err))
        .collect::<R<_>>()?;
    p.state = if p
        .validations
        .last()
        .is_some_and(|v| v.outcome == "APPROVED")
    {
        "VALIDATED"
    } else {
        "ADJUSTED"
    }
    .into();
    p.active = c
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM calibration_active WHERE profile_id=?1)",
            [id],
            |r| r.get(0),
        )
        .map_err(err)?;
    Ok(p)
}
pub fn validate_profile(
    c: &Connection,
    id: &str,
    validation_id: &str,
    ids: Vec<String>,
) -> R<Validation> {
    assess_profile(c, id, validation_id, ids, true)
}
fn assess_profile(
    c: &Connection,
    id: &str,
    validation_id: &str,
    ids: Vec<String>,
    persist: bool,
) -> R<Validation> {
    ident(validation_id)?;
    let p = get_profile(c, id)?;
    if ids.len() > 1000 {
        return Err("Seleção muito grande".into());
    }
    let mut rows = vec![];
    let mut seen = HashSet::new();
    let mut covered: Vec<HashSet<String>> =
        vec![HashSet::new(); if p.scope == "LOCAL_PRESSURE" { N } else { 1 }];
    for tid in &ids {
        if !seen.insert(tid) {
            return Err("Ensaio repetido".into());
        }
        let t = get_trial(c, tid)?;
        if t.state != "ACCEPTED"
            || t.spec.purpose != "VALIDATION"
            || t.mat_id != p.mat_id
            || t.source != p.source
            || t.spec.baseline_trial_id.as_deref() != Some(p.baseline_trial_id.as_str())
            || p.fit_trial_ids.contains(tid)
            || t.spec
                .classification_correction
                .as_ref()
                .is_some_and(|h| h.profile_id != p.id)
        {
            return Err(format!("Validação requer ensaios independentes e compatíveis: {} · repetição {} · estado {} · conjunto {}. Exige ACCEPTED, VALIDATION, mesmo tapete, origem e baseline; ensaio fora do ajuste e correção vinculada a este perfil.", t.spec.group, t.spec.repetition, t.state, t.spec.purpose));
        }
        for fit_id in &p.fit_trial_ids {
            let fit = get_trial(c, fit_id)?;
            if fit.spec.group == t.spec.group || fit.spec.protocol != t.spec.protocol {
                return Err("Grupo vazou entre ajuste e teste ou protocolo divergiu".into());
            }
        }
        let frames = window_frames(c, &t)?;
        let physical: Vec<_> = frames.iter().map(|f| convert(&f.values, &p)).collect();
        if p.scope == "TOTAL_FORCE_ONLY" {
            if !["TOTAL", "PERSON"].contains(&t.spec.kind.as_str()) {
                return Err("Validação total exige força conhecida".into());
            }
            let estimated = if physical.iter().all(|f| f.complete) {
                Some(
                    physical.iter().filter_map(|f| f.total_force_n).sum::<f64>()
                        / physical.len() as f64,
                )
            } else {
                None
            };
            let reference = reference(&t.spec, &p.scope)?;
            if estimated.is_some() {
                covered[0].insert(t.spec.group.clone());
            }
            rows.push(validation_row(tid, None, reference, estimated));
        } else {
            if !["LOCAL", "UNIFORM"].contains(&t.spec.kind.as_str()) {
                return Err("Validação local exige pressão/área conhecida".into());
            }
            let reference = reference(&t.spec, &p.scope)?;
            for i in &t.spec.region {
                let estimated = if physical.iter().all(|f| f.pressure_k_pa[*i].is_some()) {
                    Some(
                        physical
                            .iter()
                            .filter_map(|f| f.pressure_k_pa[*i])
                            .sum::<f64>()
                            / physical.len() as f64,
                    )
                } else {
                    None
                };
                if estimated.is_some() {
                    covered[*i].insert(t.spec.group.clone());
                }
                rows.push(validation_row(tid, Some(*i), reference, estimated));
            }
        }
    }
    let errors: Vec<_> = rows.iter().filter_map(|r| r.error).collect();
    let count = errors.len();
    let mae = if count > 0 {
        Some(errors.iter().map(|v| v.abs()).sum::<f64>() / count as f64)
    } else {
        None
    };
    let rmse = if count > 0 {
        Some((errors.iter().map(|v| v * v).sum::<f64>() / count as f64).sqrt())
    } else {
        None
    };
    let bias = if count > 0 {
        Some(errors.iter().sum::<f64>() / count as f64)
    } else {
        None
    };
    let max_error = errors.iter().map(|v| v.abs()).reduce(f64::max);
    let spans_full_domain = p.curves.iter().enumerate().all(|(i, k)| {
        let Some(knots) = k else {
            return false;
        };
        let refs: Vec<_> = rows
            .iter()
            .filter(|r| {
                r.estimated.is_some() && (p.scope == "TOTAL_FORCE_ONLY" || r.sensor == Some(i))
            })
            .map(|r| r.reference)
            .collect();
        let low = refs.iter().copied().reduce(f64::min);
        let high = refs.iter().copied().reduce(f64::max);
        low.is_some_and(|v| v <= knots[1].y) && high.is_some_and(|v| v >= knots.last().unwrap().y)
    });
    let sufficient = !rows.is_empty()
        && covered.iter().all(|s| s.len() >= p.min_validation_trials)
        && spans_full_domain;
    let outcome = if rows.iter().any(|r| r.estimated.is_none())
        || max_error.is_some_and(|e| e > p.max_error)
    {
        "FAILED"
    } else if !sufficient || p.source != "REAL" {
        "INCONCLUSIVE"
    } else {
        "APPROVED"
    };
    let reason=match outcome{"APPROVED"=>"Erro observado dentro do critério pré-definido, nos ensaios selecionados. Incerteza não determinada. Não comprova equivalência clínica.","FAILED"=>"Erro acima do critério ou amostras fora da faixa/saturadas.",_=>"Cobertura/grupos insuficientes ou dados simulados. Colete validação real independente."};
    let v = Validation {
        id: validation_id.into(),
        outcome: outcome.into(),
        unit: if p.scope == "LOCAL_PRESSURE" {
            "kPa"
        } else {
            "N"
        }
        .into(),
        count,
        mae,
        rmse,
        bias,
        max_error,
        rows,
        reason: reason.into(),
        trial_ids: ids,
        created_at: now(c)?,
    };
    if persist {
        c.execute(
            "INSERT INTO calibration_validations(id,profile_id,result_json) VALUES(?1,?2,?3)",
            params![v.id, id, serde_json::to_string(&v).map_err(err)?],
        )
        .map_err(err)?;
        if v.outcome != "APPROVED" {
            c.execute("DELETE FROM calibration_active WHERE profile_id=?1", [id])
                .map_err(err)?;
        }
    }
    Ok(v)
}
fn validation_row(
    id: &str,
    sensor: Option<usize>,
    reference: f64,
    estimated: Option<f64>,
) -> ValidationRow {
    let error = estimated.map(|v| v - reference);
    ValidationRow {
        trial_id: id.into(),
        sensor,
        reference,
        estimated,
        error,
        percent: if reference > 1e-6 {
            error.map(|e| 100.0 * e / reference)
        } else {
            None
        },
    }
}
pub fn activate(c: &Connection, id: &str) -> R<()> {
    audit_profile(c, id)?;
    let p = get_profile(c, id)?;
    if p.source != "REAL"
        || p.state != "VALIDATED"
        || p.algorithm != "piecewise-v1"
        || p.curves.iter().any(|c| c.is_none())
    {
        return Err("Ativação exige perfil real validado, compatível e completo".into());
    }
    let mat = get_mat(c, &p.mat_id)?;
    if serde_json::to_value(&mat).map_err(err)? != serde_json::to_value(&p.mat).map_err(err)? {
        return Err("Revisão física incompatível".into());
    }
    c.execute("INSERT INTO calibration_active(mat_id,profile_id) VALUES(?1,?2) ON CONFLICT(mat_id) DO UPDATE SET profile_id=excluded.profile_id",params![p.mat_id,p.id]).map_err(err)?;
    Ok(())
}
fn audit_profile(c: &Connection, id: &str) -> R<()> {
    let p = get_profile(c, id)?;
    let rebuilt = build_profile(
        c,
        FitRequest {
            id: p.id.clone(),
            mat_id: p.mat_id.clone(),
            name: p.name.clone(),
            scope: p.scope.clone(),
            baseline_trial_id: p.baseline_trial_id.clone(),
            trial_ids: p.fit_trial_ids.clone(),
            max_error: p.max_error,
            min_validation_trials: p.min_validation_trials,
            min_fit_levels: p.min_fit_levels,
        },
    )?;
    if p.algorithm != "piecewise-v1"
        || p.source != rebuilt.source
        || !same_numeric_json(
            &serde_json::to_value(&p.baseline).map_err(err)?,
            &serde_json::to_value(&rebuilt.baseline).map_err(err)?,
        )
        || !same_numeric_json(
            &serde_json::to_value(&p.noise).map_err(err)?,
            &serde_json::to_value(&rebuilt.noise).map_err(err)?,
        )
        || !same_numeric_json(
            &serde_json::to_value(&p.curves).map_err(err)?,
            &serde_json::to_value(&rebuilt.curves).map_err(err)?,
        )
        || serde_json::to_value(&p.mat).map_err(err)?
            != serde_json::to_value(&rebuilt.mat).map_err(err)?
    {
        return Err("Perfil não corresponde aos ensaios e à geometria preservados".into());
    }
    for v in &p.validations {
        let recomputed = assess_profile(c, id, &v.id, v.trial_ids.clone(), false)?;
        if v.outcome != recomputed.outcome
            || !same_numeric_json(
                &serde_json::to_value(&v.rows).map_err(err)?,
                &serde_json::to_value(&recomputed.rows).map_err(err)?,
            )
        {
            return Err("Validação importada não é reproduzível".into());
        }
    }
    Ok(())
}
fn same_numeric_json(a: &serde_json::Value, b: &serde_json::Value) -> bool {
    use serde_json::Value;
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => match (x.as_f64(), y.as_f64()) {
            (Some(x), Some(y)) => (x - y).abs() <= 1e-10 * x.abs().max(y.abs()).max(1.0),
            _ => false,
        },
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(x, y)| same_numeric_json(x, y))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|w| same_numeric_json(v, w)))
        }
        _ => a == b,
    }
}
pub fn audit_database(c: &Connection) -> R<()> {
    let d = data(c)?;
    for mat in &d.mats {
        validate_mat(mat)?;
    }
    for t in &d.trials {
        ident(&t.id)?;
        validate_spec(&t.spec, &get_mat(c, &t.mat_id)?)?;
        if t.state == "ACCEPTED" || t.state == "REVIEW" {
            let frames = window_frames(c, t)?;
            let actual = summarize(&frames)?;
            let Some(stored) = &t.summary else {
                return Err("Ensaio restaurado sem resumo".into());
            };
            if !same_numeric_json(
                &serde_json::to_value(stored).map_err(err)?,
                &serde_json::to_value(&actual).map_err(err)?,
            ) || actual.duplicates > 0
                || actual.sequence_gaps > 0
            {
                return Err("Resumo experimental diverge dos quadros preservados".into());
            }
        } else {
            let frames = trial_frames(c, &t.id)?;
            if !frames.is_empty() {
                summarize(&frames)?;
            }
        }
    }
    for p in &d.profiles {
        audit_profile(c, &p.id)?;
    }
    Ok(())
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Data {
    pub mats: Vec<Mat>,
    pub trials: Vec<Trial>,
    pub profiles: Vec<Profile>,
}
pub fn data(c: &Connection) -> R<Data> {
    fn ids(c: &Connection, table: &str) -> R<Vec<String>> {
        let mut q = c
            .prepare(&format!(
                "SELECT id FROM {table} ORDER BY created_at DESC,id DESC"
            ))
            .map_err(err)?;
        let rows = q
            .query_map([], |r| r.get(0))
            .map_err(err)?
            .collect::<Result<_, _>>()
            .map_err(err)?;
        Ok(rows)
    }
    Ok(Data {
        mats: ids(c, "calibration_mats")?
            .iter()
            .map(|id| get_mat(c, id))
            .collect::<R<_>>()?,
        trials: ids(c, "calibration_trials")?
            .iter()
            .map(|id| get_trial(c, id))
            .collect::<R<_>>()?,
        profiles: ids(c, "calibration_profiles")?
            .iter()
            .map(|id| get_profile(c, id))
            .collect::<R<_>>()?,
    })
}
#[tauri::command]
pub fn clinical_profiles(db: State<AppDb>) -> R<Vec<Profile>> {
    let c = db.0.lock().map_err(err)?;
    let mut q = c
        .prepare("SELECT profile_id FROM calibration_active")
        .map_err(err)?;
    let ids = q
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;
    let profiles = ids
        .iter()
        .map(|id| get_profile(&c, id))
        .collect::<R<Vec<_>>>()?;
    Ok(profiles
        .into_iter()
        .filter(|p| p.active && p.source == "REAL" && p.state == "VALIDATED")
        .collect())
}
#[tauri::command]
pub fn calibration_list(db: State<AppDb>) -> R<Data> {
    data(&*db.0.lock().map_err(err)?)
}
#[tauri::command]
pub fn calibration_save_mat(db: State<AppDb>, mut mat: Mat) -> R<Mat> {
    let c = db.0.lock().map_err(err)?;
    validate_mat(&mat)?;
    mat.created_at = Some(now(&c)?);
    c.execute(
        "INSERT INTO calibration_mats(id,spec_json) VALUES(?1,?2)",
        params![mat.id, serde_json::to_string(&mat).map_err(err)?],
    )
    .map_err(err)?;
    Ok(mat)
}
#[tauri::command]
pub fn calibration_begin(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    device: State<crate::acquisition::AcquisitionState>,
    id: String,
    mat_id: String,
    source: String,
    spec: Spec,
) -> R<Trial> {
    let c = db.0.lock().map_err(err)?;
    if source == "REAL" {
        let s = crate::acquisition::acquisition_get_status(device)?;
        if !s.connected || !s.acquiring {
            return Err("ESP32 não está adquirindo".into());
        }
    }
    let operator = crate::auth::current(&c, &auth)?.id;
    begin_trial(&c, &id, &mat_id, &source, spec, Some(operator))
}
#[tauri::command]
pub fn calibration_append(
    db: State<AppDb>,
    id: String,
    ordinal: usize,
    frames: Vec<Frame>,
) -> R<()> {
    append_frames(&*db.0.lock().map_err(err)?, &id, ordinal, frames)
}
#[tauri::command]
pub fn calibration_finish(db: State<AppDb>, id: String, reason: String) -> R<Trial> {
    if reason.len() > 2000 {
        return Err("Motivo muito longo".into());
    }
    finish_trial(&*db.0.lock().map_err(err)?, &id, &reason)
}
#[tauri::command]
pub fn calibration_review(db: State<AppDb>, id: String, accept: bool, reason: String) -> R<Trial> {
    let c = db.0.lock().map_err(err)?;
    let t = get_trial(&c, &id)?;
    if t.state != "REVIEW" || reason.len() > 2000 || (!accept && reason.trim().is_empty()) {
        return Err("Revisão inválida; informe motivo ao rejeitar".into());
    }
    c.execute(
        "UPDATE calibration_trials SET state=?2,reason=?3 WHERE id=?1",
        params![id, if accept { "ACCEPTED" } else { "REJECTED" }, reason],
    )
    .map_err(err)?;
    get_trial(&c, &id)
}
#[tauri::command]
pub fn calibration_frames(db: State<AppDb>, id: String) -> R<Vec<Frame>> {
    trial_frames(&*db.0.lock().map_err(err)?, &id)
}
/// Correct only the purpose, never the measurements, reference, group or review.
/// The selected candidate must have existed before each locally captured trial.
pub fn reclassify_trials(
    c: &Connection,
    ids: &[String],
    profile_id: &str,
    reason: &str,
    operator_id: i64,
) -> R<Vec<Trial>> {
    if ids.is_empty()
        || ids.len() > 100
        || reason.trim().is_empty()
        || reason.len() > 2000
        || operator_id <= 0
    {
        return Err("Selecione de 1 a 100 ensaios e informe o motivo da correção".into());
    }
    let selected: HashSet<_> = ids.iter().collect();
    if selected.len() != ids.len() {
        return Err("Ensaio repetido na seleção".into());
    }
    let tx = c.unchecked_transaction().map_err(err)?;
    let busy: bool = tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM calibration_trials WHERE state='CAPTURING')",
            [],
            |r| r.get(0),
        )
        .map_err(err)?;
    if busy {
        return Err("Conclua a coleta ativa antes de corrigir o conjunto".into());
    }
    let p = get_profile(&tx, profile_id)?;
    if p.active || p.state != "ADJUSTED" {
        return Err("Selecione um perfil candidato ainda não validado".into());
    }
    let mut q = tx
        .prepare("SELECT id FROM calibration_profiles")
        .map_err(err)?;
    let profile_ids = q
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;
    drop(q);
    let profiles = profile_ids
        .iter()
        .map(|id| get_profile(&tx, id))
        .collect::<R<Vec<_>>>()?;
    let stamp = now(&tx)?;
    for id in ids {
        let mut t = get_trial(&tx, id)?;
        let label = format!("{} · repetição {}", t.spec.group, t.spec.repetition);
        if !["REVIEW", "ACCEPTED"].contains(&t.state.as_str())
            || t.spec.purpose != "FIT"
            || t.spec.kind == "BASELINE"
            || t.spec.classification_correction.is_some()
        {
            return Err(format!(
                "{label}: somente ensaios de Ajuste em REVIEW ou ACCEPTED podem ser corrigidos"
            ));
        }
        if t.imported_at.is_some() {
            return Err(format!(
                "{label}: corrija a classificação no computador onde foi coletado"
            ));
        }
        if t.mat_id != p.mat_id
            || t.source != p.source
            || t.spec.baseline_trial_id.as_deref() != Some(p.baseline_trial_id.as_str())
        {
            return Err(format!(
                "{label}: tapete, origem ou baseline incompatível com o perfil"
            ));
        }
        if (p.scope == "TOTAL_FORCE_ONLY" && t.spec.kind != "TOTAL")
            || (p.scope == "LOCAL_PRESSURE"
                && !["LOCAL", "UNIFORM"].contains(&t.spec.kind.as_str()))
        {
            return Err(format!(
                "{label}: tipo de ensaio incompatível com o escopo do perfil"
            ));
        }
        let after: Option<bool> = tx
            .query_row(
                "SELECT julianday(?1) > julianday(?2)",
                params![t.created_at, p.created_at],
                |r| r.get(0),
            )
            .map_err(err)?;
        if after != Some(true) {
            return Err(format!(
                "{label}: a coleta deve ser posterior à criação da curva candidata"
            ));
        }
        for existing in &profiles {
            if existing.fit_trial_ids.contains(id)
                || existing.baseline_trial_id == *id
                || existing
                    .validations
                    .iter()
                    .any(|v| v.trial_ids.contains(id))
            {
                return Err(format!(
                    "{label}: ensaio já utilizado em ajuste ou validação; preserve o registro"
                ));
            }
        }
        for fit_id in &p.fit_trial_ids {
            let fit = get_trial(&tx, fit_id)?;
            if fit.spec.group == t.spec.group || fit.spec.protocol != t.spec.protocol {
                return Err(format!("{label}: grupo usado no ajuste ou protocolo diferente; não pode ser reclassificado"));
            }
        }
        let mut q = tx.prepare("SELECT id FROM calibration_trials WHERE mat_id=?1 AND source=?2 AND json_extract(spec_json,'$.group')=?3 AND json_extract(spec_json,'$.purpose')='FIT' AND state NOT IN ('REJECTED','INTERRUPTED')").map_err(err)?;
        let group_ids = q
            .query_map(params![t.mat_id, t.source, t.spec.group], |r| {
                r.get::<_, String>(0)
            })
            .map_err(err)?
            .collect::<Result<Vec<_>, _>>()
            .map_err(err)?;
        drop(q);
        if group_ids.iter().any(|member| !selected.contains(member)) {
            return Err(format!("{label}: selecione todas as repetições de Ajuste deste grupo para evitar dividir ajuste e validação"));
        }
        t.spec.purpose = "VALIDATION".into();
        t.spec.classification_correction = Some(ClassificationCorrection {
            from_purpose: "FIT".into(),
            to_purpose: "VALIDATION".into(),
            profile_id: profile_id.into(),
            reason: reason.trim().into(),
            operator_id,
            created_at: stamp.clone(),
        });
        validate_spec(&t.spec, &get_mat(&tx, &t.mat_id)?)?;
        tx.execute(
            "UPDATE calibration_trials SET spec_json=?2 WHERE id=?1",
            params![id, serde_json::to_string(&t.spec).map_err(err)?],
        )
        .map_err(err)?;
    }
    crate::support::add_log(&tx, "info", "calibration_reclassify", &format!("Conjunto corrigido de Ajuste para Validação independente em {} ensaios; histórico preservado.", ids.len()))?;
    let result = ids
        .iter()
        .map(|id| get_trial(&tx, id))
        .collect::<R<Vec<_>>>()?;
    tx.commit().map_err(err)?;
    Ok(result)
}
#[tauri::command]
pub fn calibration_reclassify(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    trial_ids: Vec<String>,
    profile_id: String,
    reason: String,
) -> R<Vec<Trial>> {
    let c = db.0.lock().map_err(err)?;
    let operator = crate::auth::current(&c, &auth)?.id;
    reclassify_trials(&c, &trial_ids, &profile_id, &reason, operator)
}
#[tauri::command]
pub fn calibration_fit(db: State<AppDb>, request: FitRequest) -> R<Profile> {
    fit_profile(&*db.0.lock().map_err(err)?, request)
}
#[tauri::command]
pub fn calibration_validate(
    db: State<AppDb>,
    id: String,
    validation_id: String,
    trial_ids: Vec<String>,
) -> R<Validation> {
    validate_profile(&*db.0.lock().map_err(err)?, &id, &validation_id, trial_ids)
}
#[tauri::command]
pub fn calibration_activate(db: State<AppDb>, id: String) -> R<()> {
    activate(&*db.0.lock().map_err(err)?, &id)
}
#[tauri::command]
pub fn calibration_deactivate(db: State<AppDb>, mat_id: String) -> R<()> {
    db.0.lock()
        .map_err(err)?
        .execute("DELETE FROM calibration_active WHERE mat_id=?1", [mat_id])
        .map_err(err)?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TrialArchive {
    format: String,
    schema_version: u32,
    mat: Mat,
    records: Vec<ArchivedTrial>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ArchivedTrial {
    trial: Trial,
    frames: Vec<Frame>,
}
pub fn import_trials(c: &mut Connection, content: &str) -> R<usize> {
    if content.len() > 64 * 1024 * 1024 {
        return Err("Arquivo excede 64 MB; exporte ensaios menores".into());
    }
    let archive: TrialArchive = serde_json::from_str(content).map_err(err)?;
    if archive.format != "BAROPRESS_CALIBRATION_TRIALS"
        || archive.schema_version != 1
        || archive.records.is_empty()
        || archive.records.len() > 2
    {
        return Err("Arquivo deve conter ensaio e seu baseline, sem perfil avulso".into());
    }
    validate_mat(&archive.mat)?;
    let tx = c.transaction().map_err(err)?;
    let busy: bool = tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM calibration_trials WHERE state='CAPTURING')",
            [],
            |r| r.get(0),
        )
        .map_err(err)?;
    if busy {
        return Err("Interrompa a coleta antes de importar".into());
    }
    let existing: Option<String> = tx
        .query_row(
            "SELECT spec_json FROM calibration_mats WHERE id=?1",
            [&archive.mat.id],
            |r| r.get(0),
        )
        .optional()
        .map_err(err)?;
    if let Some(json) = existing {
        let mat: Mat = serde_json::from_str(&json).map_err(err)?;
        if !same_numeric_json(
            &serde_json::to_value(&mat).map_err(err)?,
            &serde_json::to_value(&archive.mat).map_err(err)?,
        ) {
            return Err("Identificador do tapete já existe com geometria diferente".into());
        }
    } else {
        tx.execute(
            "INSERT INTO calibration_mats(id,spec_json) VALUES(?1,?2)",
            params![
                archive.mat.id,
                serde_json::to_string(&archive.mat).map_err(err)?
            ],
        )
        .map_err(err)?;
    }
    let mut inserted = 0;
    for record in archive.records {
        let t = record.trial;
        ident(&t.id)?;
        validate_spec(&t.spec, &archive.mat)?;
        if t.mat_id != archive.mat.id
            || !["REAL", "SIMULATION"].contains(&t.source.as_str())
            || !["REVIEW", "ACCEPTED", "REJECTED", "INTERRUPTED"].contains(&t.state.as_str())
        {
            return Err("Origem ou estado do ensaio inválidos".into());
        }
        if !record.frames.is_empty() {
            summarize(&record.frames)?;
        }
        if let Ok(existing) = get_trial(&tx, &t.id) {
            if existing.mat_id != t.mat_id
                || existing.source != t.source
                || !same_numeric_json(
                    &serde_json::to_value(&existing.spec).map_err(err)?,
                    &serde_json::to_value(&t.spec).map_err(err)?,
                )
                || !same_numeric_json(
                    &serde_json::to_value(trial_frames(&tx, &t.id)?).map_err(err)?,
                    &serde_json::to_value(&record.frames).map_err(err)?,
                )
            {
                return Err("Identificador do ensaio já existe com conteúdo diferente".into());
            }
            continue;
        }
        tx.execute("INSERT INTO calibration_trials(id,mat_id,source,state,spec_json,summary_json,reason,operator_id,created_at,imported_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",params![t.id,t.mat_id,t.source,t.state,serde_json::to_string(&t.spec).map_err(err)?,t.summary.as_ref().map(serde_json::to_string).transpose().map_err(err)?,t.reason,t.operator_id,t.created_at,now(&tx)?]).map_err(err)?;
        for (ordinal, chunk) in record.frames.chunks(60).enumerate() {
            tx.execute("INSERT INTO calibration_frame_chunks(trial_id,ordinal,frames_json,frame_count) VALUES(?1,?2,?3,?4)",params![t.id,ordinal,serde_json::to_string(chunk).map_err(err)?,chunk.len()]).map_err(err)?;
        }
        inserted += 1;
    }
    audit_database(&tx)?;
    let d = data(&tx)?;
    for t in d.trials.iter().filter(|t| t.mat_id == archive.mat.id) {
        if let Some(id) = &t.spec.baseline_trial_id {
            let b = get_trial(&tx, id)?;
            if b.mat_id != t.mat_id
                || b.source != t.source
                || b.spec.kind != "BASELINE"
                || b.state != "ACCEPTED"
            {
                return Err("Baseline importado ausente ou incompatível".into());
            }
        }
    }
    tx.commit().map_err(err)?;
    Ok(inserted)
}
#[tauri::command]
pub fn calibration_import(db: State<AppDb>, content: String) -> R<usize> {
    import_trials(&mut *db.0.lock().map_err(err)?, &content)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PhysicalResult {
    pub schema_version: u32,
    pub profile: Profile,
    pub mat_id: String,
    pub source: String,
    pub averaging: String,
    pub frame_count: usize,
    pub raw_retained: bool,
    pub mean: PhysicalFrame,
    pub peak_pressure_k_pa: Option<f64>,
    pub quality: String,
    pub warnings: Vec<String>,
}
pub fn process_physical(
    c: &Connection,
    profile_id: &str,
    source: &str,
    frames: &[Frame],
) -> R<PhysicalResult> {
    let p = get_profile(c, profile_id)?;
    audit_profile(c, profile_id)?;
    if source != "REAL"
        || p.source != "REAL"
        || p.state != "VALIDATED"
        || p.algorithm != "piecewise-v1"
    {
        return Err("Resultado físico exige perfil real validado".into());
    }
    let temporal = summarize(frames)?;
    let converted: Vec<_> = frames.iter().map(|f| convert(&f.values, &p)).collect();
    let complete = converted.iter().all(|f| f.complete)
        && temporal.sequence_gaps == 0
        && temporal.duplicates == 0;
    let avg = |get: fn(&PhysicalFrame) -> Option<f64>| -> Option<f64> {
        if converted.iter().all(|r| get(r).is_some()) {
            Some(converted.iter().filter_map(get).sum::<f64>() / converted.len() as f64)
        } else {
            None
        }
    };
    let mut mean = converted[0].clone();
    for i in 0..N {
        mean.pressure_k_pa[i] = if converted.iter().all(|r| r.pressure_k_pa[i].is_some()) {
            Some(
                converted
                    .iter()
                    .filter_map(|r| r.pressure_k_pa[i])
                    .sum::<f64>()
                    / converted.len() as f64,
            )
        } else {
            None
        };
        mean.statuses[i] = if converted.iter().all(|r| r.statuses[i] == "NO_CONTACT") {
            "NO_CONTACT"
        } else if converted
            .iter()
            .all(|r| ["NO_CONTACT", "VALID"].contains(&r.statuses[i].as_str()))
        {
            "VALID"
        } else {
            "INVALID"
        }
        .into();
    }
    mean.total_force_n = avg(|r| r.total_force_n);
    mean.partial_force_n = avg(|r| r.partial_force_n);
    mean.mean_pressure_k_pa = avg(|r| r.mean_pressure_k_pa);
    mean.max_pressure_k_pa = mean
        .pressure_k_pa
        .iter()
        .flatten()
        .copied()
        .reduce(f64::max);
    mean.contact_area_cm2 = avg(|r| r.contact_area_cm2);
    mean.complete = complete;
    mean.cop_mm = if complete && converted.iter().all(|f| f.cop_mm.is_some()) {
        Some(Cop {
            x: converted
                .iter()
                .filter_map(|f| f.cop_mm.as_ref().map(|c| c.x))
                .sum::<f64>()
                / converted.len() as f64,
            y: converted
                .iter()
                .filter_map(|f| f.cop_mm.as_ref().map(|c| c.y))
                .sum::<f64>()
                / converted.len() as f64,
        })
    } else {
        None
    };
    if !complete {
        mean.total_force_n = None;
        mean.mean_pressure_k_pa = None;
        mean.max_pressure_k_pa = None;
        mean.contact_area_cm2 = None;
        mean.cop_mm = None;
    }
    let peak_pressure_k_pa = if complete {
        converted
            .iter()
            .filter_map(|f| f.max_pressure_k_pa)
            .reduce(f64::max)
    } else {
        None
    };
    Ok(PhysicalResult{schema_version:1,mat_id:p.mat_id.clone(),profile:p,source:source.into(),averaging:"frame".into(),frame_count:frames.len(),raw_retained:true,mean,peak_pressure_k_pa,quality:if complete{"COMPLETE"}else{"PARTIAL"}.into(),warnings:vec!["Média por quadro. Centros do mapa seguem geometria discreta; interpolação é visual. Incerteza não determinada.".into()]})
}

#[cfg(test)]
mod tests {
    use super::*;
    fn database() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&c).unwrap();
        let m = Mat {
            id: "mat-test".into(),
            identity: "Fixture sintética".into(),
            revision: "1".into(),
            firmware: "test".into(),
            width_mm: Some(150.0),
            height_mm: Some(150.0),
            pitch_x_mm: Some(10.0),
            pitch_y_mm: Some(10.0),
            strip_width_mm: None,
            layers: "teste".into(),
            capacity_kg: Some(100.0),
            orientation: "RAW_FLIP_X".into(),
            cells: (0..N)
                .map(|i| Cell {
                    x_mm: Some((14 - i % 15) as f64 * 10.0 + 5.0),
                    y_mm: Some((i / 15) as f64 * 10.0 + 5.0),
                    area_mm2: Some(100.0),
                    enabled: true,
                    reason: String::new(),
                })
                .collect(),
            created_at: Some("fixture".into()),
        };
        c.execute(
            "INSERT INTO calibration_mats(id,spec_json) VALUES(?1,?2)",
            params![m.id, serde_json::to_string(&m).unwrap()],
        )
        .unwrap();
        c
    }
    fn spec(kind: &str, purpose: &str, group: &str, value: f64) -> Spec {
        serde_json::from_value(serde_json::json!({"kind":kind,"purpose":purpose,"protocol":"v1","group":group,"repetition":1,"cycle":"1","direction":"HOLD","inputValue":value,"inputUnit":"kg","applicatorKg":0,"areaMm2":null,"uniformConfirmed":false,"region":[],"position":"centro","instrument":"instrumento sintético","referenceResolution":null,"referenceUncertainty":null,"participantCode":"","staticConditionsConfirmed":false,"settleSeconds":0,"durationSeconds":1,"baselineTrialId":if kind=="BASELINE"{None}else{Some("zero")},"notes":"fixture","transport":"MOCK","port":"","baudRate":115200})).unwrap()
    }
    fn accepted(c: &Connection, id: &str, source: &str, s: Spec, raw: u16) {
        begin_trial(c, id, "mat-test", source, s, None).unwrap();
        let frames = (0..=10)
            .map(|k| Frame {
                received_ms: k as f64 * 100.0,
                sequence: Some(k + 1),
                values: vec![raw; N],
            })
            .collect::<Vec<_>>();
        append_frames(c, id, 0, frames).unwrap();
        let t = finish_trial(c, id, "").unwrap();
        assert_eq!(t.state, "REVIEW");
        c.execute(
            "UPDATE calibration_trials SET state='ACCEPTED' WHERE id=?1",
            [id],
        )
        .unwrap();
    }
    fn adjusted(c: &Connection, source: &str) -> Profile {
        accepted(
            c,
            "zero",
            source,
            spec("BASELINE", "CHARACTERIZATION", "zero", 0.0),
            100,
        );
        accepted(
            c,
            "fit-one",
            source,
            spec("TOTAL", "FIT", "fit-a", 1.0),
            121,
        );
        accepted(
            c,
            "fit-two",
            source,
            spec("TOTAL", "FIT", "fit-b", 2.0),
            141,
        );
        fit_profile(
            c,
            FitRequest {
                id: "profile-test".into(),
                mat_id: "mat-test".into(),
                name: "Fixture".into(),
                scope: "TOTAL_FORCE_ONLY".into(),
                baseline_trial_id: "zero".into(),
                trial_ids: vec!["fit-one".into(), "fit-two".into()],
                max_error: 0.01,
                min_validation_trials: 3,
                min_fit_levels: 2,
            },
        )
        .unwrap()
    }
    fn validate_fixture(c: &Connection, source: &str) -> Validation {
        for (id, mass, raw) in [
            ("val-one", 1.0, 121),
            ("val-middle", 1.5, 131),
            ("val-two", 2.0, 141),
        ] {
            accepted(c, id, source, spec("TOTAL", "VALIDATION", id, mass), raw);
        }
        validate_profile(
            c,
            "profile-test",
            "validation-test",
            vec!["val-one".into(), "val-middle".into(), "val-two".into()],
        )
        .unwrap()
    }
    #[test]
    fn simulation_cannot_activate_even_when_numerically_perfect() {
        let c = database();
        adjusted(&c, "SIMULATION");
        let v = validate_fixture(&c, "SIMULATION");
        assert_eq!(v.outcome, "INCONCLUSIVE");
        assert!(v.rmse.unwrap() < 1e-8);
        assert!(activate(&c, "profile-test").is_err());
        assert!(process_physical(&c, "profile-test", "SIMULATION", &[]).is_err());
    }
    fn after_candidate(c: &Connection, id: &str, group: &str, mass: f64, raw: u16) {
        accepted(c, id, "REAL", spec("TOTAL", "FIT", group, mass), raw);
        // Deterministic fixture: explicit recorded dates, no sleeps or user DB.
        c.execute(
            "UPDATE calibration_trials SET created_at='2099-01-01T00:00:00.000Z' WHERE id=?1",
            [id],
        )
        .unwrap();
    }
    #[test]
    fn classification_correction_preserves_raw_curve_and_reproduces_validation() {
        let c = database();
        adjusted(&c, "REAL");
        for (id, mass, raw) in [
            ("later-one", 1.0, 121),
            ("later-mid", 1.5, 131),
            ("later-two", 2.0, 141),
        ] {
            after_candidate(&c, id, id, mass, raw);
        }
        let ids: Vec<String> = ["later-one", "later-mid", "later-two"]
            .map(String::from)
            .into();
        let before = get_trial(&c, &ids[0]).unwrap();
        let raw = serde_json::to_value(trial_frames(&c, &ids[0]).unwrap()).unwrap();
        let original_curve: String = c
            .query_row(
                "SELECT profile_json FROM calibration_profiles WHERE id='profile-test'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        let changed =
            reclassify_trials(&c, &ids, "profile-test", "Conjunto mantido por engano", 7).unwrap();
        assert_eq!(changed.len(), 3);
        assert_eq!(changed[0].state, before.state);
        assert_eq!(changed[0].created_at, before.created_at);
        let mut expected = serde_json::to_value(&before.spec).unwrap();
        expected["purpose"] = "VALIDATION".into();
        expected["classificationCorrection"] =
            serde_json::to_value(changed[0].spec.classification_correction.as_ref().unwrap())
                .unwrap();
        assert_eq!(expected, serde_json::to_value(&changed[0].spec).unwrap());
        assert_eq!(
            raw,
            serde_json::to_value(trial_frames(&c, &ids[0]).unwrap()).unwrap()
        );
        assert_eq!(
            serde_json::to_value(before.summary).unwrap(),
            serde_json::to_value(&changed[0].summary).unwrap()
        );
        let stored: String = c
            .query_row(
                "SELECT profile_json FROM calibration_profiles WHERE id='profile-test'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(original_curve, stored);
        assert_eq!(get_trial(&c, "fit-one").unwrap().spec.purpose, "FIT");
        let v = validate_profile(&c, "profile-test", "corrected-validation", ids.clone()).unwrap();
        assert_eq!(v.outcome, "APPROVED");
        audit_database(&c).unwrap();
        assert!(reclassify_trials(&c, &ids, "profile-test", "repetir", 7).is_err());
    }
    #[test]
    fn classification_correction_rolls_back_entire_batch_when_group_leaks() {
        let c = database();
        adjusted(&c, "REAL");
        after_candidate(&c, "good", "later-good", 1.0, 121);
        after_candidate(&c, "leak", "fit-a", 1.0, 121);
        let failure = reclassify_trials(
            &c,
            &["good".into(), "leak".into()],
            "profile-test",
            "erro",
            7,
        )
        .unwrap_err();
        assert!(failure.contains("grupo usado"));
        assert_eq!(get_trial(&c, "good").unwrap().spec.purpose, "FIT");
        assert!(get_trial(&c, "good")
            .unwrap()
            .spec
            .classification_correction
            .is_none());
        assert_eq!(
            c.query_row(
                "SELECT count(*) FROM system_logs WHERE category='calibration_reclassify'",
                [],
                |r| r.get::<_, i64>(0)
            )
            .unwrap(),
            0
        );
    }
    #[test]
    fn classification_correction_rejects_pre_curve_used_and_imported_records() {
        for scenario in [
            "before",
            "used",
            "imported",
            "baseline",
            "rejected",
            "capturing",
            "wrong-baseline",
        ] {
            let c = database();
            adjusted(&c, "REAL");
            after_candidate(&c, "later", "later", 1.0, 121);
            let id = match scenario {
                "before" => {
                    c.execute("UPDATE calibration_trials SET created_at='2000-01-01T00:00:00.000Z' WHERE id='later'", []).unwrap();
                    "later"
                }
                "used" => {
                    c.execute("UPDATE calibration_trials SET created_at='2099-01-01T00:00:00.000Z' WHERE id='fit-one'", []).unwrap();
                    "fit-one"
                }
                "imported" => {
                    c.execute(
                        "UPDATE calibration_trials SET imported_at='importado' WHERE id='later'",
                        [],
                    )
                    .unwrap();
                    "later"
                }
                "baseline" => "zero",
                "rejected" => {
                    c.execute(
                        "UPDATE calibration_trials SET state='REJECTED' WHERE id='later'",
                        [],
                    )
                    .unwrap();
                    "later"
                }
                "capturing" => {
                    c.execute(
                        "UPDATE calibration_trials SET state='CAPTURING' WHERE id='later'",
                        [],
                    )
                    .unwrap();
                    "later"
                }
                _ => {
                    let mut t = get_trial(&c, "later").unwrap();
                    t.spec.baseline_trial_id = Some("outro-zero".into());
                    c.execute(
                        "UPDATE calibration_trials SET spec_json=?1 WHERE id='later'",
                        [serde_json::to_string(&t.spec).unwrap()],
                    )
                    .unwrap();
                    "later"
                }
            };
            assert!(
                reclassify_trials(&c, &[id.into()], "profile-test", "erro", 7).is_err(),
                "{scenario}"
            );
            assert!(get_trial(&c, id)
                .unwrap()
                .spec
                .classification_correction
                .is_none());
        }
    }
    #[test]
    fn classification_correction_requires_complete_group_reason_and_unique_ids() {
        let c = database();
        adjusted(&c, "REAL");
        after_candidate(&c, "later-a", "same-group", 1.0, 121);
        after_candidate(&c, "later-b", "same-group", 1.0, 121);
        let one = vec!["later-a".into()];
        assert!(reclassify_trials(&c, &one, "profile-test", "erro", 7)
            .unwrap_err()
            .contains("todas as repetições"));
        let all = vec!["later-a".into(), "later-b".into()];
        assert!(reclassify_trials(&c, &all, "profile-test", " ", 7).is_err());
        assert!(reclassify_trials(
            &c,
            &["later-a".into(), "later-a".into()],
            "profile-test",
            "erro",
            7
        )
        .is_err());
        assert_eq!(
            reclassify_trials(&c, &all, "profile-test", "erro", 7)
                .unwrap()
                .len(),
            2
        );
    }
    #[test]
    fn corrected_classification_survives_trial_export_and_import() {
        let c = database();
        adjusted(&c, "REAL");
        after_candidate(&c, "later", "later", 1.0, 121);
        reclassify_trials(&c, &["later".into()], "profile-test", "erro de conjunto", 7).unwrap();
        let t = get_trial(&c, "later").unwrap();
        let archive = serde_json::json!({"format":"BAROPRESS_CALIBRATION_TRIALS","schemaVersion":1,"mat":get_mat(&c,"mat-test").unwrap(),"records":[{"trial":get_trial(&c,"zero").unwrap(),"frames":trial_frames(&c,"zero").unwrap()},{"trial":t,"frames":trial_frames(&c,"later").unwrap()}]});
        let mut dest = database();
        assert_eq!(import_trials(&mut dest, &archive.to_string()).unwrap(), 2);
        let imported = get_trial(&dest, "later").unwrap();
        assert_eq!(imported.spec.purpose, "VALIDATION");
        assert_eq!(
            imported.spec.classification_correction.unwrap().operator_id,
            7
        );
        assert!(imported.imported_at.is_some());
        assert_eq!(trial_frames(&dest, "later").unwrap().len(), 11);
    }
    #[test]
    fn trial_import_preserves_raw_and_source_and_is_idempotent() {
        let c = database();
        adjusted(&c, "SIMULATION");
        let archive = serde_json::json!({"format":"BAROPRESS_CALIBRATION_TRIALS","schemaVersion":1,"mat":get_mat(&c,"mat-test").unwrap(),"records":[{"trial":get_trial(&c,"zero").unwrap(),"frames":trial_frames(&c,"zero").unwrap()},{"trial":get_trial(&c,"fit-one").unwrap(),"frames":trial_frames(&c,"fit-one").unwrap()}]});
        let mut dest = database();
        let json = serde_json::to_string(&archive).unwrap();
        assert_eq!(import_trials(&mut dest, &json).unwrap(), 2);
        assert_eq!(import_trials(&mut dest, &json).unwrap(), 0);
        let t = get_trial(&dest, "fit-one").unwrap();
        assert_eq!(t.source, "SIMULATION");
        assert!(t.imported_at.is_some());
        assert_eq!(trial_frames(&dest, "fit-one").unwrap().len(), 11);
        let mut bad = archive;
        bad["records"][1]["trial"]["summary"]["sd"][0] = 999.into();
        let mut empty = database();
        assert!(import_trials(&mut empty, &bad.to_string()).is_err());
        assert!(get_trial(&empty, "zero").is_err());
    }
    #[test]
    fn independent_validation_and_activation_are_reproducible() {
        let c = database();
        adjusted(&c, "REAL");
        let v = validate_fixture(&c, "REAL");
        assert_eq!(v.outcome, "APPROVED");
        activate(&c, "profile-test").unwrap();
        assert!(get_profile(&c, "profile-test").unwrap().active);
        audit_database(&c).unwrap();
        let frame = Frame {
            received_ms: 0.0,
            sequence: Some(1),
            values: vec![131; N],
        };
        let result = process_physical(&c, "profile-test", "REAL", &[frame]).unwrap();
        assert!((result.mean.total_force_n.unwrap() - 1.5 * G).abs() < 1e-8);
        assert!(result.mean.mean_pressure_k_pa.is_none());
    }
    #[test]
    fn fit_and_validation_group_cannot_overlap() {
        let c = database();
        adjusted(&c, "SIMULATION");
        assert!(begin_trial(
            &c,
            "bad",
            "mat-test",
            "SIMULATION",
            spec("TOTAL", "VALIDATION", "fit-a", 1.0),
            None
        )
        .is_err());
    }
    #[test]
    fn insufficient_validation_is_inconclusive() {
        let c = database();
        adjusted(&c, "REAL");
        let v = validate_profile(&c, "profile-test", "empty-validation", vec![]).unwrap();
        assert_eq!(v.outcome, "INCONCLUSIVE");
        assert!(activate(&c, "profile-test").is_err());
    }
    #[test]
    fn chunks_retry_without_duplication_and_early_stop_cannot_be_accepted() {
        let c = database();
        let s = spec("BASELINE", "CHARACTERIZATION", "zero", 0.0);
        begin_trial(&c, "zero", "mat-test", "SIMULATION", s, None).unwrap();
        let f = vec![Frame {
            received_ms: 10.0,
            sequence: Some(1),
            values: vec![100; N],
        }];
        append_frames(&c, "zero", 0, f.clone()).unwrap();
        append_frames(&c, "zero", 0, f).unwrap();
        assert_eq!(trial_frames(&c, "zero").unwrap().len(), 1);
        assert_eq!(finish_trial(&c, "zero", "").unwrap().state, "INTERRUPTED");
    }
    #[test]
    fn full_backup_roundtrip_keeps_trials_but_deactivates_selection() {
        let mut c = database();
        adjusted(&c, "REAL");
        validate_fixture(&c, "REAL");
        activate(&c, "profile-test").unwrap();
        let b = crate::backup::export_backup(&c, None).unwrap();
        let json = serde_json::to_string(&b).unwrap();
        let parsed = crate::backup::parse_backup(&c, &json).unwrap();
        crate::backup::restore_backup(&mut c, &parsed).unwrap();
        assert_eq!(trial_frames(&c, "fit-one").unwrap().len(), 11);
        assert!(!get_profile(&c, "profile-test").unwrap().active);
        activate(&c, "profile-test").unwrap();
    }
    #[test]
    fn corrupted_archive_profile_is_rejected_and_restore_rolls_back() {
        let mut c = database();
        adjusted(&c, "REAL");
        validate_fixture(&c, "REAL");
        let mut b = crate::backup::export_backup(&c, None).unwrap();
        let table = b
            .tables
            .iter_mut()
            .find(|t| t.name == "calibration_profiles")
            .unwrap();
        let i = table
            .columns
            .iter()
            .position(|s| s == "profile_json")
            .unwrap();
        if let crate::backup::Cell::Text(s) = &mut table.rows[0][i] {
            let mut v: serde_json::Value = serde_json::from_str(s).unwrap();
            v["curves"][0][1]["y"] = 999.0.into();
            *s = serde_json::to_string(&v).unwrap();
        }
        assert!(crate::backup::restore_backup(&mut c, &b).is_err());
        assert!(
            get_profile(&c, "profile-test").unwrap().curves[0]
                .as_ref()
                .unwrap()[1]
                .y
                < 20.0
        );
    }
    #[test]
    fn baseline_shift_and_partial_sensor_do_not_fake_total() {
        let c = database();
        let mut p = adjusted(&c, "SIMULATION");
        p.scope = "LOCAL_PRESSURE".into();
        p.curves = vec![Some(vec![Knot { x: 0.0, y: 0.0 }, Knot { x: 100.0, y: 10.0 }]); N];
        let mut values = vec![201; N];
        p.mat.cells[112].area_mm2 = Some(200.0);
        let r = convert(&values, &p);
        assert!((r.total_force_n.unwrap() - 226.0).abs() < 1e-8);
        values[0] = 4095;
        let partial = convert(&values, &p);
        assert!(!partial.complete);
        assert!(partial.total_force_n.is_none());
        assert!(partial.pressure_k_pa[0].is_none());
        values[0] = 80;
        assert_eq!(convert(&values, &p).statuses[0], "BASELINE_DRIFT");
    }
    #[test]
    fn raw_statistics_detect_gaps_and_saturation() {
        let f = vec![
            Frame {
                received_ms: 0.0,
                sequence: Some(1),
                values: vec![100; N],
            },
            Frame {
                received_ms: 100.0,
                sequence: Some(3),
                values: vec![4095; N],
            },
        ];
        let s = summarize(&f).unwrap();
        assert_eq!(s.count, 2);
        assert_eq!(s.sequence_gaps, 1);
        assert_eq!(s.saturated[0], 1);
        assert_eq!(s.fps, 10.0);
    }
    #[test]
    fn rejects_nonmonotonic_reference_and_extrapolation() {
        assert!(fit_knots(vec![(100.0, 10.0), (90.0, 20.0)], 2).is_err());
        let k = Some(vec![
            Knot { x: 0.0, y: 0.0 },
            Knot { x: 100.0, y: 10.0 },
            Knot { x: 200.0, y: 40.0 },
        ]);
        assert_eq!(curve(&k, 150.0), Some(25.0));
        assert_eq!(curve(&k, 201.0), None);
    }
    #[test]
    fn unit_reference_includes_applicator_once() {
        let s:Spec=serde_json::from_value(serde_json::json!({"kind":"TOTAL","purpose":"FIT","protocol":"v1","group":"a","repetition":1,"cycle":"1","direction":"HOLD","inputValue":4,"inputUnit":"kg","applicatorKg":1,"areaMm2":2500,"uniformConfirmed":true,"region":[0],"position":"centro","instrument":"balança","referenceResolution":null,"referenceUncertainty":null,"participantCode":"","staticConditionsConfirmed":false,"settleSeconds":0,"durationSeconds":1,"baselineTrialId":null,"notes":"","transport":"MOCK","port":"","baudRate":115200})).unwrap();
        assert!((reference(&s, "LOCAL_PRESSURE").unwrap() - 19.6133).abs() < 1e-8);
    }
    #[test]
    fn physical_exam_persists_snapshot_raw_and_legacy_adc_without_reinterpretation() {
        let mut c = database();
        adjusted(&c, "REAL");
        validate_fixture(&c, "REAL");
        activate(&c, "profile-test").unwrap();
        c.execute("INSERT INTO patients(id,name) VALUES(1,'Fixture')", [])
            .unwrap();
        let frames = (0..=10)
            .map(|k| Frame {
                received_ms: k as f64 * 100.0,
                sequence: Some(k + 1),
                values: vec![131; N],
            })
            .collect::<Vec<_>>();
        let input:crate::exams::ExamInput=serde_json::from_value(serde_json::json!({"patientId":1,"type":"static","source":"REAL","status":"completed","duration":1,"frameCount":11,"fps":11,"threshold":150,"vmax":2200,"gamma":1.3,"smoothing":0.35,"tareApplied":false,"matrix":vec![200;N],"maxPressure":200,"contactAreaPercent":100,"contactSensors":225,"leftLoad":2000,"rightLoad":2000,"physicalProfileId":"profile-test","rawFrames":frames})).unwrap();
        let saved = crate::exams::create_exam(&mut c, input).unwrap();
        assert_eq!(saved.max_pressure, Some(200.0));
        assert_eq!(saved.matrix[0], 200.0);
        let result = saved.physical_result.unwrap();
        assert!((result.mean.total_force_n.unwrap() - 1.5 * G).abs() < 1e-8);
        assert_eq!(
            c.query_row(
                "SELECT COUNT(*) FROM exam_raw_chunks WHERE exam_id=?1",
                [saved.id],
                |r| r.get::<_, usize>(0)
            )
            .unwrap(),
            1
        );
        c.execute("DELETE FROM calibration_active", []).unwrap();
        let reopened = crate::exams::get_exam(&c, saved.id).unwrap();
        assert_eq!(reopened.physical_result.unwrap().profile.id, "profile-test");
        let b = crate::backup::export_backup(&c, Some(1)).unwrap();
        let mut other = database();
        other.execute("DELETE FROM calibration_mats", []).unwrap();
        crate::backup::restore_backup(&mut other, &b).unwrap();
        assert!(crate::exams::get_exam(&other, 1)
            .unwrap()
            .physical_result
            .is_some());
    }
    #[test]
    fn previous_schema_backup_is_upgraded_without_fabricating_physical_results() {
        let c = database();
        let mut b = crate::backup::export_backup(&c, None).unwrap();
        b.schema_version = 5;
        let users = b.tables.iter_mut().find(|t| t.name == "users").unwrap();
        for n in ["session_version", "deleted_at", "ra"] {
            let i = users.columns.iter().position(|x| x == n).unwrap();
            users.columns.remove(i);
            for r in &mut users.rows {
                r.remove(i);
            }
        }
        b.tables
            .retain(|t| !t.name.starts_with("calibration_") && t.name != "exam_raw_chunks");
        let exams = b.tables.iter_mut().find(|t| t.name == "exams").unwrap();
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
            .position(|v| v == "physical_result_json")
            .unwrap();
        exams.columns.remove(index);
        for row in &mut exams.rows {
            row.remove(index);
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
        let restored =
            crate::backup::parse_backup(&c, &serde_json::to_string(&b).unwrap()).unwrap();
        assert_eq!(restored.schema_version, crate::db::SCHEMA_VERSION);
        assert!(restored
            .tables
            .iter()
            .any(|t| t.name == "calibration_profiles" && t.rows.is_empty()));
    }
    #[test]
    fn local_pressure_reference_converts_each_cell_and_validates_whole_domain() {
        let c = database();
        accepted(
            &c,
            "zero",
            "REAL",
            spec("BASELINE", "CHARACTERIZATION", "zero", 0.0),
            100,
        );
        for (id, purpose, mass, raw) in [
            ("fit-one", "FIT", 1.0, 121),
            ("fit-two", "FIT", 2.0, 141),
            ("val-one", "VALIDATION", 1.0, 121),
            ("val-middle", "VALIDATION", 1.5, 131),
            ("val-two", "VALIDATION", 2.0, 141),
        ] {
            let mut s = spec("UNIFORM", purpose, id, mass);
            s.uniform_confirmed = true;
            s.area_mm2 = Some(22500.0);
            s.region = (0..N).collect();
            accepted(&c, id, "REAL", s, raw);
        }
        let p = fit_profile(
            &c,
            FitRequest {
                id: "profile-test".into(),
                mat_id: "mat-test".into(),
                name: "Fixture local".into(),
                scope: "LOCAL_PRESSURE".into(),
                baseline_trial_id: "zero".into(),
                trial_ids: vec!["fit-one".into(), "fit-two".into()],
                max_error: 0.001,
                min_validation_trials: 3,
                min_fit_levels: 2,
            },
        )
        .unwrap();
        let v = validate_profile(
            &c,
            &p.id,
            "validation-test",
            vec!["val-one".into(), "val-middle".into(), "val-two".into()],
        )
        .unwrap();
        assert_eq!(v.outcome, "APPROVED");
        activate(&c, &p.id).unwrap();
        let r = convert(&vec![131; N], &p);
        assert!((r.total_force_n.unwrap() - 1.5 * G).abs() < 1e-8);
        assert_eq!(r.contact_area_cm2, Some(225.0));
        assert!((r.cop_mm.unwrap().x - 75.0).abs() < 1e-8);
        assert!(serde_json::to_value(&r.pressure_k_pa).unwrap().is_array());
    }
}
