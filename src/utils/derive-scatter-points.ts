import type { Fillup } from '../types';
import { formatDate } from './format';

export interface ScatterPoint {
  id: string;
  timestamp: number;
  dateLine: string;
  value: number;
  label: string;
}

function toTimestamp({ year, month, day }: Fillup): number {
  return new Date(year, month - 1, day).getTime();
}

export function deriveL100Points(fillups: Fillup[]): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (let i = 1; i < fillups.length; i++) {
    const prev = fillups[i - 1];
    const curr = fillups[i];
    if (!prev.liters || !curr.tripKm || curr.estimated || prev.estimated) continue;
    const l100 = (prev.liters / curr.tripKm) * 100;
    points.push({
      id: curr.id,
      timestamp: toTimestamp(curr),
      dateLine: formatDate(curr.year, curr.month, curr.day),
      value: l100,
      label: `${l100.toFixed(1)} l/100km`,
    });
  }
  return points;
}

export function deriveFtlPoints(fillups: Fillup[]): ScatterPoint[] {
  return fillups
    .filter((f) => f.totalCost && f.liters)
    .map((f) => {
      const pricePerLiter = f.totalCost! / f.liters!;
      return {
        id: f.id,
        timestamp: toTimestamp(f),
        dateLine: formatDate(f.year, f.month, f.day),
        value: pricePerLiter,
        label: `${pricePerLiter.toFixed(0)} Ft/l`,
      };
    });
}

export function deriveFtkmPoints(fillups: Fillup[]): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (let i = 1; i < fillups.length; i++) {
    const prev = fillups[i - 1];
    const curr = fillups[i];
    if (!prev.totalCost || !curr.tripKm) continue;
    const costPerKm = prev.totalCost / curr.tripKm;
    points.push({
      id: curr.id,
      timestamp: toTimestamp(curr),
      dateLine: formatDate(curr.year, curr.month, curr.day),
      value: costPerKm,
      label: `${costPerKm.toFixed(0)} Ft/km`,
    });
  }
  return points;
}
