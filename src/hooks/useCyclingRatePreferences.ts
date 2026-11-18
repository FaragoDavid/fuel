import { useState } from 'react';

import type { Period, Unit } from '../types';
import { LocalStorage } from '../utils/local-storage';

export function useCyclingRatePreferences(): { unit: Unit; period: Period; setUnit: (u: Unit) => void; setPeriod: (p: Period) => void } {
  const [unit, setUnitState] = useState<Unit>(() => LocalStorage.getStatUnit() ?? 'l');
  const [period, setPeriodState] = useState<Period>(() => LocalStorage.getStatPeriod() ?? 'hó');

  function setUnit(u: Unit) {
    setUnitState(u);
    LocalStorage.setStatUnit(u);
  }

  function setPeriod(p: Period) {
    setPeriodState(p);
    LocalStorage.setStatPeriod(p);
  }

  return { unit, period, setUnit, setPeriod };
}
