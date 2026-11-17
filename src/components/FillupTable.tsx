import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Fillup } from '../types/fillup';
import { deriveEfficiencies } from '../utils/derive-efficiencies';
import { formatHuf, formatDate, formatDateShort, efficiencyColor, formatNum } from '../utils/format';

const START_ODO = 181691;

function deriveOdometers(sorted: Fillup[]): Map<string, number> {
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

interface Props {
  sortedFillups: Fillup[];
  onEdit: (fillup: Fillup) => void;
  onDelete: (id: string) => void;
}

export default function FillupTable({ sortedFillups, onEdit, onDelete }: Props) {
  const displayOrder = useMemo(() => [...sortedFillups].reverse(), [sortedFillups]);
  const odometers = useMemo(() => deriveOdometers(sortedFillups), [sortedFillups]);
  const efficiencies = useMemo(() => deriveEfficiencies(sortedFillups), [sortedFillups]);

  const { l100Min, l100Max } = useMemo(() => {
    const values = [...efficiencies.values()];
    return values.length ? { l100Min: Math.min(...values), l100Max: Math.max(...values) } : { l100Min: 0, l100Max: 1 };
  }, [efficiencies]);

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr className="table-header-row">
            <th className="table-header-cell">Dátum</th>
            <th className="table-header-cell-num">Összeg</th>
            <th className="table-header-cell-num">Liter</th>
            <th className="table-header-cell-desktop">Ft/l</th>
            <th className="table-header-cell-desktop">Trip km</th>
            <th className="table-header-cell-desktop">l/100km</th>
            <th className="table-header-cell-desktop">Kmóra</th>
            <th className="table-header-cell" />
          </tr>
        </thead>
        <tbody>
          {displayOrder.map((fillup) => {
            const l100 = efficiencies.get(fillup.id) ?? null;
            const fpl = fillup.totalCost && fillup.liters ? fillup.totalCost / fillup.liters : null;
            const odo = odometers.get(fillup.id);
            const odoIsReal = fillup.odometer != null;
            return (
              <tr key={fillup.id} data-id={fillup.id} className="table-row">
                <td className="table-cell-date">
                  <span className="sm:hidden">{formatDateShort(fillup.month, fillup.day)}</span>
                  <span className="hidden sm:inline">{formatDate(fillup.year, fillup.month, fillup.day)}</span>
                </td>
                <td className="table-cell">{fillup.totalCost ? formatHuf(fillup.totalCost) : '—'}</td>
                <td className="table-cell">{fillup.liters?.toFixed(2) ?? '—'}</td>
                <td className="table-cell-desktop">{fpl ? fpl.toFixed(0) : '—'}</td>
                <td className="table-cell-desktop">
                  {fillup.tripKm != null ? (
                    fillup.estimated ? (
                      <span className="estimated">≈ {fillup.tripKm.toFixed(0)}</span>
                    ) : (
                      fillup.tripKm.toFixed(1)
                    )
                  ) : (
                    '—'
                  )}
                </td>
                <td className="table-cell-desktop">
                  {l100 ? <span style={{ color: efficiencyColor(l100, l100Min, l100Max) }}>{l100.toFixed(1)}</span> : '—'}
                </td>
                <td className="table-cell-desktop">
                  {odo != null ? odoIsReal ? formatNum(odo) : <span className="estimated">≈ {formatNum(odo)}</span> : '—'}
                </td>
                <td className="table-cell-actions">
                  <button onClick={() => onEdit(fillup)} className="btn-icon">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(fillup.id)} className="btn-icon">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
