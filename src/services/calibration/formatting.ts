import type { PhysicalResult } from "./types";
import { kpaToKgfCm2, nToKgf } from "./math";
export const physicalNumber = (n: number | null | undefined, unit: string) => n === null || n === undefined ? "Indisponível" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
export function physicalLines(result: PhysicalResult): string[] {
    const r = result.mean;
    return [
        `Perfil: ${result.profile.name} | ${result.profile.id}`,
        `Tapete: ${result.profile.mat.identity} | revisao ${result.profile.mat.revision}`,
        `Origem: ${result.source} | qualidade: ${result.quality}`,
        `Forca total media: ${physicalNumber(r.totalForceN, "N")} | ${physicalNumber(r.totalForceN === null ? null : nToKgf(r.totalForceN), "kgf")}`,
        `Pressao media de contato (media dos quadros): ${physicalNumber(r.meanPressureKPa, "kPa")}`,
        `Pressao media: ${physicalNumber(r.meanPressureKPa === null ? null : kpaToKgfCm2(r.meanPressureKPa), "kgf/cm²")}`,
        `Pico discreto do mapa medio: ${physicalNumber(r.maxPressureKPa, "kPa")}`,
        `Pico temporal durante exame: ${physicalNumber(result.peakPressureKPa, "kPa")}`,
        `Area media de contato estimada: ${physicalNumber(r.contactAreaCm2, "cm²")}`,
        `CoP medio dos quadros: X ${physicalNumber(r.copMm?.x, "mm")} | Y ${physicalNumber(r.copMm?.y, "mm")}`,
        `Amostras: ${result.frameCount} | media por quadro | bruto ${result.rawRetained ? "preservado" : "nao preservado"}`,
        "Faixa e erro: consultar curvas/validacao do perfil. Incerteza nao determinada.",
    ];
}
