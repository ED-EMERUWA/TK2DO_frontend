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
import type { AuthResponse, UserProfile } from '../types';
import { api } from '../lib/api';

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
  console.log('Attempting login with email:', email);
  try {
    const data = await api.auth.login({ email, password });
        console.log('Login API response:', data);
    await storage.setToken(data.token);
    await storage.setUser(data.user);

    // update state — you were missing these!
    setToken(data.token);
    setUser(data.user);

    console.log('Login successful, user:', data.user);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}, []);

  // -------------------------
  // SIGNUP
  // -------------------------
 const signup = useCallback(async (email: string, password: string, name?: string) => {
  console.log('Attempting signup with email:', email);
  try {
    const data = await api.auth.signup({ email, password, name });

    await storage.setToken(data.token);
    await storage.setUser(data.user);

    setToken(data.token);
    setUser(data.user);

    console.log('Signup successful, user:', data.user);
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}, []);
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