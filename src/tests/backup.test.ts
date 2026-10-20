import { describe, expect, it } from 'vitest';
import { backupFileName, examMatrixCsv } from '@/features/backup/exportUtils';
import type { ExamDetails } from '@/types';
describe('Fase 10 — exportação',()=>{
  it('exporta CSV com coordenadas suficientes para reconstruir a matriz',()=>{const exam={id:1,patientId:2,source:'REAL',matrix:Array.from({length:225},(_,i)=>i+0.5)} as ExamDetails;const rows=examMatrixCsv(exam).trim().split('\r\n').slice(1).map((r)=>r.split(','));expect(rows).toHaveLength(225);expect(rows[224].slice(0,4)).toEqual(['224','14','14','224.5']);expect(rows.map((r)=>Number(r[3]))).toEqual(exam.matrix);});
  it('rejeita exportação incompleta e nomeia backups sem caracteres proibidos',()=>{expect(()=>examMatrixCsv({matrix:[1]} as ExamDetails)).toThrow();expect(backupFileName(1,new Date('2026-10-06T12:00:00Z'))).toContain('paciente_1');expect(backupFileName()).not.toMatch(/[:*?<>|]/);});
});
