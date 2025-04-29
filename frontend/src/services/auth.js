import api from './api';

export const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
    }
    return response.data;
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
    return !!localStorage.getItem('token');
  },

  // Profil abrufen
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
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