import { describe, expect, it } from "vitest";
import { blankQuestion, formatAnswer, validateAnswer, validateTemplate } from "@/features/questionnaires/questionnaireUtils";
describe('Fase 9 — questionários',()=>{
  it('preserva zero numérico e resposta Não como respostas preenchidas',()=>{expect(validateAnswer({...blankQuestion(),type:'number',required:true},0)).toBeNull();expect(validateAnswer({...blankQuestion(),type:'yesno',required:true},false)).toBeNull();expect(formatAnswer(false)).toBe('Não');expect(formatAnswer(0)).toBe('0');});
  it('verifica obrigatoriedade e opções de seleção',()=>{const q={...blankQuestion(),question:'Seleção',required:true,type:'multi' as const,options:['A','B']};expect(validateAnswer(q,[])).toBeTruthy();expect(validateAnswer(q,['A','A'])).toBeTruthy();expect(validateAnswer(q,['C'])).toBeTruthy();expect(validateAnswer(q,['A','B'])).toBeNull();expect(validateAnswer({...q,active:false},undefined)).toBeNull();});
  it('valida modelos e opções repetidas após remover espaços',()=>{const q={...blankQuestion(),question:'Teste',type:'single' as const,options:['A',' A ']};expect(validateTemplate({id:null,name:'Modelo',description:null,active:true,questions:[q]})).toBeTruthy();q.options=['A','B'];expect(validateTemplate({id:null,name:'Modelo',description:null,active:true,questions:[q]})).toBeNull();});
});
