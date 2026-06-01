import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface JwtUser {
  id: number;
  email: string;
  roles: string[];
}

interface AuthContextValue {
  token: string | null;
  user: JwtUser | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'mybank_token';

function decodeToken(token: string | null): JwtUser | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    const data = JSON.parse(json) as Partial<JwtUser> & { exp?: number };
    if (data.exp && data.exp * 1000 < Date.now()) return null;
    return {
      id: Number(data.id ?? 0),
      email: String(data.email ?? ''),
      roles: Array.isArray(data.roles) ? data.roles : [],
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return decodeToken(stored) ? stored : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }, [token]);

  const value = useMemo<AuthContextValue>(() => {
    const user = decodeToken(token);
    return {
      token,
      user,
      isAdmin: !!user?.roles?.includes('ROLE_ADMIN'),
      login: (t: string) => setToken(t),
      logout: () => setToken(null),
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
