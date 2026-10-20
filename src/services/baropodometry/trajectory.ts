import { copToCanvas } from './cop';
import type { TemporalPoint } from '@/services/examAnalysis/types';

/** Null coordinates end the segment when contact disappears. */
export function drawTrajectory(ctx: CanvasRenderingContext2D, points: readonly TemporalPoint[], width: number, height: number, gapLimitMs = 2000) {
  ctx.save();
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  let previous: TemporalPoint | null = null;
  for (const point of points) {
    if (point.x === null || point.y === null) { previous = null; continue; }
    const p = copToCanvas({x: point.x, y: point.y}, width, height);
    if (previous && point.timestampMs - previous.timestampMs <= gapLimitMs) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
    previous = point;
  }
  ctx.stroke();
  ctx.restore();
}
