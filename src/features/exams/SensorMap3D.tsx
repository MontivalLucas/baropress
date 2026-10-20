import { useState } from 'react';
import { PRECOMPUTED_COLOR_LUT } from '@/services/baropodometry/heatmap';
import { applyGamma,normalizeValue } from '@/services/baropodometry/normalization';
export function SensorMap3D({values,vmax,gamma,threshold}:{values:number[];vmax:number;gamma:number;threshold:number}) {
  const [rotation,setRotation]=useState(35),[zoom,setZoom]=useState(1);
  const angle=rotation*Math.PI/180;
  const cells=values.map((v,i)=>{const x=i%15-7,y=Math.floor(i/15)-7;return {i,v,x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};}).sort((a,b)=>a.y-b.y);
  return <div><p className="text-xs">Altura = ADC / VMAX · sensores discretos · representação dos sensores, sem reconstrução anatômica.</p><div className="flex gap-4 text-xs"><label>Rotação<input aria-label="Rotação 3D" type="range" min={0} max={360} value={rotation} onChange={e=>setRotation(Number(e.target.value))}/></label><label>Zoom<input aria-label="Zoom 3D" type="range" min={0.6} max={1.5} step={0.05} value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label></div>
    <svg viewBox="0 0 420 280" role="img" aria-label="Vista tridimensional dos 225 sensores ADC" className="w-full bg-slate-950 rounded"><g transform={`translate(210 185) scale(${zoom})`}>{cells.map(c=>{const h=normalizeValue(c.v,vmax)*100, offset=Math.round(applyGamma(normalizeValue(c.v,vmax),gamma)*255)*4, lut=PRECOMPUTED_COLOR_LUT, color=c.v<threshold?'#334155':`rgb(${lut[offset]},${lut[offset+1]},${lut[offset+2]})`;return <g key={c.i}><line x1={c.x*15} x2={c.x*15} y1={c.y*7} y2={c.y*7-h} stroke={color} strokeWidth={9}/><ellipse cx={c.x*15} cy={c.y*7-h} rx={4.5} ry={2.2} fill={color}><title>Sensor {c.i}: {c.v.toFixed(1)} ADC</title></ellipse></g>})}</g></svg><p className="text-xs">Escala 0–{vmax} ADC; valores acima de VMAX têm altura limitada. A leitura original é preservada.</p>
  </div>;
}
