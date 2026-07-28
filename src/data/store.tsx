import { createContext, useContext } from 'react';

import type { Fillup } from '../types/fillup';

export const CACHE_KEY = 'fuel_fillups';

export interface Store {
  readFillups(): Promise<Fillup[]>;
  addFillup(fillup: Omit<Fillup, 'id'>): Promise<string>;
  updateFillup(fillup: Fillup): Promise<void>;
  deleteFillup(id: string): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ store, children }: { store: Store; children: React.ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used within a StoreProvider');
  return store;
}
