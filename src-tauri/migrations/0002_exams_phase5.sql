-- Migração da Fase 5: Campos consolidados para exames estáticos baropodométricos
ALTER TABLE exams ADD COLUMN smoothing REAL DEFAULT 0.35;
ALTER TABLE exams ADD COLUMN tare_applied INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN frame_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN max_pressure REAL;
ALTER TABLE exams ADD COLUMN mean_pressure REAL;
ALTER TABLE exams ADD COLUMN contact_area_percent REAL;
ALTER TABLE exams ADD COLUMN contact_sensors INTEGER;
ALTER TABLE exams ADD COLUMN cop_x REAL;
ALTER TABLE exams ADD COLUMN cop_y REAL;
ALTER TABLE exams ADD COLUMN left_load REAL;
ALTER TABLE exams ADD COLUMN right_load REAL;
ALTER TABLE exams ADD COLUMN left_percent REAL;
ALTER TABLE exams ADD COLUMN right_percent REAL;
ALTER TABLE exams ADD COLUMN matrix_json TEXT;

CREATE INDEX IF NOT EXISTS idx_exams_started ON exams(started_at DESC);
