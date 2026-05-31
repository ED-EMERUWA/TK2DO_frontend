import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

import { storage } from '../lib/storage';
import { env } from '../config/env';
import type { UserProfile } from '../types';

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Hydrate from SecureStore
  // -------------------------
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storage.getToken(),
          storage.getUser(),
        ]);

        if (storedToken) setToken(storedToken);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load auth state:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${env.BACKEND_ORIGIN}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await response.json();

    // persist
    await storage.setToken(data.token);
    await storage.setUser(data.user);

    // update state
    setToken(data.token);
    setUser(data.user);
  }, []);

  // -------------------------
  // SIGNUP
  // -------------------------
  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await fetch(`${env.BACKEND_ORIGIN}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Signup failed');
      }

      const data = await response.json();

      // persist
      await storage.setToken(data.token);
      await storage.setUser(data.user);

      // update state
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = useCallback(async () => {
    await storage.deleteToken();
    await storage.deleteUser();

    setToken(null);
    setUser(null);
    storage.deleteToken();
    const storedToken = await storage.getToken();
    console.log('Token after deletion:', storedToken); // Should log null
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -------------------------
// Hook
// -------------------------
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
}