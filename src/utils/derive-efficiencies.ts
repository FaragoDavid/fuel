import type { Fillup } from '../types/fillup';

export function deriveEfficiencies(sorted: Fillup[]): Map<string, number> {
  const efficiencyById = new Map<string, number>();
  for (let index = 1; index < sorted.length; index++) {
    const prev = sorted[index - 1];
    const curr = sorted[index];
    if (!prev.liters || !curr.tripKm || curr.estimated || prev.estimated) continue;
    efficiencyById.set(curr.id, (prev.liters / curr.tripKm) * 100);
  }
  return efficiencyById;
}
