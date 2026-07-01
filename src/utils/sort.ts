import type { Fillup } from '../types/fillup';

export function compareFillups(a: Fillup, b: Fillup): number {
  return a.year - b.year || a.month - b.month || a.day - b.day || a.id.localeCompare(b.id);
}
