import { useMemo } from 'react';

import { useChartPreferences } from '../hooks/useChartPreferences';
import type { ChartType, Fillup } from '../types';
import { deriveL100Points, deriveFtkmPoints, deriveFtlPoints } from '../utils/derive-scatter-points';
import { CHART_OPTIONS } from '../utils/chart-options';
import ScatterChart from './ScatterChart';
import SpendChart from './SpendChart';
import TabSelect from './TabSelect';
import TravelDistanceChart from './TravelDistanceChart';

const CHART_SELECT_OPTIONS = CHART_OPTIONS.map(({ key, label }) => ({ value: key, label }));

export default function ChartPanel({ sortedFillups, onPointClick }: { sortedFillups: Fillup[]; onPointClick: (id: string) => void }) {
  const { chartType, selectedYear, setChartType, setSelectedYear } = useChartPreferences();

  const availableYears = useMemo(() => [...new Set(sortedFillups.map(({ year }) => year))], [sortedFillups]);

  const yearSelectOptions = useMemo(
    () => [{ value: 'all', label: 'Összes év' }, ...availableYears.map((y) => ({ value: String(y), label: String(y) }))],
    [availableYears],
  );

  const scatterPoints = useMemo(() => {
    const fillups = selectedYear === null ? sortedFillups : sortedFillups.filter(({ year }) => year === selectedYear);
    return {
      liters_per_100_km: deriveL100Points(fillups),
      huf_per_liter: deriveFtlPoints(fillups),
      huf_per_km: deriveFtkmPoints(fillups),
    };
  }, [sortedFillups, selectedYear]);

  return (
    <div className="card mb-6">
      <div className="chart-tabs">
        <div className="sm:hidden">
          <TabSelect value={chartType} onValueChange={(v) => setChartType(v as ChartType)} options={CHART_SELECT_OPTIONS} />
        </div>
        {CHART_OPTIONS.map((chartOption) => (
          <button
            key={chartOption.key}
            onClick={() => setChartType(chartOption.key)}
            className={`${chartType === chartOption.key ? 'tab-btn-active' : 'tab-btn'} hidden sm:inline-flex`}
          >
            {chartOption.label}
          </button>
        ))}
        <TabSelect
          value={selectedYear?.toString() ?? 'all'}
          onValueChange={(v) => setSelectedYear(v === 'all' ? null : parseInt(v))}
          options={yearSelectOptions}
        />
      </div>
      <div className="chart-body">
        {chartType === 'cost' ? (
          <SpendChart fillups={sortedFillups} selectedYear={selectedYear} />
        ) : chartType === 'travel_distance' ? (
          <TravelDistanceChart fillups={sortedFillups} selectedYear={selectedYear} />
        ) : (
          <ScatterChart chartKey={chartType} points={scatterPoints[chartType]} trendWindow={10} onPointClick={onPointClick} />
        )}
      </div>
    </div>
  );
}
