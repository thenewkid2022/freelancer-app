import api from './api';

class AIService {
  async analyzeActivity(description) {
    try {
      const token = localStorage.getItem('token');
      console.log('AI Service - Token Check:', {
        exists: !!token,
        length: token?.length || 0,
        endpoint: '/api/ai/analyze',
        timestamp: new Date().toISOString()
      });

      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      // Konfiguration für die Anfrage
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      console.log('Sende KI-Analyse-Anfrage:', {
        url: '/api/ai/analyze',
        descriptionLength: description?.length || 0,
        hasToken: !!token,
        headerConfig: config.headers
      });

      const response = await api.post('/api/ai/analyze', { description }, config);

      console.log('KI-Analyse erfolgreich:', {
        status: response.status,
        dataReceived: !!response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        requestConfig: error.config,
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