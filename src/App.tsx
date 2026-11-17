import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ChartPanel from './components/ChartPanel';
import ConfirmDialog from './components/ConfirmDialog';
import FillupDialog from './components/FillupDialog';
import FillupTable from './components/FillupTable';
import Login from './components/Login';
import StatsStrip from './components/StatsStrip';
import { useStore } from './data/store';
import { useAuth } from './services/auth';
import type { Fillup } from './types/fillup';
import { compareFillups } from './utils/sort';

type DialogState = { mode: 'add' } | { mode: 'edit'; fillup: Fillup } | null;

export default function App() {
  const store = useStore();
  const user = useAuth();
  const [fillups, setFillups] = useState<Fillup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sortedFillups = useMemo(() => (fillups ? [...fillups].sort(compareFillups) : []), [fillups]);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    store
      .readFillups()
      .then(setFillups)
      .catch((error) => setError(error.message));
  }, [user]);

  function scrollToId(id: string) {
    const row = document.querySelector<HTMLElement>(`tr[data-id="${id}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.remove('row-highlighted');
    void row.offsetWidth;
    row.classList.add('row-highlighted');
  }

  async function handleSave(fillup: Fillup) {
    if (!fillups) return;
    setDialog(null);
    setSaving(true);
    setError(null);
    try {
      if (dialog?.mode === 'edit') {
        await store.updateFillup(fillup);
        setFillups(fillups.map((existing) => (existing.id === fillup.id ? fillup : existing)));
      } else {
        const { id: _ignored, ...data } = fillup;
        const newId = await store.addFillup(data);
        setFillups([...fillups, { ...data, id: newId }]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!fillups) return;
    setSaving(true);
    setError(null);
    try {
      await store.deleteFillup(id);
      setFillups(fillups.filter((fillup) => fillup.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Törlési hiba');
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  }

  if (user === undefined) return <div className="loading-text">Betöltés…</div>;
  if (user === null) return <Login />;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1 className="page-title">Tankolások</h1>
          <button onClick={() => setDialog({ mode: 'add' })} className="btn-header-action">
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
            <ChartPanel sortedFillups={sortedFillups} onPointClick={scrollToId} />
            <FillupTable sortedFillups={sortedFillups} onEdit={(fillup) => setDialog({ mode: 'edit', fillup })} onDelete={setDeleteId} />
            {saving && <div className="saving-text">Mentés…</div>}
          </>
        )}
      </div>

      <button onClick={() => setDialog({ mode: 'add' })} className="btn-fab" aria-label="Új tankolás">
        <Plus size={24} />
      </button>

      {dialog && (
        <FillupDialog initial={dialog.mode === 'edit' ? dialog.fillup : undefined} onSave={handleSave} onCancel={() => setDialog(null)} />
      )}

      {deleteId && <ConfirmDialog onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}
