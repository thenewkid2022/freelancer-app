import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'https://freelancer-app-1g8o.onrender.com/api';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

const defaultRetryConfig: RetryConfig = {
  retries: 5,
  retryDelay: 2000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

interface ErrorResponse {
  message: string;
}

class ApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...defaultRetryConfig, ...config };
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        const message = error.response?.data?.message || error.message;
        
        if (error.response?.status === 403) {
          toast.error('Sie haben keine Berechtigung für diese Aktion');
        } else if (error.response?.status === 401) {
          toast.error('Bitte melden Sie sich an');
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          toast.error('Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.');
        } else {
          toast.error(message);
        }

        // Retry-Logik für Timeouts und Server-Fehler
        if (this.shouldRetry(error)) {
          const config = error.config;
          if (config) {
            try {
              return await this.retryRequest(config);
            } catch (retryError) {
              return Promise.reject(retryError);
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout') ||
      (error.response !== undefined &&
        this.retryConfig.retryableStatusCodes.includes(error.response.status))
    );
  }

  private async retryRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const retryCount = (config as any).__retryCount || 0;

    if (retryCount >= this.retryConfig.retries) {
      return Promise.reject(new Error('Max retries reached'));
    }

    (config as any).__retryCount = retryCount + 1;

    await new Promise((resolve) => 
      setTimeout(resolve, this.retryConfig.retryDelay * (retryCount + 1))
    );

    return this.client(config);
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(); 