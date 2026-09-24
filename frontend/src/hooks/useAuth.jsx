import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { setCsrfToken, clearCsrfToken, onSessionExpired } from '../api/http.js';
import * as authService from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState({ loading: true, authenticated: false });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadStatus = useCallback(async () => {
    try {
      const data = await authService.authStatus();
      setCsrfToken(data.csrf_token);
      setStatus({
        loading: false,
        authenticated: Boolean(data.authenticated),
        user: data.user || null,
        demoMode: Boolean(data.demo_mode),
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatus({ loading: false, authenticated: false, user: null, demoMode: false });
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const signInDemo = useCallback(async () => {
    try {
      const data = await authService.demoLogin();
      setCsrfToken(data.csrf_token);
      setStatus({
        loading: false,
        authenticated: true,
        user: data.user,
        demoMode: true,
      });
      navigate('/app');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the server call fails, drop the local session view.
    }
    clearCsrfToken();
    setStatus({ loading: false, authenticated: false, user: null, demoMode: false });
    navigate('/');
  }, [navigate]);

  const refresh = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    // Any authenticated API returning 401 means the server-side session
    // expired (idle timeout or absolute cap). Re-check auth: AppLayout will
    // flip to unauthenticated and redirect to the sign-in screen.
    onSessionExpired(refresh);
    return () => onSessionExpired(null);
  }, [refresh]);

  const value = useMemo(
    () => ({ ...status, error, signInDemo, signOut, refresh }),
    [status, error, signInDemo, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}