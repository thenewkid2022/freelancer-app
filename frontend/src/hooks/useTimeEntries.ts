import { useState, useEffect } from 'react';
import type { TimeEntry } from '../types/statistics';

interface UseTimeEntriesReturn {
  timeEntries: TimeEntry[];
  loading: boolean;
  error: Error | null;
}

export const useTimeEntries = (): UseTimeEntriesReturn => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        const response = await fetch('/api/time-entries');
        if (!response.ok) {
          throw new Error('Failed to fetch time entries');
        }
        const data = await response.json();
        setTimeEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, []);

  return { timeEntries, loading, error };
}; 