import { useState } from 'react';

import type { ChartType } from '../types';
import { LocalStorage } from '../utils/local-storage';

const VALID_CHART_TYPES = new Set<ChartType>(['liters_per_100_km', 'huf_per_liter', 'huf_per_km', 'cost', 'travel_distance']);

export function useChartPreferences() {
  const [chartType, setChartTypeState] = useState<ChartType>(() => {
    const stored = LocalStorage.getChartType();
    return stored && VALID_CHART_TYPES.has(stored) ? stored : 'liters_per_100_km';
  });

  const [selectedYear, setSelectedYearState] = useState<number | null>(() => LocalStorage.getChartYear());

  function setChartType(type: ChartType) {
    setChartTypeState(type);
    LocalStorage.setChartType(type);
  }

  function setSelectedYear(year: number | null) {
    setSelectedYearState(year);
    if (year === null) LocalStorage.removeChartYear();
    else LocalStorage.setChartYear(year);
  }

  return { chartType, selectedYear, setChartType, setSelectedYear };
}
