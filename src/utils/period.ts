import { addDays, differenceInCalendarDays, endOfISOWeek, format, startOfISOWeek } from 'date-fns';

import type { ChartType, Fillup, Period, PeriodTotal } from '../types';
import { MONTHS } from './format';

export function weekStartLabel(key: string): string {
  const year = parseInt(key.slice(0, 4));
  const week = parseInt(key.slice(6));
  const monday = startOfISOWeek(new Date(year, 0, 4 + (week - 1) * 7));
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function getValue(fillup: Fillup, chartType: ChartType): number | undefined {
  if (chartType === 'travel_distance') return fillup.tripKm;
  if (chartType === 'cost') return fillup.totalCost;
  throw new Error(`Periods unimplemented for chart ${chartType}`);
}

function weekKey(d: Date): string {
  return format(d, "RRRR-'W'II");
}

function distributeByWeek(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  const totals = new Map<string, number>();
  const add = (key: string, n: number) => totals.set(key, (totals.get(key) ?? 0) + n);

  for (let i = 0; i < fillups.length; i++) {
    const value = getValue(fillups[i], chartType);
    if (!value) continue;

    const { year, month, day } = fillups[i];
    const endDate = new Date(year, month - 1, day);
    const prev = fillups[i - 1];
    const prevDate = prev ? new Date(prev.year, prev.month - 1, prev.day) : null;
    const totalDays = prevDate ? differenceInCalendarDays(endDate, prevDate) : 0;

    if (!prevDate || totalDays <= 0) {
      add(weekKey(endDate), value);
      continue;
    }

    let cursor = addDays(prevDate, 1);
    while (cursor <= endDate) {
      const weekEnd = endOfISOWeek(cursor);
      const sliceEnd = weekEnd < endDate ? weekEnd : endDate;
      const days = differenceInCalendarDays(sliceEnd, addDays(cursor, -1));
      add(weekKey(cursor), (value * days) / totalDays);
      cursor = addDays(weekEnd, 1);
    }
  }

  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ key, total }));
}

function getMonthBuckets(fillups: Fillup[]) {
  const totals = new Map<string, number>();
  for (let y = fillups[0].year; y <= fillups[fillups.length - 1].year; y++) {
    for (let m = 1; m <= 12; m++) {
      totals.set(`${y}-${String(m).padStart(2, '0')}`, 0);
    }
  }
  return totals;
}

function distributeByMonth(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  if (fillups.length === 0) return [];

  const totals = getMonthBuckets(fillups);

  for (const fillup of fillups) {
    const value = getValue(fillup, chartType);
    if (!value) continue;
    const { year, month, day } = fillup;
    const key = format(new Date(year, month - 1, day), 'yyyy-MM');
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return [...totals.entries()].map(([key, total]) => ({ key, total }));
}

function distributeByYear(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  const totals = new Map<string, number>();
  for (const fillup of fillups) {
    const value = getValue(fillup, chartType);
    if (!value) continue;
    const key = String(fillup.year);
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ key, total }));
}

export function calculatePeriods(fillups: Fillup[], period: Period, chartType: ChartType): PeriodTotal[] {
  if (period === 'hét') return distributeByWeek(fillups, chartType);
  if (period === 'hó') return distributeByMonth(fillups, chartType);
  if (period === 'év') return distributeByYear(fillups, chartType);
  throw new Error(`Unknown period: ${period}`);
}
