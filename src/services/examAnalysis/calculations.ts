import { applyTare, normalizeMatrixOrientation } from '@/services/acquisition/parser';
import { calculateCop } from '@/services/baropodometry/cop';
import type { PhysicalResult } from '@/services/calibration/types';
import type { RawFrame, SeriesMetadata, AcquisitionQuality, MapMode, RegionRevision, RegionId, TemporalPoint } from './types';

export function correctedFrame(frame: RawFrame, meta: SeriesMetadata): number[] {
  return normalizeMatrixOrientation(applyTare(frame.values, meta.tareBaseline, meta.tareActive));
}
export function mapFromFrames(frames: RawFrame[], meta: SeriesMetadata, mode: MapMode, index = 0): number[] | null {
  if (!frames.length) return null;
  if (mode === 'frame') return frames[index] ? correctedFrame(frames[index], meta) : null;
  const values = Array<number>(225).fill(0);
  for (const frame of frames) {
    const corrected = correctedFrame(frame, meta);
    for (let i = 0; i < 225; i++) values[i] = mode === 'maximum' ? Math.max(values[i], corrected[i]) : values[i] + corrected[i] / frames.length;
  }
  return mode === 'mean' ? values.map(v => Math.round(v * 10) / 10) : values;
}
export function acquisitionQuality(frames: RawFrame[], meta: SeriesMetadata, plannedMs: number, invalidFrames: number | null): AcquisitionQuality {
  const intervals = frames.slice(1).map((f, i) => f.receivedMs - frames[i].receivedMs).filter(t => t > 0);
  const firstMs = frames[0]?.receivedMs ?? null, lastMs = frames[frames.length - 1]?.receivedMs ?? null;
  const observedMs = firstMs !== null && lastMs !== null ? lastMs - firstMs : 0;
  let adcLimitSamples = 0, colorLimitSamples = 0, sequenceResets = 0, sequenceGaps = 0;
  frames.forEach((f, i) => {
    adcLimitSamples += f.values.filter(v => v >= 4095).length;
    colorLimitSamples += correctedFrame(f, meta).filter(v => v >= meta.acquisitionVmax).length;
    const previous = frames[i - 1]?.sequence;
    if (f.sequence !== null && previous != null) {
      if (f.sequence <= previous) sequenceResets++;
      else sequenceGaps += Math.max(0, f.sequence - previous - 1);
    }
  });
  const warnings: string[] = ['Sequência e relógio do computador não comprovam ausência de perdas no firmware ou transporte.'];
  if (invalidFrames === null) warnings.push('Contagem de quadros inválidos indisponível.');
  if (invalidFrames) warnings.push('Linhas inválidas recebidas na janela de coleta.');
  if (sequenceResets || sequenceGaps) warnings.push('Sequência de recepção descontínua.');
  if (frames.length < 2) warnings.push('Quadros insuficientes para medir intervalos.');
  if (adcLimitSamples) warnings.push('Leituras no limite ADC; distinto do limite visual VMAX.');
  return { validFrames: frames.length, invalidFrames, plannedMs, observedMs, firstMs, lastMs,
    intervalMeanMs: intervals.length ? intervals.reduce((a,b) => a+b,0) / intervals.length : null,
    intervalMinMs: intervals.length ? Math.min(...intervals) : null, intervalMaxMs: intervals.length ? Math.max(...intervals) : null,
    largestGapMs: Math.max(firstMs ?? plannedMs, plannedMs - (lastMs ?? 0), ...intervals),
    receptionHz: observedMs > 0 ? (frames.length - 1) * 1000 / observedMs : null,
    framesPerPlannedSecond: plannedMs > 0 ? frames.length * 1000 / plannedMs : 0,
    adcLimitSamples, colorLimitSamples, sampleCount: frames.length * 225, sequenceResets, sequenceGaps, warnings };
}
export function validateMasks(revision: RegionRevision): boolean {
  const cells = Object.values(revision.masks).flat();
  return cells.every(i => Number.isInteger(i) && i >= 0 && i < 225) && new Set(cells).size === cells.length;
}
const pct = (n: number, d: number) => d > 0 ? n / d * 100 : null;
export function regionIndicators(values: number[], threshold: number, revision: RegionRevision, areasMm2?: (number | null)[]) {
  if (!validateMasks(revision)) throw new Error('Regiões sobrepostas ou células inválidas.');
  const total = values.reduce((n, v) => n + (v >= threshold ? v : 0), 0);
  const rows = (Object.keys(revision.masks) as RegionId[]).map(id => {
    const contact = revision.masks[id].filter(i => values[i] >= threshold);
    const sum = contact.reduce((n,i) => n + values[i], 0);
    const areaKnown = areasMm2?.length === 225 && revision.masks[id].every(i => areasMm2[i] !== null && Number.isFinite(areasMm2[i]) && areasMm2[i]! > 0);
    return { id, sum, max: contact.length ? Math.max(...contact.map(i => values[i])) : null, mean: contact.length ? sum / contact.length : null,
      contactCells: contact.length, areaCm2: areaKnown ? contact.reduce((n,i) => n + areasMm2![i]!, 0) / 100 : null, generalPercent: pct(sum,total) };
  });
  const assigned = rows.reduce((n,r) => n+r.sum,0), left = rows[0].sum + rows[1].sum, right = rows[2].sum + rows[3].sum;
  const areaTotal = rows.every(r => r.areaCm2 !== null) ? rows.reduce((n,r) => n+r.areaCm2!,0) : null;
  return { rows: rows.map(r => ({ ...r, assignedPercent: pct(r.sum,assigned), withinFootPercent: pct(r.sum,r.id.startsWith('L') ? left : right), areaPercent: areaTotal === null || r.areaCm2 === null ? null : pct(r.areaCm2,areaTotal) })),
    total, assigned, unassigned: total - assigned, unassignedPercent: pct(total-assigned,total), leftAssignedPercent: pct(left,assigned), rightAssignedPercent: pct(right,assigned),
    anteriorGlobalPercent: pct(rows[0].sum+rows[2].sum,assigned), posteriorGlobalPercent: pct(rows[1].sum+rows[3].sum,assigned) };
}
export function temporalPoints(frames: RawFrame[], meta: SeriesMetadata): TemporalPoint[] {
  return frames.map(f => ({ timestampMs: f.receivedMs, ...(calculateCop(correctedFrame(f,meta),meta.threshold) ?? {x:null,y:null}) }));
}
/** Uma conexão só é contínua com contato em ambos os pontos, dt positivo e dt <= limite técnico declarado. */
export function temporalMetrics(points: TemporalPoint[], gapLimitMs: number, fromMs = 0, toMs = Infinity) {
  const selected = points.filter(p => p.timestampMs >= fromMs && p.timestampMs <= toMs);
  const valid = selected.filter((p): p is TemporalPoint & {x:number;y:number} => p.x !== null && p.y !== null);
  let length = 0, validMs = 0, intervals = 0, speedSum = 0, gaps = 0;
  for (let i = 1; i < selected.length; i++) {
    const a = selected[i-1], b = selected[i], dt = b.timestampMs-a.timestampMs;
    if (a.x === null || a.y === null || b.x === null || b.y === null || dt <= 0 || dt > gapLimitMs) { gaps++; continue; }
    const distance = Math.hypot(b.x-a.x,b.y-a.y);
    length += distance; validMs += dt; speedSum += distance*1000/dt; intervals++;
  }
  const meanX = valid.length ? valid.reduce((n,p) => n+p.x,0)/valid.length : null;
  const meanY = valid.length ? valid.reduce((n,p) => n+p.y,0)/valid.length : null;
  return { length: valid.length ? length : null, validMs, gaps, intervals,
    timeWeightedSpeed: validMs > 0 ? length*1000/validMs : null, intervalMeanSpeed: intervals ? speedSum/intervals : null,
    amplitudeX: valid.length ? Math.max(...valid.map(p => p.x))-Math.min(...valid.map(p => p.x)) : null,
    amplitudeY: valid.length ? Math.max(...valid.map(p => p.y))-Math.min(...valid.map(p => p.y)) : null,
    sdX: meanX === null ? null : Math.sqrt(valid.reduce((n,p) => n+(p.x-meanX)**2,0)/valid.length),
    sdY: meanY === null ? null : Math.sqrt(valid.reduce((n,p) => n+(p.y-meanY)**2,0)/valid.length) };
}
export function temporalGapLimit(quality: AcquisitionQuality): number {
  // Regra exploratória: 3 vezes o intervalo médio observado, limitada pelo watchdog de 2 s.
  return Math.min(2000, Math.max(1, (quality.intervalMeanMs ?? 0) * 3));
}
export function normalizedCellAreas(result?:PhysicalResult|null):(number|null)[]|undefined {
  if(!result)return undefined;
  return Array.from({length:225},(_,i)=>{const cell=result.profile.mat.cells[Math.floor(i/15)*15+14-i%15];return cell?.enabled?cell.areaMm2:null;});
}
export function physicalRegionIndicators(result:PhysicalResult|null|undefined, revision:RegionRevision) {
  if(!result || revision.mode!=='mean' || result.profile.scope!=='LOCAL_PRESSURE' || !result.mean.complete || result.profile.state!=='VALIDATED') return null;
  if(!validateMasks(revision))throw new Error('Regiões sobrepostas.');
  return (Object.keys(revision.masks) as RegionId[]).map(id=>{
    const raw=revision.masks[id].map(i=>Math.floor(i/15)*15+14-i%15);
    if(!raw.length || raw.some(i=>result.mean.pressureKPa[i]===null || result.profile.mat.cells[i]?.areaMm2===null || !result.profile.mat.cells[i]?.enabled))return {id,forceN:null,meanPressureKPa:null,maxPressureKPa:null,areaCm2:null};
    const contact=raw.filter(i=>result.mean.pressureKPa[i]!>0),area=contact.reduce((n,i)=>n+result.profile.mat.cells[i].areaMm2!,0),force=contact.reduce((n,i)=>n+result.mean.pressureKPa[i]!*result.profile.mat.cells[i].areaMm2!/1000,0);
    return {id,forceN:force,meanPressureKPa:area>0?force*1000/area:null,maxPressureKPa:contact.length?Math.max(...contact.map(i=>result.mean.pressureKPa[i]!)):null,areaCm2:area/100};
  });
}
