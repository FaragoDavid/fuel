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

  static getChartYear(): number | null {
    return Number(localStorage.getItem('fuel_distance_year')) || null;
  }
  static setChartYear(year: number): void {
    localStorage.setItem('fuel_distance_year', String(year));
  }
  static removeChartYear(): void {
    localStorage.removeItem('fuel_distance_year');
  }

  static getSpendPeriod(): Period | null {
    return localStorage.getItem('fuel_spend_period') as Period | null;
  }
  static setSpendPeriod(v: Period): void {
    localStorage.setItem('fuel_spend_period', v);
  }

  static getDistancePeriod(): Period | null {
    return localStorage.getItem('fuel_distance_period') as Period | null;
  }
  static setDistancePeriod(v: Period): void {
    localStorage.setItem('fuel_distance_period', v);
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
