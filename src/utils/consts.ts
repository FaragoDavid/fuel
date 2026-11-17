import type { Unit, Period } from '../types';

export const UNITS: readonly Unit[] = ['l', 'km'];
export const PERIODS: readonly Period[] = ['hét', 'hó', 'év'];

const _W = 600;
const _H = 220;
const _PAD = { top: 16, right: 16, bottom: 36, left: 52 } as const;

export const BAR_CHART = {
  WIDTH: _W,
  HEIGHT: _H,
  PAD: _PAD,
  INNER_W: _W - _PAD.left - _PAD.right,
  INNER_H: _H - _PAD.top - _PAD.bottom,
  TOOLTIP_W: 140,
  TOOLTIP_GAP: 12,
  BAR_GAP: 4,
} as const;
