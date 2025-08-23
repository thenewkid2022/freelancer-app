import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, TimeEntry, TimeEntryFormData, User, Statistics } from '../types';

const API_URL = 'http://localhost:3001/api'; // Für lokale Entwicklung

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor - Token hinzufügen
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Token bei 401 entfernen
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('token');
          // Hier könnten wir zur Login-Seite navigieren
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Services
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.instance.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.instance.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.instance.get('/auth/me');
    return response.data;
  }

  // Time Entries Services
  async getTimeEntries(): Promise<TimeEntry[]> {
    const response: AxiosResponse<TimeEntry[]> = await this.instance.get('/time-entries');
    return response.data;
  }

  async createTimeEntry(entry: TimeEntryFormData): Promise<TimeEntry> {
    const response: AxiosResponse<TimeEntry> = await this.instance.post('/time-entries', entry);
    return response.data;
  }

  async updateTimeEntry(id: string, entry: TimeEntryFormData): Promise<TimeEntry> {
    const response: AxiosResponse<TimeEntry> = await this.instance.put(`/time-entries/${id}`, entry);
    return response.data;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await this.instance.delete(`/time-entries/${id}`);
  }

  // Statistics Services
  async getStatistics(): Promise<Statistics> {
    const response: AxiosResponse<Statistics> = await this.instance.get('/stats');
    return response.data;
  }

  // Export Services
  async exportTimeEntries(startDate: string, endDate: string): Promise<Blob> {
    const response = await this.instance.get('/export', {
      params: { startDate, endDate },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
