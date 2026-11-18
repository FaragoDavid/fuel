import { useState } from 'react';

import type { BarChartId, Period } from '../types';
import { LocalStorage } from '../utils/local-storage';

export function useBarChartPeriod(key: BarChartId): [Period, (p: Period) => void] {
  const [period, setPeriodState] = useState<Period>(
    () => (key === 'spend' ? LocalStorage.getSpendPeriod() : LocalStorage.getDistancePeriod()) ?? 'hó',
  );

  function setPeriod(p: Period) {
    setPeriodState(p);
    if (key === 'spend') LocalStorage.setSpendPeriod(p);
    else LocalStorage.setDistancePeriod(p);
  }

  return [period, setPeriod];
}
