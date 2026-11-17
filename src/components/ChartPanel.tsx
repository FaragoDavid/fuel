import { useMemo, useState } from 'react';
import type { Fillup } from '../types/fillup';
import type { ChartView } from '../types/ui';
import { formatDate } from '../utils/format';
import { LocalStorage } from '../utils/local-storage';
import SpendChart from './SpendChart';
import ScatterChart from './ScatterChart';
import TabSelect from './TabSelect';
import TravelDistanceChart from './TravelDistanceChart';

const CHART_OPTIONS = [
  { key: 'liters_per_100_km', label: 'Fogyasztás', yUnit: 'l/100km', yDecimals: 1 },
  { key: 'huf_per_liter', label: 'Üzemanyagár', yUnit: 'Ft/l', yDecimals: 0 },
  { key: 'huf_per_km', label: 'Kilométerköltség', yUnit: 'Ft/km', yDecimals: 0 },
  { key: 'cost', label: 'Költség', yUnit: '', yDecimals: 0 },
  { key: 'travel_distance', label: 'Megtett km', yUnit: '', yDecimals: 0 },
] as const;

const CHART_SELECT_OPTIONS = CHART_OPTIONS.map(({ key, label }) => ({ value: key, label }));

const CHART_COLOR = 'var(--chart-color)';

function toTimestamp({ year, month, day }: Fillup): number {
  return new Date(year, month - 1, day).getTime();
}

const VALID_CHART_VIEWS = new Set(CHART_OPTIONS.map((o) => o.key));

export default function ChartPanel({ sortedFillups, onPointClick }: { sortedFillups: Fillup[]; onPointClick: (id: string) => void }) {
  const [chartView, setChartView] = useState<ChartView>(() => {
    const stored = LocalStorage.getChartView();
    return stored && VALID_CHART_VIEWS.has(stored) ? stored : 'liters_per_100_km';
  });
  const [selectedYear, setSelectedYear] = useState<number | null>(() => LocalStorage.getChartYear());
  const activeView = CHART_OPTIONS.find((v) => v.key === chartView)!;

  const availableYears = useMemo(() => [...new Set(sortedFillups.map(({ year }) => year))], [sortedFillups]);

  const yearSelectOptions = useMemo(
    () => [{ value: 'all', label: 'Összes év' }, ...availableYears.map((y) => ({ value: String(y), label: String(y) }))],
    [availableYears],
  );

  const filteredFillups = useMemo(
    () => (selectedYear === null ? sortedFillups : sortedFillups.filter(({ year }) => year === selectedYear)),
    [sortedFillups, selectedYear],
  );

  function handleChartView(view: ChartView) {
    setChartView(view);
    LocalStorage.setChartView(view);
  }

  function handleYearChange(val: string) {
    const year = val === 'all' ? null : parseInt(val);
    setSelectedYear(year);
    if (year === null) LocalStorage.removeChartYear();
    else LocalStorage.setChartYear(year);
  }

  const l100Points = useMemo(() => {
    const points = [];
    for (let index = 1; index < filteredFillups.length; index++) {
      const prev = filteredFillups[index - 1];
      const curr = filteredFillups[index];
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
  }, [filteredFillups]);

  const ftlPoints = useMemo(
    () =>
      filteredFillups
        .filter((fillup) => fillup.totalCost && fillup.liters)
        .map((fillup) => {
          const pricePerLiter = fillup.totalCost! / fillup.liters!;
          return {
            id: fillup.id,
            timestamp: toTimestamp(fillup),
            dateLine: formatDate(fillup.year, fillup.month, fillup.day),
            value: pricePerLiter,
            label: `${pricePerLiter.toFixed(0)} Ft/l`,
          };
        }),
    [filteredFillups],
  );

  const ftkmPoints = useMemo(() => {
    const points = [];
    for (let index = 1; index < filteredFillups.length; index++) {
      const prev = filteredFillups[index - 1];
      const curr = filteredFillups[index];
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
  }, [filteredFillups]);

  const scatterPoints = useMemo(
    () => ({ liters_per_100_km: l100Points, huf_per_liter: ftlPoints, huf_per_km: ftkmPoints }),
    [l100Points, ftlPoints, ftkmPoints],
  );

  return (
    <div className="card mb-6">
      <div className="chart-tabs">
        <div className="sm:hidden">
          <TabSelect value={chartView} onValueChange={(v) => handleChartView(v as ChartView)} options={CHART_SELECT_OPTIONS} />
        </div>
        {CHART_OPTIONS.map((chartOption) => (
          <button
            key={chartOption.key}
            onClick={() => handleChartView(chartOption.key)}
            className={`${chartView === chartOption.key ? 'tab-btn-active' : 'tab-btn'} hidden sm:inline-flex`}
          >
            {chartOption.label}
          </button>
        ))}
        <TabSelect value={selectedYear?.toString() ?? 'all'} onValueChange={handleYearChange} options={yearSelectOptions} />
      </div>
      <div className="chart-body">
        {chartView === 'cost' ? (
          <SpendChart fillups={filteredFillups} multiYear={selectedYear === null} />
        ) : chartView === 'travel_distance' ? (
          <TravelDistanceChart fillups={filteredFillups} multiYear={selectedYear === null} />
        ) : (
          <ScatterChart
            points={scatterPoints[chartView as keyof typeof scatterPoints]}
            yUnit={activeView.yUnit}
            yDecimals={activeView.yDecimals}
            color={CHART_COLOR}
            trendWindow={10}
            onPointClick={onPointClick}
          />
        )}
      </div>
    </div>
  );
}
