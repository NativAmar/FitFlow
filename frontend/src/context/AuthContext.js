import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getStoredToken,
  saveAuth,
  clearAuth,
} from "../services/authService";
import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  // Bootstrap: verify stored token against /api/users/me on every app load.
  // If the token is missing, expired, or invalid the user is treated as unauthenticated.
  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await apiRequest("/api/users/me");
        if (!cancelled) {
          setUser(me);
          setToken(stored);
        }
      } catch {
        // Token invalid or expired — clear it silently
        if (!cancelled) {
          clearAuth();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Clear locally even if server-side logout fails (e.g. expired token)
    } finally {
      clearAuth();
      setUser(null);
      setToken(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiRequest("/api/users/me");
      setUser(me);
      return me;
    } catch {
      clearAuth();
      setUser(null);
      setToken(null);
      throw new Error("Session expired. Please log in again.");
    }
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
