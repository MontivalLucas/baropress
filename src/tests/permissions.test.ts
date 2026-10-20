import { describe, expect, it } from 'vitest';
import { canPage, canSettings } from '@/features/auth/permissions';
import type { Page } from '@/types';
describe('Perfis de acesso',()=>{
 it('secretaria acessa pacientes, resultados, agenda e sua configuração',()=>{
   const allowed:Page[]=['patients','exams','settings','agenda'];const denied:Page[]=['dashboard','baropodometry','new-exam','comparison','questionnaires','calibration','users'];
   for(const page of allowed)expect(canPage('assistant',page)).toBe(true);for(const page of denied)expect(canPage('assistant',page)).toBe(false);
   for(const tab of ['arduino','backup','logs'])expect(canSettings('assistant',tab)).toBe(false);
 });
 it('profissional mantém clínica sem administração',()=>{
   for(const page of ['dashboard','patients','agenda','baropodometry','new-exam','comparison','questionnaires','exams'] as Page[])expect(canPage('professional',page)).toBe(true);
   for(const page of ['users','calibration'] as Page[])expect(canPage('professional',page)).toBe(false);
   expect(canSettings('professional','arduino')).toBe(false);
 });
 it('admin tem todas as páginas e abas; sessão ausente não acessa',()=>{
   for(const page of ['dashboard','patients','agenda','baropodometry','new-exam','comparison','questionnaires','exams','users','calibration','settings'] as Page[]){expect(canPage('admin',page)).toBe(true);expect(canPage(undefined,page)).toBe(false);}
   for(const tab of ['general','arduino','backup','logs'])expect(canSettings('admin',tab)).toBe(true);
 });
});
