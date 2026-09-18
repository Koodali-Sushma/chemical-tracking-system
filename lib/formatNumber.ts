export function formatNumber(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
