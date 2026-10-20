-- Dados históricos somente para novos exames. Não inferir dados de registros antigos.
ALTER TABLE exams ADD COLUMN patient_snapshot_json TEXT;
