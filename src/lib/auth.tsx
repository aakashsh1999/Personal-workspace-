import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, initAnalytics } from './firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initAnalytics();
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      clearError: () => setError(null),
      async signUp(email, password, name) {
        setError(null);
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name?.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
          }
        } catch (err) {
          setError(mapAuthError(err));
          throw err;
        }
      },
      async signIn(email, password) {
        setError(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
          setError(mapAuthError(err));
          throw err;
        }
      },
      async logOut() {
        setError(null);
        await signOut(auth);
      },
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
