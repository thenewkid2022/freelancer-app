import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

const TimeStatistics = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'daily',
    format: 'json'
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Lade Statistiken mit Filtern:', filters);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/time-entries/stats/filtered?${queryParams}`, config);
      
      console.log('Statistiken erfolgreich geladen:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
      setError(error.message);
      
      if (error.response?.status === 401) {
        toast.error('Bitte melden Sie sich erneut an');
        window.location.href = '/login';
      } else {
        toast.error('Fehler beim Laden der Statistiken');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialer Abruf und bei Filter-Änderungen
  useEffect(() => {
    fetchStats();
  }, [filters]);

  // Automatische Aktualisierung alle 5 Minuten
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Zeiterfassungs-Statistiken', 20, 10);
      
      let yPos = 30;
      stats.forEach((stat, index) => {
        const text = `${stat.date}: ${stat.totalHours} Stunden (${stat.totalEntries} Einträge)`;
        doc.text(text, 20, yPos);
        yPos += 10;
      });
      
      doc.save('zeiterfassung-statistiken.pdf');
      toast.success('PDF erfolgreich exportiert');
    } catch (error) {
      toast.error('Fehler beim PDF-Export');
      console.error('Fehler beim PDF-Export:', error);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/stats/filtered', {
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'zeiterfassung-statistiken.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CSV erfolgreich exportiert');
    } catch (error) {
      toast.error('Fehler beim CSV-Export');
      console.error('Fehler beim CSV-Export:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Lade Statistiken...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Fehler: {error}</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Zeiterfassungs-Statistiken</h2>
      
      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startdatum
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enddatum
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gruppierung
          </label>
          <select
            name="groupBy"
            value={filters.groupBy}
            onChange={handleFilterChange}
            className="w-full p-2 border rounded"
          >
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>
      </div>

      {/* Statistik-Anzeige */}
      {stats && stats.results && stats.results.length > 0 ? (
        <div>
          <BarChart width={800} height={400} data={stats.results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalHours" fill="#4F46E5" name="Stunden" />
          </BarChart>
          
          {/* Zusammenfassung */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium">Gesamtstunden</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalStats?.totalHours?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium">Durchschnitt/Tag</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalStats?.averageHoursPerPeriod?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium">Anzahl Einträge</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalStats?.totalEntries || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium">Zeiträume</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalStats?.totalPeriods || 0}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Keine Daten für den ausgewählten Zeitraum verfügbar
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportToPDF}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          PDF Export
        </button>
        <button
          onClick={exportToCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          CSV Export
        </button>
      </div>
    </div>
  );
};

export default TimeStatistics; 