import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/services/database/api';
import type { ManagedUser, Role } from '@/types';
import { useSession } from '@/stores/session';
import { Button, Field } from '@/components/ui/controls';
import { PasswordField } from './PasswordField';
import { RecoveryReceipt } from './RecoveryReceipt';
import { passwordError, PASSWORD_HELP } from './authValidation';
import { roleLabels } from './permissions';
import { clearLocalSession } from './sessionActions';
import { useUnsavedChanges } from '@/components/ui/useUnsavedChanges';
import { requestNavigation } from '@/services/navigationGuard';

export function UsersPage() {
  const me = useSession(s => s.user);
  const [rows, setRows] = useState<ManagedUser[]>([]), [search, setSearch] = useState(''), [page, setPage] = useState(0), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [selected, setSelected] = useState<ManagedUser | null | undefined>(undefined);
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [ra, setRa] = useState(''), [role, setRole] = useState<Role>('professional'), [active, setActive] = useState(true);
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [adminPassword, setAdminPassword] = useState(''), [code, setCode] = useState(''), [deleteConfirm, setDeleteConfirm] = useState(false);
  const [initial, setInitial] = useState('');
  const value = JSON.stringify([name,email,ra,role,active]);
  useUnsavedChanges(selected !== undefined && (value !== initial || !!password || !!confirmation || !!adminPassword), 'O cadastro de usuário tem alterações não salvas.', busy);
  useEffect(() => {
    let live=true; setLoading(true);
    const timer=setTimeout(() => { api.users.list(search,page*50).then(r=>{if(live){setRows(r);setError('');}}).catch(e=>{if(live){setRows([]);setError(e.message);}}).finally(()=>{if(live)setLoading(false);}); },250);
    return()=>{live=false;clearTimeout(timer);};
  },[search,page,revision]);
  function edit(u: ManagedUser | null) {
    setSelected(u); setName(u?.name??'');setEmail(u?.email??'');setRa(u?.ra??'');setRole(u?.role??'professional');setActive(u?.active??true);
    setInitial(JSON.stringify([u?.name??'',u?.email??'',u?.ra??'',u?.role??'professional',u?.active??true]));
    setPassword('');setConfirmation('');setAdminPassword('');setError('');setCode('');setDeleteConfirm(false);
  }
  async function submit(e:FormEvent) {
    e.preventDefault();if(busy)return;setError('');setMessage('');
    if(!selected){const err=passwordError(password,confirmation);if(err)return setError(err);}
    setBusy(true);
    try {
      if(selected) await api.users.update(selected.id,{name,email,ra,role,active},adminPassword);
      else { const created=await api.registerUser(name,email,password,role,ra,adminPassword);setCode(created.recoveryCode); }
      setMessage(selected?'Usuário atualizado. Sessões anteriores encerradas.':'Usuário criado. Entregue o código pessoal de recuperação em particular.');
      setSelected(undefined);setPassword('');setConfirmation('');setRevision(r=>r+1);
      if(selected?.id===me?.id) await clearLocalSession('Conta atualizada. Entre novamente.');
    }catch(e){setError((e as Error).message);}finally{setBusy(false);setAdminPassword('');}
  }
  async function remove() {
    if(!selected||busy||!adminPassword)return;setBusy(true);setError('');
    try{await api.users.delete(selected.id,adminPassword);setSelected(undefined);setDeleteConfirm(false);setRevision(r=>r+1);setMessage('Acesso excluído. Identidade histórica preservada.');}catch(e){setError((e as Error).message);}finally{setBusy(false);setAdminPassword('');}
  }
  async function recovery() {
    if(!selected||busy||!adminPassword)return;setBusy(true);setError('');
    try{setCode(await api.users.recovery(selected.id,adminPassword));setMessage('Código temporário: uso único, validade de 30 minutos. Entregue em particular.');}catch(e){setError((e as Error).message);}finally{setBusy(false);setAdminPassword('');}
  }
  return <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
    <header><h1 className="text-2xl font-semibold">Usuários</h1><p className="text-sm text-mute">Gerencie contas, RA e permissões da equipe.</p></header>
    {error&&<p role="alert" className="text-danger">{error}</p>}{message&&<p role="status" className="text-ok">{message}</p>}
    {code&&<section className="p-4 border border-line rounded-xl"><RecoveryReceipt code={code} onDone={()=>setCode('')}/></section>}
    {selected!==undefined ? <form onSubmit={submit} className="p-4 border border-line rounded-xl bg-surface space-y-4 max-w-2xl">
      <h2 className="font-semibold">{selected?'Editar usuário':'Criar usuário'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={120} disabled={busy}/>
        <Field label="E-mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} disabled={busy}/>
        <Field label="RA" value={ra} onChange={e=>setRa(e.target.value)} inputMode="numeric" pattern="[0-9]{1,32}" maxLength={32} required disabled={busy}/>
        <label className="text-sm">Perfil<select className="block w-full p-2 bg-surface border border-line rounded-lg" value={role} onChange={e=>setRole(e.target.value as Role)} disabled={busy||selected?.id===me?.id}>{Object.entries(roleLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <p className="text-xs text-mute">{role==='admin'?'Acesso completo, incluindo equipe, calibração e sistema.':role==='professional'?'Acesso clínico completo. Sem equipe, calibração, hardware, logs ou backup.':'Pacientes, consulta/PDF de resultados e criação/consulta de agendamentos. Sem novos exames ou acesso técnico.'}</p>
      {selected&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} disabled={busy||selected.id===me?.id}/>Conta ativa</label>}
      {!selected&&<><PasswordField label="Senha inicial do usuário" value={password} onChange={setPassword} disabled={busy}/><PasswordField label="Confirmar senha inicial" value={confirmation} onChange={setConfirmation} disabled={busy}/><p className="text-xs text-mute">{PASSWORD_HELP}</p></>}
      <PasswordField label="Sua senha de administrador para confirmar" value={adminPassword} onChange={setAdminPassword} autoComplete="current-password" disabled={busy}/>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}>{busy?'Aguarde...':'Salvar usuário'}</Button><Button variant="ghost" disabled={busy} onClick={()=>requestNavigation(()=>{setSelected(undefined);setAdminPassword('');setPassword('');setConfirmation('');setDeleteConfirm(false);})}>Voltar à lista</Button>
      {selected&&<Button variant="ghost" disabled={busy||!selected.active||!selected.ra||!adminPassword} onClick={()=>void recovery()}>Gerar código temporário</Button>}
      {selected&&selected.id!==me?.id&&<Button variant="ghost" disabled={busy} onClick={()=>setDeleteConfirm(true)}>Excluir acesso</Button>}</div>
      {deleteConfirm&&<div role="alert" className="p-3 border border-danger rounded-lg space-y-3"><p>Excluir acesso de {selected?.name}? A conta não poderá entrar novamente; seu histórico será preservado. Informe sua senha acima.</p><Button disabled={busy||!adminPassword} onClick={()=>void remove()}>Confirmar exclusão</Button><Button variant="ghost" onClick={()=>setDeleteConfirm(false)} disabled={busy}>Cancelar exclusão</Button></div>}
    </form> : <><div className="flex gap-3 flex-wrap items-end"><div className="flex-1"><Field label="Buscar por nome, e-mail ou RA" value={search} maxLength={254} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></div><Button onClick={()=>edit(null)}>Criar usuário</Button><Button variant="ghost" disabled={loading} onClick={()=>setRevision(r=>r+1)}>Atualizar</Button></div>
    <div className="overflow-x-auto border border-line rounded-xl"><table className="w-full text-sm"><thead><tr className="text-left bg-surface">{['Nome','E-mail','RA','Perfil','Situação','Ações'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={6} className="p-4">Carregando...</td></tr>:rows.slice(0,50).map(u=><tr key={u.id} className="border-t border-line"><td className="p-3">{u.name}{u.id===me?.id?' (você)':''}</td><td className="p-3 break-all">{u.email}</td><td className="p-3">{u.ra??'Completar cadastro'}</td><td className="p-3">{roleLabels[u.role]}</td><td className="p-3">{u.active?'Ativa':'Inativa'}</td><td className="p-3"><Button variant="ghost" onClick={()=>edit(u)}>Editar</Button></td></tr>)}{!loading&&!rows.length&&<tr><td colSpan={6} className="p-4">Nenhum usuário encontrado.</td></tr>}</tbody></table></div>
    <div className="flex gap-3 items-center"><Button variant="ghost" disabled={loading||!page} onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page+1}</span><Button variant="ghost" disabled={loading||rows.length<=50} onClick={()=>setPage(p=>p+1)}>Próxima</Button></div></>}
  </div>;
}
