import { differenceInDays } from 'date-fns';

import type { Fillup } from '../types';
import { deriveEfficiencies } from './derive-efficiencies';

export function deriveAvgL100(fillups: Fillup[]): number | null {
  const efficiencies = [...deriveEfficiencies(fillups).values()];
  return efficiencies.length ? efficiencies.reduce((sum, v) => sum + v, 0) / efficiencies.length : null;
}

export function deriveAvgFtPer100km(fillups: Fillup[]): number | null {
  const costs = fillups
    .filter(({ totalCost, tripKm, estimated }) => totalCost && tripKm && !estimated)
    .map(({ totalCost, tripKm }) => (totalCost! / tripKm!) * 100);
  return costs.length ? costs.reduce((sum, v) => sum + v, 0) / costs.length : null;
}

export function deriveTotalLiters(fillups: Fillup[]): number {
  return fillups.filter(({ liters }) => liters).reduce((sum, f) => sum + f.liters!, 0);
}

export function deriveTotalKm(fillups: Fillup[]): number {
  return fillups.filter(({ tripKm }) => tripKm).reduce((sum, f) => sum + f.tripKm!, 0);
}

export function deriveSpanDays(fillups: Fillup[]): number {
  if (fillups.length < 2) return 0;
  const first = fillups[0];
  const last = fillups[fillups.length - 1];
  return differenceInDays(new Date(last.year, last.month - 1, last.day), new Date(first.year, first.month - 1, first.day));
}
