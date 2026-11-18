import { useEffect, useMemo, useState } from 'react';

import { useStore } from '../data/store';
import type { Fillup } from '../types';
import { compareFillups } from '../utils/sort';

export function useFillups(enabled: boolean) {
  const store = useStore();
  const [fillups, setFillups] = useState<Fillup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedFillups = useMemo(() => (fillups ? [...fillups].sort(compareFillups) : []), [fillups]);

  useEffect(() => {
    if (!enabled) return;
    store
      .readFillups()
      .then(setFillups)
      .catch((e: Error) => setError(e.message));
  }, [enabled]);

  async function addFillup(fillup: Omit<Fillup, 'id'>): Promise<void> {
    if (!fillups) return;
    setSaving(true);
    setError(null);
    try {
      const newId = await store.addFillup(fillup);
      setFillups([...fillups, { ...fillup, id: newId }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  }

  async function updateFillup(fillup: Fillup): Promise<void> {
    if (!fillups) return;
    setSaving(true);
    setError(null);
    try {
      await store.updateFillup(fillup);
      setFillups(fillups.map((existing) => (existing.id === fillup.id ? fillup : existing)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  }

  async function deleteFillup(id: string): Promise<void> {
    if (!fillups) return;
    setSaving(true);
    setError(null);
    try {
      await store.deleteFillup(id);
      setFillups(fillups.filter((f) => f.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Törlési hiba');
    } finally {
      setSaving(false);
    }
  }

  return { loaded: fillups !== null, sortedFillups, error, saving, addFillup, updateFillup, deleteFillup };
}
