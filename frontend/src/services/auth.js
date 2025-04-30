import api from './api';

const validateToken = (token) => {
  if (!token) {
    console.log('Token validation failed: Token is empty');
    return false;
  }
  
  // Überprüfe Token-Format (JWT-Format)
  const tokenRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  if (!tokenRegex.test(token)) {
    console.log('Token validation failed: Invalid format');
    return false;
  }
  
  // Überprüfe Token-Ablauf
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', {
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none',
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'none',
      userId: payload.userId || 'none'
    });
    
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('Token validation failed: Token expired');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Token validation error:', e);
    return false;
  }
};

export const authService = {
  // Login
  login: async (email, password) => {
    try {
      console.log('Login attempt:', { 
        email,
        apiUrl: api.defaults.baseURL,
        timestamp: new Date().toISOString()
      });
      
      // Explizite Request-Konfiguration
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      };
      
      const response = await api.post('auth/login', { 
        email, 
        password 
      }, config);
      
      console.log('Login response received:', {
        status: response.status,
        hasToken: !!response.data.token,
        timestamp: new Date().toISOString(),
        headers: response.headers
      });
      
      if (!response.data.token) {
        throw new Error('No token received in login response');
      }

      // Validiere Token vor dem Speichern
      if (!validateToken(response.data.token)) {
        throw new Error('Invalid token format or token expired');
      }
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  // Registrierung
  register: async (userData) => {
    try {
      const response = await api.post('auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  },

  // Token prüfen
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return validateToken(token);
  },

  // Token abrufen
  getToken: () => {
    const token = localStorage.getItem('token');
    if (!validateToken(token)) {
      console.warn('Ungültiges Token gefunden - Logout durchführen');
      authService.logout();
      return null;
    }
    return token;
  },

  // Profil abrufen
  getProfile: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Kein gültiges Token vorhanden');
      }

      const response = await api.get('auth/profile');
      return response.data;
    } catch (error) {
      console.error('Profil-Abruf-Fehler:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Profil aktualisieren
  updateProfile: async (userData) => {
    try {
      const response = await api.put('auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Passwort ändern
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Password change error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }
}; 