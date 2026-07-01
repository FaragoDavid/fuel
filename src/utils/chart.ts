export interface Point {
  x: number;
  y: number;
  label: string;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padTop: number;
  padRight: number;
  padBottom: number;
  padLeft: number;
}

export function scaleLinear(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  return (v: number) => rangeMin + ((v - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

export function smoothLine(points: { cx: number; cy: number }[]): string {
  if (points.length < 2) return '';
  const tension = 0.2;
  let path = `M${points[0].cx.toFixed(1)},${points[0].cy.toFixed(1)}`;
  for (let index = 1; index < points.length; index++) {
    const prev = points[index - 1];
    const curr = points[index];
    const prevPrev = points[Math.max(0, index - 2)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const cp1x = prev.cx + (curr.cx - prevPrev.cx) * tension;
    const cp1y = prev.cy + (curr.cy - prevPrev.cy) * tension;
    const cp2x = curr.cx - (next.cx - prev.cx) * tension;
    const cp2y = curr.cy - (next.cy - prev.cy) * tension;
    path += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${curr.cx.toFixed(1)},${curr.cy.toFixed(1)}`;
  }
  return path;
}

export function niceYTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  const raw = range / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.ceil(raw / magnitude) * magnitude;
  const start = Math.floor(min / step) * step;
  return Array.from({ length: count + 1 }, (_, i) => start + i * step).filter((v) => v <= max + step * 0.5);
}
