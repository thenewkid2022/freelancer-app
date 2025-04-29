import React, { useState, useEffect } from 'react';
import { timeEntryService } from '../services/timeEntry';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const STORAGE_KEY = 'timeTracker';

const TimeTracker = ({ onTimeEntrySaved }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    projectNumber: '',
    projectName: '',
    description: ''
  });

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const data = JSON.parse(savedData);
      setIsTracking(data.isTracking);
      setStartTime(data.startTime);
      setElapsedTime(data.elapsedTime);
      setProjectInfo(data.projectInfo);
      
      // Wenn eine Zeitmessung läuft, berechne die verstrichene Zeit
      if (data.isTracking && data.startTime) {
        const newElapsedTime = Date.now() - data.startTime;
        setElapsedTime(newElapsedTime);
      }
    }
  }, []);

  // Speichere Daten bei Änderungen
  useEffect(() => {
    if (isTracking || projectInfo.projectNumber || projectInfo.projectName || projectInfo.description) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isTracking,
        startTime,
        elapsedTime,
        projectInfo
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isTracking, startTime, elapsedTime, projectInfo]);

  // Konfiguriere axios mit dem Auth-Token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    console.log('TimeTracker Auth-Token Status:', {
      tokenExists: !!token,
      tokenValue: token ? `${token.substring(0, 10)}...` : 'nicht vorhanden'
    });
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Timer aktualisieren, wenn Tracking aktiv ist
  useEffect(() => {
    let timer;
    if (isTracking) {
      console.log('Timer gestartet mit startTime:', new Date(startTime).toISOString());
      timer = setInterval(() => {
        const newElapsedTime = Date.now() - startTime;
        console.log('Timer-Update:', {
          startTime: new Date(startTime).toISOString(),
          currentTime: new Date().toISOString(),
          elapsedSeconds: Math.floor(newElapsedTime / 1000)
        });
        setElapsedTime(newElapsedTime);
      }, 1000);
    }
    return () => {
      if (timer) {
        console.log('Timer wird aufgeräumt');
        clearInterval(timer);
      }
    };
  }, [isTracking, startTime]);

  // Start-Button Handler
  const handleStart = () => {
    if (!projectInfo.projectNumber || !projectInfo.projectName) {
      toast.warning('Bitte geben Sie Projektnummer und Projektname ein');
      return;
    }

    const newStartTime = Date.now() - elapsedTime;
    console.log('Zeiterfassung gestartet:', {
      startTime: new Date(newStartTime).toISOString(),
      elapsedTime
    });
    setIsTracking(true);
    setStartTime(newStartTime);
    toast.success('Zeiterfassung gestartet');
  };

  // Stop-Button Handler
  const handleStop = async () => {
    console.log('Zeiterfassung wird gestoppt...');
    setIsTracking(false);
    setLoading(true);
    const duration = Math.floor(elapsedTime / 1000);
    const endTime = new Date();
    
    // Überprüfe, ob die userId vorhanden ist
    const userId = localStorage.getItem('userId');
    console.log('User ID aus localStorage:', userId);
    
    if (!userId) {
      toast.error('Benutzer-ID nicht gefunden. Bitte melden Sie sich erneut an.');
      setLoading(false);
      return;
    }

    // Überprüfe, ob die Projektinformationen vollständig sind
    if (!projectInfo.projectNumber || !projectInfo.projectName) {
      toast.error('Bitte geben Sie Projektnummer und Projektname ein');
      setLoading(false);
      return;
    }

    // Überprüfe, ob die Beschreibung vorhanden ist
    if (!projectInfo.description) {
      projectInfo.description = 'Keine Beschreibung';
    }
    
    const requestData = {
      startTime: new Date(startTime),
      endTime,
      duration,
      project: `${projectInfo.projectNumber} - ${projectInfo.projectName}`,
      description: projectInfo.description,
      userId: userId
    };
    
    console.log('Zeiterfassungsdaten:', requestData);

    try {
      console.log('Sende Daten an das Backend...');
      const response = await timeEntryService.create(requestData);
      
      console.log('Backend-Antwort erfolgreich:', {
        status: 200,
        data: response
      });
      
      if (onTimeEntrySaved) {
        onTimeEntrySaved();
      }
      
      toast.success('Zeiterfassung erfolgreich gespeichert');

      // Timer und Formular zurücksetzen
      setElapsedTime(0);
      setStartTime(null);
      setProjectInfo({
        projectNumber: '',
        projectName: '',
        description: ''
      });
      
      // Lösche gespeicherte Daten
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Fehler beim Senden der Daten:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        headers: error.response?.config?.headers || 'Keine Header-Informationen',
        requestData: requestData
      });
      
      if (error.response?.status === 401) {
        // Behalte die Daten im localStorage bei einem Authentifizierungsfehler
        toast.error('Bitte melden Sie sich erneut an');
        window.location.href = '/login';
      } else {
        toast.error('Fehler beim Speichern der Zeiterfassung');
      }
    } finally {
      setLoading(false);
    }
  };

  // Zeit formatieren (Stunden, Minuten, Sekunden)
  const formatTime = (time) => {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-6 max-w-md mx-auto">
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

      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Zeiterfassung
      </h2>
      <p className="text-lg text-gray-600 mb-4 text-center">
        Aktuelle Zeit: <span className="font-bold">{formatTime(elapsedTime)}</span>
      </p>
      
      {/* Projektinformationen */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Projektnummer
          </label>
          <input
            type="text"
            value={projectInfo.projectNumber}
            onChange={(e) => setProjectInfo({ ...projectInfo, projectNumber: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="z.B. PRJ-001"
            disabled={isTracking}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Projektname
          </label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={(e) => setProjectInfo({ ...projectInfo, projectName: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="z.B. Website-Relaunch"
            disabled={isTracking}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung
          </label>
          <textarea
            value={projectInfo.description}
            onChange={(e) => setProjectInfo({ ...projectInfo, description: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Kurze Beschreibung der Tätigkeit"
            rows="2"
            disabled={isTracking}
          />
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleStart}
          disabled={isTracking || loading}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            isTracking || loading
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } transition-colors duration-200`}
        >
          {loading ? <ClipLoader color="#ffffff" size={20} /> : 'Start'}
        </button>
        <button
          onClick={handleStop}
          disabled={!isTracking || loading}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            !isTracking || loading
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
          } transition-colors duration-200`}
        >
          {loading ? <ClipLoader color="#ffffff" size={20} /> : 'Stop'}
        </button>
      </div>
    </div>
  );
};

export default TimeTracker;