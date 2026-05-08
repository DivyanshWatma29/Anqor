import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { insforge } from '@/lib/insforge';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ requiresVerification: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email.split('@')[0],
        });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Sign in failed');
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split('@')[0],
      });

      // Ensure profile exists
      await insforge.database
        .from('profiles')
        .upsert([{
          id: data.user.id,
          name: data.user.name || data.user.email.split('@')[0],
          role: 'user',
        }], { onConflict: 'id' });
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ requiresVerification: boolean }> => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });
    if (error) throw new Error(error.message || 'Sign up failed');

    if (data?.requireEmailVerification) {
      return { requiresVerification: true };
    }

    // No verification needed — user is signed in
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.email.split('@')[0],
      });

      await insforge.database.from('profiles').upsert([{
        id: data.user.id,
        name,
        role: 'user',
      }], { onConflict: 'id' });
    }

    return { requiresVerification: false };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw new Error(error.message || 'Verification failed');

    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name || data.user.email.split('@')[0],
      });

      await insforge.database.from('profiles').upsert([{
        id: data.user.id,
        name: data.user.name || data.user.email.split('@')[0],
        role: 'user',
      }], { onConflict: 'id' });
    }
  };

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, verifyEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
