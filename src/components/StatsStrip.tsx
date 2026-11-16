import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { Fillup } from '../types/fillup';
import { deriveEfficiencies } from '../utils/derive-efficiencies';
import { formatNum, formatHuf } from '../utils/format';
import CyclingRateStat from './CyclingRateStat';

interface Props {
  sortedFillups: Fillup[];
}

export default function StatsStrip({ sortedFillups }: Props) {
  const stats = useMemo(() => {
    const efficiencies = [...deriveEfficiencies(sortedFillups).values()];

    const costsPerHundredKm = sortedFillups
      .filter(({ totalCost, tripKm, estimated }) => totalCost && tripKm && !estimated)
      .map(({ totalCost, tripKm }) => (totalCost! / tripKm!) * 100);

    const totalLiters = sortedFillups.filter(({ liters }) => liters).reduce((sum, f) => sum + f.liters!, 0);
    const totalKm = sortedFillups.filter(({ tripKm }) => tripKm).reduce((sum, f) => sum + f.tripKm!, 0);

    let spanDays = 0;
    if (sortedFillups.length >= 2) {
      const first = sortedFillups[0];
      const last = sortedFillups[sortedFillups.length - 1];
      spanDays = differenceInDays(new Date(last.year, last.month - 1, last.day), new Date(first.year, first.month - 1, first.day));
    }

    return {
      avgL100: efficiencies.length ? efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length : null,
      avgFtPer100km: costsPerHundredKm.length ? costsPerHundredKm.reduce((sum, v) => sum + v, 0) / costsPerHundredKm.length : null,
      totalLiters,
      totalKm,
      spanDays,
    };
  }, [sortedFillups]);

  return (
    <div className="stats-grid">
      <Stat label="Átlag l/100km" value={stats.avgL100 ? formatNum(stats.avgL100, 1) : '—'} />
      <Stat label="Átlag Ft/100km" value={stats.avgFtPer100km ? formatHuf(Math.round(stats.avgFtPer100km)) : '—'} />
      <CyclingRateStat totalLiters={stats.totalLiters} totalKm={stats.totalKm} spanDays={stats.spanDays} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
