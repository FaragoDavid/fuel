import type { Fillup } from '../types';

const START_ODO = 181691;

export function deriveOdometers(sorted: Fillup[]): Map<string, number> {
  const odometerById = new Map<string, number>();
  let running = START_ODO;
  for (const fillup of sorted) {
    if (fillup.odometer != null) {
      running = fillup.odometer;
    } else if (fillup.tripKm != null) {
      running = running + fillup.tripKm;
    }
    odometerById.set(fillup.id, Math.round(running * 10) / 10);
  }
  return odometerById;
}
