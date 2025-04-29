import { useState, useCallback } from 'react';
import { timeEntryService } from '../services/timeEntry';

export const useTimeEntries = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Zeiterfassungen laden
  const fetchTimeEntries = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.getAll(params);
      setTimeEntries(response.timeEntries || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || 0
      });
    } catch (err) {
      setError(err.message);
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Neue Zeiterfassung erstellen
  const createTimeEntry = useCallback(async (timeEntry) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.create(timeEntry);
      setTimeEntries(prev => [response, ...prev]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Zeiterfassung aktualisieren
  const updateTimeEntry = useCallback(async (id, timeEntry) => {
    setLoading(true);
    setError(null);
    try {
      const response = await timeEntryService.update(id, timeEntry);
      setTimeEntries(prev => prev.map(entry => 
        entry._id === id ? response : entry
      ));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Zeiterfassung löschen
  const deleteTimeEntry = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await timeEntryService.delete(id);
      setTimeEntries(prev => prev.filter(entry => entry._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    timeEntries,
    loading,
    error,
    pagination,
    fetchTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry
  };
}; 