import api from './api';
import { authService } from './auth';

class AIService {
  async analyzeActivity(description) {
    try {
      // Token über den Auth-Service abrufen
      const token = authService.getToken();
      
      console.log('AI Service - Token Status:', {
        exists: !!token,
        valid: authService.isAuthenticated(),
        timestamp: new Date().toISOString()
      });

      if (!token) {
        throw new Error('Kein gültiges Authentifizierungstoken gefunden');
      }

      // Explizite Request-Konfiguration
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Debug-Logging für Request-Headers
      console.log('AI Service - Request Details:', {
        url: '/api/ai/analyze',
        headers,
        description: description?.length || 0,
        timestamp: new Date().toISOString()
      });

      // Sende Request mit expliziten Optionen
      const response = await api.post('/api/ai/analyze', { description }, { 
        headers,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      // Debug-Logging für erfolgreiche Antwort
      console.log('AI Service - Erfolgreiche Antwort:', {
        status: response.status,
        headers: response.headers,
        data: response.data,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      // Wenn der Token ungültig ist, Logout durchführen
      if (error.response?.status === 401) {
        console.warn('Token ungültig - Logout durchführen');
        authService.logout();
        window.location.href = '/login';
      }

      // Erweitertes Error-Logging
      console.error('AI Service - Fehler:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.config?.headers,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async getSuggestions(projectId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      const response = await api.get(`/api/ai/suggestions/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorschläge:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async categorizeActivity(description) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      const response = await api.post('/api/ai/categorize', {
        description
      });
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Kategorisierung:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

export const aiService = new AIService(); 