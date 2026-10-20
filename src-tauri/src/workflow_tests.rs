use crate::{agenda, backup, db, exams, questionnaires, support};
use rusqlite::Connection;
use serde_json::json;

#[test]
fn complete_workflow_survives_full_backup_restore() {
    let mut c = Connection::open_in_memory().unwrap();
    c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
    db::migrate(&c).unwrap();
    c.execute("INSERT INTO users(name,email,password_hash,role) VALUES('Teste','teste@example.invalid','hash-de-teste','admin')",[]).unwrap();
    c.execute(
        "INSERT INTO patients(id,name) VALUES(1,'Paciente sintético')",
        [],
    )
    .unwrap();
    for day in [1, 7] {
        let input:exams::ExamInput=serde_json::from_value(json!({"patientId":1,"type":"static","source":"SIMULATION","status":"completed","startedAt":format!("2026-10-{day:02}T12:00:00Z"),"duration":10,"frameCount":303,"fps":30.3,"threshold":150,"vmax":2200,"gamma":1.3,"smoothing":0.35,"tareApplied":false,"matrix":vec![500.0;225],"maxPressure":500,"contactAreaPercent":100,"contactSensors":225,"leftLoad":5000,"rightLoad":5000,"copTrajectory":[{"timestampMs":33,"x":7,"y":7}]})).unwrap();
        exams::create_exam(&mut c, input).unwrap();
    }
    agenda::save_appointment(
        &c,
        None,
        agenda::AppointmentInput {
            patient_id: 1,
            professional_id: None,
            date: "2026-10-07".into(),
            start_time: "09:00".into(),
            end_time: "09:30".into(),
            r#type: "Avaliação".into(),
            status: "confirmed".into(),
            notes: None,
        },
    )
    .unwrap();
    let mut template = questionnaires::Questionnaire {
        id: None,
        name: "Modelo sintético".into(),
        description: None,
        active: true,
        questions: vec![],
    };
    for kind in ["text", "single", "multi", "number", "yesno"] {
        template.questions.push(questionnaires::Question {
            id: None,
            group_name: "Grupo de teste".into(),
            question: format!("Pergunta {kind}"),
            r#type: kind.into(),
            options: if ["single", "multi"].contains(&kind) {
                vec!["A".into(), "B".into()]
            } else {
                vec![]
            },
            required: true,
            active: true,
        });
    }
    let model = questionnaires::save_questionnaire(&mut c, template).unwrap();
    let values = [
        json!("Texto de teste"),
        json!("A"),
        json!(["A", "B"]),
        json!(0),
        json!(false),
    ];
    let answers = model
        .questions
        .iter()
        .zip(values)
        .map(|(q, value)| questionnaires::Answer {
            question_id: q.id.unwrap(),
            value,
        })
        .collect();
    questionnaires::answer_questionnaire(&mut c, model.id.unwrap(), 1, answers).unwrap();
    let mut preferences = support::Preferences::default();
    preferences.duration_seconds = 15;
    preferences.visualization.resolution = 450;
    support::save_preferences(&c, preferences).unwrap();
    support::add_log(&c, "info", "workflow", "Operações de teste concluídas.").unwrap();
    let text = serde_json::to_string(&backup::export_backup(&c, None).unwrap()).unwrap();
    let mut restored = Connection::open_in_memory().unwrap();
    restored.execute_batch("PRAGMA foreign_keys=ON").unwrap();
    db::migrate(&restored).unwrap();
    let file = backup::parse_backup(&restored, &text).unwrap();
    backup::restore_backup(&mut restored, &file).unwrap();
    let exams = exams::list_exams(&restored, None).unwrap();
    assert_eq!(exams.len(), 2);
    assert!(exams.iter().all(|e| e.patient_id == 1));
    assert_eq!(
        exams::get_exam(&restored, exams[0].id)
            .unwrap()
            .matrix
            .len(),
        225
    );
    assert_eq!(
        agenda::list_appointments(&restored, "2026-10-07", "2026-10-07", Some(1)).unwrap()[0]
            .status,
        "confirmed"
    );
    let history = questionnaires::list_sessions(&restored, 1).unwrap();
    assert_eq!(history[0].answers[3].value, json!(0));
    assert_eq!(history[0].answers[4].value, json!(false));
    assert_eq!(history[0].answers.len(), 5);
    assert_eq!(
        support::get_preferences(&restored)
            .unwrap()
            .visualization
            .resolution,
        450
    );
    assert_eq!(
        support::get_preferences(&restored)
            .unwrap()
            .duration_seconds,
        15
    );
}
