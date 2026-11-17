import { addDays, differenceInCalendarDays, endOfISOWeek, format, startOfISOWeek } from 'date-fns';

import type { ChartType, Fillup, Period, PeriodTotal } from '../types';
import { MONTHS } from './format';

export function weekStartLabel(key: string): string {
  const year = parseInt(key.slice(0, 4));
  const week = parseInt(key.slice(6));
  const monday = startOfISOWeek(new Date(year, 0, 4 + (week - 1) * 7));
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function distributeByWeek(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  const totals = new Map<string, number>();
  const weekKey = (d: Date) => format(d, "RRRR-'W'II");

  for (let i = 0; i < fillups.length; i++) {
    const fillup = fillups[i];
    let value;
    if (chartType === 'travel_distance') value = fillup.tripKm;
    else if (chartType === 'cost') value = fillup.totalCost;
    else throw new Error(`Periods unimplemented for chart ${chartType}`);
    if (!value) continue;

    const endDate = new Date(fillup.year, fillup.month - 1, fillup.day);
    const prev = fillups[i - 1];

    if (!prev) {
      const key = weekKey(endDate);
      totals.set(key, (totals.get(key) ?? 0) + value);
      continue;
    }

    const prevDate = new Date(prev.year, prev.month - 1, prev.day);
    const totalDays = differenceInCalendarDays(endDate, prevDate);

    if (totalDays <= 0) {
      const key = weekKey(endDate);
      totals.set(key, (totals.get(key) ?? 0) + value);
      continue;
    }

    let weekStart = addDays(prevDate, 1);
    while (weekStart <= endDate) {
      const weekEnd = endOfISOWeek(weekStart);
      const sliceEnd = weekEnd < endDate ? weekEnd : endDate;
      const daysInSlice = differenceInCalendarDays(sliceEnd, addDays(weekStart, -1));
      const key = weekKey(weekStart);
      totals.set(key, (totals.get(key) ?? 0) + (value * daysInSlice) / totalDays);
      weekStart = addDays(weekEnd, 1);
    }
  }

  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ key, total }));
}

export function calculatePeriods(fillups: Fillup[], period: Period, chartType: ChartType): PeriodTotal[] {
  if (period === 'hét') return distributeByWeek(fillups, chartType);

  const totals = new Map<string, number>();
  const order: string[] = [];
  for (const fillup of fillups) {
    let value: number | undefined;
    if (chartType === 'travel_distance') value = fillup.tripKm;
    else if (chartType === 'cost') value = fillup.totalCost;
    else throw new Error(`Periods unimplemented for chart ${chartType}`);
    if (!value) continue;
    const { year, month, day } = fillup;
    const fmt = period === 'hó' ? 'yyyy-MM' : 'yyyy';
    const key = format(new Date(year, month - 1, day), fmt);
    if (!totals.has(key)) order.push(key);
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return order.map((key) => ({ key, total: totals.get(key)! }));
}
