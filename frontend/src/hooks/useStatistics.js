import { useState, useCallback } from 'react';
import { timeEntryService } from '../services/timeEntry';

export const useStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Statistiken laden
  const fetchStats = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.getStats(params);
      setStats(response);
      return response;
    } catch (err) {
      setError(err.message);
      setStats(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tägliche Statistiken laden
  const fetchDailyStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.getDailyStats();
      setStats(response);
      return response;
    } catch (err) {
      setError(err.message);
      setStats(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Monatliche Statistiken laden
  const fetchMonthlyStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.getMonthlyStats();
      setStats(response);
      return response;
    } catch (err) {
      setError(err.message);
      setStats(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    fetchDailyStats,
    fetchMonthlyStats
  };
}; 