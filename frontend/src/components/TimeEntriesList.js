import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

const TimeEntriesList = ({ refresh, onEntryUpdated }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [sortConfig, setSortConfig] = useState({ field: 'startTime', order: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    startDate: '',
    endDate: '',
    project: ''
  });
  const [editForm, setEditForm] = useState({
    startTime: '',
    endTime: '',
    duration: 0,
    projectNumber: '',
    projectName: '',
    description: ''
  });

  // Ausloggen und zur Login-Seite weiterleiten
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
    navigate('/login');
  }, [navigate]);

  // Konfiguriere axios mit dem Auth-Token
  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleLogout();
      return null;
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }, [handleLogout]);

  // Zeiterfassungen vom Backend abrufen
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    console.log('Starte Abruf der Zeiterfassungen...');
    try {
      const config = getAuthConfig();
      if (!config) return;

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.order,
        ...filterConfig,
        _t: Date.now()  // Cache-Busting Parameter
      });

      const response = await api.get(
        `/api/time-entries?${queryParams}`,
        config
      );
      console.log('Antwort vom Server erhalten:', response.data);
      
      if (response.data && response.data.timeEntries) {
        setEntries(response.data.timeEntries);
        setTotalPages(response.data.pagination?.totalPages || 1);
        console.log('Zeiterfassungen gesetzt:', response.data.timeEntries);
      } else {
        console.error('Unerwartetes Antwortformat:', response.data);
        setEntries([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Zeiterfassungen:', error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        toast.error('Fehler beim Laden der Zeiterfassungen');
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortConfig, filterConfig, getAuthConfig, handleLogout]);

  // Funktion zum manuellen Aktualisieren
  const refreshList = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Initial laden und bei Änderungen
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refresh, currentPage, sortConfig.field, sortConfig.order, refreshCounter]);

  // Bearbeitung starten
  const handleEdit = useCallback((entry) => {
    setEditingEntry(entry._id);
    const [projectNumber] = (entry.project || 'Allgemein').split(' - ');
    setEditForm({
      startTime: new Date(entry.startTime).toISOString().slice(0, 16),
      endTime: new Date(entry.endTime).toISOString().slice(0, 16),
      duration: entry.duration,
      projectNumber: projectNumber || '',
      projectName: '', // Nicht verwendet, aber für zukünftige Erweiterungen beibehalten
      description: entry.description || ''
    });
    toast.info('Bearbeitungsmodus aktiviert');
  }, []);

  // Bearbeitung speichern
  const handleSave = useCallback(async (id) => {
    try {
      setLoading(true);
      console.log('Speichere Änderungen für Eintrag:', id);
      const config = getAuthConfig();
      if (!config) return;

      const response = await api.put(
        `/api/time-entries/${id}`,
        {
          startTime: new Date(editForm.startTime),
          endTime: new Date(editForm.endTime),
          duration: editForm.duration,
          project: `${editForm.projectNumber} - ${editForm.projectName}`,
          description: editForm.description
        },
        config
      );
      console.log('Änderungen gespeichert:', response.data);
      
      setEntries(prev => prev.map(entry => 
        entry._id === id ? response.data : entry
      ));
      setEditingEntry(null);
      toast.success('Änderungen erfolgreich gespeichert');
      if (onEntryUpdated) onEntryUpdated();
      refreshList();
    } catch (error) {
      console.error('Fehler beim Speichern der Änderungen:', error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        toast.error('Fehler beim Speichern der Änderungen');
      }
    } finally {
      setLoading(false);
    }
  }, [editForm, getAuthConfig, handleLogout, onEntryUpdated, refreshList]);

  // Eintrag löschen
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Lösche Eintrag:', id);
      const config = getAuthConfig();
      if (!config) return;

      await api.delete(
        `/api/time-entries/${id}`,
        config
      );
      console.log('Eintrag erfolgreich gelöscht');
      
      setEntries(prev => prev.filter(entry => entry._id !== id));
      toast.success('Zeiteintrag erfolgreich gelöscht');
      refreshList();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      if (error.response?.status === 401) {
        handleLogout();
      } else if (error.response?.status === 404) {
        setEntries(prev => prev.filter(entry => entry._id !== id));
        toast.info('Eintrag war bereits gelöscht oder nicht mehr vorhanden.');
      } else {
        toast.error('Fehler beim Löschen des Eintrags');
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig, handleLogout, refreshList]);

  // Sortierung ändern
  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filter ändern
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilterConfig(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Zurück zur ersten Seite bei Filteränderung
  }, []);

  // Dauer formatieren
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return '0h 0m 0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }, []);

  // Datum formatieren
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }, []);

  // Mobile Karten-Ansicht
  const MobileCard = useCallback(({ entry }) => {
    const [projectNumber] = (entry.project || 'Allgemein').split(' - ');
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-sm text-gray-500">Projekt</span>
            <p className="font-medium">{projectNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Dauer</span>
            <p className="font-medium">{formatDuration(entry.duration)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-sm text-gray-500">Start</span>
            <p className="text-sm">{formatDateTime(entry.startTime)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Ende</span>
            <p className="text-sm">{formatDateTime(entry.endTime)}</p>
          </div>
        </div>
        
        {entry.description && (
          <div className="mt-3">
            <span className="text-sm text-gray-500">Beschreibung</span>
            <p className="text-sm mt-1">{entry.description}</p>
          </div>
        )}
        
        <div className="flex justify-end mt-3 space-x-2">
          <button
            onClick={() => handleEdit(entry)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Bearbeiten
          </button>
          <button
            onClick={() => handleDelete(entry._id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Löschen
          </button>
        </div>
      </div>
    );
  }, [formatDateTime, formatDuration, handleEdit, handleDelete]);

  // Sortier-Indikator
  const getSortIndicator = useCallback((field) => {
    if (sortConfig.field !== field) return '↕';
    return sortConfig.order === 'asc' ? '↑' : '↓';
  }, [sortConfig]);

  // Memoized Filter-UI
  const filterUI = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Startdatum
        </label>
        <input
          type="date"
          name="startDate"
          value={filterConfig.startDate}
          onChange={handleFilterChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enddatum
        </label>
        <input
          type="date"
          name="endDate"
          value={filterConfig.endDate}
          onChange={handleFilterChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Projekt
        </label>
        <input
          type="text"
          name="project"
          value={filterConfig.project}
          onChange={handleFilterChange}
          className="w-full p-2 border rounded-lg"
          placeholder="Projekt filtern"
        />
      </div>
    </div>
  ), [filterConfig, handleFilterChange]);

  // Memoized Pagination-UI
  const paginationUI = useMemo(() => (
    <div className="flex justify-center items-center space-x-4 mt-4">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300"
      >
        Zurück
      </button>
      <span className="text-gray-600">
        Seite {currentPage} von {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300"
      >
        Weiter
      </button>
    </div>
  ), [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#3B82F6" size={50} />
      </div>
    );
  }

  console.log('Aktuelle Zeiterfassungen:', entries);

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 max-w-4xl mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 text-center">
        Gespeicherte Zeiterfassungen
      </h2>

      {filterUI}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : !entries || entries.length === 0 ? (
        <p className="text-gray-600 text-center py-8">
          Keine Zeiterfassungen vorhanden.
        </p>
      ) : (
        <>
          {/* Mobile Ansicht */}
          <div className="md:hidden space-y-4">
            {entries.map(entry => (
              <MobileCard key={entry._id} entry={entry} />
            ))}
          </div>

          {/* Desktop Ansicht */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th 
                    className="border border-gray-300 px-4 py-2 text-left text-gray-700 cursor-pointer"
                    onClick={() => handleSort('startTime')}
                  >
                    Startzeit {getSortIndicator('startTime')}
                  </th>
                  <th 
                    className="border border-gray-300 px-4 py-2 text-left text-gray-700 cursor-pointer"
                    onClick={() => handleSort('endTime')}
                  >
                    Endzeit {getSortIndicator('endTime')}
                  </th>
                  <th 
                    className="border border-gray-300 px-4 py-2 text-left text-gray-700 cursor-pointer"
                    onClick={() => handleSort('duration')}
                  >
                    Dauer {getSortIndicator('duration')}
                  </th>
                  <th 
                    className="border border-gray-300 px-4 py-2 text-left text-gray-700 cursor-pointer"
                    onClick={() => handleSort('project')}
                  >
                    Projekt {getSortIndicator('project')}
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-700">
                    Beschreibung
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-gray-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry._id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {formatDateTime(entry.startTime)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {formatDateTime(entry.endTime)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {entry.project || 'Allgemein'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-600">
                      {entry.description}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginationUI}
        </>
      )}
    </div>
  );
};

export default TimeEntriesList;