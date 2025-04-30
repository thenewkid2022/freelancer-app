import axios from 'axios';
import { authService } from './auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug-Logging für jeden Request
    console.log('API - Request Details:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [FILTERED]' : undefined
      },
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  (error) => {
    console.error('API - Request Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Debug-Logging für erfolgreiche Antworten
    console.log('API - Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  (error) => {
    // Debug-Logging für Fehler
    console.error('API - Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });

    // Spezifische Fehlerbehandlung
    if (error.response?.status === 401) {
      console.log('Unauthorized - Logging out');
      authService.logout();
      window.location.href = '/login';
    } else if (!error.response) {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 