/**
 * AuthContext — ODS Global Network
 *
 * Provides the session state (user, role, loading) and auth actions
 * (login, logout) to the entire component tree.
 *
 * On mount, calls GET /api/auth/me to restore an existing cookie session.
 * The `login` action stores the user returned by the API — no token in state,
 * no localStorage — the HttpOnly cookie is the single source of truth.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────────── */
export type UserRole = 'customer' | 'merchant' | 'provider' | 'admin' | 'super_admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string | number;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: ApprovalStatus;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
}

/* ── Context ───────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = 'http://localhost:3001';

/* ── Provider ──────────────────────────────────────────────── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from cookie on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data.user) setUser(data.user);
      })
      .catch(() => {
        // No active session — not an error
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
  }, []);

  const updateUser = useCallback((fields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Best-effort — clear local state regardless
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ── Hook ──────────────────────────────────────────────────── */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
