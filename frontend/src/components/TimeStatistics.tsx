import React from 'react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useStatistics } from '../hooks/useStatistics';
import type { Statistics } from '../types/statistics';

export const TimeStatistics: React.FC = () => {
  const { timeEntries, loading, error } = useTimeEntries();
  const { statistics, loading: statsLoading } = useStatistics();

  if (loading || statsLoading) {
    return <div>Loading statistics...</div>;
  }

  if (error) {
    return <div>Error loading statistics: {error.message}</div>;
  }

  return (
    <div className="time-statistics">
      <h2 className="text-2xl font-bold mb-4">Time Statistics</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      <div className="project-breakdown">
        <h3 className="text-xl font-semibold mb-3">Project Breakdown</h3>
        <div className="grid grid-cols-2 gap-4">
          {statistics.projectBreakdown.map((project, index) => (
            <div key={index} className="project-card p-4 bg-white rounded shadow">
              <h4 className="font-semibold">{project.name}</h4>
              <p className="text-lg">{project.hours} hours</p>
              <p className="text-sm text-gray-600">
                {((project.hours / statistics.totalHours) * 100).toFixed(1)}% of total
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeStatistics; 