import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Debug-Logging für jeden Request
    console.log('API - Request Details:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      timestamp: new Date().toISOString()
    });
    return config;
  },
  (error) => {
    console.error('API - Request Error:', error);
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
      headers: error.config?.headers,
      timestamp: new Date().toISOString()
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 