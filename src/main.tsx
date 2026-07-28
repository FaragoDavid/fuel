import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { localStore } from './data/local-store';
import { remoteStore } from './data/remote-store';
import { StoreProvider } from './data/store';

const store = import.meta.env.DEV ? localStore : remoteStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
