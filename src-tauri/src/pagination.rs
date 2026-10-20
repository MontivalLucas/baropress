pub fn bounds(limit: Option<i64>, offset: Option<i64>) -> Result<(i64, i64), String> {
    if limit.is_some_and(|value| !(1..=500).contains(&value))
        || offset.is_some_and(|value| value < 0)
    {
        return Err("Página inválida.".into());
    }
    Ok((limit.unwrap_or(-1), offset.unwrap_or(0)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{db, exams, patients};
    use rusqlite::{params, Connection};

    fn sample_database(count: i64) -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        db::migrate(&conn).unwrap();
        let tx = conn.transaction().unwrap();
        for id in 1..=count {
            tx.execute(
                "INSERT INTO patients(id,name,cpf) VALUES(?1,?2,?3)",
                params![id, format!("Paciente {:05}", id / 3), format!("{id:011}")],
            )
            .unwrap();
            tx.execute("INSERT INTO exams(patient_id,source,status,started_at) VALUES(?1,'SIMULATION','completed','2026-10-07T12:00:00Z')", [id]).unwrap();
        }
        tx.commit().unwrap();
        conn
    }

    #[test]
    fn patient_pages_preserve_order_and_all_matches_without_duplicates() {
        let conn = sample_database(123);
        conn.execute("UPDATE patients SET archived=1 WHERE id=17", [])
            .unwrap();
        for search in [None, Some("Paciente 0001"), Some("00000000003")] {
            let all = patients::list_patients(&conn, search).unwrap();
            let mut paged = Vec::new();
            let mut offset = 0;
            loop {
                let page =
                    patients::list_patients_page(&conn, search, Some(50), Some(offset)).unwrap();
                let more = page.len() == 50;
                paged.extend(page);
                if !more {
                    break;
                }
                offset += 50;
            }
            assert_eq!(
                paged.iter().map(|p| p.id).collect::<Vec<_>>(),
                all.iter().map(|p| p.id).collect::<Vec<_>>()
            );
            assert!(!paged.iter().any(|p| p.id == 17));
        }
    }

    #[test]
    fn exam_pages_preserve_timestamp_ties_filters_and_last_page() {
        let conn = sample_database(123);
        for search in [None, Some("Paciente 0001"), Some("00000000003")] {
            let all = exams::list_exams(&conn, search).unwrap();
            let pages: Vec<_> = (0..3)
                .flat_map(|page| {
                    exams::list_exams_page(&conn, search, Some(50), Some(page * 50)).unwrap()
                })
                .collect();
            assert_eq!(
                pages.iter().map(|e| e.id).collect::<Vec<_>>(),
                all.iter().map(|e| e.id).collect::<Vec<_>>()
            );
        }
        assert!(exams::list_exams_page(&conn, None, Some(50), Some(1000))
            .unwrap()
            .is_empty());
    }

    #[test]
    fn invalid_bounds_do_not_execute_a_query() {
        for limit in [Some(0), Some(-1), Some(501)] {
            assert!(bounds(limit, None).is_err());
        }
        assert!(bounds(Some(50), Some(-1)).is_err());
        assert_eq!(bounds(None, None).unwrap(), (-1, 0));
    }

    #[test]
    #[ignore = "Benchmark sintético explícito, não depende do banco pessoal"]
    fn benchmark_lists_10000_records() {
        use std::time::Instant;
        let conn = sample_database(10_000);
        let start = Instant::now();
        let all_patients = patients::list_patients(&conn, None).unwrap();
        let patients_all_ms = start.elapsed().as_secs_f64() * 1000.0;
        let start = Instant::now();
        let page_patients = patients::list_patients_page(&conn, None, Some(51), Some(0)).unwrap();
        let patients_page_ms = start.elapsed().as_secs_f64() * 1000.0;
        let start = Instant::now();
        let all_exams = exams::list_exams(&conn, None).unwrap();
        let exams_all_ms = start.elapsed().as_secs_f64() * 1000.0;
        let start = Instant::now();
        let page_exams = exams::list_exams_page(&conn, None, Some(51), Some(0)).unwrap();
        let exams_page_ms = start.elapsed().as_secs_f64() * 1000.0;
        let result = serde_json::json!({"syntheticRecords":10000,"patients":{"allMs":patients_all_ms,"pageMs":patients_page_ms,"allBytes":serde_json::to_vec(&all_patients).unwrap().len(),"pageBytes":serde_json::to_vec(&page_patients).unwrap().len()},"exams":{"allMs":exams_all_ms,"pageMs":exams_page_ms,"allBytes":serde_json::to_vec(&all_exams).unwrap().len(),"pageBytes":serde_json::to_vec(&page_exams).unwrap().len()}});
        println!("BAROPRESS_LIST_BENCHMARK={result}");
        assert_eq!(page_patients.len(), 51);
        assert_eq!(page_exams.len(), 51);
    }
}
