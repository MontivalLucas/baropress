import type { RawFrame } from '@/services/calibration/types';

export const ANALYSIS_VERSION = 'baropress-static-v1' as const;
export type MapMode = 'mean' | 'maximum' | 'frame';
export interface ExamConditions {
  visual: 'unknown' | 'open' | 'closed';
  posture: 'unknown' | 'standing' | 'seated';
  support: 'unknown' | 'none' | 'external';
  positioning: string;
  protocol: string;
  protocolVersion: string;
  informedBy: string;
  notes: string;
}
export interface ExamEvent { timestampMs: number; kind: 'movement' | 'correction' | 'note'; text: string; informedBy: string }
export interface AcquisitionQuality {
  validFrames: number;
  invalidFrames: number | null;
  plannedMs: number;
  observedMs: number;
  firstMs: number | null;
  lastMs: number | null;
  intervalMeanMs: number | null;
  intervalMinMs: number | null;
  intervalMaxMs: number | null;
  largestGapMs: number;
  receptionHz: number | null;
  framesPerPlannedSecond: number;
  adcLimitSamples: number;
  colorLimitSamples: number;
  sampleCount: number;
  sequenceResets: number;
  sequenceGaps: number;
  warnings: string[];
}
export interface SeriesMetadata {
  frameCount: number;
  representation: 'raw-adc-u16';
  clock: 'pc-monotonic-reception';
  sequenceOrigin: 'pc-reception';
  orientation: 'RAW_FLIP_X';
  tareBaseline: number[] | null;
  tareActive: boolean;
  threshold: number;
  acquisitionVmax: number;
  source: 'REAL' | 'SIMULATION';
  transformation: 'tare-then-flip-v1';
}
export type RegionId = 'LA' | 'LP' | 'RA' | 'RP';
export interface RegionRevision {
  version: 1;
  createdAt: string;
  operator: string;
  origin: 'manual-cells';
  mode: MapMode;
  frameIndex: number | null;
  masks: Record<RegionId, number[]>;
}
export interface ExamAnalysis {
  acquisition?: import('@/services/examProtocol').ExamAcquisition | null;
  version: typeof ANALYSIS_VERSION;
  conditions: ExamConditions;
  events: ExamEvent[];
  quality: AcquisitionQuality;
  series: SeriesMetadata;
  regions: RegionRevision[];
}
export interface TemporalPoint { timestampMs: number; x: number | null; y: number | null }
export const unknownConditions = (): ExamConditions => ({ visual: 'unknown', posture: 'unknown', support: 'unknown', positioning: '', protocol: '', protocolVersion: '', informedBy: '', notes: '' });
export const emptyMasks = (): Record<RegionId, number[]> => ({ LA: [], LP: [], RA: [], RP: [] });
export const REGION_LABELS: Record<RegionId, string> = { LA: 'Esquerdo anterior', LP: 'Esquerdo posterior', RA: 'Direito anterior', RP: 'Direito posterior' };
export const MAP_LABELS: Record<MapMode, string> = { mean: 'Média temporal por sensor', maximum: 'Máximos por sensor', frame: 'Quadro individual' };
export type { RawFrame };
