import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: 'fuel-2cd56.firebaseapp.com',
  projectId: 'fuel-2cd56',
  storageBucket: 'fuel-2cd56.firebasestorage.app',
  messagingSenderId: '588897487',
  appId: '1:588897487:web:eb00a584ef0a6da7ccabba',
});

export const db = getFirestore(app);
export { app };
