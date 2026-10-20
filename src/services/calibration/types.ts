export type Source = "REAL" | "SIMULATION";
export type Scope = "TOTAL_FORCE_ONLY" | "LOCAL_PRESSURE";
export interface MatCell {
    xMm: number | null;
    yMm: number | null;
    areaMm2: number | null;
    enabled: boolean;
    reason: string;
}
export interface Mat {
    id: string;
    identity: string;
    revision: string;
    firmware: string;
    widthMm: number | null;
    heightMm: number | null;
    pitchXMm: number | null;
    pitchYMm: number | null;
    stripWidthMm: number | null;
    layers: string;
    capacityKg: number | null;
    orientation: "RAW_FLIP_X";
    cells: MatCell[];
    createdAt?: string;
}
export interface TrialSpec {
    classificationCorrection?: {
        fromPurpose: "FIT";
        toPurpose: "VALIDATION";
        profileId: string;
        reason: string;
        operatorId: number;
        createdAt: string;
    };
    kind: "BASELINE" | "TOTAL" | "LOCAL" | "UNIFORM" | "PERSON";
    purpose: "CHARACTERIZATION" | "FIT" | "VALIDATION";
    protocol: string;
    group: string;
    repetition: number;
    cycle: string;
    direction: "UP" | "DOWN" | "HOLD";
    inputValue: number;
    inputUnit: "kg" | "g" | "N" | "kPa" | "kgf/cm2";
    applicatorKg: number;
    areaMm2: number | null;
    uniformConfirmed: boolean;
    region: number[];
    position: string;
    instrument: string;
    referenceResolution: number | null;
    referenceUncertainty: number | null;
    participantCode: string;
    staticConditionsConfirmed: boolean;
    settleSeconds: number;
    durationSeconds: number;
    baselineTrialId: string | null;
    notes: string;
    transport: string;
    port: string;
    baudRate: number;
}
export interface RawFrame {
    receivedMs: number;
    sequence: number | null;
    values: number[];
}
export interface Summary {
    count: number;
    durationMs: number;
    fps: number;
    intervalMeanMs: number;
    intervalSdMs: number;
    means: number[];
    sd: number[];
    min: number[];
    max: number[];
    drift: number[];
    saturated: number[];
    sequenceGaps: number;
    duplicates: number;
}
export interface Trial {
    id: string;
    matId: string;
    source: Source;
    state: string;
    spec: TrialSpec;
    summary: Summary | null;
    reason: string;
    createdAt: string;
    operatorId: number | null;
    importedAt?: string | null;
}
export interface Knot {
    x: number;
    y: number;
}
export interface ValidationResult {
    id: string;
    outcome: "APPROVED" | "FAILED" | "INCONCLUSIVE";
    unit: "N" | "kPa";
    count: number;
    mae: number | null;
    rmse: number | null;
    bias: number | null;
    maxError: number | null;
    rows: {
        trialId: string;
        sensor: number | null;
        reference: number;
        estimated: number | null;
        error: number | null;
        percent: number | null;
    }[];
    reason: string;
    trialIds: string[];
    createdAt: string;
}
export interface Profile {
    id: string;
    matId: string;
    name: string;
    scope: Scope;
    source: Source;
    algorithm: "piecewise-v1";
    baselineTrialId: string;
    baseline: number[];
    noise: number[];
    curves: (Knot[] | null)[];
    fitTrialIds: string[];
    maxError: number;
    minValidationTrials: number;
    minFitLevels: number;
    state: string;
    validations: ValidationResult[];
    createdAt: string;
    active: boolean;
    mat: Mat;
}
export interface PhysicalFrame {
    pressureKPa: (number | null)[];
    statuses: string[];
    totalForceN: number | null;
    partialForceN: number | null;
    meanPressureKPa: number | null;
    maxPressureKPa: number | null;
    contactAreaCm2: number | null;
    copMm: {
        x: number;
        y: number;
    } | null;
    complete: boolean;
}
export interface PhysicalResult {
    schemaVersion: 1;
    profile: Profile;
    matId: string;
    source: Source;
    averaging: "frame";
    frameCount: number;
    rawRetained: boolean;
    mean: PhysicalFrame;
    peakPressureKPa: number | null;
    quality: string;
    warnings: string[];
}
export interface CalibrationData {
    mats: Mat[];
    trials: Trial[];
    profiles: Profile[];
}
