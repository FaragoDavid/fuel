import { useMemo } from 'react';

import { useChartPreferences } from '../hooks/useChartPreferences';
import type { ChartOption, ChartType, Fillup } from '../types';
import { deriveL100Points, deriveFtkmPoints, deriveFtlPoints } from '../utils/derive-scatter-points';
import ScatterChart from './ScatterChart';
import SpendChart from './SpendChart';
import TabSelect from './TabSelect';
import TravelDistanceChart from './TravelDistanceChart';

const CHART_OPTIONS: readonly ChartOption[] = [
  { key: 'liters_per_100_km', kind: 'scatter', label: 'Fogyasztás', yUnit: 'l/100km', yDecimals: 1 },
  { key: 'huf_per_liter', kind: 'scatter', label: 'Üzemanyagár', yUnit: 'Ft/l', yDecimals: 0 },
  { key: 'huf_per_km', kind: 'scatter', label: 'Kilométerköltség', yUnit: 'Ft/km', yDecimals: 0 },
  { key: 'cost', kind: 'bar', label: 'Költség', BarComponent: SpendChart },
  { key: 'travel_distance', kind: 'bar', label: 'Megtett km', BarComponent: TravelDistanceChart },
];

const CHART_SELECT_OPTIONS = CHART_OPTIONS.map(({ key, label }) => ({ value: key, label }));

export default function ChartPanel({ sortedFillups, onPointClick }: { sortedFillups: Fillup[]; onPointClick: (id: string) => void }) {
  const { chartType, selectedYear, setChartType, setSelectedYear } = useChartPreferences();
  const activeView = CHART_OPTIONS.find((v) => v.key === chartType)!;

  const availableYears = useMemo(() => [...new Set(sortedFillups.map(({ year }) => year))], [sortedFillups]);

  const yearSelectOptions = useMemo(
    () => [{ value: 'all', label: 'Összes év' }, ...availableYears.map((y) => ({ value: String(y), label: String(y) }))],
    [availableYears],
  );

  const filteredFillups = useMemo(
    () => (selectedYear === null ? sortedFillups : sortedFillups.filter(({ year }) => year === selectedYear)),
    [sortedFillups, selectedYear],
  );

  const scatterPoints = useMemo(
    () => ({
      liters_per_100_km: deriveL100Points(filteredFillups),
      huf_per_liter: deriveFtlPoints(filteredFillups),
      huf_per_km: deriveFtkmPoints(filteredFillups),
    }),
    [filteredFillups],
  );

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
        {activeView.kind === 'bar' ? (
          <activeView.BarComponent fillups={sortedFillups} selectedYear={selectedYear} />
        ) : (
          <ScatterChart
            points={scatterPoints[activeView.key]}
            yUnit={activeView.yUnit}
            yDecimals={activeView.yDecimals}
            trendWindow={10}
            onPointClick={onPointClick}
          />
        )}
      </div>
    </div>
  );
}
