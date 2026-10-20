import { useState } from "react";
import { api } from "@/services/database/api";
import { Button } from "@/components/ui/controls";
import { DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import { renderHeatmapToDataUrl } from "@/features/reports/reportUtils";
import { downloadTextFile, examMatrixCsv } from "@/features/backup/exportUtils";
import type { ExamDetails } from "@/types";
import { validateExamForReport } from "@/features/reports/reportUtils";
export function ExamExportActions({ exam }: {
    exam: ExamDetails;
}) {
    const [message, setMessage] = useState('');
    const [exporting,setExporting]=useState(false);
    async function exportSeries() { if(exporting)return;setExporting(true);try { const frames=await api.exams.rawFrames(exam.id);if(frames.length!==exam.analysis?.series.frameCount)throw new Error('Série incompleta; exportação interrompida.');downloadTextFile(JSON.stringify({format:'BAROPRESS_EXAM_SERIES',formatVersion:1,exam,frames},null,2),`BAROPRESS_exame_${exam.id}_serie.json`);setMessage('Série e metadados disponibilizados.'); }catch(e){setMessage((e as Error).message);}finally{setExporting(false);} }
    function run(format: 'csv' | 'png' | 'json') {
        try {
            const validation = validateExamForReport(exam);
            if (!validation.valid) throw new Error(validation.error);
            if (format === 'csv')
                downloadTextFile(examMatrixCsv(exam), `BAROPRESS_exame_${exam.id}_matriz_media.csv`, 'text/csv');
            else if (format === 'json')
                downloadTextFile(JSON.stringify(exam, null, 2), `BAROPRESS_exame_${exam.id}_processado.json`);
            else {
                const config = { ...DEFAULT_HEATMAP_SETTINGS, ...exam.visualizationSettings, gamma: exam.gamma ?? 1.3, vmax: exam.vmax ?? 2200, threshold: exam.threshold ?? 150, smoothing: exam.smoothing ?? 0.35 };
                const url = renderHeatmapToDataUrl(exam.matrix, config, exam.copX != null && exam.copY != null ? { x: exam.copX, y: exam.copY } : null, 600);
                if (!url)
                    throw new Error('Não foi possível renderizar o mapa.');
                const a = document.createElement('a');
                a.href = url;
                a.download = `BAROPRESS_exame_${exam.id}_mapa.png`;
                document.body.append(a);
                a.click();
                a.remove();
            }
            setMessage('Arquivo disponibilizado para salvar.');
        }
        catch (e) {
            setMessage((e as Error).message);
        }
    }
    return <div className="space-y-2 border-t border-line pt-3"><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => run('csv')}>CSV da matriz média ADC</Button><Button variant="ghost" onClick={() => run('png')}>Imagem PNG ADC</Button><Button variant="ghost" onClick={() => run('json')}>Dados processados JSON</Button>{exam.analysis && <Button variant="ghost" disabled={exporting} onClick={()=>void exportSeries()}>{exporting?"Exportando...":"Série temporal e metadados JSON"}</Button>}{exam.physicalResult && <Button variant="ghost" onClick={async()=>{try { const frames=await api.exams.rawFrames(exam.id);downloadTextFile(JSON.stringify({format:'BAROPRESS_PHYSICAL_EXAM',schemaVersion:1,exam,frames},null,2),`BAROPRESS_exame_${exam.id}_fisico_e_bruto.json`);setMessage('Exame físico e quadros brutos disponibilizados.');} catch(e){setMessage((e as Error).message);}}}>Exame físico e bruto JSON</Button>}</div><p className="text-xs text-mute">Exportações ADC preservam a amostra média original. O JSON físico inclui o perfil e os quadros realmente retidos; não reconstrói bruto pela média.</p>{message && <p role="status" className="text-xs">{message}</p>}</div>;
}
