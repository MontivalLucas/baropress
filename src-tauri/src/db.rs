use rusqlite::Connection;
use std::path::Path;

/// Migrations em ordem. O índice+1 é gravado em PRAGMA user_version após aplicar.
const MIGRATIONS: &[&str] = &[
    include_str!("../migrations/0001_init.sql"),
    include_str!("../migrations/0002_exams_phase5.sql"),
    include_str!("../migrations/0003_exam_visualization.sql"),
    include_str!("../migrations/0004_exam_trajectory.sql"),
    include_str!("../migrations/0005_questionnaire_sessions.sql"),
    include_str!("../migrations/0006_calibration.sql"),
    include_str!("../migrations/0007_exam_patient_snapshot.sql"),
    include_str!("../migrations/0008_exam_analysis.sql"),
    include_str!("../migrations/0009_user_access.sql"),
];
pub const SCHEMA_VERSION: usize = MIGRATIONS.len();
pub fn copy_legacy(source: &Path, destination: &Path) -> rusqlite::Result<()> {
    let c = Connection::open_with_flags(source, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    c.backup(rusqlite::DatabaseName::Main, destination, None)
}

pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    let existed = path.exists();
    let conn = Connection::open(path)?;
    let current: usize = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if current > SCHEMA_VERSION {
        return Err(rusqlite::Error::InvalidParameterName(
            "Banco de uma versão mais recente; atualize o aplicativo.".into(),
        ));
    }
    if existed && current < SCHEMA_VERSION {
        // SQLite produces a consistent snapshot, including any WAL, before migrations.
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let snapshot =
            path.with_file_name(format!("baropress-pre-migration-v{current}-{stamp}.db"));
        conn.execute("VACUUM INTO ?1", [snapshot.to_string_lossy().as_ref()])?;
    }
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
    migrate(&conn)?;
    Ok(conn)
}

pub fn migrate(conn: &Connection) -> rusqlite::Result<()> {
    let current: usize = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if current > SCHEMA_VERSION {
        return Err(rusqlite::Error::InvalidParameterName(
            "Banco de uma versão mais recente; atualize o aplicativo.".into(),
        ));
    }
    for (i, sql) in MIGRATIONS.iter().enumerate().skip(current) {
        let tx = conn.unchecked_transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", i + 1)?;
        tx.commit()?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn refuses_newer_schema_without_modifying_data() {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("PRAGMA user_version=999; CREATE TABLE sentinel(value TEXT); INSERT INTO sentinel VALUES('preservado');").unwrap();
        assert!(migrate(&c).is_err());
        assert_eq!(
            c.query_row("SELECT value FROM sentinel", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "preservado"
        );
    }
    #[test]
    fn legacy_copy_includes_live_wal_rows() {
        let dir = std::env::temp_dir().join(format!(
            "baropress-legacy-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&dir).unwrap();
        let source = dir.join("old.db");
        let target = dir.join("new.db");
        {
            let c = Connection::open(&source).unwrap();
            c.execute_batch("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE sentinel(value TEXT); INSERT INTO sentinel VALUES('teste WAL');").unwrap();
            copy_legacy(&source, &target).unwrap();
            let copied = Connection::open(&target).unwrap();
            assert_eq!(
                copied
                    .query_row("SELECT value FROM sentinel", [], |r| r.get::<_, String>(0))
                    .unwrap(),
                "teste WAL"
            );
        }
        for entry in std::fs::read_dir(&dir).unwrap() {
            std::fs::remove_file(entry.unwrap().path()).unwrap();
        }
        std::fs::remove_dir(dir).unwrap();
    }
    #[test]
    fn existing_database_gets_consistent_snapshot_before_upgrade() {
        let dir = std::env::temp_dir().join(format!(
            "baropress-migration-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&dir).unwrap();
        let path = dir.join("baropress.db");
        {
            let c = Connection::open(&path).unwrap();
            c.execute_batch(include_str!("../migrations/0001_init.sql"))
                .unwrap();
            c.execute_batch(
                "PRAGMA user_version=1; INSERT INTO patients(name) VALUES('Teste isolado');",
            )
            .unwrap();
        }
        let c = open(&path).unwrap();
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM patients", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        drop(c);
        let copies = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().path())
            .filter(|p| {
                p.file_name()
                    .unwrap()
                    .to_string_lossy()
                    .starts_with("baropress-pre-migration")
            })
            .collect::<Vec<_>>();
        assert_eq!(copies.len(), 1);
        {
            let old = Connection::open(&copies[0]).unwrap();
            assert_eq!(
                old.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0))
                    .unwrap(),
                1
            );
        }
        for entry in std::fs::read_dir(&dir).unwrap() {
            std::fs::remove_file(entry.unwrap().path()).unwrap();
        }
        std::fs::remove_dir(dir).unwrap();
    }
    #[test]
    fn migrations_apply_on_empty_db() {
        let c = Connection::open_in_memory().unwrap();
        migrate(&c).unwrap();
        let n: i64 = c.query_row("SELECT COUNT(*) FROM sqlite_master WHERE name IN ('patients','exams','exam_frames','exam_metrics')", [], |r| r.get(0)).unwrap();
        assert_eq!(n, 4);
        let version: usize = c
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(version, MIGRATIONS.len());

        // Verifica colunas adicionadas na migração 2
        let has_matrix_json: bool = c
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('exams') WHERE name = 'matrix_json'",
                [],
                |r| r.get::<_, i64>(0),
            )
            .unwrap()
            > 0;
        assert!(has_matrix_json);

        migrate(&c).unwrap(); // idempotente
    }

    #[test]
    fn migration_preserves_existing_exams() {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch(include_str!("../migrations/0001_init.sql"))
            .unwrap();
        c.execute_batch(include_str!("../migrations/0002_exams_phase5.sql"))
            .unwrap();
        c.execute_batch(
            "PRAGMA user_version = 2;
            INSERT INTO patients (id, name) VALUES (1, 'Paciente anterior');
            INSERT INTO exams (patient_id, type, source, status, gamma, matrix_json)
            VALUES (1, 'static', 'REAL', 'completed', 2.2, '[100,200]');",
        )
        .unwrap();
        migrate(&c).unwrap();
        let (gamma, matrix, settings): (f64, String, Option<String>) = c
            .query_row(
                "SELECT gamma, matrix_json, visualization_settings_json FROM exams",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        assert_eq!(gamma, 2.2);
        assert_eq!(matrix, "[100,200]");
        assert!(settings.is_none());
        migrate(&c).unwrap();
    }
}
