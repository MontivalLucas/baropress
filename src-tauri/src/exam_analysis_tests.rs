use crate::{backup, db, exam_analysis, exams};
use rusqlite::Connection;
fn database() -> Connection {
    let c = Connection::open_in_memory().unwrap();
    c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
    db::migrate(&c).unwrap();
    c.execute(
        "INSERT INTO patients(name) VALUES('PARTICIPANTE-SINTETICO')",
        [],
    )
    .unwrap();
    c
}
fn sample() -> exams::ExamInput {
    let frames: Vec<_> = [100.0, 300.0, 800.0]
        .iter()
        .enumerate()
        .map(|(i, t)| serde_json::json!({"receivedMs":t,"sequence":i+1,"values":vec![100;225]}))
        .collect();
    let conditions = serde_json::json!({"visual":"unknown","posture":"unknown","support":"unknown","positioning":"","protocol":"","protocolVersion":"","informedBy":"","notes":""});
    let series = serde_json::json!({"frameCount":3,"representation":"raw-adc-u16","clock":"pc-monotonic-reception","sequenceOrigin":"pc-reception","orientation":"RAW_FLIP_X","tareBaseline":null,"tareActive":false,"threshold":10,"acquisitionVmax":500,"source":"SIMULATION","transformation":"tare-then-flip-v1"});
    let quality = serde_json::json!({"validFrames":3,"invalidFrames":0,"plannedMs":1000,"observedMs":700,"firstMs":100,"lastMs":800,"intervalMeanMs":350,"intervalMinMs":200,"intervalMaxMs":500,"largestGapMs":500,"receptionHz":20.0/7.0,"framesPerPlannedSecond":3,"adcLimitSamples":0,"colorLimitSamples":0,"sampleCount":675,"sequenceResets":0,"sequenceGaps":0,"warnings":[]});
    let analysis = serde_json::json!({"version":"baropress-static-v1","conditions":conditions,"events":[],"regions":[],"series":series,"quality":quality});
    let mut data = serde_json::json!({"patientId":1,"type":"static","source":"SIMULATION","status":"completed","duration":1,"frameCount":3,"fps":3,"threshold":10,"vmax":500,"gamma":1.3,"smoothing":0.35,"tareApplied":false,"matrix":vec![100;225],"maxPressure":100,"meanPressure":100,"contactAreaPercent":100,"contactSensors":225,"leftLoad":10500,"rightLoad":10500,"leftPercent":50,"rightPercent":50});
    data["seriesFrames"] = serde_json::json!(frames);
    data["analysis"] = analysis;
    serde_json::from_value(data).unwrap()
}
fn paired_samples() -> Vec<exams::ExamInput> {
    ["left", "right"]
        .iter()
        .enumerate()
        .map(|(i, foot)| {
            let mut input = sample();
            input.analysis.as_mut().unwrap().acquisition = Some(exam_analysis::Acquisition {
                foot: foot.to_string(),
                sequence_id: Some("synthetic-sequence".into()),
                stage: i + 1,
                total_stages: 2,
                order: vec!["left".into(), "right".into()],
            });
            input
        })
        .collect()
}
#[test]
fn sequence_rolls_back_first_stage_when_second_write_fails_and_retries_without_duplicates() {
    let mut c = database();
    c.execute_batch("CREATE TRIGGER fail_second BEFORE UPDATE OF analysis_json ON exams WHEN json_extract(NEW.analysis_json,'$.acquisition.stage')=2 BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;").unwrap();
    assert!(exams::create_exam_sequence(&mut c, paired_samples()).is_err());
    assert_eq!(
        c.query_row("SELECT count(*) FROM exams", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        0
    );
    assert_eq!(
        c.query_row("SELECT count(*) FROM exam_raw_chunks", [], |r| r
            .get::<_, i64>(0))
            .unwrap(),
        0
    );
    c.execute_batch("DROP TRIGGER fail_second").unwrap();
    let pair = exams::create_exam_sequence(&mut c, paired_samples()).unwrap();
    assert_eq!(pair.len(), 2);
    assert_eq!(
        pair[0]
            .analysis
            .as_ref()
            .unwrap()
            .acquisition
            .as_ref()
            .unwrap()
            .foot,
        "left"
    );
    assert_eq!(
        pair[1]
            .analysis
            .as_ref()
            .unwrap()
            .acquisition
            .as_ref()
            .unwrap()
            .stage,
        2
    );
    let list = exams::list_exams(&c, None).unwrap();
    assert!(list
        .iter()
        .all(|e| e.acquisition.as_ref().unwrap().sequence_id.as_deref()
            == Some("synthetic-sequence")));
    assert!(exams::create_exam_sequence(&mut c, paired_samples()).is_err());
    assert_eq!(
        c.query_row("SELECT count(*) FROM exams", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        2
    );
}
#[test]
fn sequence_rejects_incomplete_mismatched_patient_source_duration_and_order() {
    let mut c = database();
    assert!(exams::create_exam_sequence(&mut c, vec![paired_samples().remove(0)]).is_err());
    for change in 0..4 {
        let mut pair = paired_samples();
        match change {
            0 => pair[1].patient_id = 2,
            1 => pair[1].source = "REAL".into(),
            2 => pair[1].duration = 45.0,
            _ => {
                pair[1]
                    .analysis
                    .as_mut()
                    .unwrap()
                    .acquisition
                    .as_mut()
                    .unwrap()
                    .foot = "left".into()
            }
        }
        assert!(exams::create_exam_sequence(&mut c, pair).is_err());
    }
    assert_eq!(
        c.query_row("SELECT count(*) FROM exams", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        0
    );
}
#[test]
fn acquisition_metadata_survives_patient_backup_restore_and_old_exams_stay_unknown() {
    let mut c = database();
    exams::create_exam_sequence(&mut c, paired_samples()).unwrap();
    let text = serde_json::to_string(&backup::export_backup(&c, Some(1)).unwrap()).unwrap();
    let parsed = backup::parse_backup(&c, &text).unwrap();
    let mut dest = database();
    let patient_id = backup::restore_backup(&mut dest, &parsed).unwrap().unwrap();
    let list = exams::list_exams_filtered(&dest, None, None, None, Some(patient_id)).unwrap();
    assert_eq!(list.len(), 2);
    assert!(list.iter().all(|e| e.acquisition.is_some()));
    let legacy = exams::create_exam(&mut c, sample()).unwrap();
    assert!(legacy.analysis.unwrap().acquisition.is_none());
}
#[test]
fn relative_series_reopens_and_survives_full_and_patient_restore() {
    let mut c = database();
    let saved = exams::create_exam(&mut c, sample()).unwrap();
    assert!(saved.analysis.is_some());
    assert!(saved.physical_result.is_none());
    assert_eq!(
        exam_analysis::read_frames(&c, saved.id, 1, 1).unwrap()[0].received_ms,
        300.0
    );
    for patient in [None, Some(1)] {
        let b = backup::export_backup(&c, patient).unwrap();
        let parsed = backup::parse_backup(&c, &serde_json::to_string(&b).unwrap()).unwrap();
        let mut dest = database();
        let id = backup::restore_backup(&mut dest, &parsed).unwrap();
        let eid = dest
            .query_row(
                "SELECT id FROM exams WHERE patient_id=?1",
                [id.unwrap_or(1)],
                |r| r.get(0),
            )
            .unwrap();
        let restored = exams::get_exam(&dest, eid).unwrap();
        assert_eq!(restored.analysis.unwrap().quality.valid_frames, 3);
        assert_eq!(
            exam_analysis::read_frames(&dest, eid, 0, 600)
                .unwrap()
                .len(),
            3
        );
    }
}

#[test]
fn visual_and_external_support_choices_survive_sqlite_reopen() {
    let mut c = database();
    for visual in ["open", "closed", "unknown"] {
        for support in ["none", "external", "unknown"] {
            let mut input = sample();
            let conditions = &mut input.analysis.as_mut().unwrap().conditions;
            conditions.visual = visual.into();
            conditions.support = support.into();
            let saved = exams::create_exam(&mut c, input).unwrap();
            let reopened = exams::get_exam(&c, saved.id).unwrap();
            let conditions = reopened.analysis.unwrap().conditions;
            assert_eq!(conditions.visual, visual);
            assert_eq!(conditions.support, support);
            assert!(reopened.physical_result.is_none());
        }
    }
}
#[test]
fn rejects_partial_series_duplicate_storage_and_changed_quality_without_commit() {
    let mut c = database();
    let mut input = sample();
    input.series_frames.as_mut().unwrap().pop();
    assert!(exams::create_exam(&mut c, input).is_err());
    let mut input = sample();
    input.raw_frames = input.series_frames.clone();
    assert!(exams::create_exam(&mut c, input).is_err());
    let mut input = sample();
    input.analysis.as_mut().unwrap().quality.largest_gap_ms = 0.0;
    assert!(exams::create_exam(&mut c, input).is_err());
    let mut input = sample();
    input.matrix[0] = 0.0;
    assert!(exams::create_exam(&mut c, input).is_err());
    let count: i64 = c
        .query_row("SELECT count(*) FROM exams", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}
#[test]
fn incomplete_restore_is_rejected_and_previous_database_preserved() {
    let mut c = database();
    exams::create_exam(&mut c, sample()).unwrap();
    let mut b = backup::export_backup(&c, None).unwrap();
    b.tables
        .iter_mut()
        .find(|t| t.name == "exam_raw_chunks")
        .unwrap()
        .rows
        .clear();
    let mut dest = database();
    dest.execute("UPDATE patients SET name='PRESERVADO' WHERE id=1", [])
        .unwrap();
    assert!(backup::restore_backup(&mut dest, &b).is_err());
    let name: String = dest
        .query_row("SELECT name FROM patients WHERE id=1", [], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "PRESERVADO");
}
#[test]
fn region_contract_forbids_overlap_and_invalid_frame() {
    let r = serde_json::json!({"version":1,"createdAt":"2026-10-09","operator":"OPERADOR-TESTE","origin":"manual-cells","mode":"frame","frameIndex":3,"masks":{"LA":[0],"LP":[],"RA":[7],"RP":[]}});
    let mut r: exam_analysis::Region = serde_json::from_value(r).unwrap();
    assert!(exam_analysis::validate_region(&r, 3).is_err());
    r.frame_index = Some(2);
    assert!(exam_analysis::validate_region(&r, 3).is_ok());
    r.masks.get_mut("RP").unwrap().push(0);
    assert!(exam_analysis::validate_region(&r, 3).is_err());
}
#[test]
fn schema_seven_import_keeps_analysis_absent_and_original_matrix() {
    let c = database();
    let mut input = sample();
    input.analysis = None;
    input.series_frames = None;
    let mut c = c;
    exams::create_exam(&mut c, input).unwrap();
    let mut b = backup::export_backup(&c, None).unwrap();
    b.schema_version = 7;
    let users = b.tables.iter_mut().find(|t| t.name == "users").unwrap();
    for n in ["session_version", "deleted_at", "ra"] {
        let i = users.columns.iter().position(|x| x == n).unwrap();
        users.columns.remove(i);
        for r in &mut users.rows {
            r.remove(i);
        }
    }
    let table = b.tables.iter_mut().find(|t| t.name == "exams").unwrap();
    let i = table
        .columns
        .iter()
        .position(|s| s == "analysis_json")
        .unwrap();
    table.columns.remove(i);
    for row in &mut table.rows {
        row.remove(i);
    }
    let parsed = backup::parse_backup(&c, &serde_json::to_string(&b).unwrap()).unwrap();
    let mut dest = database();
    backup::restore_backup(&mut dest, &parsed).unwrap();
    let e = exams::get_exam(&dest, 1).unwrap();
    assert!(e.analysis.is_none());
    assert_eq!(e.matrix[0], 100.0);
}
