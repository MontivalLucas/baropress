// Development-only preview: synthetic patient, Mock device and in-memory exams.
import { createRoot } from 'react-dom/client';
import { NewExamPage } from '../src/features/exams/NewExamPage';
import { ReportViewer } from '../src/features/reports/ReportViewer';
import { api } from '../src/services/database/api';
import { useSession } from '../src/stores/session';
import { useAcquisitionStore } from '../src/stores/acquisition';
import { fixture } from './barosys-fixture';
import type { ExamDetails, ExamInput } from '../src/types';
import type { RawFrame } from '../src/services/calibration/types';
import '../src/index.css';

const saved: ExamDetails[] = [];
const series = new Map<number,RawFrame[]>();
useSession.setState({user:{id:0,name:'OPERADOR SINTÉTICO',email:'fixture@example.invalid',role:'admin'}});
useAcquisitionStore.getState().setDeviceType('MOCK');
useAcquisitionStore.getState().setMockPattern('both');
api.patients.list=async()=>[{id:1,name:fixture.patientName,socialName:null,birthDate:null,sex:null,cpf:null,phone:null,email:null,lastExamAt:null,createdAt:fixture.createdAt}];
api.calibration.list=async()=>({mats:[],profiles:[],trials:[]});
function save(input: ExamInput): ExamDetails {
  const id = saved.length + 1;
  const result = {...structuredClone(fixture),...structuredClone(input),id} as ExamDetails;
  saved.push(result); series.set(id, structuredClone(input.seriesFrames ?? input.rawFrames ?? []));
  return result;
}
api.exams.create=async input=>save(input);
api.exams.createSequence=async inputs=>inputs.map(save);
api.exams.get=async id=>structuredClone(saved.find(exam=>exam.id===id)!);
api.exams.sequence=async id=>structuredClone(saved.filter(exam=>exam.analysis?.acquisition?.sequenceId===saved.find(e=>e.id===id)?.analysis?.acquisition?.sequenceId));
api.exams.rawFrames=async id=>structuredClone(series.get(id) ?? []);
api.exams.list=async()=>structuredClone(saved);
api.exams.updateNotes=async(id,notes)=>({...saved.find(e=>e.id===id)!,notes});
function Preview() {
  const reportId = useSession(s => s.reportExamId);
  const report = saved.find(exam=>exam.id===reportId);
  return <div className="h-screen overflow-auto bg-bg text-ink"><p className="bg-purple-500/20 p-2 text-xs">PRÉVIA SINTÉTICA · SEM BANCO PESSOAL · DADOS DESCARTADOS AO RECARREGAR</p>{report ? <ReportViewer key={report.id} exam={report} onBack={()=>useSession.setState({reportExamId:null})}/> : <NewExamPage/>}</div>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
