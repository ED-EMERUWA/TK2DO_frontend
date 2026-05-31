import { useCallback, useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { auth } from '../lib/api';
import type { UserProfile } from '../types';
//useauth.ts
export function useAuth() {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    storage.getToken().then(t => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await auth.login({ email, password });
    await storage.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const data = await auth.signup({ email, password, name });
    await storage.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteToken();
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, isLoading, login, signup, logout };
}
