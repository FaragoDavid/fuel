import type { Unit, Period, ChartView } from '../types/ui';

export class LocalStorage {
  static getFillups(): string | null {
    return localStorage.getItem('fuel_fillups');
  }
  static setFillups(v: string): void {
    localStorage.setItem('fuel_fillups', v);
  }

  static getChartView(): ChartView | null {
    return localStorage.getItem('fuel_chart') as ChartView | null;
  }
  static setChartView(v: ChartView): void {
    localStorage.setItem('fuel_chart', v);
  }

  static getDistanceYear(): number | null {
    return Number(localStorage.getItem('fuel_distance_year')) || null;
  }
  static setDistanceYear(year: number): void {
    localStorage.setItem('fuel_distance_year', String(year));
  }
  static removeDistanceYear(): void {
    localStorage.removeItem('fuel_distance_year');
  }

  static getStatUnit(): Unit | null {
    return localStorage.getItem('cyclingRateStat.unit') as Unit | null;
  }
  static setStatUnit(v: Unit): void {
    localStorage.setItem('cyclingRateStat.unit', v);
  }

  static getStatPeriod(): Period | null {
    return localStorage.getItem('cyclingRateStat.period') as Period | null;
  }
  static setStatPeriod(v: Period): void {
    localStorage.setItem('cyclingRateStat.period', v);
  }
}
