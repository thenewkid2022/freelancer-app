import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (data: LoginData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ user: AuthUser; token: string }>('/api/auth/login', data);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      toast.success('Erfolgreich eingeloggt');
    } catch (err) {
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
    try {
      const response = await apiClient.post<{ user: AuthUser; token: string }>('/api/auth/register', data);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      toast.success('Erfolgreich registriert');
    } catch (err) {
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
    setUser(null);
    localStorage.removeItem('token');
    toast.info('Erfolgreich ausgeloggt');
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await apiClient.get<AuthUser>('/api/auth/me');
      setUser(response);
    } catch (err) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
}; 