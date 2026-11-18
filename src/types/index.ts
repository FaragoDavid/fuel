export interface Fillup {
  id: string;
  year: number;
  month: number; // 1–12
  day: number;
  totalCost?: number;
  liters?: number;
  tripKm?: number;
  odometer?: number; // only present when physically recorded at the pump
  estimated?: true; // tripKm is a derived average, not a real reading
}

export type Unit = 'l' | 'km';
export type Period = 'hét' | 'hó' | 'év';
export type BarChartId = 'spend' | 'distance';

export interface YearLine {
  x: number;
  year: number;
}
export type ScatterChartKey = 'liters_per_100_km' | 'huf_per_liter' | 'huf_per_km';
export type BarChartKey = 'cost' | 'travel_distance';
export type ChartType = ScatterChartKey | BarChartKey;

export interface ChartOption {
  readonly key: ChartType;
  readonly label: string;
}

export interface PeriodTotal {
  key: string;
  total: number;
}

export interface Bar {
  key: string;
  cx: number;
  top: number;
  barW: number;
  total: number;
  label: string;
  xLabel: string;
}
