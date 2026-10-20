ALTER TABLE questionnaire_questions ADD COLUMN group_name TEXT NOT NULL DEFAULT 'Geral';
CREATE TABLE questionnaire_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE RESTRICT,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  snapshot_json TEXT NOT NULL, answers_json TEXT NOT NULL,
  answered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_questionnaire_sessions_patient ON questionnaire_sessions(patient_id, answered_at);
ALTER TABLE questionnaire_answers ADD COLUMN session_id INTEGER REFERENCES questionnaire_sessions(id) ON DELETE CASCADE;
