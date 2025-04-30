import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Debug-Logging
    console.log('Request Interceptor - Details:', {
      url: config.url,
      method: config.method,
      tokenExists: !!token,
      currentHeaders: config.headers,
      timestamp: new Date().toISOString()
    });
    
    if (token) {
      // Stelle sicher, dass headers existiert
      config.headers = config.headers || {};
      
      // Setze den Authorization Header
      config.headers.Authorization = `Bearer ${token}`;
      
      // Debug-Logging nach Header-Setzung
      console.log('Token wurde gesetzt:', {
        headerExists: !!config.headers.Authorization,
        headerLength: config.headers.Authorization.length
      });
    } else {
      console.warn('Kein Token im localStorage gefunden');
    }
    
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 