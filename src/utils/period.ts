import { addDays, addMonths, differenceInCalendarDays, endOfISOWeek, format, startOfISOWeek } from 'date-fns';

import type { ChartType, Fillup, PeriodTotal } from '../types';
import { MONTHS } from './format';

export function weekStartLabel(key: string): string {
  const year = parseInt(key.slice(0, 4));
  const week = parseInt(key.slice(6));
  const monday = startOfISOWeek(new Date(year, 0, 4 + (week - 1) * 7));
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function fillupDate({ year, month, day }: Fillup): Date {
  return new Date(year, month - 1, day);
}

function getValue(fillup: Fillup, chartType: ChartType): number | undefined {
  if (chartType === 'travel_distance') return fillup.tripKm;
  if (chartType === 'cost') return fillup.totalCost;
  throw new Error(`Periods unimplemented for chart ${chartType}`);
}

function weekKey(d: Date): string {
  return format(d, "RRRR-'W'II");
}

function weekSlices(from: Date, to: Date): { key: string; days: number }[] {
  const slices: { key: string; days: number }[] = [];
  let cursor = from;
  while (cursor <= to) {
    const weekEnd = endOfISOWeek(cursor);
    const sliceEnd = weekEnd < to ? weekEnd : to;
    slices.push({ key: weekKey(cursor), days: differenceInCalendarDays(sliceEnd, addDays(cursor, -1)) });
    cursor = addDays(weekEnd, 1);
  }
  return slices;
}

function getWeekBuckets(fillups: Fillup[]) {
  const weekBuckets = new Map<string, number>();
  let nextWeekDate = startOfISOWeek(fillupDate(fillups[0]));
  const lastFillupDate = fillupDate(fillups[fillups.length - 1]);
  while (nextWeekDate <= lastFillupDate) {
    weekBuckets.set(weekKey(nextWeekDate), 0);
    nextWeekDate = addDays(nextWeekDate, 7);
  }
  return weekBuckets;
}

export function distributeByWeek(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  const weekBuckets = getWeekBuckets(fillups);

  for (let i = 0; i < fillups.length; i++) {
    const value = getValue(fillups[i], chartType);
    if (!value) continue;

    const endDate = fillupDate(fillups[i]);
    const prev = fillups[i - 1];
    const prevDate = prev ? fillupDate(prev) : null;
    const totalDays = prevDate ? differenceInCalendarDays(endDate, prevDate) : 0;

    if (!prevDate || totalDays <= 0) {
      weekBuckets.set(weekKey(endDate), (weekBuckets.get(weekKey(endDate)) ?? 0) + value);
    } else {
      for (const { key, days } of weekSlices(addDays(prevDate, 1), endDate)) {
        weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + (value * days) / totalDays);
      }
    }
  }

  return [...weekBuckets.entries()].map(([key, total]) => ({ key, total }));
}

function getMonthBuckets(fillups: Fillup[]) {
  const monthBuckets = new Map<string, number>();
  let nextFillupDate = fillupDate(fillups[0]);
  const lastFillupDate = fillupDate(fillups[fillups.length - 1]);

  while (nextFillupDate <= lastFillupDate) {
    monthBuckets.set(format(nextFillupDate, 'yyyy-MM'), 0);
    nextFillupDate = addMonths(nextFillupDate, 1);
  }

  return monthBuckets;
}

export function distributeByMonth(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  if (fillups.length === 0) return [];
  const monthBuckets = getMonthBuckets(fillups);
  for (const fillup of fillups) {
    const value = getValue(fillup, chartType);
    if (!value) continue;
    const key = format(fillupDate(fillup), 'yyyy-MM');
    monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + value);
  }
  return [...monthBuckets.entries()].map(([key, total]) => ({ key, total }));
}

export function distributeByYear(fillups: Fillup[], chartType: ChartType): PeriodTotal[] {
  const totals = new Map<string, number>();
  for (const fillup of fillups) {
    const value = getValue(fillup, chartType);
    if (!value) continue;
    const key = String(fillup.year);
    totals.set(key, (totals.get(key) ?? 0) + value);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ key, total }));
}
