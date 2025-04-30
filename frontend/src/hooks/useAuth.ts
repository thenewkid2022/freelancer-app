import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@services/authService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'freelancer' | 'client';
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
  role: 'freelancer' | 'client';
}

interface AuthResponse {
  token: string;
  user: User;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    enabled: !!token,
    retry: false,
    onError: () => {
      setToken(null);
      localStorage.removeItem('token');
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data: AuthResponse) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      navigate('/');
    },
  });

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (token) {
      authService.setAuthToken(token);
    }
  }, [token]);

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isAuthenticated: !!token,
  };
}; 