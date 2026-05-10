import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/http';
import { analyticsIdentify, analyticsReset, analyticsTrack, ANALYTICS_EVENTS } from '@/lib/analytics';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
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
    apiFetch<{ user: User | null }>('/api/v1/auth/me')
      .then((data) => {
        setUser(data.user);
        if (data.user) {
          analyticsIdentify(data.user);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await apiFetch<{ user: User }>('/api/v1/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    analyticsIdentify(data.user);
    analyticsTrack(ANALYTICS_EVENTS.LOGIN_COMPLETED, { method: 'password' });
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ requiresVerification: boolean }> => {
    analyticsTrack(ANALYTICS_EVENTS.SIGNUP_STARTED, { method: 'password' });
    const data = await apiFetch<{ requiresVerification: boolean; user: User | null }>('/api/v1/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (data.requiresVerification) {
      return { requiresVerification: true };
    }

    if (data.user) {
      setUser(data.user);
      analyticsIdentify(data.user);
      analyticsTrack(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { requiresVerification: false });
    }

    return { requiresVerification: false };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const data = await apiFetch<{ user: User }>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    setUser(data.user);
    analyticsIdentify(data.user);
    analyticsTrack(ANALYTICS_EVENTS.EMAIL_VERIFICATION_COMPLETED);
    analyticsTrack(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { requiresVerification: true });
  };

  const signOut = async () => {
    await apiFetch('/api/v1/auth/sign-out', { method: 'POST' });
    analyticsReset();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, verifyEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
