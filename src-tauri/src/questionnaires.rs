use crate::AppDb;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub id: Option<i64>,
    pub group_name: String,
    pub question: String,
    pub r#type: String,
    pub options: Vec<String>,
    pub required: bool,
    pub active: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Questionnaire {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub active: bool,
    pub questions: Vec<Question>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Answer {
    pub question_id: i64,
    pub value: Value,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionnaireSession {
    pub id: i64,
    pub patient_id: i64,
    pub patient_name: String,
    pub answered_at: String,
    pub questionnaire: Questionnaire,
    pub answers: Vec<Answer>,
}

pub fn get_questionnaire(c: &Connection, id: i64) -> Result<Questionnaire, String> {
    let mut item = c
        .query_row(
            "SELECT id,name,description,active FROM questionnaires WHERE id=?1",
            [id],
            |r| {
                Ok(Questionnaire {
                    id: Some(r.get(0)?),
                    name: r.get(1)?,
                    description: r.get(2)?,
                    active: r.get(3)?,
                    questions: vec![],
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or("Questionário não encontrado.")?;
    let mut q=c.prepare("SELECT id,group_name,question,type,options,required,active FROM questionnaire_questions WHERE questionnaire_id=?1 ORDER BY order_index,id").map_err(|e|e.to_string())?;
    let rows = q
        .query_map([id], |r| {
            let options: Option<String> = r.get(4)?;
            Ok(Question {
                id: Some(r.get(0)?),
                group_name: r.get(1)?,
                question: r.get(2)?,
                r#type: r.get(3)?,
                options: options
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or_default(),
                required: r.get(5)?,
                active: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    item.questions = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(item)
}
fn validate_questionnaire(data: &Questionnaire) -> Result<(), String> {
    if data.name.trim().is_empty()
        || data.name.len() > 120
        || data.questions.is_empty()
        || data.questions.len() > 200
        || data.description.as_ref().is_some_and(|s| s.len() > 5000)
    {
        return Err("Informe um nome e de 1 a 200 perguntas.".into());
    }
    let mut seen = HashSet::new();
    for q in &data.questions {
        if q.id.is_some_and(|id| !seen.insert(id)) {
            return Err("Pergunta duplicada.".into());
        }
        if q.question.trim().is_empty()
            || q.question.len() > 2000
            || q.group_name.trim().is_empty()
            || q.group_name.len() > 120
            || !["text", "single", "multi", "number", "yesno"].contains(&q.r#type.as_str())
        {
            return Err("Pergunta, grupo ou tipo inválido.".into());
        }
        if ["single", "multi"].contains(&q.r#type.as_str())
            && (q.options.len() < 2
                || q.options.len() > 50
                || q.options
                    .iter()
                    .any(|s| s.trim().is_empty() || s.len() > 500)
                || q.options
                    .iter()
                    .map(|s| s.trim())
                    .collect::<HashSet<_>>()
                    .len()
                    != q.options.len())
        {
            return Err("Seleções precisam de 2 a 50 opções distintas e preenchidas.".into());
        }
    }
    Ok(())
}

pub fn save_questionnaire(
    c: &mut Connection,
    data: Questionnaire,
) -> Result<Questionnaire, String> {
    validate_questionnaire(&data)?;
    let tx = c.transaction().map_err(|e| e.to_string())?;
    let result = write_questionnaire(&tx, &data)?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(result)
}

fn write_questionnaire(tx: &Connection, data: &Questionnaire) -> Result<Questionnaire, String> {
    let id = if let Some(id) = data.id {
        if tx
            .execute(
                "UPDATE questionnaires SET name=?1,description=?2,active=?3 WHERE id=?4",
                params![data.name.trim(), data.description, data.active, id],
            )
            .map_err(|e| e.to_string())?
            == 0
        {
            return Err("Questionário não encontrado.".into());
        }
        id
    } else {
        tx.execute(
            "INSERT INTO questionnaires(name,description,active) VALUES(?1,?2,?3)",
            params![data.name.trim(), data.description, data.active],
        )
        .map_err(|e| e.to_string())?;
        tx.last_insert_rowid()
    };
    tx.execute(
        "UPDATE questionnaire_questions SET active=0 WHERE questionnaire_id=?1",
        [id],
    )
    .map_err(|e| e.to_string())?;
    for (order, q) in data.questions.iter().enumerate() {
        let options =
            serde_json::to_string(&q.options.iter().map(|s| s.trim()).collect::<Vec<_>>())
                .map_err(|e| e.to_string())?;
        if let Some(qid) = q.id {
            if tx.execute("UPDATE questionnaire_questions SET group_name=?1,question=?2,type=?3,options=?4,required=?5,active=?6,order_index=?7 WHERE id=?8 AND questionnaire_id=?9",params![q.group_name.trim(),q.question.trim(),q.r#type,options,q.required,q.active,order as i64,qid,id]).map_err(|e|e.to_string())?==0 {return Err("Pergunta não pertence ao questionário.".into());}
        } else {
            tx.execute("INSERT INTO questionnaire_questions(questionnaire_id,group_name,question,type,options,required,active,order_index) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)",params![id,q.group_name.trim(),q.question.trim(),q.r#type,options,q.required,q.active,order as i64]).map_err(|e|e.to_string())?;
        }
    }
    get_questionnaire(tx, id)
}

const BUILTIN_ANAMNESE: &str =
    include_str!("../../docs/questionnaires/anamnese-baropodometrica.json");
const BUILTIN_ANAMNESE_KEY: &str = "app.builtinQuestionnaire.anamnese-baropodometrica-v1";

/// Inclui o modelo distribuído uma vez, sem sobrescrever personalizações.
pub fn ensure_builtin_questionnaires(c: &mut Connection) -> Result<(), String> {
    let registered: Option<String> = c
        .query_row(
            "SELECT value FROM settings WHERE key=?1",
            [BUILTIN_ANAMNESE_KEY],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if let Some(id) = registered.and_then(|value| value.parse::<i64>().ok()) {
        let exists: bool = c
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM questionnaires WHERE id=?1)",
                [id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if exists {
            return Ok(());
        }
    }
    let source: Questionnaire = serde_json::from_str(BUILTIN_ANAMNESE)
        .map_err(|e| format!("Modelo de anamnese inválido: {e}"))?;
    validate_questionnaire(&source)?;
    let tx = c.transaction().map_err(|e| e.to_string())?;
    // Um modelo já incluído manualmente ou restaurado de backup é preservado.
    let existing: Option<i64> = tx
        .query_row(
            "SELECT id FROM questionnaires WHERE name=?1 ORDER BY id LIMIT 1",
            [source.name.trim()],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let id = match existing {
        Some(id) => id,
        None => write_questionnaire(&tx, &source)?
            .id
            .ok_or("Modelo sem identificador.")?,
    };
    tx.execute(
        "INSERT INTO settings(key,value) VALUES(?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![BUILTIN_ANAMNESE_KEY, id.to_string()],
    ).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
fn validate_answers(q: &Questionnaire, answers: &[Answer]) -> Result<(), String> {
    let active: Vec<_> = q.questions.iter().filter(|p| p.active).collect();
    if !q.active || active.is_empty() {
        return Err("Questionário inativo ou sem perguntas ativas.".into());
    }
    let mut seen = HashSet::new();
    for a in answers {
        if !seen.insert(a.question_id) || !active.iter().any(|p| p.id == Some(a.question_id)) {
            return Err("Resposta duplicada ou pergunta inválida.".into());
        }
    }
    for p in active {
        let value = answers
            .iter()
            .find(|a| Some(a.question_id) == p.id)
            .map(|a| &a.value);
        let empty = value.is_none_or(|v| {
            v.is_null()
                || v.as_str().is_some_and(|s| s.trim().is_empty())
                || v.as_array().is_some_and(|a| a.is_empty())
        });
        if empty {
            if p.required {
                return Err(format!("Responda a pergunta obrigatória: {}", p.question));
            }
            continue;
        }
        let v = value.unwrap();
        let valid = match p.r#type.as_str() {
            "text" => v.as_str().is_some_and(|s| s.len() <= 10000),
            "number" => v.as_f64().is_some_and(|n| n.is_finite()),
            "yesno" => v.is_boolean(),
            "single" => v.as_str().is_some_and(|s| p.options.iter().any(|o| o == s)),
            "multi" => v.as_array().is_some_and(|a| {
                a.len() <= p.options.len()
                    && a.iter()
                        .all(|v| v.as_str().is_some_and(|s| p.options.iter().any(|o| o == s)))
                    && a.iter()
                        .map(|v| v.as_str().unwrap_or(""))
                        .collect::<HashSet<_>>()
                        .len()
                        == a.len()
            }),
            _ => false,
        };
        if !valid {
            return Err(format!("Resposta inválida: {}", p.question));
        }
    }
    Ok(())
}
pub fn list_sessions(c: &Connection, patient_id: i64) -> Result<Vec<QuestionnaireSession>, String> {
    let mut q=c.prepare("SELECT s.id,s.patient_id,p.name,s.answered_at,s.snapshot_json,s.answers_json FROM questionnaire_sessions s JOIN patients p ON p.id=s.patient_id WHERE s.patient_id=?1 ORDER BY s.answered_at DESC,s.id DESC").map_err(|e|e.to_string())?;
    let rows = q
        .query_map([patient_id], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, i64>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, String>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut result = vec![];
    for row in rows {
        let (id, patient_id, patient_name, answered_at, snapshot, answers) =
            row.map_err(|e| e.to_string())?;
        result.push(QuestionnaireSession {
            id,
            patient_id,
            patient_name,
            answered_at,
            questionnaire: serde_json::from_str(&snapshot)
                .map_err(|e| format!("Questionário histórico inválido: {e}"))?,
            answers: serde_json::from_str(&answers)
                .map_err(|e| format!("Respostas históricas inválidas: {e}"))?,
        });
    }
    Ok(result)
}
pub fn answer_questionnaire(
    c: &mut Connection,
    questionnaire_id: i64,
    patient_id: i64,
    answers: Vec<Answer>,
) -> Result<QuestionnaireSession, String> {
    let tx = c.transaction().map_err(|e| e.to_string())?;
    let q = get_questionnaire(&tx, questionnaire_id)?;
    validate_answers(&q, &answers)?;
    let exists: bool = tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM patients WHERE id=?1 AND archived=0)",
            [patient_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !exists {
        return Err("Paciente não encontrado ou arquivado.".into());
    }
    let snapshot = serde_json::to_string(&q).map_err(|e| e.to_string())?;
    let encoded = serde_json::to_string(&answers).map_err(|e| e.to_string())?;
    tx.execute("INSERT INTO questionnaire_sessions(questionnaire_id,patient_id,snapshot_json,answers_json) VALUES(?1,?2,?3,?4)",params![questionnaire_id,patient_id,snapshot,encoded]).map_err(|e|e.to_string())?;
    let id = tx.last_insert_rowid();
    for a in &answers {
        tx.execute("INSERT INTO questionnaire_answers(questionnaire_id,patient_id,question_id,answer,session_id) VALUES(?1,?2,?3,?4,?5)",params![questionnaire_id,patient_id,a.question_id,serde_json::to_string(&a.value).map_err(|e|e.to_string())?,id]).map_err(|e|e.to_string())?;
    }
    let result = list_sessions(&tx, patient_id)?
        .into_iter()
        .find(|s| s.id == id)
        .ok_or("Resposta não encontrada.")?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(result)
}
#[tauri::command]
pub fn questionnaires_list(db: State<AppDb>) -> Result<Vec<Questionnaire>, String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    ensure_builtin_questionnaires(&mut c)?;
    let mut q = c
        .prepare("SELECT id FROM questionnaires ORDER BY active DESC,name")
        .map_err(|e| e.to_string())?;
    let ids = q
        .query_map([], |r| r.get::<_, i64>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    ids.into_iter()
        .map(|id| get_questionnaire(&c, id))
        .collect()
}
#[tauri::command]
pub fn questionnaires_save(db: State<AppDb>, data: Questionnaire) -> Result<Questionnaire, String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    save_questionnaire(&mut c, data)
}
#[tauri::command]
pub fn questionnaires_answer(
    db: State<AppDb>,
    questionnaire_id: i64,
    patient_id: i64,
    answers: Vec<Answer>,
) -> Result<QuestionnaireSession, String> {
    let mut c = db.0.lock().map_err(|_| "Banco indisponível")?;
    answer_questionnaire(&mut c, questionnaire_id, patient_id, answers)
}
#[tauri::command]
pub fn questionnaires_history(
    db: State<AppDb>,
    patient_id: i64,
) -> Result<Vec<QuestionnaireSession>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    list_sessions(&c, patient_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn setup() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("PRAGMA foreign_keys=ON").unwrap();
        crate::db::migrate(&c).unwrap();
        c.execute("INSERT INTO patients(id,name) VALUES(1,'Teste')", [])
            .unwrap();
        c
    }
    fn template() -> Questionnaire {
        Questionnaire {
            id: None,
            name: "Anamnese".into(),
            description: None,
            active: true,
            questions: vec![
                Question {
                    id: None,
                    group_name: "Dados".into(),
                    question: "Queixa".into(),
                    r#type: "text".into(),
                    options: vec![],
                    required: true,
                    active: true,
                },
                Question {
                    id: None,
                    group_name: "Dados".into(),
                    question: "Dor?".into(),
                    r#type: "yesno".into(),
                    options: vec![],
                    required: false,
                    active: true,
                },
            ],
        }
    }
    #[test]
    fn bundled_anamnesis_is_complete_and_registered_once() {
        let mut c = setup();
        ensure_builtin_questionnaires(&mut c).unwrap();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let id: i64 = c
            .query_row("SELECT id FROM questionnaires", [], |r| r.get(0))
            .unwrap();
        let mut saved = get_questionnaire(&c, id).unwrap();
        assert_eq!(saved.questions.len(), 40);
        assert_eq!(
            saved
                .questions
                .iter()
                .map(|q| &q.group_name)
                .collect::<HashSet<_>>()
                .len(),
            7
        );
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaires", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert!(saved.questions.iter().all(|q| q.id.is_some()));
        saved.id = None;
        for q in &mut saved.questions {
            q.id = None;
        }
        assert_eq!(
            serde_json::to_value(saved).unwrap(),
            serde_json::from_str::<Value>(BUILTIN_ANAMNESE).unwrap()
        );
    }
    #[test]
    fn builtin_customization_and_inactive_state_survive_registration() {
        let mut c = setup();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let id: i64 = c
            .query_row("SELECT id FROM questionnaires", [], |r| r.get(0))
            .unwrap();
        let mut edited = get_questionnaire(&c, id).unwrap();
        edited.name = "Anamnese personalizada".into();
        edited.active = false;
        edited.questions[0].question = "Pergunta personalizada".into();
        save_questionnaire(&mut c, edited).unwrap();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let saved = get_questionnaire(&c, id).unwrap();
        assert_eq!(saved.name, "Anamnese personalizada");
        assert!(!saved.active);
        assert_eq!(saved.questions[0].question, "Pergunta personalizada");
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaires", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    #[test]
    fn manually_imported_template_is_adopted_without_overwriting() {
        let mut c = setup();
        let source: Questionnaire = serde_json::from_str(BUILTIN_ANAMNESE).unwrap();
        let mut custom = template();
        custom.name = source.name;
        custom.description = Some("Revisão local preservada".into());
        let existing = save_questionnaire(&mut c, custom).unwrap();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let saved = get_questionnaire(&c, existing.id.unwrap()).unwrap();
        assert_eq!(
            saved.description.as_deref(),
            Some("Revisão local preservada")
        );
        assert_eq!(saved.questions.len(), 2);
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaires", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    #[test]
    fn builtin_registration_rolls_back_if_marker_write_fails() {
        let mut c = setup();
        save_questionnaire(&mut c, template()).unwrap();
        c.execute_batch("CREATE TRIGGER reject_builtin_marker BEFORE INSERT ON settings WHEN NEW.key='app.builtinQuestionnaire.anamnese-baropodometrica-v1' BEGIN SELECT RAISE(ABORT,'Falha simulada'); END;").unwrap();
        assert!(ensure_builtin_questionnaires(&mut c).is_err());
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaires", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaire_questions", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            2
        );
        c.execute_batch("DROP TRIGGER reject_builtin_marker")
            .unwrap();
        ensure_builtin_questionnaires(&mut c).unwrap();
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM questionnaires", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            2
        );
    }
    #[test]
    fn bundled_answers_preserve_optional_fields_and_historical_snapshot() {
        let mut c = setup();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let id: i64 = c
            .query_row("SELECT id FROM questionnaires", [], |r| r.get(0))
            .unwrap();
        let mut model = get_questionnaire(&c, id).unwrap();
        let answers = model
            .questions
            .iter()
            .filter(|q| q.required)
            .map(|q| Answer {
                question_id: q.id.unwrap(),
                value: if q.r#type == "single" {
                    Value::String(q.options[0].clone())
                } else {
                    Value::String("Relato sintético".into())
                },
            })
            .collect::<Vec<_>>();
        let count = answers.len();
        answer_questionnaire(&mut c, id, 1, answers).unwrap();
        model.questions[0].question = "Pergunta editada".into();
        save_questionnaire(&mut c, model).unwrap();
        ensure_builtin_questionnaires(&mut c).unwrap();
        let sessions = list_sessions(&c, 1).unwrap();
        assert_eq!(sessions[0].questionnaire.questions.len(), 40);
        assert_eq!(
            sessions[0].questionnaire.questions[0].question,
            "Qual é o principal motivo da avaliação?"
        );
        assert_eq!(sessions[0].answers.len(), count);
        assert!(sessions[0].answers.len() < 40);
        assert!(!sessions[0].questionnaire.questions[9].required);
    }
    #[test]
    fn snapshot_survives_template_edit() {
        let mut c = setup();
        let mut q = save_questionnaire(&mut c, template()).unwrap();
        let answers = vec![
            Answer {
                question_id: q.questions[0].id.unwrap(),
                value: Value::String("Resposta de teste".into()),
            },
            Answer {
                question_id: q.questions[1].id.unwrap(),
                value: Value::Bool(false),
            },
        ];
        answer_questionnaire(&mut c, q.id.unwrap(), 1, answers).unwrap();
        q.name = "Modelo alterado".into();
        q.questions[0].question = "Outra pergunta".into();
        save_questionnaire(&mut c, q).unwrap();
        let old = list_sessions(&c, 1).unwrap();
        assert_eq!(old[0].questionnaire.name, "Anamnese");
        assert_eq!(old[0].questionnaire.questions[0].question, "Queixa");
        assert_eq!(old[0].answers[1].value, Value::Bool(false));
    }
    #[test]
    fn rejects_missing_required_and_wrong_type() {
        let mut c = setup();
        let q = save_questionnaire(&mut c, template()).unwrap();
        assert!(answer_questionnaire(&mut c, q.id.unwrap(), 1, vec![])
            .unwrap_err()
            .contains("obrigatória"));
        let a = vec![
            Answer {
                question_id: q.questions[0].id.unwrap(),
                value: Value::String("Texto".into()),
            },
            Answer {
                question_id: q.questions[1].id.unwrap(),
                value: Value::String("talvez".into()),
            },
        ];
        assert!(answer_questionnaire(&mut c, q.id.unwrap(), 1, a).is_err());
        assert!(list_sessions(&c, 1).unwrap().is_empty());
    }
    #[test]
    fn rejects_duplicate_options_and_foreign_question() {
        let mut c = setup();
        let mut q = template();
        q.questions[0].r#type = "single".into();
        q.questions[0].options = vec!["A".into(), "A".into()];
        assert!(save_questionnaire(&mut c, q).is_err());
        let q = save_questionnaire(&mut c, template()).unwrap();
        assert!(answer_questionnaire(
            &mut c,
            q.id.unwrap(),
            1,
            vec![Answer {
                question_id: 999,
                value: Value::Bool(true)
            }]
        )
        .is_err());
    }
    #[test]
    fn inactive_questions_are_not_required() {
        let mut c = setup();
        let mut q = template();
        q.questions[0].active = false;
        let q = save_questionnaire(&mut c, q).unwrap();
        answer_questionnaire(&mut c, q.id.unwrap(), 1, vec![]).unwrap();
        assert_eq!(list_sessions(&c, 1).unwrap().len(), 1);
    }
}
