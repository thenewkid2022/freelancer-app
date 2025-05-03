import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { toast } from 'react-toastify';

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
  const navigate = useNavigate();

  const login = async (data: LoginData): Promise<void> => {
    setLoading(true);
    setError(null);
    console.log('Starte Login-Versuch...');
    try {
      console.log('Sende Login-Anfrage...');
      const response = await apiClient.post<{ user: AuthUser; token: string }>('/auth/login', data);
      console.log('Login erfolgreich:', response);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      toast.success('Erfolgreich eingeloggt');
    } catch (err) {
      console.error('Login-Fehler:', err);
      let message = 'Ein Fehler ist aufgetreten';
      
      if (err instanceof Error) {
        message = err.message;
        if (message.includes('timeout')) {
          message = 'Die Verbindung zum Server hat zu lange gedauert. Bitte versuchen Sie es erneut.';
        } else if (message.includes('Network Error')) {
          message = 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
        }
      }
      
      setError(message);
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setLoading(true);
    setError(null);
    console.log('Starte Registrierungs-Versuch...');
    try {
      console.log('Sende Registrierungs-Anfrage...');
      const response = await apiClient.post<{ user: AuthUser; token: string }>('/auth/register', data);
      console.log('Registrierung erfolgreich:', response);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      toast.success('Erfolgreich registriert');
    } catch (err) {
      console.error('Registrierungs-Fehler:', err);
      let message = 'Ein Fehler ist aufgetreten';
      
      if (err instanceof Error) {
        message = err.message;
        if (message.includes('timeout')) {
          message = 'Die Verbindung zum Server hat zu lange gedauert. Bitte versuchen Sie es erneut.';
        } else if (message.includes('Network Error')) {
          message = 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
        }
      }
      
      setError(message);
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logout durchgeführt');
    setUser(null);
    localStorage.removeItem('token');
    toast.info('Erfolgreich ausgeloggt');
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Kein Token gefunden');
      return;
    }

    try {
      console.log('Überprüfe Authentifizierung...');
      const response = await apiClient.get<AuthUser>('/auth/me');
      console.log('Authentifizierung erfolgreich:', response);
      setUser(response);
    } catch (err) {
      console.error('Authentifizierungs-Fehler:', err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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