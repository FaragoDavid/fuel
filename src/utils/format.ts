export const MONTHS = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

export function formatNum(n: number): string {
  return new Intl.NumberFormat('hu-HU', { useGrouping: 'always' as unknown as boolean }).format(n);
}

export function formatHuf(amount: number): string {
  return formatNum(amount) + ' Ft';
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}. ${MONTHS[month - 1]} ${day}.`;
}

export function efficiencyColor(value: number, min: number, max: number): string {
  if (min === max) return 'hsl(120, 60%, 65%)';
  const normalized = (value - min) / (max - min);
  const hue = Math.round(120 * (1 - normalized));
  return `hsl(${hue}, 70%, 65%)`;
}
