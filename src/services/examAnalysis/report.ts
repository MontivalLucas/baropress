import { acquisitionLabel } from "@/services/examProtocol";
import type { ExamDetails } from '@/types';
import { MAP_LABELS, REGION_LABELS, type RawFrame } from './types';
import { mapFromFrames, regionIndicators, temporalPoints, temporalMetrics, temporalGapLimit, normalizedCellAreas, physicalRegionIndicators } from './calculations';
const n=(v:number|null|undefined,unit='')=>v==null?'Indisponível':`${v.toFixed(3)}${unit}`;
export function analysisLines(exam:Pick<ExamDetails,'analysis'|'matrix'|'threshold'|'physicalResult'>, frames?:RawFrame[]):string[] {
  const a=exam.analysis;
  if(!a)return ['Exame legado: condições, qualidade e série temporal indisponíveis. Indicadores históricos preservados.'];
  const c=a.conditions,q=a.quality;
  const lines=[acquisitionLabel(a.acquisition), `Análise ${a.version} · mapa original: média temporal por sensor · ADC relativo.`,
    `Condições: visão ${{unknown:'não informada',open:'olhos abertos',closed:'olhos fechados'}[c.visual]}; postura ${{unknown:'não informada',standing:'em pé',seated:'sentado'}[c.posture]}; apoio ${{unknown:'não informado',none:'sem apoio',external:'externo'}[c.support]}.`,
    `Posição/orientação: ${c.positioning||'não informada'}. Protocolo: ${c.protocol||'não informado'} / versão ${c.protocolVersion||'não informada'}. Informado por: ${c.informedBy||'não informado'}.`,
    `Notas de condições: ${c.notes||'não informadas'}.`,
    `Qualidade descritiva: ${q.validFrames} quadros válidos; ${q.invalidFrames??'indisponível'} inválidos na janela. Planejada: ${n(q.plannedMs/1000,' s')}; entre primeiro/último: ${n(q.observedMs/1000,' s')}.`,
    `Taxa de recepção (N-1 / intervalo observado): ${n(q.receptionHz,' Hz')}; N / janela planejada: ${n(q.framesPerPlannedSecond,' quadros/s')}. Atualização visual não determina aquisição.`,
    `Intervalo mínimo/médio/máximo: ${n(q.intervalMinMs)}/${n(q.intervalMeanMs)}/${n(q.intervalMaxMs)} ms; maior lacuna, incluindo bordas: ${n(q.largestGapMs,' ms')}.`,
    `Amostras no limite ADC: ${q.adcLimitSamples}/${q.sampleCount}; no limite de cor da coleta VMAX ${a.series.acquisitionVmax}: ${q.colorLimitSamples}/${q.sampleCount}; fora do domínio físico: ${exam.physicalResult?'consultar resultado físico salvo':'indisponível sem perfil'}.`,
    `Sequência do computador: ${q.sequenceResets} reinício(s)/duplicata(s), ${q.sequenceGaps} lacuna(s). Relógio: recepção monotônica no computador.`,...q.warnings,
    ...a.events.map(e=>`Evento ${(e.timestampMs/1000).toFixed(3)} s / ${e.kind}: ${e.text}; informado por ${e.informedBy}.`)];
  const r=a.regions[a.regions.length-1];
  if(r){const values=r.mode==='mean'?exam.matrix:frames?mapFromFrames(frames,a.series,r.mode,r.frameIndex??0):null;
    lines.push(`Regiões geométricas manuais v${r.version}, revisão ${a.regions.length}: ${r.operator}; ${r.createdAt}; ${MAP_LABELS[r.mode]}${r.mode==='frame'?` / quadro ${(r.frameIndex??0)+1}`:''}.`);
    if(values){const result=regionIndicators(values,a.series.threshold,r,normalizedCellAreas(exam.physicalResult));for(const row of result.rows)lines.push(`${REGION_LABELS[row.id]}: máximo ${n(row.max)} ADC; média ${n(row.mean)} ADC; soma ${n(row.sum)} ADC; ${row.contactCells} células em contato; ${n(row.generalPercent)}% geral; ${n(row.assignedPercent)}% atribuído; ${n(row.withinFootPercent)}% dentro do pé; área ${n(row.areaCm2,' cm²')}; ${n(row.areaPercent)}% da área atribuída.`);
      lines.push(`Parcela não atribuída ${n(result.unassignedPercent)}% geral. Esquerdo/direito ${n(result.leftAssignedPercent)}/${n(result.rightAssignedPercent)}% do total atribuído. Anterior/posterior ${n(result.anteriorGlobalPercent)}/${n(result.posteriorGlobalPercent)}% atribuído.`);
    }else lines.push('Indicadores desta revisão exigem carregar a série temporal.');
    const physical=physicalRegionIndicators(exam.physicalResult,r);
    if(physical){lines.push('Derivação física regional do mapa médio de pressão por sensor; contato físico > 0 kPa; média ponderada pela área efetiva. Não equivale à média das pressões máximas por quadro.');for(const row of physical)lines.push(`${REGION_LABELS[row.id]}: força ${n(row.forceN,' N')}; pressão média ponderada ${n(row.meanPressureKPa,' kPa')}; máximo do mapa médio ${n(row.maxPressureKPa,' kPa')}; área de contato do mapa médio físico ${n(row.areaCm2,' cm²')}.`);}else lines.push('Indicadores físicos regionais indisponíveis: exigem modo médio e perfil local validado com cobertura completa.');
  } else lines.push('Regiões por pé não definidas; indicadores bilaterais antigos usam metades fixas.');
  if(frames){const gap=temporalGapLimit(q),m=temporalMetrics(temporalPoints(frames,a.series),gap);lines.push(`Oscilação ADC relativa v1, sem filtro; lacuna técnica > ${n(gap,' ms')}; ausência de contato separa segmentos.`,
    `Comprimento ${n(m.length,' células')}; duração contínua ${n(m.validMs/1000,' s')}; velocidade ponderada ${n(m.timeWeightedSpeed,' células/s')}; média por intervalo ${n(m.intervalMeanSpeed,' células/s')}.`,
    `Amplitude X/Y ${n(m.amplitudeX)}/${n(m.amplitudeY)} células; desvio populacional X/Y ${n(m.sdX)}/${n(m.sdY)} células; ${m.gaps} interrupções.`);
  } else lines.push('Oscilação completa requer os quadros; tempos legados não têm precisão comprovada.');
  lines.push('Unidades ADC e centro relativo não representam pressão local ou CoP físico validado. Contato: valor >= limiar; limiar zero inclui zeros.');
  return lines;
}
