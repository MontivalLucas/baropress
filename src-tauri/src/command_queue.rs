use std::sync::mpsc::{self, Sender};
use std::thread;

pub fn is_serial(command: &str) -> bool {
    matches!(
        command,
        "acquisition_list_ports"
            | "acquisition_connect"
            | "acquisition_disconnect"
            | "acquisition_start"
            | "acquisition_stop"
            | "acquisition_get_status"
    )
}

/// A mesma ordem dos comandos síncronos, sem executar banco/serial na janela.
pub fn start<T: Send + 'static>(handle: impl Fn(T) + Send + 'static) -> std::io::Result<Sender<T>> {
    let (sender, receiver) = mpsc::channel();
    thread::Builder::new()
        .name("baropress-commands".into())
        .spawn(move || {
            for command in receiver {
                handle(command);
            }
        })?;
    Ok(sender)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn blocked_serial_does_not_delay_database_queue() {
        let (release_tx, release_rx) = mpsc::channel::<()>();
        let (serial_tx, serial_rx) = mpsc::channel();
        let serial = start(move |_: ()| {
            serial_tx.send(()).unwrap();
            release_rx.recv().unwrap();
        })
        .unwrap();
        let (done_tx, done_rx) = mpsc::channel();
        let database = start(move |id: u8| {
            done_tx.send(id).unwrap();
        })
        .unwrap();
        serial.send(()).unwrap();
        serial_rx.recv_timeout(Duration::from_secs(2)).unwrap();
        database.send(7).unwrap();
        assert_eq!(done_rx.recv_timeout(Duration::from_secs(2)).unwrap(), 7);
        release_tx.send(()).unwrap();
        assert!(is_serial("acquisition_connect"));
        assert!(!is_serial("exams_create"));
        assert!(!is_serial("backups_import"));
        assert!(!is_serial("auth_logout"));
    }

    #[test]
    fn slow_command_does_not_block_the_sender_or_reorder_commands() {
        let caller = thread::current().id();
        let (entered_tx, entered_rx) = mpsc::channel();
        let (release_tx, release_rx) = mpsc::channel();
        let (results_tx, results_rx) = mpsc::channel();
        let commands = start(move |id| {
            if id == 1 {
                entered_tx.send(thread::current().id()).unwrap();
                release_rx.recv().unwrap();
            }
            results_tx.send(id).unwrap();
        })
        .unwrap();
        commands.send(1).unwrap();
        assert_ne!(
            entered_rx.recv_timeout(Duration::from_secs(2)).unwrap(),
            caller
        );
        commands.send(2).unwrap();
        commands.send(3).unwrap();
        assert!(results_rx.try_recv().is_err());
        release_tx.send(()).unwrap();
        for expected in 1..=3 {
            assert_eq!(
                results_rx.recv_timeout(Duration::from_secs(2)).unwrap(),
                expected
            );
        }
    }

    #[test]
    fn dropping_the_sender_finishes_already_queued_commands() {
        let (results_tx, results_rx) = mpsc::channel();
        let commands = start(move |id| {
            results_tx.send(id).unwrap();
        })
        .unwrap();
        for id in 0..20 {
            commands.send(id).unwrap();
        }
        drop(commands);
        assert_eq!(
            results_rx.iter().collect::<Vec<_>>(),
            (0..20).collect::<Vec<_>>()
        );
    }
}
