import { apiClient } from './api/client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
  role: 'freelancer' | 'client';
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'freelancer' | 'client';
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    this.setAuthToken(response.token);
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    this.setAuthToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService(); 