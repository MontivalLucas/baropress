import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewExamPage } from '@/features/exams/NewExamPage';
import { ExamConditionsForm } from '@/features/exams/ExamConditionsForm';
import { useNewExamStore as examStore } from '@/features/exams/examStore';
import { useAcquisitionStore } from '@/stores/acquisition';
import { api } from '@/services/database/api';
import type { ExamDetails, PatientSummary } from '@/types';

// Canvas rendering is verified in check_paired_exam.cjs; these SSR assertions
// exercise the surrounding controls without a browser document.
vi.mock('@/features/baropodometry/BaropodometricHeatmap', () => ({BaropodometricHeatmap: () => null}));

// The session module initializes browser storage at import; this code-rendering
// test uses a synthetic operator without mounting the desktop session.
vi.mock('@/stores/session', () => ({useSession: Object.assign(
  (selector?: (state: {go: () => void; user: {name:string;role:string}}) => unknown) => {
    const state={go:() => {},user:{name:'Operador sintético',role:'admin'}};
    return selector ? selector(state) : state;
  }, {getState: () => ({user:{name:'Operador sintético',role:'admin'}})}
)}));

// Zustand SSR normally reads its initial snapshot. These render checks need
// the current synthetic state, while keeping the real acquisition actions.
vi.mock('@/features/exams/examStore', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/exams/examStore')>();
  return {useNewExamStore: Object.assign(
    (selector?: (state: ReturnType<typeof actual.useNewExamStore.getState>) => unknown) => selector ? selector(actual.useNewExamStore.getState()) : actual.useNewExamStore.getState(),
    actual.useNewExamStore
  )};
});

const patient: PatientSummary = {id:1, name:'Participante sintético',socialName:null,birthDate:null,sex:null,cpf:null,phone:null,email:null,lastExamAt:null,createdAt:'2026-10-14'};

beforeEach(() => {
  examStore.getState().resetExam();
  examStore.getState().selectPatient(patient);
  useAcquisitionStore.setState({deviceType:'MOCK',status:{connected:true,acquiring:true,transport:'MOCK',framesReceived:0,invalidFrames:0,fps:30},tareState:{baseline:null,active:false,isZeroing:false,zeroingProgress:0,message:null}});
});
afterEach(() => {vi.restoreAllMocks();examStore.getState().resetExam();});

describe('Novo Exame — condições simplificadas', () => {
  it.each(['left', 'right'] as const)('oferece a troca imediatamente após coletar o pé %s', async foot => {
    examStore.getState().setModality(foot);
    await examStore.getState().startAcquisition();
    const values = new Array(225).fill(1000);
    examStore.getState().collectFrame(values, 100);
    examStore.getState().collectRawFrame({values, receivedMs: 100, sequence: 1});
    examStore.getState().finishAcquisition();
    const other = foot === 'left' ? 'direito' : 'esquerdo';
    const html = renderToStaticMarkup(createElement(NewExamPage));
    expect(html).toContain(`Troque para o pé ${other}`);
    expect(html).toContain(`Iniciar pé ${other}`);
    expect(examStore.getState().completedStages).toHaveLength(1);
    expect(examStore.getState().framesCollected).toHaveLength(0);
  });

  it('mantém a revisão técnica fechada no resultado', async () => {
    await examStore.getState().startAcquisition();
    const values = new Array(225).fill(1000);
    examStore.getState().collectFrame(values, 100);
    examStore.getState().collectRawFrame({values, receivedMs: 100, sequence: 1});
    examStore.getState().finishAcquisition();
    const html = renderToStaticMarkup(createElement(NewExamPage));
    expect(html).toContain('Detalhes técnicos</summary>');
    const details = html.slice(html.indexOf('<details'), html.indexOf('</details>'));
    expect(details).toContain('Qualidade descritiva');
    expect(details).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
  });

  it('renderiza os dois campos dentro da aba Paciente e protocolo, sem painel antigo ou seleção de calibração', () => {
    const html=renderToStaticMarkup(createElement(NewExamPage));
    const patientPanel=html.slice(html.indexOf('id="exam-panel-patient"'));
    expect(patientPanel).toContain('Condição visual');
    expect(patientPanel).toContain('Apoio externo');
    expect(html.match(/<select\b/g)).toHaveLength(2);
    for(const removed of ['Calibração física do exame','Condições planejadas da coleta','Postura<select','Posição dos pés / orientação','Versão do protocolo','Usar nome do operador como informante']) expect(html).not.toContain(removed);
  });

  it.each(['open','closed','unknown'] as const)('renderiza a escolha visual %s e a opção de apoio selecionadas', visual => {
    examStore.getState().setConditions({visual,support:'external'});
    const html=renderToStaticMarkup(createElement(ExamConditionsForm));
    expect(html).toContain(`value="${visual}" selected=""`);
    expect(html).toContain('value="external" selected=""');
    expect(html).not.toContain('disabled=""');
  });

  it.each(['none','external','unknown'] as const)('preserva apoio %s e visão até o resultado salvo e bloqueia alterações na coleta', async support => {
    examStore.getState().setConditions({visual:'closed',support});
    await examStore.getState().startAcquisition();
    const html=renderToStaticMarkup(createElement(ExamConditionsForm));
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    examStore.getState().setConditions({visual:'open',support:support==='external'?'none':'external'});
    expect(examStore.getState().frozenConditions).toMatchObject({visual:'closed',support});
    const values=new Array(225).fill(1000);
    examStore.getState().collectFrame(values,100);
    examStore.getState().collectRawFrame({values,receivedMs:100,sequence:1});
    examStore.getState().tickAcquisition(examStore.getState().durationSeconds*1000);
    const input=examStore.getState().processedResult!.examInput;
    expect(input.analysis?.conditions).toMatchObject({visual:'closed',support});
    expect(input.physicalProfileId).toBeUndefined();
    const saved={...input,id:1,patientName:patient.name} as ExamDetails;
    const create=vi.spyOn(api.exams,'create').mockResolvedValue(saved);
    await examStore.getState().saveExam();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({analysis:expect.objectContaining({conditions:expect.objectContaining({visual:'closed',support})})}));
    expect(examStore.getState().savedExam?.analysis?.conditions).toMatchObject({visual:'closed',support});
  });
});
