import React, { useState, useEffect, useCallback } from 'react';
import { timeEntryService } from '../services/timeEntry';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import PaymentModal from './PaymentModal';
import 'react-toastify/dist/ReactToastify.css';

const STORAGE_KEY = 'timeTracker';
const LAST_PROJECT_KEY = 'lastProject';

const TimeTracker = ({ onTimeEntrySaved }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSpokenCommand, setLastSpokenCommand] = useState('');
  const [useLastProject, setUseLastProject] = useState(true);
  const [projectInfo, setProjectInfo] = useState({
    projectNumber: '',
    projectName: '',
    description: ''
  });
  const [isInDialog, setIsInDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);

  // Lade gespeicherte Daten beim Start
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const lastProject = localStorage.getItem(LAST_PROJECT_KEY);
    
    if (savedData) {
      const data = JSON.parse(savedData);
      setIsTracking(data.isTracking);
      setStartTime(data.startTime);
      setElapsedTime(data.elapsedTime);
      setProjectInfo(data.projectInfo);
      
      if (data.isTracking && data.startTime) {
        const newElapsedTime = Date.now() - data.startTime;
        setElapsedTime(newElapsedTime);
      }
    } else if (lastProject && useLastProject) {
      // Wenn keine aktive Zeiterfassung, aber ein letztes Projekt existiert
      setProjectInfo(JSON.parse(lastProject));
    }
  }, [useLastProject]);

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

  // Sprachausgabe-Funktion
  const speak = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Interaktiver Dialog-Handler
  const handleDialog = useCallback((transcript) => {
    if (!waitingForAnswer) return;

    if (currentQuestion === 'projekt_nummer') {
      const numberMatch = transcript.match(/\d+/);
      if (numberMatch) {
        const projectNumber = numberMatch[0];
        setProjectInfo(prev => ({
          ...prev,
          projectNumber: `PRJ-${projectNumber.padStart(3, '0')}`,
          projectName: `Projekt ${projectNumber}`,
        }));
        speak('Möchten Sie eine Beschreibung hinzufügen?');
        setCurrentQuestion('beschreibung');
      } else {
        speak('Ich habe die Projektnummer nicht verstanden. Bitte nennen Sie eine Nummer.');
      }
      return;
    }

    if (currentQuestion === 'beschreibung') {
      if (transcript.includes('nein') || transcript.includes('keine')) {
        setProjectInfo(prev => ({
          ...prev,
          description: 'Per Sprache gestartet'
        }));
        speak('Alles klar, ich starte die Zeiterfassung jetzt.');
        handleStart();
      } else {
        setProjectInfo(prev => ({
          ...prev,
          description: transcript
        }));
        speak('Danke, ich starte die Zeiterfassung jetzt.');
        handleStart();
      }
      setCurrentQuestion('');
      setWaitingForAnswer(false);
      setIsInDialog(false);
      return;
    }
  }, [currentQuestion, waitingForAnswer, speak, handleStart]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
          .toLowerCase();

        setLastSpokenCommand(transcript);

        if (isInDialog) {
          handleDialog(transcript);
          return;
        }

        // Hauptbefehle
        if (transcript.includes('start') || transcript.includes('beginn')) {
          if (!isTracking) {
            if (!projectInfo.projectNumber && !useLastProject) {
              speak('Welche Projektnummer möchten Sie verwenden?');
              setCurrentQuestion('projekt_nummer');
              setWaitingForAnswer(true);
              setIsInDialog(true);
              return;
            }
            handleStart();
            speak('Zeiterfassung gestartet');
          }
        } else if (transcript.includes('stop') || transcript.includes('ende')) {
          if (isTracking) {
            handleStop();
            speak('Zeiterfassung beendet');
          }
        } else if (transcript.includes('letztes projekt')) {
          const lastProject = localStorage.getItem(LAST_PROJECT_KEY);
          if (lastProject) {
            setProjectInfo(JSON.parse(lastProject));
            setUseLastProject(true);
            speak('Letztes Projekt geladen');
          } else {
            speak('Kein letztes Projekt gefunden');
          }
        } else if (transcript.includes('hilfe')) {
          speak('Verfügbare Befehle sind: Start oder Beginn zum Starten, Stop oder Ende zum Beenden, und Letztes Projekt um das vorherige Projekt zu laden.');
        } else if (transcript.includes('status')) {
          if (isTracking) {
            speak(`Zeiterfassung läuft für Projekt ${projectInfo.projectNumber} seit ${formatTime(elapsedTime)}`);
          } else {
            speak('Keine aktive Zeiterfassung');
          }
        }
      };

      recognition.onstart = () => {
        if (!isInDialog) {
          speak('Sprachsteuerung aktiviert. Sagen Sie Hilfe für verfügbare Befehle.');
        }
      };

      recognition.onerror = (event) => {
        console.error('Spracherkennungsfehler:', event.error);
        setIsListening(false);
        speak('Es gab einen Fehler mit der Spracherkennung');
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };

      if (isListening) {
        recognition.start();
      }

      return () => {
        recognition.stop();
        window.speechSynthesis.cancel();
      };
    } else {
      toast.error('Spracherkennung wird in diesem Browser nicht unterstützt');
    }
  }, [isTracking, isListening, useLastProject, isInDialog, handleDialog, speak]);

  // Toggle Sprachsteuerung
  const toggleVoiceControl = () => {
    setIsListening(!isListening);
    toast.info(isListening ? 'Sprachsteuerung deaktiviert' : 'Sprachsteuerung aktiviert');
  };

  // Start-Button Handler
  const handleStart = () => {
    if (!projectInfo.projectNumber || !projectInfo.projectName) {
      toast.warning('Bitte geben Sie Projektnummer und Projektname ein');
      return;
    }

    // Speichere das aktuelle Projekt als letztes Projekt
    localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify(projectInfo));

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

      {/* Aktuelle Zeit */}
      <p className="text-lg text-gray-600 mb-4 text-center">
        Aktuelle Zeit: <span className="font-bold">{formatTime(elapsedTime)}</span>
      </p>

      {/* Sprachsteuerung Button und Status */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex space-x-2 w-full max-w-xs mb-2">
          <button
            onClick={toggleVoiceControl}
            className={`flex-1 px-4 py-2 rounded-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors flex items-center justify-center space-x-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <span>{isListening ? 'Deaktivieren' : 'Aktivieren'}</span>
            {isListening && (
              <span className="animate-pulse w-3 h-3 bg-white rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setUseLastProject(!useLastProject)}
            className={`px-4 py-2 rounded-lg ${
              useLastProject 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            } text-white transition-colors`}
            title={useLastProject ? 'Letztes Projekt wird verwendet' : 'Neues Projekt eingeben'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {isListening && (
          <div className="bg-blue-50 p-4 rounded-lg w-full">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Sprachsteuerung aktiv
              {isInDialog && (
                <span className="ml-2 text-green-600">
                  (Im Dialog: {currentQuestion === 'projekt_nummer' ? 'Warte auf Projektnummer' : 'Warte auf Beschreibung'})
                </span>
              )}
            </p>
            <p className="text-sm text-blue-600 mb-2">
              Verfügbare Befehle:
            </p>
            <ul className="text-sm text-blue-600 list-disc list-inside">
              <li>"Start" oder "Beginn" - Zeiterfassung starten</li>
              <li>"Stop" oder "Ende" - Zeiterfassung beenden</li>
              <li>"Letztes Projekt" - Letztes Projekt laden</li>
              <li>"Status" - Aktuelle Zeiterfassung abfragen</li>
              <li>"Hilfe" - Verfügbare Befehle anzeigen</li>
            </ul>
            {lastSpokenCommand && (
              <p className="text-sm text-gray-600 mt-2">
                Letzter Befehl: "{lastSpokenCommand}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Projektinformationen */}
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Projektnummer
          </label>
          {useLastProject && (
            <span className="text-xs text-green-600">Letztes Projekt wird verwendet</span>
          )}
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

      {/* Zahlungs-Button */}
      {!isTracking && elapsedTime > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-2 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
          >
            Jetzt bezahlen
          </button>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={25.00} // Beispielbetrag - hier können Sie Ihre eigene Logik zur Berechnung des Betrags einbauen
      />
    </div>
  );
};

export default TimeTracker;