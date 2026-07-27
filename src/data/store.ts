import type { Fillup } from '../types/fillup';

export const CACHE_KEY = 'fuel_fillups';

export interface Store {
  readFillups(): Promise<Fillup[]>;
  addFillup(fillup: Omit<Fillup, 'id'>): Promise<string>;
  updateFillup(fillup: Fillup): Promise<void>;
  deleteFillup(id: string): Promise<void>;
}
