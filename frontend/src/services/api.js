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
    
    // Debug-Logging vor der Header-Setzung
    console.log('Request Interceptor - Vor Header-Setzung:', {
      url: config.url,
      method: config.method,
      tokenExists: !!token,
      currentHeaders: JSON.stringify(config.headers),
      timestamp: new Date().toISOString()
    });
    
    if (token) {
      // Stelle sicher, dass headers existiert und initialisiere es neu
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Debug-Logging nach Header-Setzung
      console.log('Request Interceptor - Nach Header-Setzung:', {
        url: config.url,
        method: config.method,
        headers: JSON.stringify(config.headers),
        timestamp: new Date().toISOString()
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
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
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