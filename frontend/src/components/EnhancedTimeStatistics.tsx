import React, { useState } from 'react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useStatistics } from '../hooks/useStatistics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { TimeRange, ChartType, Statistics } from '../types/statistics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const EnhancedTimeStatistics: React.FC = () => {
  const { timeEntries, loading, error } = useTimeEntries();
  const { statistics, loading: statsLoading } = useStatistics();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [chartType, setChartType] = useState<ChartType>('line');

  if (loading || statsLoading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div>Error loading statistics: {error.message}</div>;
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={statistics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={statistics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={statistics.projectBreakdown}
                dataKey="hours"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {statistics.projectBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="enhanced-statistics">
      <div className="controls mb-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="mr-4 p-2 border rounded"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          className="p-2 border rounded"
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      <div className="summary-stats mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">Total Hours</h3>
            <p className="text-2xl">{statistics.totalHours}</p>
          </div>
          <div className="stat-card p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">Average Daily Hours</h3>
            <p className="text-2xl">{statistics.averageHoursPerDay}</p>
          </div>
          <div className="stat-card p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">Total Entries</h3>
            <p className="text-2xl">{statistics.totalEntries}</p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default EnhancedTimeStatistics; 