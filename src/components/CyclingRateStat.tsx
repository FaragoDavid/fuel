import type { Period, Unit } from '../types';
import { PERIODS, UNITS } from '../utils/consts';
import { formatNum } from '../utils/format';
import { useCyclingRatePreferences } from '../hooks/useCyclingRatePreferences';

interface Props {
  totalLiters: number;
  totalKm: number;
  spanDays: number;
}

const PERIOD_DAYS: Record<Period, number> = { hét: 7, hó: 365.25 / 12, év: 365.25 };

export default function CyclingRateStat({ totalLiters, totalKm, spanDays }: Props) {
  const { unit, period, setUnit: changeUnit, setPeriod: changePeriod } = useCyclingRatePreferences();

  const total = unit === 'l' ? totalLiters : totalKm;
  const value = spanDays > 0 && total > 0 ? total / (spanDays / PERIOD_DAYS[period]) : null;
  const formattedValue = value != null ? (unit === 'l' ? formatNum(value, 0, 2) : formatNum(value, 0)) : '—';

  const tabCls = (active: boolean) =>
    `text-[0.65rem] px-1.5 py-0.5 rounded cursor-pointer ${active ? 'bg-teal-600 text-[#fce8cc]' : 'text-teal-200 hover:bg-teal-600/50'}`;

  return (
    <div className="stat-card">
      <div className="stat-label flex items-center gap-0.5 mb-1">
        <span className="mr-0.5">Átlag</span>
        {UNITS.map((u) => (
          <button key={u} onClick={() => changeUnit(u)} className={tabCls(u === unit)}>
            {u}
          </button>
        ))}
        <span>/</span>
        {PERIODS.map((p) => (
          <button key={p} onClick={() => changePeriod(p)} className={tabCls(p === period)}>
            {p}
          </button>
        ))}
      </div>
      <div className="stat-value">{value != null ? `${formattedValue} ${unit}` : '—'}</div>
    </div>
  );
}
