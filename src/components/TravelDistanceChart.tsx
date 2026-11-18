import { useMemo, useState } from 'react';

import type { Bar, Fillup, Period, PeriodTotal, YearLine } from '../types';
import { niceYTicks, scaleLinear, smoothLine } from '../utils/chart';
import { BAR_CHART } from '../utils/consts';
import { MONTHS, formatNum } from '../utils/format';
import { useBarChartPeriod } from '../hooks/useBarChartPeriod';
import { distributeByMonth, distributeByWeek, distributeByYear, weekStartLabel } from '../utils/period';

const { WIDTH, HEIGHT, PAD, INNER_W, INNER_H, TOOLTIP_W, TOOLTIP_GAP, BAR_GAP } = BAR_CHART;

function buildBars(periods: PeriodTotal[], period: Period, xStep: number, barW: number): Omit<Bar, 'top'>[] {
  return periods.map(({ key, total }, index) => {
    let xLabel: string;
    let label: string;
    if (period === 'hét') {
      xLabel = weekStartLabel(key);
      label = `${xLabel}: ${formatNum(total)} km`;
    } else if (period === 'hó') {
      xLabel = MONTHS[parseInt(key.slice(5)) - 1];
      label = `${key.slice(0, 4)}. ${xLabel} ${formatNum(total)} km`;
    } else {
      xLabel = key;
      label = `${key}. ${formatNum(total)} km`;
    }
    return { cx: PAD.left + xStep * index + xStep / 2, barW, total, label, key, xLabel };
  });
}

function buildRollingAverages(periods: PeriodTotal[], recentN: number): number[] {
  return periods.map((_, index) => {
    const slice = periods.slice(Math.max(0, index - recentN + 1), index + 1);
    return slice.reduce((sum, { total: sliceTotal }) => sum + sliceTotal, 0) / slice.length;
  });
}

function buildYearLines(periods: PeriodTotal[], xStep: number): YearLine[] {
  const yearLines: YearLine[] = [];
  for (let i = 1; i < periods.length; i++) {
    const prevYear = parseInt(periods[i - 1].key.slice(0, 4));
    const currYear = parseInt(periods[i].key.slice(0, 4));
    if (currYear !== prevYear) yearLines.push({ x: PAD.left + xStep * i, year: currYear });
  }
  return yearLines;
}

function calculateLabelStep(barCount: number): number {
  if (barCount > 48) return 8;
  if (barCount > 24) return 4;
  if (barCount > 12) return 2;
  return 1;
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

function renderYearLines(yearLines: YearLine[], baseline: number) {
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
  const labelStep = calculateLabelStep(bars.length);
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
      <rect x={tx} y={y - 18} width={TOOLTIP_W} height={22} rx={4} fill="var(--color-modal-bg)" fillOpacity={0.93} />
      <text x={tx + 6} y={y - 3} fontSize={11} fill="var(--chart-trend)">
        {text}
      </text>
    </g>
  );
}

export default function TravelDistanceChart({ fillups, selectedYear }: { fillups: Fillup[]; selectedYear: number | null }) {
  const [period, setPeriod] = useBarChartPeriod('distance');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { bars, gridLines, overallAvgY, rollingAveragePath, yearLines } = useMemo(() => {
    const distribute = { hét: distributeByWeek, hó: distributeByMonth, év: distributeByYear };
    const allPeriods = distribute[period](fillups, 'travel_distance');
    const periods = selectedYear === null ? allPeriods : allPeriods.filter(({ key }) => key.startsWith(String(selectedYear)));

    const xStep = INNER_W / periods.length;
    const barW = Math.max(BAR_GAP, xStep - BAR_GAP);
    const maxTotal = Math.max(...periods.map(({ total }) => total));
    const yScale = scaleLinear(0, maxTotal * 1.1, PAD.top + INNER_H, PAD.top);
    const recentN = period === 'hét' ? 12 : 3;

    const bars: Bar[] = buildBars(periods, period, xStep, barW).map((bar) => ({ ...bar, top: yScale(bar.total) }));
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
  }, [fillups, period, selectedYear]);

  const baseline = PAD.top + INNER_H;

  return (
    <div>
      <div className="chart-tabs" style={{ marginBottom: 8 }}>
        <button onClick={() => setPeriod('hó')} className={period === 'hó' ? 'tab-btn-active' : 'tab-btn'}>
          Havi
        </button>
        <button onClick={() => setPeriod('hét')} className={period === 'hét' ? 'tab-btn-active' : 'tab-btn'}>
          Heti
        </button>
        <button onClick={() => setPeriod('év')} className={period === 'év' ? 'tab-btn-active' : 'tab-btn'}>
          Éves
        </button>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" onMouseLeave={() => setTooltip(null)}>
        {renderGridLines(gridLines, baseline)}
        {selectedYear === null && period !== 'év' && renderYearLines(yearLines, baseline)}
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
