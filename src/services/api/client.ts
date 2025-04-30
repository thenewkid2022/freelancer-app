import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { environment } from '@config/environment';
import { ApiResponse, ApiError } from '@types/api';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private readonly client: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/api/${environment.apiVersion}`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      },
      withCredentials: true
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (environment.enableDebug) {
          console.log('API Request:', {
            url: config.url,
            method: config.method,
            headers: {
              ...config.headers,
              Authorization: config.headers.Authorization ? 'Bearer [FILTERED]' : undefined
            },
            data: config.data
          });
        }

        return config;
      },
      (error) => {
        if (environment.enableDebug) {
          console.error('Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (environment.enableDebug) {
          console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data
          });
        }
        return response;
      },
      (error) => {
        if (environment.enableDebug) {
          console.error('Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
          });
        }

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        const apiError: ApiError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details
        };

        return Promise.reject(apiError);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

// Erstelle eine Singleton-Instanz des API-Clients
export const apiClient = new ApiClient({
  baseURL: environment.apiUrl,
  timeout: environment.timeout
}); 