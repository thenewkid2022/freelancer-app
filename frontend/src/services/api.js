import axios from 'axios';
import { authService } from './auth';

// Explizite API-URL
const API_URL = process.env.REACT_APP_API_URL || 'https://freelancer-app-chi.vercel.app';

console.log('Initializing API with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: true,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Akzeptiere auch Fehler-Statuscodes für besseres Error-Handling
  }
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Stelle sicher, dass die URL korrekt formatiert ist
    if (!config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    // Debug-Logging für jeden Request
    console.log('API - Request Details:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [FILTERED]' : undefined
      },
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      withCredentials: config.withCredentials
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
      headers: response.headers,
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
      headers: error.response?.headers,
      timestamp: new Date().toISOString()
    });

    // Spezifische Fehlerbehandlung
    if (error.response?.status === 401) {
      console.log('Unauthorized - Logging out');
      authService.logout();
      window.location.href = '/login';
    } else if (error.response?.status === 405) {
      console.error('Method Not Allowed - Überprüfe API-Route:', {
        method: error.config?.method,
        url: error.config?.url,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`
      });
    } else if (!error.response) {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 