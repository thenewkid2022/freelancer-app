import axios from 'axios';

class AIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || window.location.origin;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeActivity(description) {
    try {
      const response = await this.axiosInstance.post('/api/ai/analyze', {
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
      const response = await this.axiosInstance.get(`/api/ai/suggestions/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Vorschläge:', error);
      throw error;
    }
  }

  async categorizeActivity(description) {
    try {
      const response = await this.axiosInstance.post('/api/ai/categorize', {
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