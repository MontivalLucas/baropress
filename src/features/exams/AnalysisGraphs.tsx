import { temporalMetrics } from '@/services/examAnalysis/calculations';
import type { TemporalPoint, ExamEvent } from '@/services/examAnalysis/types';
export function AnalysisGraphs({points,gapLimitMs,fromMs=0,toMs=Infinity,events=[],legacy=false,currentMs,onSelectTime}:{points:TemporalPoint[];gapLimitMs:number;fromMs?:number;toMs?:number;events?:ExamEvent[];legacy?:boolean;currentMs?:number;onSelectTime?:(time:number)=>void}) {
  const data=points.filter(p=>p.timestampMs>=fromMs && p.timestampMs<=toMs);
  const end=Math.max(1,...data.map(p=>p.timestampMs));
  const segments:TemporalPoint[][]=[];
  data.forEach((p,i)=>{if(p.x===null || p.y===null)return;const previous=data[i-1];if(!previous || previous.x===null || previous.y===null || p.timestampMs<=previous.timestampMs || p.timestampMs-previous.timestampMs>gapLimitMs || legacy)segments.push([]);segments[segments.length-1].push(p);});
  const metric=temporalMetrics(data,gapLimitMs);
  const fmt=(v:number|null)=>v===null?'Indisponível':v.toFixed(3);
  return <div className="space-y-3"><p className="text-xs">Centro ADC relativo · coordenadas em células (0–14) · sem filtro · {legacy?'tempos históricos estimados; continuidade desconhecida':`recepção monotônica; segmentos separados para ausência de contato, dt ≤ 0 ou lacuna > ${gapLimitMs.toFixed(1)} ms`}</p>
    <div className="grid md:grid-cols-3 gap-3">{(['trajectory','x','y'] as const).map(axis=><figure key={axis}><figcaption className="text-sm font-semibold">{axis==='trajectory'?'Trajetória X/Y':`${axis.toUpperCase()}(t)`}</figcaption><svg viewBox="0 0 310 190" role="img" aria-label={axis==='trajectory'?'Trajetória relativa X Y':`${axis} por tempo real`} onClick={e=>{if(axis==='trajectory' || !onSelectTime)return;const rect=e.currentTarget.getBoundingClientRect();onSelectTime(Math.max(0,Math.min(end,((e.clientX-rect.left)/rect.width*310-35)/260*end)));}} className="w-full border border-line rounded bg-white text-slate-700">
      <path d="M35 10 V155 H295" fill="none" stroke="#94a3b8"/><text x="5" y="18" fontSize="10">14</text><text x="16" y="155" fontSize="10">0</text><text x="35" y="174" fontSize="10">0</text><text x="195" y="180" fontSize="10">{axis==='trajectory'?'X (células)':`Tempo (s) · ${(end/1000).toFixed(2)}`}</text>
      {segments.map((segment,i)=>{const positions=segment.map(p=>[35+(axis==='trajectory'?p.x!/14:p.timestampMs/end)*260,155-(axis==='y'?p.y!:axis==='x'?p.x!:p.y!)/14*145]);return <g key={i}><polyline points={positions.map(p=>p.join(',')).join(' ')} fill="none" stroke="#0284c7" strokeWidth="1.4"/>{positions.length===1 && <circle cx={positions[0][0]} cy={positions[0][1]} r="2" fill="#0284c7"/>}</g>})}
      {axis!=='trajectory' && events.filter(e=>e.timestampMs>=fromMs && e.timestampMs<=toMs).map((e,i)=><line key={i} x1={35+e.timestampMs/end*260} x2={35+e.timestampMs/end*260} y1={10} y2={155} stroke="#f59e0b"><title>{e.text}</title></line>)}
      {axis!=='trajectory' && currentMs!==undefined && currentMs>=fromMs && currentMs<=toMs && <line x1={35+currentMs/end*260} x2={35+currentMs/end*260} y1={10} y2={155} stroke="#c026d3"><title>Quadro selecionado</title></line>}
    </svg></figure>)}</div>
    {!legacy && <p className="text-sm">Comprimento: {fmt(metric.length)} células · Duração dos intervalos contínuos: {(metric.validMs/1000).toFixed(3)} s · Velocidade ponderada no tempo: {fmt(metric.timeWeightedSpeed)} células/s · Média das velocidades por intervalo: {fmt(metric.intervalMeanSpeed)} células/s · Amplitudes X/Y: {fmt(metric.amplitudeX)} / {fmt(metric.amplitudeY)} células · Desvio populacional X/Y: {fmt(metric.sdX)} / {fmt(metric.sdY)} células · Interrupções: {metric.gaps}.</p>}
    {events.length>0 && <ul className="text-xs">{events.map((e,i)=><li key={i}>{(e.timestampMs/1000).toFixed(3)} s · {e.kind} · {e.text} · {e.informedBy}</li>)}</ul>}
  </div>;
}
