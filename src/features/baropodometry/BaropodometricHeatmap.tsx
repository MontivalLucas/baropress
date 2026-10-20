import React, { useEffect, useRef, useMemo } from "react";
import clsx from "clsx";
import { drawTrajectory } from '@/services/baropodometry/trajectory';
import type { TemporalPoint } from '@/services/examAnalysis/types';
import {
  copToCanvas,
  createInterpolationWorkspace,
  interpolateGrid,
  renderInterpolatedToImageData,
  type CopPoint,
  type HeatmapConfig,
} from "@/services/baropodometry";

interface BaropodometricHeatmapProps {
  values: number[]; // 225 valores após tara e normalização de orientação
  config: HeatmapConfig;
  cop: CopPoint | null;
  className?: string;
  trajectory?: readonly TemporalPoint[] | null;
  trajectoryGapMs?: number;
}

export const BaropodometricHeatmap: React.FC<BaropodometricHeatmapProps> = ({
  values,
  config,
  cop,
  className,
  trajectory,
  trajectoryGapMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Buffer offscreen e ImageData reutilizados para alta performance (zero GC stutter)
  const offscreen = useMemo(() => {
    const res = config.resolution || 300;
    const canvas = document.createElement("canvas");
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const imgData = ctx?.createImageData(res, res) || null;
    return { canvas, ctx, imgData, res, workspace: createInterpolationWorkspace(res, res) };
  }, [config.resolution]);

  const lastRenderTime = useRef<number>(0);
  const prevConfigRef = useRef<HeatmapConfig>(config);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreen.ctx || !offscreen.imgData) return;

    // Verifica se os parâmetros visuais mudaram (se sim, redesenha imediatamente para feedback instantâneo)
    const configChanged =
      prevConfigRef.current.gamma !== config.gamma ||
      prevConfigRef.current.vmax !== config.vmax ||
      prevConfigRef.current.threshold !== config.threshold ||
      prevConfigRef.current.smoothing !== config.smoothing ||
      prevConfigRef.current.resolution !== config.resolution ||
      prevConfigRef.current.showCop !== config.showCop;

    prevConfigRef.current = config;

    // Controle de taxa de renderização (FPS visual) desacoplado da frequência do ESP32
    const targetFps = config.renderFps || 30;
    const minIntervalMs = 1000 / targetFps;
    const now = performance.now();
    const elapsed = now - lastRenderTime.current;

    if (!configChanged && elapsed < minIntervalMs - 2) {
      return;
    }

    lastRenderTime.current = now;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const res = offscreen.res;

    // 1. Limpa o canvas principal com fundo da plataforma
    ctx.clearRect(0, 0, width, height);

    // Desenha superfície neutra da esteira com borda sutil
    ctx.fillStyle = "#0a0f1d";
    ctx.fillRect(0, 0, width, height);

    // Linha média sagital discreta (separação anatômica entre esquerda e direita)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 8);
    ctx.lineTo(width / 2, height - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Interpola os 225 sensores para a grade contínua de alta resolução (res x res)
    const smoothingVal = config.smoothing !== undefined ? config.smoothing : 0.35;
    const interpolated = interpolateGrid(values, res, res, smoothingVal, offscreen.workspace);

    // 3. Converte a grade interpolada para cores RGBA com transição suave de threshold
    renderInterpolatedToImageData(interpolated, res, res, config, offscreen.imgData);
    offscreen.ctx.putImageData(offscreen.imgData, 0, 0);

    // 4. Renderiza a superfície contínua interpolada no canvas visível com interpolação de alta qualidade
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(offscreen.canvas, 0, 0, width, height);
    if (trajectory) drawTrajectory(ctx, trajectory, width, height, trajectoryGapMs);

    // 5. Desenha o marcador do Centro de Pressão (CoP) se habilitado e presente
    if (config.showCop && cop) {
      const pos = copToCanvas(cop, width, height);

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Sombra projetada do CoP
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Anel externo branco de alto contraste
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Retículo central
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ponto focal central (âmbar)
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      // Tag de texto CoP
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.beginPath();
      ctx.roundRect(10, -10, 30, 16, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CoP", 25, -2);

      ctx.restore();
    }
  }, [values, config, cop, offscreen, trajectory, trajectoryGapMs]);

  return (
    <div
      className={clsx(
        "relative flex items-center justify-center select-none h-full w-full min-h-0 min-w-0 overflow-hidden",
        className
      )}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-line/80 bg-[#0a0f1d] aspect-square h-full max-h-full max-w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={520}
          height={520}
          className="w-full h-full object-contain block"
        />

        {/* Indicadores sutis de orientação da esteira */}
        <div className="absolute top-1.5 left-2.5 text-[9px] uppercase tracking-wider font-mono text-white/25 pointer-events-none">
          Superior / Anterior
        </div>
        <div className="absolute bottom-1.5 left-2.5 text-[9px] uppercase tracking-wider font-mono text-white/25 pointer-events-none">
          Inferior / Posterior
        </div>
        <div className="absolute bottom-1.5 right-2.5 text-[9px] uppercase tracking-wider font-mono text-white/25 pointer-events-none">
          15×15
        </div>
      </div>
    </div>
  );
};
