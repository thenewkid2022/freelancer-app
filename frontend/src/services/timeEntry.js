import api from './api';

export const timeEntryService = {
  // Alle Zeiterfassungen abrufen
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/time-entries', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Neue Zeiterfassung erstellen
  create: async (timeEntry) => {
    try {
      const response = await api.post('/time-entries', timeEntry);
      console.log('Create Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create Error:', error);
      throw error;
    }
  },

  // Zeiterfassung aktualisieren
  update: async (id, timeEntry) => {
    try {
      const response = await api.put(`/time-entries/${id}`, timeEntry);
      console.log('Update Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update Error:', error);
      throw error;
    }
  },

  // Zeiterfassung löschen
  delete: async (id) => {
    try {
      const response = await api.delete(`/time-entries/${id}`);
      console.log('Delete Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete Error:', error);
      throw error;
    }
  },

  // Statistiken abrufen
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/time-entries/stats/filtered', { params });
      console.log('Stats Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Stats Error:', error);
      throw error;
    }
  },

  // Tägliche Statistiken
  getDailyStats: async () => {
    try {
      const response = await api.get('/time-entries/stats/daily');
      console.log('Daily Stats Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Daily Stats Error:', error);
      throw error;
    }
  },

  // Monatliche Statistiken
  getMonthlyStats: async () => {
    try {
      const response = await api.get('/time-entries/stats/monthly');
      console.log('Monthly Stats Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Monthly Stats Error:', error);
      throw error;
    }
  }
}; 