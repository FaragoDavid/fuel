import type { Fillup } from '../types/fillup';
import { CACHE_KEY, type Store } from './store';

function read(): Fillup[] {
  if (import.meta.env.VITE_MOCK_FILLUPS) {
    const records = JSON.parse(import.meta.env.VITE_MOCK_FILLUPS) as Fillup[];
    localStorage.setItem(CACHE_KEY, JSON.stringify(records));
    return records;
  }
  const raw = localStorage.getItem(CACHE_KEY);
  return raw ? (JSON.parse(raw) as Fillup[]) : [];
}

function write(fillups: Fillup[]): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(fillups));
}

export const localStore: Store = {
  async readFillups() {
    return read();
  },

  async addFillup(fillup) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    write([...read(), { ...fillup, id }]);
    return id;
  },

  async updateFillup({ id, ...data }) {
    write(read().map((fillup) => (fillup.id === id ? { ...data, id } : fillup)));
  },

  async deleteFillup(id) {
    write(read().filter((fillup) => fillup.id !== id));
  },
};
