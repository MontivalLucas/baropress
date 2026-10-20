CREATE TABLE calibration_mats (
 id TEXT PRIMARY KEY, spec_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE calibration_trials (
 id TEXT PRIMARY KEY, mat_id TEXT NOT NULL REFERENCES calibration_mats(id), source TEXT NOT NULL CHECK(source IN ('REAL','SIMULATION')),
 state TEXT NOT NULL CHECK(state IN ('CAPTURING','REVIEW','ACCEPTED','REJECTED','INTERRUPTED')),
 spec_json TEXT NOT NULL, summary_json TEXT, reason TEXT NOT NULL DEFAULT '', operator_id INTEGER, imported_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE calibration_frame_chunks (
 trial_id TEXT NOT NULL REFERENCES calibration_trials(id), ordinal INTEGER NOT NULL CHECK(ordinal>=0), frames_json TEXT NOT NULL, frame_count INTEGER NOT NULL CHECK(frame_count BETWEEN 1 AND 60),
 PRIMARY KEY(trial_id,ordinal)
);
CREATE TABLE calibration_profiles (
 id TEXT PRIMARY KEY, mat_id TEXT NOT NULL REFERENCES calibration_mats(id), profile_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE calibration_validations (
 id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES calibration_profiles(id), result_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE calibration_active (
 mat_id TEXT PRIMARY KEY REFERENCES calibration_mats(id), profile_id TEXT UNIQUE NOT NULL REFERENCES calibration_profiles(id)
);
CREATE INDEX calibration_trials_mat ON calibration_trials(mat_id,created_at);
ALTER TABLE exams ADD COLUMN physical_result_json TEXT;
CREATE TABLE exam_raw_chunks (
 id INTEGER PRIMARY KEY AUTOINCREMENT, exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
 ordinal INTEGER NOT NULL, frames_json TEXT NOT NULL, UNIQUE(exam_id,ordinal)
);
