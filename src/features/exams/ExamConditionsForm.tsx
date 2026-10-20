import { useNewExamStore } from './examStore';
import { useSession } from '@/stores/session';
import { useState } from 'react';
export function ExamConditionsForm() {
  const conditions = useNewExamStore(s => s.conditions), change = useNewExamStore(s => s.setConditions);
  const disabled = useNewExamStore(s => s.isStarting || s.step !== 'CONFIRM');
  return <div className="grid sm:grid-cols-2 gap-3 text-sm">
    <label>Condição visual
      <select className="input w-full" disabled={disabled} value={conditions.visual} onChange={e => change({visual:e.target.value as typeof conditions.visual})}>
        <option value="unknown">Não informada</option>
        <option value="open">Olhos abertos</option>
        <option value="closed">Olhos fechados</option>
      </select>
    </label>
    <label>Apoio externo
      <select className="input w-full" disabled={disabled} value={conditions.support} onChange={e => change({support:e.target.value as typeof conditions.support})}>
        <option value="unknown">Não informado</option>
        <option value="none">Sem apoio externo</option>
        <option value="external">Com apoio externo</option>
      </select>
    </label>
  </div>;
}
export function ExamEventRecorder() {
  const step=useNewExamStore(s => s.step);
  const lastTime=useNewExamStore(s=>s.frameTimestampsMs[s.frameTimestampsMs.length-1]??0);
  const [manualTime,setManualTime]=useState<number|null>(null);
  if (!['ACQUIRING','RESULT'].includes(step)) return null;
  return <form className="flex flex-wrap gap-2 text-sm" onSubmit={e => {e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const state=useNewExamStore.getState();const text=String(data.get('text')??'').trim();const informedBy=String(data.get('author')??'').trim();if(!text || !informedBy)return;state.addEvent({timestampMs:Number(data.get('time')),kind:data.get('kind') as 'movement'|'correction'|'note',text,informedBy});form.reset();setManualTime(null);}}>
    <select className="input" name="kind" aria-label="Tipo do evento"><option value="movement">Movimento percebido</option><option value="correction">Correção de condição</option><option value="note">Nota</option></select>
    <input className="input" aria-label="Tempo do evento em milissegundos" name="time" type="number" required min={0} max={useNewExamStore.getState().durationSeconds*1000} value={manualTime??lastTime} onChange={e=>setManualTime(Number(e.target.value))}/>
    <input className="input" name="text" aria-label="Descrição do evento" placeholder="Descrição" required maxLength={4000}/><input className="input" name="author" aria-label="Informante do evento" placeholder="Informado por" defaultValue={useSession.getState().user?.name??''} required maxLength={200}/><button type="submit" className="btn">Registrar evento</button><span className="text-xs text-mute">Tempo desde o início da coleta (ms); padrão = último quadro recebido, ajustável pelo informante. {useNewExamStore.getState().events.length} evento(s).</span>
  </form>;
}
