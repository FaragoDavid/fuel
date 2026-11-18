import { useMemo } from 'react';

import type { Fillup } from '../types';
import { deriveAvgFtPer100km, deriveAvgL100, deriveSpanDays, deriveTotalKm, deriveTotalLiters } from '../utils/derive-stats';
import { formatHuf, formatNum } from '../utils/format';
import CyclingRateStat from './CyclingRateStat';

interface Props {
  sortedFillups: Fillup[];
}

export default function StatsStrip({ sortedFillups }: Props) {
  const stats = useMemo(
    () => ({
      avgL100: deriveAvgL100(sortedFillups),
      avgFtPer100km: deriveAvgFtPer100km(sortedFillups),
      totalLiters: deriveTotalLiters(sortedFillups),
      totalKm: deriveTotalKm(sortedFillups),
      spanDays: deriveSpanDays(sortedFillups),
    }),
    [sortedFillups],
  );

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
