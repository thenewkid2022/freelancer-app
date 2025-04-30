import axios from 'axios';

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
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(`${API_URL}/auth/me`);
    return response.data;
  }

  logout() {
    this.token = null;
    delete axios.defaults.headers.common['Authorization'];
  }
}

export const authService = new AuthService(); 