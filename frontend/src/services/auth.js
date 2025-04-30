import api from './api';

const validateToken = (token) => {
  if (!token) return false;
  
  // Überprüfe Token-Format (JWT-Format)
  const tokenRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  return tokenRegex.test(token);
};

export const authService = {
  // Login
  login: async (email, password) => {
    try {
      console.log('Login-Versuch:', { email, apiUrl: api.defaults.baseURL });
      
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        // Validiere Token vor dem Speichern
        if (!validateToken(response.data.token)) {
          throw new Error('Ungültiges Token-Format');
        }
        
        console.log('Token erhalten:', {
          length: response.data.token.length,
          valid: true
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login-Fehler:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Registrierung
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
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

      const response = await api.get('/api/auth/profile');
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
    const response = await api.put('/api/auth/profile', userData);
    return response.data;
  },

  // Passwort ändern
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
}; 