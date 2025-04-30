import api from './api';

class AIService {
  async analyzeActivity(description) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      console.log('Sende KI-Analyse-Anfrage:', {
        url: '/api/ai/analyze',
        descriptionLength: description?.length || 0,
        hasToken: !!token
      });

      const response = await api.post('/api/ai/analyze', {
        description
      });

      console.log('KI-Analyse erfolgreich:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
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