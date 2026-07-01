import { useMemo } from 'react';
import type { Fillup } from '../types/fillup';
import { formatHuf } from '../utils/format';
import { deriveEfficiencies } from '../utils/derive-efficiencies';

interface Props {
  sortedFillups: Fillup[];
}

export default function StatsStrip({ sortedFillups }: Props) {
  const stats = useMemo(() => {
    const efficiencies = [...deriveEfficiencies(sortedFillups).values()];

    const pricesPerLiter = sortedFillups
      .filter(({ totalCost, liters }) => totalCost && liters)
      .map(({ totalCost, liters }) => totalCost! / liters!);

    return {
      totalSpend: sortedFillups.filter(({ totalCost }) => totalCost).reduce((sum, fillup) => sum + fillup.totalCost!, 0),
      avgL100: efficiencies.length ? efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length : null,
      avgPricePerLiter: pricesPerLiter.length ? pricesPerLiter.reduce((sum, price) => sum + price, 0) / pricesPerLiter.length : null,
      fillupCount: sortedFillups.length,
    };
  }, [sortedFillups]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      <Stat label="Tankolások" value={String(stats.fillupCount)} />
      <Stat label="Összes költség" value={formatHuf(stats.totalSpend)} />
      <Stat label="Átlag l/100km" value={stats.avgL100 ? stats.avgL100.toFixed(1) : '—'} />
      <Stat label="Átlag Ft/l" value={stats.avgPricePerLiter ? stats.avgPricePerLiter.toFixed(0) + ' Ft' : '—'} />
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
