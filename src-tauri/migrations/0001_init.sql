CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('admin','professional','assistant')),
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, document TEXT, phone TEXT, email TEXT, address TEXT, city TEXT, state TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE professionals (
  id INTEGER PRIMARY KEY AUTOINCREMENT, clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL, name TEXT NOT NULL, email TEXT, phone TEXT,
  profession TEXT, registration TEXT, active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, social_name TEXT, birth_date TEXT, sex TEXT, cpf TEXT, phone TEXT, email TEXT,
  address TEXT, profession TEXT, height REAL, weight REAL, shoe_size REAL, observations TEXT, archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_cpf ON patients(cpf);
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL, clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
  date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT, type TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','done','cancelled')), notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE TABLE questionnaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE questionnaire_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE, question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','single','multi','number','yesno')), options TEXT, required INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, order_index INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE questionnaire_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE, question_id INTEGER NOT NULL REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  answer TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL, clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'static' CHECK (type IN ('static','dynamic')),
  source TEXT NOT NULL CHECK (source IN ('REAL','SIMULATION')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','acquiring','completed','discarded')),
  started_at TEXT, finished_at TEXT, duration REAL, acquisition_frequency REAL, sensor_rows INTEGER NOT NULL DEFAULT 15, sensor_columns INTEGER NOT NULL DEFAULT 15,
  threshold REAL, vmax REAL, gamma REAL, baseline_data BLOB, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_exams_patient ON exams(patient_id, started_at);
-- matrix_data: 225 x uint16 little-endian (450 bytes) por frame, dados BRUTOS (sem tara/gamma).
CREATE TABLE exam_frames (
  id INTEGER PRIMARY KEY AUTOINCREMENT, exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE, frame_number INTEGER NOT NULL,
  timestamp REAL NOT NULL, matrix_data BLOB NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (exam_id, frame_number)
);
CREATE TABLE exam_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT, exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE, frame_id INTEGER REFERENCES exam_frames(id) ON DELETE CASCADE,
  left_pressure REAL, right_pressure REAL, left_percentage REAL, right_percentage REAL, max_pressure REAL, average_pressure REAL,
  contact_area_left REAL, contact_area_right REAL, cop_x REAL, cop_y REAL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_metrics_exam ON exam_metrics(exam_id);
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT, exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE, type TEXT NOT NULL DEFAULT 'standard',
  file_path TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error')), category TEXT NOT NULL, message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
