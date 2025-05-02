import { useState, useCallback } from 'react';
import axios from 'axios';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', data);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/register', data);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      logout();
    }
  }, [logout]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isLoading: loading,
    isAuthenticated: !!user
  };
}; 