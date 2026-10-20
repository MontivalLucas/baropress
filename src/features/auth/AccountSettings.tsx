import { useState, type FormEvent } from 'react';
import { api } from '@/services/database/api';
import { useSession } from '@/stores/session';
import { useNewExamStore } from '@/features/exams/examStore';
import { useCalibrationStore } from '@/stores/calibration';
import { Button } from '@/components/ui/controls';
import { PasswordField } from './PasswordField';
import { RecoveryReceipt } from './RecoveryReceipt';
import { passwordError, PASSWORD_HELP } from './authValidation';
import { clearLocalSession } from './sessionActions';
import { roleLabels } from './permissions';
import { useUnsavedChanges } from '@/components/ui/useUnsavedChanges';
import { requestNavigation } from '@/services/navigationGuard';
export function AccountSettings() {
  const user=useSession(s=>s.user);
  const activeExam=useNewExamStore(s=>s.step==='ACQUIRING'||s.step==='PREPARING'||s.isSaving||s.isStarting);
  const calibrationBusy=useCalibrationStore(s=>s.busy);
  const [mode,setMode]=useState<'change'|'recovery'>('change');
  const [password,setPassword]=useState(''),[next,setNext]=useState(''),[confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[code,setCode]=useState('');
  useUnsavedChanges(!!password||!!next||!!confirmation,'A alteração da conta ainda não foi concluída.',busy);
  async function submit(e:FormEvent){
    e.preventDefault();if(busy||activeExam||calibrationBusy)return;setError('');setMessage('');
    if(mode==='change'){const err=passwordError(next,confirmation);if(err)return setError(err);}
    setBusy(true);
    try{if(mode==='change'){await api.changePassword(password,next);await clearLocalSession('Senha alterada. Entre novamente.');}
    else{setCode(await api.provisionRecovery(password));setMessage('O novo código substitui o anterior. Guarde em particular.');}setNext('');setConfirmation('');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);setPassword('');}
  }
  function switchMode(value:typeof mode){requestNavigation(()=>{setMode(value);setError('');setMessage('');setPassword('');setNext('');setConfirmation('');});}
  return <section className="space-y-4"><h2 className="font-semibold">Minha conta e segurança</h2><p className="text-sm text-mute">{user?.email} · {user&&roleLabels[user.role]} · RA: {user?.ra??'Solicite ao admin completar seu cadastro'}</p>
  {error&&<p role="alert" className="text-danger">{error}</p>}{message&&<p role="status" className="text-ok">{message}</p>}
  {code?<RecoveryReceipt code={code} onDone={()=>setCode('')}/>:<><div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={busy} onClick={()=>switchMode('change')}>Alterar minha senha</Button><Button variant="ghost" disabled={busy} onClick={()=>switchMode('recovery')}>Gerar código pessoal de recuperação</Button>{user?.role==='admin'&&<Button variant="ghost" disabled={busy} onClick={()=>useSession.getState().go('users')}>Gerenciar usuários</Button>}</div>
  <form onSubmit={submit} className="space-y-3 max-w-md"><PasswordField label="Senha atual" value={password} onChange={setPassword} autoComplete="current-password" disabled={busy}/>
  {mode==='change'&&<><PasswordField label="Nova senha" value={next} onChange={setNext} disabled={busy}/><PasswordField label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} disabled={busy}/><p className="text-xs text-mute">{PASSWORD_HELP}</p></>}
  {(activeExam||calibrationBusy)&&<p role="status" className="text-warn text-sm">Conclua ou cancele a coleta antes de alterar a conta.</p>}
  <Button type="submit" disabled={busy||activeExam||calibrationBusy}>{busy?'Aguarde...':mode==='change'?'Alterar senha e sair':'Gerar novo código'}</Button></form></>}
  </section>;
}
