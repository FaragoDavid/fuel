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
