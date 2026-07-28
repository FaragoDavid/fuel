import { getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import type { Fillup } from '../types/fillup';
import { scaleLinear, niceYTicks, smoothLine } from '../utils/chart';
import { MONTHS } from '../utils/format';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 52 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TOOLTIP_W = 140;
const TOOLTIP_GAP = 12;
const BAR_GAP = 4;
const LABEL_SKIP_EVERY_2_THRESHOLD = 18;
const LABEL_SKIP_EVERY_4_THRESHOLD = 36;
const STORED_YEAR_KEY = 'fuel_distance_year';

type Granularity = 'weekly' | 'monthly';

interface Props {
  fillups: Fillup[];
}

interface PeriodTotal {
  key: string;
  total: number;
}

interface Bar {
  key: string;
  cx: number;
  top: number;
  barW: number;
  total: number;
  label: string;
  xLabel: string;
}

function isoWeekKey(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const isoYear = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function weekStartLabel(key: string): string {
  const year = parseInt(key.slice(0, 4));
  const week = parseInt(key.slice(6));
  const jan4 = new Date(year, 0, 4);
  const monday = startOfISOWeek(new Date(jan4.getFullYear(), 0, 4 + (week - 1) * 7));
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function calculatePeriods(fillups: Fillup[], granularity: Granularity): PeriodTotal[] {
  const periods: PeriodTotal[] = [];
  for (const { year, month, day, tripKm } of fillups) {
    if (!tripKm) continue;
    const key = granularity === 'weekly' ? isoWeekKey(year, month, day) : `${year}-${String(month).padStart(2, '0')}`;
    const last = periods[periods.length - 1];
    if (last?.key === key) last.total += tripKm;
    else periods.push({ key, total: tripKm });
  }
  return periods;
}

function buildBars(periods: PeriodTotal[], granularity: Granularity, xStep: number, barW: number): Omit<Bar, 'top'>[] {
  return periods.map(({ key, total }, index) => {
    const label =
      granularity === 'weekly'
        ? `${key.slice(0, 4)} W${key.slice(6)}: ${total.toLocaleString('hu-HU')} km`
        : `${key.slice(0, 4)}. ${MONTHS[parseInt(key.slice(5)) - 1]} ${total.toLocaleString('hu-HU')} km`;
    const xLabel = granularity === 'weekly' ? weekStartLabel(key) : MONTHS[parseInt(key.slice(5)) - 1];
    return { cx: PAD.left + xStep * index + xStep / 2, barW, total, label, key, xLabel };
  });
}

function buildRollingAverages(periods: PeriodTotal[], recentN: number): number[] {
  return periods.map(({ total }, index) => {
    const slice = periods.slice(Math.max(0, index - recentN + 1), index + 1);
    return slice.reduce((sum, { total: sliceTotal }) => sum + sliceTotal, 0) / slice.length;
  });
}

function buildYearLines(periods: PeriodTotal[], xStep: number): { x: number; year: number }[] {
  const yearLines: { x: number; year: number }[] = [];
  for (let i = 1; i < periods.length; i++) {
    const prevYear = parseInt(periods[i - 1].key.slice(0, 4));
    const currYear = parseInt(periods[i].key.slice(0, 4));
    if (currYear !== prevYear) yearLines.push({ x: PAD.left + xStep * i, year: currYear });
  }
  return yearLines;
}

function renderGridLines(gridLines: { tick: number; cy: number }[], baseline: number) {
  return gridLines.map(({ tick, cy }) => {
    if (cy < PAD.top - 4 || cy > baseline + 4) return null;
    return (
      <g key={tick}>
        <line x1={PAD.left} x2={PAD.left + INNER_W} y1={cy} y2={cy} stroke="var(--chart-grid)" strokeWidth={1} />
        <text x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={10} fill="var(--chart-label)">
          {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
        </text>
      </g>
    );
  });
}

function renderYearLines(yearLines: { x: number; year: number }[], baseline: number) {
  return yearLines.map(({ x, year }) => (
    <g key={year}>
      <line x1={x} x2={x} y1={PAD.top} y2={baseline} stroke="var(--chart-axis)" strokeWidth={1} opacity={0.5} />
      <text x={x + 3} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
        {year}
      </text>
    </g>
  ));
}

function renderBars(bars: Bar[], baseline: number, setTooltip: (tooltip: { x: number; y: number; text: string } | null) => void) {
  const labelStep = bars.length > LABEL_SKIP_EVERY_4_THRESHOLD ? 4 : bars.length > LABEL_SKIP_EVERY_2_THRESHOLD ? 2 : 1;
  return bars.map(({ key, cx, top, barW, label, xLabel }, index) => (
    <g key={key} onMouseEnter={() => setTooltip({ x: cx, y: top, text: label })} onMouseLeave={() => setTooltip(null)}>
      <rect x={cx - barW / 2} y={top} width={barW} height={baseline - top} fill="var(--chart-color)" fillOpacity={0.8} rx={2} />
      {index % labelStep === 0 && (
        <text x={cx} y={HEIGHT - 6} textAnchor="middle" fontSize={10} fill="var(--chart-label)">
          {xLabel}
        </text>
      )}
    </g>
  ));
}

function renderOverallAverage(overallAvgY: number) {
  return (
    <line
      x1={PAD.left}
      x2={PAD.left + INNER_W}
      y1={overallAvgY}
      y2={overallAvgY}
      stroke="var(--chart-avg)"
      strokeWidth={1.5}
      strokeDasharray="4 3"
      opacity={0.7}
    />
  );
}

function renderTooltip(tooltip: { x: number; y: number; text: string }) {
  const { x, y, text } = tooltip;
  const fitsRight = x + TOOLTIP_GAP + TOOLTIP_W <= WIDTH;
  const tx = fitsRight ? x + TOOLTIP_GAP : x - TOOLTIP_W - TOOLTIP_GAP;
  return (
    <g>
      <rect x={tx} y={y - 18} width={TOOLTIP_W} height={22} rx={4} fill="#2a1205ee" />
      <text x={tx + 6} y={y - 3} fontSize={11} fill="var(--chart-trend)">
        {text}
      </text>
    </g>
  );
}

export default function TravelDistanceChart({ fillups }: Props) {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [selectedYear, setSelectedYear] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORED_YEAR_KEY);
    return stored ? parseInt(stored) : null;
  });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  function handleYearChange(year: number | null) {
    setSelectedYear(year);
    if (year === null) localStorage.removeItem(STORED_YEAR_KEY);
    else localStorage.setItem(STORED_YEAR_KEY, String(year));
  }

  const availableYears = useMemo(() => [...new Set(fillups.map(({ year }) => year))].sort((a, b) => a - b), [fillups]);

  const fillupsOfSelectedYear = useMemo(
    () => (selectedYear === null ? fillups : fillups.filter(({ year }) => year === selectedYear)),
    [fillups, selectedYear],
  );

  const { bars, gridLines, overallAvgY, rollingAveragePath, yearLines } = useMemo(() => {
    const periods = calculatePeriods(fillupsOfSelectedYear, granularity);

    const xStep = INNER_W / periods.length;
    const barW = Math.max(BAR_GAP, xStep - BAR_GAP);
    const maxTotal = Math.max(...periods.map(({ total }) => total));
    const yScale = scaleLinear(0, maxTotal * 1.1, PAD.top + INNER_H, PAD.top);
    const recentN = granularity === 'weekly' ? 12 : 3;

    const bars: Bar[] = buildBars(periods, granularity, xStep, barW).map((bar) => ({ ...bar, top: yScale(bar.total) }));
    const rollingAveragePath = smoothLine(
      buildRollingAverages(periods, recentN).map((avg, index) => ({ cx: PAD.left + xStep * index + xStep / 2, cy: yScale(avg) })),
    );

    return {
      bars,
      gridLines: niceYTicks(0, maxTotal * 1.1).map((tick) => ({ tick, cy: yScale(tick) })),
      overallAvgY: yScale(periods.reduce((sum, { total }) => sum + total, 0) / periods.length),
      rollingAveragePath,
      yearLines: buildYearLines(periods, xStep),
    };
  }, [fillupsOfSelectedYear, granularity]);

  const baseline = PAD.top + INNER_H;

  return (
    <div>
      <div className="chart-tabs" style={{ marginBottom: 8 }}>
        <button onClick={() => setGranularity('monthly')} className={granularity === 'monthly' ? 'tab-btn-active' : 'tab-btn'}>
          Havi
        </button>
        <button onClick={() => setGranularity('weekly')} className={granularity === 'weekly' ? 'tab-btn-active' : 'tab-btn'}>
          Heti
        </button>
        <select
          value={selectedYear ?? ''}
          onChange={(e) => handleYearChange(e.target.value === '' ? null : parseInt(e.target.value))}
          className="btn-secondary"
          style={{ marginLeft: 'auto' }}
        >
          <option value="">Összes év</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" onMouseLeave={() => setTooltip(null)}>
        {renderGridLines(gridLines, baseline)}
        {selectedYear === null && renderYearLines(yearLines, baseline)}
        {renderBars(bars, baseline, setTooltip)}
        {renderOverallAverage(overallAvgY)}
        <path d={rollingAveragePath} fill="none" stroke="var(--chart-avg)" strokeWidth={2} strokeLinejoin="round" opacity={0.9} />
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={baseline} stroke="var(--chart-axis)" strokeWidth={1} />
        <text x={PAD.left + 4} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
          km
        </text>
        {tooltip && renderTooltip(tooltip)}
      </svg>
    </div>
  );
}
