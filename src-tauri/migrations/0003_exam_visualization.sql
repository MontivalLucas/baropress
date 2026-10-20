-- Mantém as configurações completas sem alterar exames existentes.
ALTER TABLE exams ADD COLUMN visualization_settings_json TEXT;
