import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'https://freelancer-app-1g8o.onrender.com/api';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

interface ErrorResponse {
  message: string;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

class ApiClient {
  private instance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: RetryConfig = defaultRetryConfig) {
    this.retryConfig = config;
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
    // Request Interceptor
    this.instance.interceptors.request.use(
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
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        const originalRequest = error.config as RetryableRequestConfig;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Wenn der Fehler 401 ist und wir noch keine Retry-Versuche gemacht haben
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Retry-Logik für andere Fehler
        if (
          error.response &&
          this.retryConfig.retryableStatusCodes.includes(error.response.status) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(this.instance(originalRequest));
            }, this.retryConfig.retryDelay);
          });
        }

        // Fehlerbehandlung
        if (error.response) {
          const message = error.response.data?.message || 'Ein Fehler ist aufgetreten';
          toast.error(message);
        } else if (error.request) {
          toast.error('Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.');
        } else {
          toast.error('Ein unerwarteter Fehler ist aufgetreten.');
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`PATCH Anfrage an: ${url}`, data);
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(); 