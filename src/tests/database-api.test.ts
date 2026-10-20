import { beforeEach,afterEach,describe,expect,it,vi } from 'vitest';
const {invoke}=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@tauri-apps/api/core',()=>({invoke}));
import { api } from '@/services/database/api';
describe('Fase 11 — auditoria sem dados pessoais',()=>{
  beforeEach(()=>{vi.stubGlobal('window',{__TAURI_INTERNALS__:{},dispatchEvent:vi.fn()});invoke.mockReset();});afterEach(()=>vi.unstubAllGlobals());
  it('não copia códigos de recuperação nem senhas novas para logs',async()=>{
    invoke.mockImplementation(async(cmd:string)=>{if(cmd==='auth_recover')throw 'Credenciais inválidas';});
    await expect(api.recover('sintetico@example.invalid',null,'NovaSenhaTeste2026','CODIGO-SINTETICO')).rejects.toThrow('Credenciais inválidas');
    const events=invoke.mock.calls.filter((args)=>args[0]==='system_logs_add');
    expect(JSON.stringify(events)).not.toContain('CODIGO-SINTETICO');expect(JSON.stringify(events)).not.toContain('NovaSenhaTeste2026');expect(JSON.stringify(events)).not.toContain('sintetico@example.invalid');
  });
  it('envia o RA sem converter zeros iniciais e sem gravar logs no frontend',async()=>{
    invoke.mockResolvedValue(undefined);
    await api.recover('sintetico@example.invalid','00180386','NovaSenhaTeste2026');
    expect(invoke).toHaveBeenCalledWith('auth_recover',{email:'sintetico@example.invalid',ra:'00180386',code:null,newPassword:'NovaSenhaTeste2026'});
    expect(invoke.mock.calls.filter(args=>args[0]==='system_logs_add')).toHaveLength(0);
  });
  it('informa expiração da sessão ao aplicativo',async()=>{
    invoke.mockImplementation(async(cmd:string)=>{if(cmd==='patients_list')throw 'Sessão encerrada. Entre novamente.';});
    await expect(api.patients.list()).rejects.toThrow('Sessão encerrada');
    expect(window.dispatchEvent).toHaveBeenCalledOnce();
  });
  it('delega o log de autenticação ao backend sem duplicar nem copiar credenciais',async()=>{invoke.mockImplementation(async(cmd:string)=>cmd==='auth_login'?{id:1}:undefined);await api.login('teste@example.invalid','segredo-de-teste');expect(invoke.mock.calls.filter((args)=>args[0]==='system_logs_add')).toEqual([]);});
  it('preserva o erro clínico sem depender de permissão de escrita em logs',async()=>{
    invoke.mockRejectedValue('Falha em consulta');
    await expect(api.patients.list()).rejects.toThrow('Falha em consulta');
    expect(invoke.mock.calls.filter(args=>args[0]==='system_logs_add')).toHaveLength(0);
  });
});
