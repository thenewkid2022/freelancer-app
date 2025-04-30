import { apiClient } from '../api/client';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/api';

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    this.token = localStorage.getItem('token');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    this.setSession(response.data);
    return response.data;
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    this.setSession(response.data);
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearSession();
    }
  }

  public async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    this.user = response.data;
    return response.data;
  }

  public async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data);
    this.user = response.data;
    return response.data;
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  private setSession(authResponse: AuthResponse): void {
    this.token = authResponse.token;
    this.user = authResponse.user;
    localStorage.setItem('token', authResponse.token);
  }

  private clearSession(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
  }
}

export const authService = AuthService.getInstance(); 