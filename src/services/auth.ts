import { useEffect, useState } from 'react';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { app } from './firebase';

type AuthUser = User | null | undefined;

export function useAuth(): AuthUser {
  const [user, setUser] = useState<AuthUser>(undefined);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setUser({ displayName: 'Dev User', email: 'dev@localhost' } as User);
      return;
    }

    return onAuthStateChanged(getAuth(app), setUser);
  }, []);

  return user;
}

export async function signIn(): Promise<void> {
  const auth = getAuth(app);
  await signInWithPopup(auth, new GoogleAuthProvider());
}
