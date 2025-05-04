import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'freelancer';
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: 'admin' | 'freelancer';
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
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, credentials, { withCredentials: true });
    this.setAuthToken(response.data.token);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    if (data.role !== 'admin' && data.role !== 'freelancer') {
      throw new Error('Ungültige Rolle!');
    }
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, data, { withCredentials: true });
    this.setAuthToken(response.data.token);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService(); 