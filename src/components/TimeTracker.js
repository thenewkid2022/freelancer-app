import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function TimeTracker() {
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const { token } = useAuth();

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      const response = await api.get('/time-entries', config);
      setTimeEntries(response.data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const startTracking = async () => {
    try {
      const response = await api.post('/time-entries/start', {
        description
      }, config);
      setCurrentEntry(response.data);
      setIsTracking(true);
      fetchTimeEntries();
    } catch (error) {
      console.error('Error starting time tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      await api.post(`/time-entries/${currentEntry._id}/stop`, {}, config);
      setIsTracking(false);
      setCurrentEntry(null);
      setDescription('');
      fetchTimeEntries();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Time Tracker</h2>
      <div className="mb-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`mt-2 px-4 py-2 rounded ${
            isTracking
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isTracking ? 'Stop' : 'Start'}
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Time Entries</h3>
        <div className="space-y-2">
          {timeEntries.map((entry) => (
            <div
              key={entry._id}
              className="p-3 border rounded shadow-sm"
            >
              <div className="font-medium">{entry.description}</div>
              <div className="text-sm text-gray-600">
                Start: {new Date(entry.startTime).toLocaleString()}
              </div>
              {entry.endTime && (
                <div className="text-sm text-gray-600">
                  End: {new Date(entry.endTime).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimeTracker; 