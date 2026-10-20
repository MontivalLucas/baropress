import { describe,expect,it } from 'vitest';
import { DEFAULT_APP_PREFERENCES,formatClock,normalizePreferences } from '@/services/preferences';
import { createSerialWriter } from '@/services/serialWriter';
describe('Fase 11 — preferências e recuperação',()=>{
  it('valida duração, escala, resolução e baud rate antes de salvar',()=>{const p=normalizePreferences({durationSeconds:Infinity,baudRate:0,visualization:{...DEFAULT_APP_PREFERENCES.visualization,vmax:99999,resolution:999}});expect(p.durationSeconds).toBe(30);expect(p.baudRate).toBe(115200);expect(p.visualization.vmax).toBe(4095);expect(p.visualization.resolution).toBe(300);expect(formatClock(60)).toBe('01:00');});
  it('aguarda gravações antes de restaurar e recupera a fila após uma falha',async()=>{const seen:number[]=[];let release!:()=>void;const writer=createSerialWriter<number>(async(value)=>{seen.push(value);if(value===1)await new Promise<void>((resolve)=>{release=resolve;});if(value===2)throw new Error('Falha simulada');});const first=writer.save(1);const second=writer.save(2);const caught=second.catch(()=>{});const third=writer.save(3);await Promise.resolve();await Promise.resolve();expect(seen).toEqual([1]);release();await first;await caught;await third;await writer.wait();expect(seen).toEqual([1,2,3]);});
});
