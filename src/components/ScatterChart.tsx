import { useMemo, useState } from 'react';
import { scaleLinear, smoothLine, niceYTicks } from '../utils/chart';

interface DataPoint {
  id: string;
  timestamp: number;
  dateLine: string;
  value: number;
  label: string;
}

interface Props {
  points: DataPoint[];
  yUnit: string;
  color: string;
  yDecimals?: number;
  trendWindow?: number;
  onPointClick?: (id: string) => void;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 12, left: 52 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TOOLTIP_W = 110;
const TOOLTIP_H = 34;
const TOOLTIP_GAP = 12;

function rollingAverage(values: number[], window: number): number[] {
  return values.map((_, index) => {
    const half = Math.floor(window / 2);
    const start = Math.max(0, index - half);
    const end = Math.min(values.length - 1, index + half);
    const slice = values.slice(start, end + 1);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  });
}

export default function ScatterChart({ points, yUnit, color, yDecimals = 1, trendWindow = 5, onPointClick }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string; dateLine: string } | null>(null);

  const { scaledPoints, trendPath, yScale, yTicks } = useMemo(() => {
    const timestamps = points.map((point) => point.timestamp);
    const values = points.map((point) => point.value);
    const xMin = Math.min(...timestamps);
    const xMax = Math.max(...timestamps);
    const yMin = Math.min(...values);
    const yMax = Math.max(...values);
    const yPad = (yMax - yMin) * 0.15 || 1;

    const xRange = xMax - xMin || 1;
    const xPad = xRange * 0.02;
    const xScale = scaleLinear(xMin - xPad, xMax + xPad, PAD.left, PAD.left + INNER_W);
    const yScale = scaleLinear(yMin - yPad, yMax + yPad, PAD.top + INNER_H, PAD.top);
    const yTicks = niceYTicks(yMin - yPad, yMax + yPad);

    const scaledPoints = points.map((point) => ({
      cx: xScale(point.timestamp),
      cy: yScale(point.value),
    }));

    // Average same-day points before smoothing to avoid S-shapes from vertical bezier segments
    const dailyAvg = Object.values(
      points.reduce<Record<number, { cx: number; sum: number; count: number }>>((acc, point, index) => {
        const entry = acc[point.timestamp];
        if (entry) {
          entry.sum += point.value;
          entry.count++;
        } else {
          acc[point.timestamp] = { cx: scaledPoints[index].cx, sum: point.value, count: 1 };
        }
        return acc;
      }, {}),
    );

    const smoothed = rollingAverage(
      dailyAvg.map((entry) => entry.sum / entry.count),
      trendWindow,
    );
    const trendPath = smoothLine(smoothed.map((val, index) => ({ cx: dailyAvg[index].cx, cy: yScale(val) })));

    return { scaledPoints, trendPath, yScale, yTicks };
  }, [points, trendWindow]);

  function renderTooltip() {
    if (!tooltip) return null;
    const fitsRight = tooltip.x + TOOLTIP_GAP + TOOLTIP_W <= WIDTH;
    const tx = fitsRight ? tooltip.x + TOOLTIP_GAP : tooltip.x - TOOLTIP_W - TOOLTIP_GAP;
    return (
      <g>
        <rect x={tx} y={tooltip.y - TOOLTIP_H + 4} width={TOOLTIP_W} height={TOOLTIP_H} rx={4} fill="#2a1205ee" />
        <text x={tx + 6} y={tooltip.y - 16} fontSize={10} fill="var(--chart-label-dim)">
          {tooltip.dateLine}
        </text>
        <text x={tx + 6} y={tooltip.y - 3} fontSize={10} fill="var(--chart-trend)">
          {tooltip.value}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" onMouseLeave={() => setTooltip(null)}>
      {yTicks.map((tick) => {
        const cy = yScale(tick);
        if (cy < PAD.top - 4 || cy > PAD.top + INNER_H + 4) return null;
        return (
          <g key={tick}>
            <line x1={PAD.left} x2={PAD.left + INNER_W} y1={cy} y2={cy} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={PAD.left - 6} y={cy + 4} textAnchor="end" fontSize={10} fill="var(--chart-label)">
              {tick.toFixed(yDecimals)}
            </text>
          </g>
        );
      })}

      <path d={trendPath} fill="none" stroke="var(--chart-trend)" strokeWidth={2} strokeLinejoin="round" opacity={0.7} />

      {scaledPoints.map(({ cx, cy }, index) => (
        <g
          key={index}
          onMouseEnter={() => setTooltip({ x: cx, y: cy, value: points[index].label, dateLine: points[index].dateLine })}
          onClick={() => onPointClick?.(points[index].id)}
          style={{ cursor: onPointClick ? 'pointer' : 'default' }}
        >
          <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.8} />
          <circle cx={cx} cy={cy} r={10} fill="transparent" />
        </g>
      ))}

      {renderTooltip()}

      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + INNER_H} stroke="var(--chart-axis)" strokeWidth={1} />
      <text x={PAD.left + 4} y={PAD.top + 10} fontSize={10} fill="var(--chart-label-dim)">
        {yUnit}
      </text>
    </svg>
  );
}
