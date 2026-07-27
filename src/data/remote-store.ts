import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';

import { db } from '../services/firebase';
import type { Fillup } from '../types/fillup';
import { CACHE_KEY, type Store } from './store';

const COLLECTION = 'fillups';

function cacheRead(): Fillup[] | null {
  const raw = localStorage.getItem(CACHE_KEY);
  return raw ? (JSON.parse(raw) as Fillup[]) : null;
}

function cacheWrite(fillups: Fillup[]): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(fillups));
}

export const remoteStore: Store = {
  async readFillups() {
    const cached = cacheRead();
    if (cached) return cached;
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('year'), orderBy('month'), orderBy('day')));
    const fillups = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Fillup, 'id'>) }));
    cacheWrite(fillups);
    return fillups;
  },

  async addFillup(fillup) {
    const docRef = await addDoc(collection(db, COLLECTION), fillup);
    const cached = cacheRead() ?? [];
    cacheWrite([...cached, { ...fillup, id: docRef.id }]);
    return docRef.id;
  },

  async updateFillup({ id, ...data }) {
    await setDoc(doc(db, COLLECTION, id), data);
    const cached = cacheRead();
    if (cached) cacheWrite(cached.map((fillup) => (fillup.id === id ? { ...data, id } : fillup)));
  },

  async deleteFillup(id) {
    await deleteDoc(doc(db, COLLECTION, id));
    const cached = cacheRead();
    if (cached) cacheWrite(cached.filter((fillup) => fillup.id !== id));
  },
};
