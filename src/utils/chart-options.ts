import type { ChartOption, ScatterChartKey } from '../types';

export const CHART_OPTIONS: readonly ChartOption[] = [
  { key: 'liters_per_100_km', label: 'Fogyasztás' },
  { key: 'huf_per_liter', label: 'Üzemanyagár' },
  { key: 'huf_per_km', label: 'Kilométerköltség' },
  { key: 'cost', label: 'Költség' },
  { key: 'travel_distance', label: 'Megtett km' },
];

export const SCATTER_OPTIONS: Record<ScatterChartKey, { yUnit: string; yDecimals: number }> = {
  liters_per_100_km: { yUnit: 'l/100km', yDecimals: 1 },
  huf_per_liter: { yUnit: 'Ft/l', yDecimals: 0 },
  huf_per_km: { yUnit: 'Ft/km', yDecimals: 0 },
};
