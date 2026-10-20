// Fixture visual local, fora do entrypoint de produção. Nenhum acesso ao SQLite.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AnalysisReview } from '../src/features/exams/AnalysisReview';
import { ReportViewer } from '../src/features/reports/ReportViewer';
import { ComparisonPage } from '../src/features/comparison/ComparisonPage';
import { NewExamPage } from '../src/features/exams/NewExamPage';
import { api } from '../src/services/database/api';
import { useSession } from '../src/stores/session';
import { fixture,frames } from './barosys-fixture';
import { acquisitionQuality,mapFromFrames } from '../src/services/examAnalysis/calculations';
import '../src/index.css';
if(new URLSearchParams(location.search).get('volume')==='10000') {
 const seed=[...frames];frames.splice(0,frames.length,...Array.from({length:10000},(_,i)=>({receivedMs:i*6,sequence:i+1,values:[...seed[i%seed.length].values]})));
 fixture.analysis!.series.frameCount=10000;fixture.analysis!.quality=acquisitionQuality(frames,fixture.analysis!.series,60000,0);
 fixture.matrix=mapFromFrames(frames,fixture.analysis!.series,'mean')!;fixture.duration=60;fixture.frameCount=10000;
}
useSession.setState({user:{id:0,name:'OPERADOR-TESTE',email:'fixture@example.invalid',role:'admin'}});
api.exams.rawFrames=async(_id,offset=0,limit=20000)=>structuredClone(frames.slice(offset,offset+limit));
api.exams.get=async id=>({...structuredClone(fixture),id,startedAt:`2026-10-0${id+1}T11:00:00Z`});
api.exams.addRegion=async(_id,revision)=>{fixture.analysis!.regions.push(revision);return structuredClone(fixture);};
api.exams.updateNotes=async(_id,notes)=>({...structuredClone(fixture),notes});
api.exams.create=async data=>({...structuredClone(fixture),...data});
api.exams.list=async()=>Array.from({length:4},(_,i)=>({...fixture,id:i+1,startedAt:`2026-10-0${i+2}T11:00:00Z`}));
api.patients.list=async()=>[{id:1,name:fixture.patientName,socialName:null,birthDate:null,sex:null,cpf:null,phone:null,email:null,lastExamAt:null,createdAt:fixture.createdAt}];
api.calibration.list=async()=>({mats:[],profiles:[],trials:[]});
const query=new URLSearchParams(location.search);document.documentElement.classList.toggle('dark',query.get('theme')!=='light');
function Review(){const [exam,setExam]=React.useState(fixture);return <AnalysisReview exam={exam} onUpdated={setExam}/>;}
createRoot(document.getElementById('root')!).render(<div className="min-h-screen bg-bg text-ink"><p className="bg-purple-500/20 p-3 font-semibold">PRÉVIA SINTÉTICA - SEM BANCO PESSOAL</p>{query.get('page')==='report'?<ReportViewer exam={query.has('legacy')?{...fixture,analysis:null}:fixture} onBack={()=>{}}/>:query.get('page')==='comparison'?<ComparisonPage initialPatientId={1}/>:query.get('page')==='new'?<NewExamPage/>:<div className="p-4"><Review/></div>}</div>);
