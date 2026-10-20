import { useEffect, useState } from "react";
import { api } from "@/services/database/api";
import { Button } from "@/components/ui/controls";
import { useSession } from "@/stores/session";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useNewExamStore } from "@/features/exams/examStore";
import type { BackupPreview, PatientSummary } from "@/types";
import { formatDateTime } from "@/features/patients/patientUtils";
import { backupFileName, downloadTextFile } from "./exportUtils";
import { usePreferencesStore } from "@/stores/preferences";
import { saveCurrentPreferences, waitForPreferencesWrites } from "@/services/usePreferencesSync";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";
export function BackupPage({ onBusyChange }: { onBusyChange: (busy: boolean) => void }) {
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [patientId, setPatientId] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [content, setContent] = useState('');
    const [preview, setPreview] = useState<BackupPreview | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    useUnsavedChanges(false, "", busy);
    const acquiring = useAcquisitionStore(s => s.status.acquiring);
    const stopAcquisition = useAcquisitionStore(s => s.stopAcquisition);
    const resetExam = useNewExamStore(s => s.resetExam);
    const session = useSession();
    const examinationActive = useNewExamStore(s => s.isSaving || s.isStarting || s.step === 'PREPARING' || s.step === 'ACQUIRING');
    useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
    useEffect(() => {
        let live = true;
        api.patients.list().then((p) => {
            if (live)
                setPatients(p);
        }).catch((e) => {
            if (live)
                setError(e.message);
        });
        return () => { live = false; };
    }, []);
    async function exportBackup(individual: boolean) {
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await saveCurrentPreferences();
            const text = await api.backups.export(individual ? patientId : undefined);
            downloadTextFile(text, backupFileName(individual ? patientId : undefined));
            setMessage('Arquivo de backup disponibilizado para salvar no computador.');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function inspect(file: File) {
        setBusy(true);
        setError('');
        setMessage('');
        setConfirmed(false);
        setContent('');
        setPreview(null);
        try {
            if (file.size > 64 * 1024 * 1024)
                throw new Error('Limite de arquivo: 64 MB.');
            const text = await file.text();
            const info = await api.backups.preview(text);
            setContent(text);
            setPreview(info);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function restore() {
        if (!preview || !confirmed || examinationActive || acquiring || busy)
            return;
        setBusy(true);
        setError('');
        usePreferencesStore.setState({ paused: true });
        try {
            await waitForPreferencesWrites();
            const result = await api.backups.import(content, true);
            const notice = `${result.kind === 'full' ? 'Backup completo restaurado. Entre com uma conta do backup.' : 'Paciente importado sem substituir outros prontuários.'} Cópia de segurança: ${result.safetyBackup}`;
            setContent('');
            setPreview(null);
            setConfirmed(false);
            if (result.kind === 'full') {
                resetExam();
                session.setNotice(notice);
                session.setUser(null);
            }
            else {
                setMessage(notice);
                setPatients(await api.patients.list());
            }
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            usePreferencesStore.setState({ paused: false });
            setBusy(false);
        }
    }
    if (session.user?.role !== "admin") return <div className="space-y-3"><h2 className="text-xl font-semibold">Backup e restauração</h2><p className="mt-3 text-mute">Esta operação exige uma conta administradora.</p></div>;
    return <div className="max-w-4xl space-y-5"><header><h2 className="text-xl font-semibold">Backup e restauração</h2><p className="text-sm text-mute">Cópias locais dos prontuários, exames, consultas, questionários e configurações salvas.</p></header>{error && <p role="alert" className="text-danger break-words">{error}</p>}{message && <p role="status" className="text-ok break-words">{message}</p>}
    <section className="bg-surface border border-line rounded-xl p-5 space-y-3"><h3 className="text-lg font-semibold">Exportar backup</h3><p className="text-sm text-mute">O backup completo inclui as contas locais e todos os dados armazenados. O arquivo contém dados pessoais; guarde-o em um local protegido.</p><Button disabled={busy || examinationActive} onClick={() => void exportBackup(false)}>Exportar backup completo</Button><label className="block text-sm">Backup individual<select className="block w-full border border-line rounded-lg bg-surface p-2" disabled={busy} value={patientId} onChange={(e) => setPatientId(Number(e.target.value))}><option value="0">Selecione o paciente</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Button variant="ghost" disabled={busy || !patientId || examinationActive} onClick={() => void exportBackup(true)}>Exportar dados deste paciente</Button></section>
    <section className="bg-surface border border-line rounded-xl p-5 space-y-3"><h3 className="text-lg font-semibold">Importar arquivo</h3><label className="block text-sm">Arquivo de backup BAROPRESS<input type="file" accept=".json,.baropress.json" disabled={busy || examinationActive} className="block mt-2 w-full text-sm" onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file)
                void inspect(file);
        }}/></label>
      {preview && <><div className="border border-line rounded-lg p-3 text-sm space-y-1"><p className="font-semibold">{preview.kind === 'full' ? 'Restauração completa' : 'Importação de um paciente'}</p><p>Gerado em {formatDateTime(preview.generatedAt)}</p>{Object.entries({ patients: 'Pacientes', exams: 'Exames', appointments: 'Consultas', questionnaire_sessions: 'Questionários respondidos', exam_frames: 'Frames armazenados', users: 'Contas locais' }).map(([key, label]) => <p key={key}>{label}: {preview.rowCounts[key] ?? 0}</p>)}</div><p className="text-sm text-warn">{preview.kind === 'full' ? 'A restauração completa substituirá os dados e as contas atuais pelos dados do arquivo e encerrará esta sessão.' : 'A importação individual cria um prontuário novo e remapeia seus vínculos. Um CPF já existente impede a importação.'} Antes de importar, o sistema guarda uma cópia completa dos dados atuais.</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)}/>Conferi o conteúdo e confirmo {preview.kind === 'full' ? 'a substituição dos dados atuais' : 'a importação deste paciente'}.</label></>}
      {acquiring && <div className="flex flex-wrap gap-2 items-center"><p className="text-sm text-warn">Pause a aquisição para importar.</p><Button variant="ghost" disabled={busy || examinationActive} onClick={() => void stopAcquisition()}>Pausar aquisição</Button></div>}
      {examinationActive && <p className="text-sm text-warn">Conclua ou cancele o exame antes de gerenciar backups.</p>}<Button disabled={busy || !preview || !confirmed || examinationActive || acquiring} onClick={() => void restore()}>{busy ? 'Processando...' : preview?.kind === 'patient' ? 'Importar paciente' : 'Restaurar backup completo'}</Button>
    </section>
  </div>;
}
