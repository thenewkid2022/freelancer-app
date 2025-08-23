import { useState, useEffect } from 'react';
import type { Statistics } from '../types/statistics';

const API_URL = process.env.REACT_APP_API_URL;

interface UseStatisticsReturn {
  statistics: Statistics;
  loading: boolean;
  error: Error | null;
}

export const useStatistics = (): UseStatisticsReturn => {
  const [statistics, setStatistics] = useState<Statistics>({
    totalHours: 0,
    totalEntries: 0,
    averageHoursPerDay: 0,
    projectBreakdown: [],
    dailyData: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_URL}/statistics`);
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, loading, error };
}; 