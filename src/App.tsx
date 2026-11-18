import { Plus } from 'lucide-react';
import { useState } from 'react';

import ChartPanel from './components/ChartPanel';
import ConfirmDialog from './components/ConfirmDialog';
import FillupDialog from './components/FillupDialog';
import FillupTable from './components/FillupTable';
import Login from './components/Login';
import StatsStrip from './components/StatsStrip';
import { useFillups } from './hooks/useFillups';
import { useAuth } from './services/auth';
import type { Fillup } from './types';

type DialogState = { mode: 'add' } | { mode: 'edit'; fillup: Fillup } | null;

export default function App() {
  const user = useAuth();
  const { loaded, sortedFillups, error, saving, addFillup, updateFillup, deleteFillup } = useFillups(user);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function scrollToId(id: string) {
    const row = document.querySelector<HTMLElement>(`tr[data-id="${id}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.remove('row-highlighted');
    void row.offsetWidth;
    row.classList.add('row-highlighted');
  }

  async function handleSave(fillup: Fillup) {
    setDialog(null);
    if (dialog?.mode === 'edit') {
      await updateFillup(fillup);
    } else {
      const { id: _ignored, ...data } = fillup;
      await addFillup(data);
    }
  }

  async function handleDelete(id: string) {
    await deleteFillup(id);
    setDeleteId(null);
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

        {!loaded ? (
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
