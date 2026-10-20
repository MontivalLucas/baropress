import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewExamStore as store } from '@/features/exams/examStore';
import { useAcquisitionStore } from '@/stores/acquisition';
import { usePreferencesStore } from '@/stores/preferences';
import { normalizePreferences } from '@/services/preferences';
import { api } from '@/services/database/api';
import { drawTrajectory } from '@/services/baropodometry/trajectory';
import { normalizeMatrixOrientation } from '@/services/acquisition/parser';
import type { PatientSummary, ExamDetails } from '@/types';

const patient = {id: 1, name: 'Participante sintético'} as PatientSummary;
function collect(value: number, time: number) {
  const values = new Array(225).fill(0); values[112] = value;
  const count = store.getState().framesCollected.length;
  store.getState().collectFrame(values, time);
  if (store.getState().framesCollected.length === count + 1) store.getState().collectRawFrame({values: normalizeMatrixOrientation(values), receivedMs: time, sequence: count + 1});
}
beforeEach(() => {
  vi.useFakeTimers();
  usePreferencesStore.setState({durationSeconds: 30});
  useAcquisitionStore.setState({deviceType: 'MOCK', status: {connected: true, acquiring: true, transport: 'MOCK', framesReceived: 0, invalidFrames: 0, fps: 30}, tareState: {baseline: null, active: false, isZeroing: false, zeroingProgress: 0, message: null}});
  store.getState().resetExam(); store.getState().selectPatient(patient);
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); store.getState().resetExam(); });
describe('Aquisição de 30/45 segundos e modalidades', () => {
  it('migra preferências antigas para 30s e preserva a opção 45s', () => {
    expect(normalizePreferences({durationSeconds: 10}).durationSeconds).toBe(30);
    expect(normalizePreferences({durationSeconds: 45}).durationSeconds).toBe(45);
  });
  it.each([30,45])('coleta até o limite de %i segundos, sem incluir a preparação', async seconds => {
    store.getState().setDurationSeconds(seconds);
    await store.getState().startPreparation();
    collect(1000,0); expect(store.getState().framesCollected).toHaveLength(0);
    vi.advanceTimersByTime(5000); store.getState().tickPrep(); await Promise.resolve(); await Promise.resolve();
    expect(store.getState().step).toBe('ACQUIRING');
    store.getState().setDurationSeconds(30); expect(store.getState().durationSeconds).toBe(seconds);
    collect(1000,100); collect(1200,seconds*1000-10); collect(4000,seconds*1000+1);
    store.getState().tickAcquisition(seconds*1000-1); expect(store.getState().step).toBe('ACQUIRING');
    store.getState().tickAcquisition(seconds*1000);
    expect(store.getState().processedResult?.examInput.duration).toBe(seconds);
    expect(store.getState().processedResult?.averageMatrix[112]).toBe(1100);
    expect(store.getState().processedResult?.examInput.frameCount).toBe(2);
  });
  it.each(['both','left','right'] as const)('identifica uma coleta única: %s', async foot => {
    store.getState().setModality(foot); await store.getState().startAcquisition(); collect(900,100); store.getState().tickAcquisition(30000);
    expect(store.getState().processedResult?.examInput.analysis?.acquisition).toMatchObject({foot, stage:1, totalStages:1, order:[foot], sequenceId:null});
  });
  it.each(['left','right'] as const)('preserva e salva as duas etapas iniciando por %s, com retry', async foot => {
    store.getState().setModality(foot,true); await store.getState().startAcquisition(); collect(1000,100); store.getState().tickAcquisition(30000);
    await expect(store.getState().saveExam()).rejects.toThrow('segundo pé');
    store.getState().nextFoot(); expect(store.getState().step).toBe('NEXT_FOOT');
    const first = store.getState().completedStages[0]; expect(first.averageMatrix[112]).toBe(1000);
    collect(4095,200); expect(store.getState().framesCollected).toHaveLength(0);
    await store.getState().startPreparation(); expect(store.getState().step).toBe('PREPARING');
    await store.getState().startAcquisition(); collect(2000,100); store.getState().tickAcquisition(30000);
    const second = store.getState().processedResult!;
    expect(second.averageMatrix[112]).toBe(2000);
    expect(second.examInput.analysis?.acquisition?.sequenceId).toBe(first.examInput.analysis?.acquisition?.sequenceId);
    expect(second.examInput.analysis?.acquisition?.foot).toBe(foot === 'left' ? 'right' : 'left');
    const saved = [first,second].map((r,i)=>({...r.examInput,id:i+1,patientName:patient.name})) as ExamDetails[];
    const save = vi.spyOn(api.exams,'createSequence').mockRejectedValueOnce(new Error('Falha SQLite')).mockResolvedValueOnce(saved);
    await expect(store.getState().saveExam()).rejects.toThrow('Falha SQLite'); expect(store.getState().completedStages).toHaveLength(1);
    await store.getState().saveExam(); await store.getState().saveExam();
    expect(save).toHaveBeenCalledTimes(2); expect(store.getState().savedExams).toHaveLength(2);
  });
  it('desconexão no segundo pé preserva a primeira etapa para repetir; cancelamento descarta tudo', async () => {
    store.getState().setModality('left',true); await store.getState().startAcquisition(); collect(1000,100); store.getState().tickAcquisition(30000); store.getState().nextFoot();
    await store.getState().startPreparation(); store.getState().abortAcquisition('Desconectado');
    expect(store.getState().step).toBe('NEXT_FOOT'); expect(store.getState().completedStages[0].averageMatrix[112]).toBe(1000);
    store.getState().confirmCancel(); expect(store.getState().completedStages).toHaveLength(0); expect(store.getState().sequenceId).toBeNull(); expect(store.getState().foot).toBe('left');
  });
  it('interrompe o traçado quando perde contato ou há lacuna, mantendo coordenadas do tapete', () => {
    const ctx = {save:vi.fn(),restore:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn()} as unknown as CanvasRenderingContext2D;
    drawTrajectory(ctx,[{timestampMs:0,x:0,y:0},{timestampMs:30,x:1,y:1},{timestampMs:60,x:null,y:null},{timestampMs:90,x:14,y:14},{timestampMs:4000,x:7,y:7}],150,150);
    expect(ctx.moveTo).toHaveBeenCalledTimes(3); expect(ctx.lineTo).toHaveBeenCalledTimes(1); expect(ctx.moveTo).toHaveBeenCalledWith(5,5);
  });
});
