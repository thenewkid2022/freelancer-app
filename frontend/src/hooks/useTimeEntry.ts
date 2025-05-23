import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
}

interface TimeEntryFormData {
  projectId: string;
  description: string;
  startTime: string;
  endTime: string;
}

export const useTimeEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTimeEntry = async (id: string, data: Partial<TimeEntryFormData>): Promise<TimeEntry> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${API_URL}/time-entries/${id}`, data);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTimeEntry = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/time-entries/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateTimeEntry,
    deleteTimeEntry,
  };
}; 