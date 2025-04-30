import api from './api';

class AIService {
  async analyzeActivity(description) {
    try {
      const token = localStorage.getItem('token');
      
      // Debug-Logging für Token-Status
      console.log('AI Service - Token Status:', {
        exists: !!token,
        length: token?.length || 0,
        timestamp: new Date().toISOString()
      });

      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      // Explizite Request-Konfiguration
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Debug-Logging für Request-Konfiguration
      console.log('AI Service - Request Config:', {
        url: '/api/ai/analyze',
        headers: config.headers,
        timestamp: new Date().toISOString()
      });

      const response = await api.post('/api/ai/analyze', { description }, config);

      // Debug-Logging für erfolgreiche Antwort
      console.log('AI Service - Erfolgreiche Antwort:', {
        status: response.status,
        headers: response.headers,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      // Erweitertes Error-Logging
      console.error('AI Service - Fehler:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        requestConfig: error.config,
        requestHeaders: error.config?.headers,
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