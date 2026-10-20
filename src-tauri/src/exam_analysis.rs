use crate::{calibration::Frame, exams::ExamInput};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Conditions {
    pub visual: String,
    pub posture: String,
    pub support: String,
    pub positioning: String,
    pub protocol: String,
    pub protocol_version: String,
    pub informed_by: String,
    pub notes: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Event {
    pub timestamp_ms: f64,
    pub kind: String,
    pub text: String,
    pub informed_by: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Series {
    pub frame_count: usize,
    pub representation: String,
    pub clock: String,
    pub sequence_origin: String,
    pub orientation: String,
    pub tare_baseline: Option<Vec<f64>>,
    pub tare_active: bool,
    pub threshold: f64,
    pub acquisition_vmax: f64,
    pub source: String,
    pub transformation: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Quality {
    pub valid_frames: usize,
    pub invalid_frames: Option<usize>,
    pub planned_ms: f64,
    pub observed_ms: f64,
    pub first_ms: Option<f64>,
    pub last_ms: Option<f64>,
    pub interval_mean_ms: Option<f64>,
    pub interval_min_ms: Option<f64>,
    pub interval_max_ms: Option<f64>,
    pub largest_gap_ms: f64,
    pub reception_hz: Option<f64>,
    pub frames_per_planned_second: f64,
    pub adc_limit_samples: usize,
    pub color_limit_samples: usize,
    pub sample_count: usize,
    pub sequence_resets: usize,
    pub sequence_gaps: u64,
    pub warnings: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Region {
    pub version: u8,
    pub created_at: String,
    pub operator: String,
    pub origin: String,
    pub mode: String,
    pub frame_index: Option<usize>,
    pub masks: std::collections::BTreeMap<String, Vec<usize>>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Analysis {
    #[serde(default)]
    pub acquisition: Option<Acquisition>,
    pub version: String,
    pub conditions: Conditions,
    pub events: Vec<Event>,
    pub quality: Quality,
    pub series: Series,
    pub regions: Vec<Region>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Acquisition {
    pub foot: String,
    pub sequence_id: Option<String>,
    pub stage: usize,
    pub total_stages: usize,
    pub order: Vec<String>,
}
pub fn validate_acquisition(a: &Acquisition) -> Result<(), String> {
    let single = a.total_stages == 1
        && a.stage == 1
        && a.sequence_id.is_none()
        && a.order == vec![a.foot.clone()];
    let pair = a.total_stages == 2
        && (1..=2).contains(&a.stage)
        && a.sequence_id
            .as_ref()
            .is_some_and(|id| !id.is_empty() && id.len() <= 100)
        && (a.order == vec!["left", "right"] || a.order == vec!["right", "left"])
        && a.order.get(a.stage - 1) == Some(&a.foot);
    if !["both", "left", "right"].contains(&a.foot.as_str()) || !(single || pair) {
        return Err("Modalidade ou sequência de aquisição inválida".into());
    }
    Ok(())
}
fn close(a: f64, b: f64) -> bool {
    a.is_finite() && b.is_finite() && (a - b).abs() <= 0.00001 * (1.0 + b.abs())
}
fn optional_close(a: Option<f64>, b: Option<f64>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => close(a, b),
        _ => false,
    }
}
pub fn validate_region(r: &Region, count: usize) -> Result<(), String> {
    let mut seen = std::collections::HashSet::new();
    if r.version != 1
        || r.origin != "manual-cells"
        || r.operator.trim().is_empty()
        || r.operator.len() > 200
        || r.created_at.is_empty()
        || !["mean", "maximum", "frame"].contains(&r.mode.as_str())
        || r.masks.len() != 4
        || ["LA", "LP", "RA", "RP"]
            .iter()
            .any(|k| !r.masks.contains_key(*k))
        || (r.mode == "frame" && r.frame_index.is_none_or(|i| i >= count))
        || (r.mode != "frame" && r.frame_index.is_some())
        || r.masks
            .values()
            .flatten()
            .any(|i| *i >= 225 || !seen.insert(*i))
    {
        return Err("Revisão de regiões inválida ou sobreposta".into());
    }
    Ok(())
}
pub fn validate(data: &ExamInput, frames: &[Frame]) -> Result<(), String> {
    let Some(a) = &data.analysis else {
        return Ok(());
    };
    let s = &a.series;
    if let Some(acquisition) = &a.acquisition {
        validate_acquisition(acquisition)?;
    }
    let q = &a.quality;
    let c = &a.conditions;
    if a.version != "baropress-static-v1"
        || data.r#type != "static"
        || data.status != "completed"
        || s.representation != "raw-adc-u16"
        || s.clock != "pc-monotonic-reception"
        || s.sequence_origin != "pc-reception"
        || s.orientation != "RAW_FLIP_X"
        || s.transformation != "tare-then-flip-v1"
        || s.source != data.source
        || s.threshold != data.threshold
        || s.tare_active != data.tare_applied
        || !s.acquisition_vmax.is_finite()
        || !(500.0..=4095.0).contains(&s.acquisition_vmax)
        || s.frame_count != frames.len()
        || data.frame_count as usize != frames.len()
        || frames.is_empty()
        || frames.len() > 10000
        || !["unknown", "open", "closed"].contains(&c.visual.as_str())
        || !["unknown", "standing", "seated"].contains(&c.posture.as_str())
        || !["unknown", "none", "external"].contains(&c.support.as_str())
        || [
            &c.positioning,
            &c.protocol,
            &c.protocol_version,
            &c.informed_by,
            &c.notes,
        ]
        .iter()
        .any(|s| s.len() > 4000)
        || (s.tare_active && s.tare_baseline.is_none())
        || s.tare_baseline.as_ref().is_some_and(|b| {
            b.len() != 225
                || b.iter()
                    .any(|v| !v.is_finite() || !(0.0..=4095.0).contains(v))
        })
    {
        return Err("Contrato da análise/série incompatível".into());
    }
    let planned = data.duration * 1000.0;
    if planned <= 0.0
        || a.events.len() > 1000
        || a.regions.len() > 100
        || a.events.iter().any(|e| {
            !e.timestamp_ms.is_finite()
                || e.timestamp_ms < 0.0
                || e.timestamp_ms > planned
                || !["movement", "correction", "note"].contains(&e.kind.as_str())
                || e.text.len() > 4000
                || e.informed_by.trim().is_empty()
                || e.informed_by.len() > 200
        })
    {
        return Err("Eventos ou duração inválidos".into());
    }
    for r in &a.regions {
        validate_region(r, frames.len())?;
    }
    let mut intervals = vec![];
    let mut adc = 0;
    let mut color = 0;
    let mut resets = 0;
    let mut gaps = 0;
    let mut average = vec![0.0; 225];
    for (i, f) in frames.iter().enumerate() {
        if f.values.len() != 225
            || !f.received_ms.is_finite()
            || f.received_ms < 0.0
            || f.received_ms > planned
            || f.values.iter().any(|v| *v > 4095)
            || (i > 0 && f.received_ms < frames[i - 1].received_ms)
        {
            return Err("Quadro bruto ou relógio inválido".into());
        }
        if i > 0 {
            let dt = f.received_ms - frames[i - 1].received_ms;
            if dt > 0.0 {
                intervals.push(dt);
            }
            if let (Some(x), Some(y)) = (frames[i - 1].sequence, f.sequence) {
                if y <= x {
                    resets += 1;
                } else {
                    gaps += y - x - 1;
                }
            }
        }
        for (j, v) in f.values.iter().enumerate() {
            if *v == 4095 {
                adc += 1;
            }
            let value = (*v as f64
                - if s.tare_active {
                    s.tare_baseline.as_ref().unwrap()[j]
                } else {
                    0.0
                })
            .max(0.0);
            if value >= s.acquisition_vmax {
                color += 1;
            }
            let target = (j / 15) * 15 + 14 - j % 15;
            average[target] += value / frames.len() as f64;
        }
    }
    if average
        .iter()
        .zip(&data.matrix)
        .any(|(a, b)| !close((a * 10.0).round() / 10.0, *b))
    {
        return Err("Média incompatível com a transformação histórica".into());
    }
    let first = frames.first().unwrap().received_ms;
    let last = frames.last().unwrap().received_ms;
    let observed = last - first;
    let mean = if intervals.is_empty() {
        None
    } else {
        Some(intervals.iter().sum::<f64>() / intervals.len() as f64)
    };
    let min = intervals.iter().copied().reduce(f64::min);
    let max = intervals.iter().copied().reduce(f64::max);
    let largest = first.max(planned - last).max(max.unwrap_or(0.0));
    if q.valid_frames != frames.len()
        || q.sample_count != frames.len() * 225
        || !close(q.planned_ms, planned)
        || !close(q.observed_ms, observed)
        || !optional_close(q.first_ms, Some(first))
        || !optional_close(q.last_ms, Some(last))
        || !optional_close(q.interval_mean_ms, mean)
        || !optional_close(q.interval_min_ms, min)
        || !optional_close(q.interval_max_ms, max)
        || !close(q.largest_gap_ms, largest)
        || !optional_close(
            q.reception_hz,
            if observed > 0.0 {
                Some((frames.len() - 1) as f64 * 1000.0 / observed)
            } else {
                None
            },
        )
        || !close(
            q.frames_per_planned_second,
            frames.len() as f64 * 1000.0 / planned,
        )
        || q.adc_limit_samples != adc
        || q.color_limit_samples != color
        || q.sequence_resets != resets
        || q.sequence_gaps != gaps
        || q.warnings.len() > 100
        || q.warnings.iter().any(|s| s.len() > 4000)
    {
        return Err("Qualidade incompatível com os quadros retidos".into());
    }
    Ok(())
}
pub fn read_frames(
    c: &Connection,
    id: i64,
    offset: usize,
    limit: usize,
) -> Result<Vec<Frame>, String> {
    if limit == 0 || limit > 20000 || offset > 20000 {
        return Err("Janela de leitura inválida".into());
    }
    let mut q=c.prepare("SELECT ordinal,frames_json FROM exam_raw_chunks WHERE exam_id=?1 AND ordinal>=?2 AND ordinal<=?3 ORDER BY ordinal").map_err(|e|e.to_string())?;
    let chunks = q
        .query_map(params![id, offset / 60, (offset + limit - 1) / 60], |r| {
            Ok((r.get::<_, usize>(0)?, r.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut frames = vec![];
    for row in chunks {
        let (ordinal, json) = row.map_err(|e| e.to_string())?;
        let chunk: Vec<Frame> = serde_json::from_str(&json).map_err(|e| e.to_string())?;
        for (i, f) in chunk.into_iter().enumerate() {
            let index = ordinal * 60 + i;
            if index >= offset && index < offset + limit {
                frames.push(f);
            }
        }
    }
    Ok(frames)
}
pub fn audit_database(c: &Connection) -> Result<(), String> {
    let mut q = c
        .prepare("SELECT id FROM exams WHERE analysis_json IS NOT NULL")
        .map_err(|e| e.to_string())?;
    let ids = q
        .query_map([], |r| r.get::<_, i64>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    for id in ids {
        let exam = crate::exams::get_exam(c, id)?;
        let input: ExamInput =
            serde_json::from_value(serde_json::to_value(exam).map_err(|e| e.to_string())?)
                .map_err(|e| e.to_string())?;
        let frames = read_frames(c, id, 0, 10000)?;
        validate(&input, &frames)?;
    }
    Ok(())
}
