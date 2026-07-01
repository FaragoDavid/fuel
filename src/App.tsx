import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Fillup } from './types/fillup';
import { readFillups, writeFillups } from './services/github';
import { compareFillups } from './utils/sort';
import { formatDate } from './utils/format';
import StatsStrip from './components/StatsStrip';
import FillupTable from './components/FillupTable';
import FillupDialog from './components/FillupDialog';
import ScatterChart from './components/ScatterChart';
import MonthlySpendChart from './components/MonthlySpendChart';

type DialogState = { mode: 'add' } | { mode: 'edit'; fillup: Fillup } | null;

const CHART_VIEWS = [
  { key: 'l100', label: 'Fogyasztás', yUnit: 'l/100km', yDecimals: 1 },
  { key: 'ftl', label: 'Üzemanyagár', yUnit: 'Ft/l', yDecimals: 0 },
  { key: 'ftkm', label: 'Kilométerköltség', yUnit: 'Ft/km', yDecimals: 0 },
  { key: 'monthly', label: 'Havi költség', yUnit: '', yDecimals: 0 },
] as const;

type ChartView = (typeof CHART_VIEWS)[number]['key'];
const STORED_CHART_KEY = 'fuel_chart';
const CHART_COLOR = 'var(--chart-color)';

function toTimestamp({ year, month, day }: Fillup): number {
  return new Date(year, month - 1, day).getTime();
}

export default function App() {
  const [fillups, setFillups] = useState<Fillup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sortedFillups = useMemo(() => (fillups ? [...fillups].sort(compareFillups) : []), [fillups]);

  const l100Points = useMemo(() => {
    const points = [];
    for (let index = 1; index < sortedFillups.length; index++) {
      const prev = sortedFillups[index - 1];
      const curr = sortedFillups[index];
      if (!prev.liters || !curr.tripKm || curr.estimated || prev.estimated) continue;
      const l100 = (prev.liters / curr.tripKm) * 100;
      points.push({
        id: curr.id,
        timestamp: toTimestamp(curr),
        dateLine: formatDate(curr.year, curr.month, curr.day),
        value: l100,
        label: `${l100.toFixed(1)} l/100km`,
      });
    }
    return points;
  }, [sortedFillups]);

  const ftlPoints = useMemo(
    () =>
      sortedFillups
        .filter((fillup) => fillup.totalCost && fillup.liters)
        .map((fillup) => {
          const pricePerLiter = fillup.totalCost! / fillup.liters!;
          return {
            id: fillup.id,
            timestamp: toTimestamp(fillup),
            dateLine: formatDate(fillup.year, fillup.month, fillup.day),
            value: pricePerLiter,
            label: `${pricePerLiter.toFixed(0)} Ft/l`,
          };
        }),
    [sortedFillups],
  );

  const ftkmPoints = useMemo(() => {
    const points = [];
    for (let index = 1; index < sortedFillups.length; index++) {
      const prev = sortedFillups[index - 1];
      const curr = sortedFillups[index];
      if (!prev.totalCost || !curr.tripKm) continue;
      const costPerKm = prev.totalCost / curr.tripKm;
      points.push({
        id: curr.id,
        timestamp: toTimestamp(curr),
        dateLine: formatDate(curr.year, curr.month, curr.day),
        value: costPerKm,
        label: `${costPerKm.toFixed(0)} Ft/km`,
      });
    }
    return points;
  }, [sortedFillups]);

  const scatterPoints = useMemo(() => ({ l100: l100Points, ftl: ftlPoints, ftkm: ftkmPoints }), [l100Points, ftlPoints, ftkmPoints]);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>(() => (localStorage.getItem(STORED_CHART_KEY) as ChartView) ?? 'l100');
  const activeView = CHART_VIEWS.find((v) => v.key === chartView)!;

  function handleChartView(view: ChartView) {
    setChartView(view);
    localStorage.setItem(STORED_CHART_KEY, view);
  }

  useEffect(() => {
    readFillups()
      .then(setFillups)
      .catch((error) => setError(error.message));
  }, []);

  function scrollToId(id: string) {
    const row = document.querySelector<HTMLElement>(`tr[data-id="${id}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.remove('row-highlighted');
    void row.offsetWidth; // force reflow to restart animation
    row.classList.add('row-highlighted');
  }

  async function save(next: Fillup[]) {
    setSaving(true);
    setError(null);
    try {
      await writeFillups(next);
      setFillups(next);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  }

  function handleSave(fillup: Fillup) {
    if (!fillups) return;
    const next =
      dialog?.mode === 'edit'
        ? fillups.map((existing) => (existing.id === fillup.id ? fillup : existing))
        : [...fillups, { ...fillup, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
    setDialog(null);
    save(next);
  }

  function handleDelete(id: string) {
    if (!fillups) return;
    save(fillups.filter((fillup) => fillup.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1 className="page-title">Tankolások</h1>
          <button onClick={() => setDialog({ mode: 'add' })} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} />
            Új tankolás
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {fillups === null ? (
          <div className="loading-text">Betöltés…</div>
        ) : (
          <>
            <StatsStrip sortedFillups={sortedFillups} />
            <div className="card mb-6">
              <div className="chart-tabs">
                {CHART_VIEWS.map((chartOption) => (
                  <button
                    key={chartOption.key}
                    onClick={() => handleChartView(chartOption.key)}
                    className={chartView === chartOption.key ? 'tab-btn-active' : 'tab-btn'}
                  >
                    {chartOption.label}
                  </button>
                ))}
              </div>
              <div className="chart-body">
                {chartView === 'monthly' ? (
                  <MonthlySpendChart fillups={sortedFillups} />
                ) : (
                  <ScatterChart
                    points={scatterPoints[chartView]}
                    yUnit={activeView.yUnit}
                    yDecimals={activeView.yDecimals}
                    color={CHART_COLOR}
                    trendWindow={10}
                    onPointClick={scrollToId}
                  />
                )}
              </div>
            </div>
            <FillupTable sortedFillups={sortedFillups} onEdit={(fillup) => setDialog({ mode: 'edit', fillup })} onDelete={setDeleteId} />
            {saving && <div className="saving-text">Mentés…</div>}
          </>
        )}
      </div>

      {dialog && (
        <FillupDialog initial={dialog.mode === 'edit' ? dialog.fillup : undefined} onSave={handleSave} onCancel={() => setDialog(null)} />
      )}

      {deleteId && (
        <div className="overlay">
          <div className="modal max-w-xs p-6 text-center">
            <p className="confirm-text">Biztosan törlöd ezt a tankolást?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">
                Mégse
              </button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
