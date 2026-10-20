/** Marca: grade 3×3 de pressão com um pico de calor — referência à matriz de sensores. */
const heat = [0.1, 0.25, 0.1, 0.3, 0.9, 0.45, 0.15, 0.55, 0.2];
export function Logo({ size = 28 }: { size?: number }) {
  const cell = size / 3 - 1.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {heat.map((h, i) => (
        <rect key={i} x={(i % 3) * (cell + 2.25)} y={Math.floor(i / 3) * (cell + 2.25)} width={cell} height={cell} rx={2}
          fill={h > 0.7 ? "#F59E0B" : "rgb(var(--brand))"} opacity={h > 0.7 ? 1 : 0.25 + h} />
      ))}
    </svg>
  );
}
