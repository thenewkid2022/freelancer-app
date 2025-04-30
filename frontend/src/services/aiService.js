import api from './api';

class AIService {
  async analyzeActivity(description) {
    try {
      const response = await api.post('/api/ai/analyze', {
        description
      });
      return response.data;
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      throw error;
    }
  }

  async getSuggestions(projectId) {
    try {
      const response = await api.get(`/api/ai/suggestions/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorschläge:', error);
      throw error;
    }
  }

  async categorizeActivity(description) {
    try {
      const response = await api.post('/api/ai/categorize', {
        description
      });
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Kategorisierung:', error);
      throw error;
    }
  }
}

export const aiService = new AIService(); 