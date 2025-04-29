import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EnhancedTimeStatistics = ({ refresh }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  
  // Erweiterte Filter
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'daily',
    project: '',
    tags: [],
  });

  // Auth-Konfiguration
  const getAuthConfig = useCallback(() => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }), []);

  // Logout-Funktion
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    toast.error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
    navigate('/login');
  }, [navigate]);

  // Diagrammdaten vorbereiten
  const prepareChartData = useCallback((data) => {
    if (!data?.stats) return;

    // Daten für das Balkendiagramm
    const barData = data.stats.map(entry => ({
      name: entry.date,
      stunden: parseFloat(entry.totalHours.toFixed(2)),
      einträge: entry.totalEntries
    }));
    setChartData(barData);

    // Projekt-Statistiken - Alle Projekte berücksichtigen
    if (data.stats && data.stats.length > 0) {
      // Sammle alle einzigartigen Projekte und ihre Gesamtstunden
      const projectHours = {};
      data.stats.forEach(stat => {
        stat.projects.forEach(project => {
          if (!projectHours[project]) {
            projectHours[project] = 0;
          }
          // Teile die Stunden gleichmäßig auf die Projekte des Tages auf
          projectHours[project] += stat.totalHours / stat.projects.length;
        });
      });

      // Konvertiere in das Format für das Kuchendiagramm
      const pieData = Object.entries(projectHours).map(([project, hours]) => ({
        name: project,
        value: parseFloat(hours.toFixed(2))
      }));
      setProjectStats(pieData);
    }

    // Gesamtstatistiken setzen
    if (data.summary) {
      setStats({
        totalStats: {
          totalPeriods: data.stats.length,
          totalHours: parseFloat(data.summary.totalHours.toFixed(2)),
          averageHoursPerPeriod: parseFloat(data.summary.averageHoursPerDay),
          totalEntries: data.summary.totalEntries
        },
        results: data.stats.map(stat => ({
          period: stat.date,
          totalHours: parseFloat(stat.totalHours.toFixed(2)),
          totalMinutes: Math.round(stat.totalHours * 60),
          numberOfEntries: stat.totalEntries
        }))
      });
    }
  }, []);

  // Statistiken laden
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('groupBy', filters.groupBy);
      if (filters.project) queryParams.append('project', filters.project);
      if (filters.tags.length > 0) queryParams.append('tags', filters.tags.join(','));

      const response = await api.get(
        `/api/time-entries/stats/filtered?${queryParams}`,
        getAuthConfig()
      );

      console.log('Statistiken erhalten:', response.data);
      setStats(response.data);
      prepareChartData(response.data);
    } catch (err) {
      console.error('Fehler beim Laden der Statistiken:', err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError('Fehler beim Laden der Statistiken: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [filters, handleLogout, prepareChartData, getAuthConfig]);

  // PDF Export
  const exportToPDF = useCallback(() => {
    if (!stats) return;
    
    const doc = new jsPDF();
    
    // Titel
    doc.setFontSize(16);
    doc.text('Zeiterfassungs-Statistiken', 20, 20);
    
    // Gesamtstatistiken
    doc.setFontSize(14);
    doc.text('Gesamtübersicht', 20, 40);
    
    const totalStatsData = [
      ['Zeiträume', stats.totalStats.totalPeriods.toString()],
      ['Gesamtstunden', stats.totalStats.totalHours.toFixed(1)],
      ['Durchschnitt/Zeitraum', stats.totalStats.averageHoursPerPeriod],
      ['Einträge', stats.totalStats.totalEntries.toString()]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Metrik', 'Wert']],
      body: totalStatsData
    });
    
    // Detaillierte Statistiken
    doc.setFontSize(14);
    doc.text('Detaillierte Übersicht', 20, doc.lastAutoTable.finalY + 20);
    
    const detailData = stats.results.map(entry => [
      entry.period,
      entry.totalHours.toFixed(1),
      entry.totalMinutes.toString(),
      entry.numberOfEntries.toString()
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Zeitraum', 'Stunden', 'Minuten', 'Einträge']],
      body: detailData
    });
    
    // PDF speichern
    doc.save(`zeiterfassung_${filters.groupBy}_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [stats, filters.groupBy]);

  // CSV Export
  const exportToCSV = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        format: 'csv'
      });

      const response = await api.get(
        `/api/time-entries/stats/filtered?${queryParams}`,
        {
          ...getAuthConfig(),
          responseType: 'blob'
        }
      );

      // CSV-Datei herunterladen
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zeiterfassung_${filters.groupBy}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('CSV-Export erfolgreich');
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        toast.error('Fehler beim CSV-Export');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, getAuthConfig, handleLogout]);

  // Initial laden und bei Filter-Änderungen
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refresh]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Filter-Bereich */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Filter & Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gruppierung
            </label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projekt
            </label>
            <input
              type="text"
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Projektname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={filters.tags.join(',')}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value.split(',').map(tag => tag.trim()) })}
              className="w-full p-2 border rounded-lg"
              placeholder="Tag1, Tag2, ..."
            />
          </div>
          <div className="flex flex-col md:flex-row items-end space-y-2 md:space-y-0 md:space-x-2">
            <button
              onClick={() => fetchStats()}
              className="w-full md:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aktualisieren
            </button>
            <button
              onClick={exportToPDF}
              className="w-full md:w-auto bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              PDF
            </button>
            <button
              onClick={exportToCSV}
              className="w-full md:w-auto bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Diagramme */}
      {chartData && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Visualisierungen</h2>
          
          {/* Balkendiagramm */}
          <div className="mb-8">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">Zeitverteilung</h3>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <BarChart 
                  width={window.innerWidth < 768 ? window.innerWidth - 40 : 800}
                  height={300} 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#4B5563' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: '#4B5563' }}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'stunden') return [`${value}h`, 'Stunden'];
                      if (name === 'einträge') return [value, 'Einträge'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Datum: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="stunden" 
                    fill="#8884d8" 
                    name="Stunden"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="einträge" 
                    fill="#82ca9d" 
                    name="Einträge"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </div>
            </div>
          </div>

          {/* Projekt-Verteilung */}
          {projectStats && (
            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">Projektverteilung</h3>
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4">
                <div className="w-full lg:w-2/3 overflow-x-auto">
                  <div className="min-w-[300px] flex justify-center">
                    <PieChart 
                      width={window.innerWidth < 768 ? window.innerWidth - 40 : 400} 
                      height={300}
                    >
                      <Pie
                        data={projectStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={window.innerWidth < 768 ? 100 : 120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {projectStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
                    </PieChart>
                  </div>
                </div>
                <div className="w-full lg:w-1/3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Projekte</h4>
                  <div className="max-h-[200px] overflow-y-auto">
                    {projectStats.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center mb-2">
                        <div 
                          className="w-4 h-4 rounded-sm mr-2 flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm truncate flex-grow" title={entry.name}>
                          {entry.name.length > 20 ? `${entry.name.substring(0, 17)}...` : entry.name}
                        </span>
                        <span className="text-sm ml-2 flex-shrink-0">{entry.value.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gesamtstatistiken */}
      {stats?.totalStats && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Gesamtübersicht</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold text-blue-800">Zeiträume</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalStats.totalPeriods}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold text-green-800">Gesamtstunden</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {stats.totalStats.totalHours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold text-purple-800">Durchschnitt</h3>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">
                {stats.totalStats.averageHoursPerPeriod}h
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-base md:text-lg font-semibold text-yellow-800">Einträge</h3>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.totalStats.totalEntries}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detaillierte Statistiken */}
      {stats?.results && stats.results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
            {filters.groupBy === 'daily' ? 'Tägliche Übersicht' :
             filters.groupBy === 'weekly' ? 'Wöchentliche Übersicht' :
             'Monatliche Übersicht'}
          </h2>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zeitraum
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stunden
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Minuten
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Einträge
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.results.map((period) => (
                    <tr key={period.period} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm">
                        {period.period}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm">
                        {period.totalHours.toFixed(1)}h
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm">
                        {period.totalMinutes}min
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm">
                        {period.numberOfEntries}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTimeStatistics; 