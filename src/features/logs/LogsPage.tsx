import { useEffect, useState } from 'react';
import { api } from '@/services/database/api';
import { Button } from '@/components/ui/controls';
import { useAcquisitionStore } from '@/stores/acquisition';
import { formatDateTime } from '@/features/patients/patientUtils';
import { downloadTextFile } from '@/features/backup/exportUtils';
import type { SystemLog } from '@/types';
export function LogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [level, setLevel] = useState('');
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(false);
    const acquisition = useAcquisitionStore((s) => s.logs);
    useEffect(() => {
        let live = true;
        setLoading(true);
        setError('');
        api.logs.list(level).then((l) => {
            if (live)
                setLogs(l);
        }).catch((e) => {
            if (live)
                setError(e.message);
        }).finally(() => {
            if (live)
                setLoading(false);
        });
        return () => { live = false; };
    }, [level, revision]);
    return <div className="max-w-6xl space-y-4"><h2 className="text-xl font-semibold">Logs do sistema</h2><p className="text-sm text-mute">Últimos 500 eventos persistentes. As operações registram categorias e resultados, sem senhas, respostas ou dados clínicos.</p>{error && <p role="alert" className="text-danger">{error}</p>}<div className="flex flex-wrap gap-2"><select aria-label="Nível dos logs" className="p-2 border border-line bg-surface rounded-lg" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Todos os níveis</option>{['debug', 'info', 'warn', 'error'].map((v) => <option key={v}>{v}</option>)}</select><Button variant="ghost" disabled={loading} onClick={() => setRevision((r) => r + 1)}>Atualizar</Button><Button variant="ghost" disabled={!logs.length || loading} onClick={() => downloadTextFile(JSON.stringify(logs, null, 2), 'BAROPRESS_logs.json')}>Exportar eventos exibidos</Button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Data</th><th className="p-2">Nível</th><th className="p-2">Categoria</th><th className="p-2">Mensagem</th></tr></thead><tbody>{logs.map((l) => <tr key={l.id} className="border-t border-line"><td className="p-2 whitespace-nowrap">{formatDateTime(l.createdAt)}</td><td className="p-2">{l.level}</td><td className="p-2">{l.category}</td><td className="p-2">{l.message}</td></tr>)}</tbody></table>{loading && <p role="status" className="text-mute">Carregando eventos...</p>}{!loading && !logs.length && <p className="text-mute">Nenhum evento neste filtro.</p>}</div><details className="border border-line rounded-xl p-3"><summary className="cursor-pointer">Aquisição nesta sessão ({acquisition.length})</summary><ul className="text-xs space-y-2 mt-3">{acquisition.map((l, i) => <li key={i}>{l.timestamp} · {l.level} · {l.message}</li>)}</ul></details></div>;
}
