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
export type ChartType = 'liters_per_100_km' | 'huf_per_liter' | 'huf_per_km' | 'cost' | 'travel_distance';

export interface PeriodTotal {
  key: string;
  total: number;
}
