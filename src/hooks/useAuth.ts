import { useCallback, useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { auth } from '../lib/api';
import type { UserProfile } from '../types';
import { env } from '../config/env';



export function useAuth() {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);

  // useEffect(() => {
  //   storage.getToken().then(t => {
  //     setToken(t);
  //     setLoading(false);
  //   });
  // }, []);

const login = useCallback(async (email: string, password: string) => {
  console.log('Attempting login with email:', email);
    try {
      const response = await fetch(`${env.BACKEND_ORIGIN}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'email': email, 'password': password }),
      });
          console.log(response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
    
      }
      const data = await response.json();
      await storage.setToken(data.token);
      
      await storage.setUser(data.user);
      console.log('Login successful, user:', data.user);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);


  const signup = useCallback(async (email: string, password: string, name?: string) => {
    console.log('Attempting signup with email:', email);
    try {
      const response = await fetch(`${env.BACKEND_ORIGIN}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'email': email, 'password': password, 'name': name }),
      });
      console.log(response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }
      const data = await response.json();
      await storage.setToken(data.token);
      await storage.setUser(data.user);
    
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
 
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteToken();
    await storage.deleteUser();
 
  }, []);

  return { token, user, isLoading, login, signup, logout };
}
