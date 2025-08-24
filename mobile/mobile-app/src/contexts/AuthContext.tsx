import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginData, RegisterData } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginData): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(data);
      setUser(response.user);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      let message = 'Ein Fehler ist aufgetreten';
      if (err instanceof Error) {
        message = err.message;
      }
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
      const response = await apiClient.register(data);
      setUser(response.user);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      let message = 'Ein Fehler ist aufgetreten';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Überprüfe, ob der Token noch gültig ist
        try {
          await apiClient.getProfile();
        } catch (error) {
          // Token ist ungültig, logout
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
    }
  }, []);

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
