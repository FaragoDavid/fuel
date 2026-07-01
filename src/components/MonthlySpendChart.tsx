import { useMemo, useState } from 'react';
import { scaleLinear, niceYTicks } from '../utils/chart';
import type { Fillup } from '../types/fillup';
import { MONTHS } from '../utils/format';

interface Props {
  fillups: Fillup[];
}

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 36, left: 52 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TOOLTIP_W = 120;
const TOOLTIP_GAP = 12;

export default function MonthlySpendChart({ fillups }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { bars, yScale, yTicks } = useMemo(() => {
    const sorted = Object.entries(
      fillups.reduce<Record<string, number>>((acc, { year, month, totalCost }) => {
        if (!totalCost) return acc;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        acc[key] = (acc[key] ?? 0) + totalCost;
        return acc;
      }, {}),
    ).sort(([a], [b]) => a.localeCompare(b));

    const xStep = INNER_W / sorted.length;
    const barW = Math.max(4, xStep - 4);
    const maxTotal = Math.max(...sorted.map(([, total]) => total));
    const yScale = scaleLinear(0, maxTotal * 1.1, PAD.top + INNER_H, PAD.top);

    return {
      yScale,
      yTicks: niceYTicks(0, maxTotal * 1.1),
      bars: sorted.map(([key, total], index) => ({
        cx: PAD.left + xStep * index + xStep / 2,
        top: yScale(total),
        barW,
        total,
        label: `${key.slice(0, 4)}. ${MONTHS[parseInt(key.slice(5)) - 1]} ${total.toLocaleString('hu-HU')} Ft`,
        month: key,
      })),
    };
  }, [fillups]);

  const baseline = PAD.top + INNER_H;
  const labelStep = bars.length > 10 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" onMouseLeave={() => setTooltip(null)}>
      {yTicks.map((t) => {
        const cy = yScale(t);
        if (cy < PAD.top - 4 || cy > baseline + 4) return null;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + INNER_W} y1={cy} y2={cy} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={10} fill="var(--chart-label)">
              {(t / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}

      {bars.map((bar, index) => (
        <g
          key={bar.month}
          onMouseEnter={() => setTooltip({ x: bar.cx, y: bar.top, text: bar.label })}
          onMouseLeave={() => setTooltip(null)}
        >
          <rect
            x={bar.cx - bar.barW / 2}
            y={bar.top}
            width={bar.barW}
            height={baseline - bar.top}
            fill="var(--chart-color)"
            fillOpacity={0.8}
            rx={2}
          />
          {index % labelStep === 0 && (
            <text x={bar.cx} y={HEIGHT - 6} textAnchor="middle" fontSize={10} fill="var(--chart-label)">
              {MONTHS[parseInt(bar.month.slice(5)) - 1]}
            </text>
          )}
        </g>
      ))}

      {tooltip &&
        (() => {
          const fitsRight = tooltip.x + TOOLTIP_GAP + TOOLTIP_W <= WIDTH;
          const tx = fitsRight ? tooltip.x + TOOLTIP_GAP : tooltip.x - TOOLTIP_W - TOOLTIP_GAP;
          return (
            <g>
              <rect x={tx} y={tooltip.y - 18} width={TOOLTIP_W} height={22} rx={4} fill="#2a1205ee" />
              <text x={tx + 6} y={tooltip.y - 3} fontSize={11} fill="var(--chart-trend)">
                {tooltip.text}
              </text>
            </g>
          );
        })()}

      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={baseline} stroke="var(--chart-axis)" strokeWidth={1} />
      <text x={PAD.left + 4} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
        Ft
      </text>
    </svg>
  );
}
