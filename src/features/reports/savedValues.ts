export function savedNumber(value: number | null | undefined, digits = 1, suffix = ""): string {
  return value != null && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "Não disponível";
}
export function lateralDistribution(left: number | null | undefined, right: number | null | undefined) {
  const available = left != null && right != null && Number.isFinite(left) && Number.isFinite(right);
  return { available, leftText: savedNumber(left, 1, "%"), rightText: savedNumber(right, 1, "%"), leftWidth: available ? left : 0, rightWidth: available ? right : 0 };
}
