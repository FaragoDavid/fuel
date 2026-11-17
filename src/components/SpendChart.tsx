import { format, startOfISOWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import type { Fillup } from '../types/fillup';
import type { Period } from '../types/ui';
import { niceYTicks, scaleLinear } from '../utils/chart';
import { MONTHS, formatNum } from '../utils/format';
import { LocalStorage } from '../utils/local-storage';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 52 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TOOLTIP_W = 140;
const TOOLTIP_GAP = 12;
const BAR_GAP = 4;

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

function weekStartLabel(key: string): string {
  const year = parseInt(key.slice(0, 4));
  const week = parseInt(key.slice(6));
  const monday = startOfISOWeek(new Date(year, 0, 4 + (week - 1) * 7));
  return `${MONTHS[monday.getMonth()]} ${monday.getDate()}.`;
}

function calculatePeriods(fillups: Fillup[], granularity: Period): PeriodTotal[] {
  const totals = new Map<string, number>();
  const order: string[] = [];
  for (const { year, month, day, totalCost } of fillups) {
    if (!totalCost) continue;
    const fmt = granularity === 'hét' ? "RRRR-'W'II" : granularity === 'hó' ? 'yyyy-MM' : 'yyyy';
    const key = format(new Date(year, month - 1, day), fmt);
    if (!totals.has(key)) order.push(key);
    totals.set(key, (totals.get(key) ?? 0) + totalCost);
  }
  return order.map((key) => ({ key, total: totals.get(key)! }));
}

function buildBars(periods: PeriodTotal[], granularity: Period, xStep: number, barW: number): Omit<Bar, 'top'>[] {
  return periods.map(({ key, total }, index) => {
    let xLabel: string;
    let label: string;
    if (granularity === 'hét') {
      xLabel = weekStartLabel(key);
      label = `${xLabel}: ${formatNum(total)} Ft`;
    } else if (granularity === 'hó') {
      xLabel = MONTHS[parseInt(key.slice(5)) - 1];
      label = `${key.slice(0, 4)}. ${xLabel} ${formatNum(total)} Ft`;
    } else {
      xLabel = key;
      label = `${key}. ${formatNum(total)} Ft`;
    }
    return { cx: PAD.left + xStep * index + xStep / 2, barW, total, label, key, xLabel };
  });
}

function calculateLabelStep(barCount: number): number {
  if (barCount > 48) return 8;
  if (barCount > 24) return 4;
  if (barCount > 12) return 2;
  return 1;
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

export default function SpendChart({ fillups, multiYear }: { fillups: Fillup[]; multiYear: boolean }) {
  const [granularity, setGranularity] = useState<Period>(() => LocalStorage.getSpendPeriod() ?? 'hó');

  function handleGranularity(p: Period) {
    setGranularity(p);
    LocalStorage.setSpendPeriod(p);
  }
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { bars, gridLines, yearLines } = useMemo(() => {
    const periods = calculatePeriods(fillups, granularity);
    const xStep = INNER_W / periods.length;
    const barW = Math.max(BAR_GAP, xStep - BAR_GAP);
    const maxTotal = Math.max(...periods.map(({ total }) => total));
    const yScale = scaleLinear(0, maxTotal * 1.1, PAD.top + INNER_H, PAD.top);
    const bars: Bar[] = buildBars(periods, granularity, xStep, barW).map((bar) => ({ ...bar, top: yScale(bar.total) }));
    return {
      bars,
      gridLines: niceYTicks(0, maxTotal * 1.1).map((tick) => ({ tick, cy: yScale(tick) })),
      yearLines: buildYearLines(periods, xStep),
    };
  }, [fillups, granularity]);

  const baseline = PAD.top + INNER_H;
  const labelStep = calculateLabelStep(bars.length);

  return (
    <div>
      <div className="chart-tabs" style={{ marginBottom: 8 }}>
        <button onClick={() => handleGranularity('hó')} className={granularity === 'hó' ? 'tab-btn-active' : 'tab-btn'}>
          Havi
        </button>
        <button onClick={() => handleGranularity('hét')} className={granularity === 'hét' ? 'tab-btn-active' : 'tab-btn'}>
          Heti
        </button>
        <button onClick={() => handleGranularity('év')} className={granularity === 'év' ? 'tab-btn-active' : 'tab-btn'}>
          Éves
        </button>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" onMouseLeave={() => setTooltip(null)}>
        {gridLines.map(({ tick, cy }) => {
          if (cy < PAD.top - 4 || cy > baseline + 4) return null;
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={PAD.left + INNER_W} y1={cy} y2={cy} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={10} fill="var(--chart-label)">
                {(tick / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
        {multiYear &&
          granularity !== 'év' &&
          yearLines.map(({ x, year }) => (
            <g key={year}>
              <line x1={x} x2={x} y1={PAD.top} y2={baseline} stroke="var(--chart-axis)" strokeWidth={1} opacity={0.5} />
              <text x={x + 3} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
                {year}
              </text>
            </g>
          ))}
        {bars.map(({ key, cx, top, barW, label, xLabel }, index) => (
          <g key={key} onMouseEnter={() => setTooltip({ x: cx, y: top, text: label })} onMouseLeave={() => setTooltip(null)}>
            <rect x={cx - barW / 2} y={top} width={barW} height={baseline - top} fill="var(--chart-color)" fillOpacity={0.8} rx={2} />
            {index % labelStep === 0 && (
              <text x={cx} y={HEIGHT - 6} textAnchor="middle" fontSize={10} fill="var(--chart-label)">
                {xLabel}
              </text>
            )}
          </g>
        ))}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={baseline} stroke="var(--chart-axis)" strokeWidth={1} />
        <text x={PAD.left + 4} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
          Ft
        </text>
        {tooltip &&
          (() => {
            const fitsRight = tooltip.x + TOOLTIP_GAP + TOOLTIP_W <= WIDTH;
            const tx = fitsRight ? tooltip.x + TOOLTIP_GAP : tooltip.x - TOOLTIP_W - TOOLTIP_GAP;
            return (
              <g>
                <rect x={tx} y={tooltip.y - 18} width={TOOLTIP_W} height={22} rx={4} fill="var(--color-modal-bg)" fillOpacity={0.93} />
                <text x={tx + 6} y={tooltip.y - 3} fontSize={11} fill="var(--chart-trend)">
                  {tooltip.text}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
