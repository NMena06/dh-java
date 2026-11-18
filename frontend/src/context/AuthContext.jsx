import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readSession, writeSession } from '../services/api.js';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

/**
 * Sesion del usuario (historias #14 y #15). El token se guarda en localStorage para sobrevivir recargas,
 * y al iniciar la app se valida contra /api/auth/me (si el backend lo rechaza, se vuelve a modo anonimo).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [checking, setChecking] = useState(() => Boolean(readSession()?.token));

  const clear = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session?.token) {
      setChecking(false);
      return;
    }
    authService
      .getMe()
      .then((user) => {
        const next = { token: session.token, user };
        writeSession(next);
        setSession(next);
      })
      .catch(() => clear())
      .finally(() => setChecking(false));
    // Solo al montar: valida la sesion guardada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', clear);
    return () => window.removeEventListener('auth:expired', clear);
  }, [clear]);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    writeSession(result);
    setSession(result);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // aunque falle la red, la sesion local se elimina igual
    }
    clear();
  }, [clear]);

  const refreshUser = useCallback(async () => {
    const user = await authService.getMe();
    setSession((prev) => {
      const next = prev ? { ...prev, user } : prev;
      writeSession(next);
      return next;
    });
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: session?.user?.role === 'ADMIN',
      checking,
      login,
      logout,
      refreshUser,
    }),
    [session, checking, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** "Ana María Pérez" -> "AP" (iniciales del nombre y del apellido). */
export function initialsOf(user) {
  if (!user) return '';
  const first = user.firstName?.trim()?.[0] ?? '';
  const last = user.lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase();
}
