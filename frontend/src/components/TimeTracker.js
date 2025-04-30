import React, { useState, useEffect, useCallback, useRef } from 'react';
import { timeEntryService } from '../services/timeEntry';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import PaymentModal from './PaymentModal';
import 'react-toastify/dist/ReactToastify.css';

const STORAGE_KEY = 'timeTracker';
const LAST_PROJECT_KEY = 'lastProject';

const TimeTracker = ({ onTimeEntrySaved }) => {
  // Refs für persistente Werte
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // State-Definitionen
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastSpokenCommand, setLastSpokenCommand] = useState('');
  const [useLastProject, setUseLastProject] = useState(true);
  const [isInDialog, setIsInDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    projectNumber: '',
    projectName: '',
    description: ''
  });

  // Sprachausgabe-Funktion
  const speak = useCallback((text) => {
    if (!text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Fehler bei der Sprachausgabe:', error);
    }
  }, []);

  // Zeit formatieren
  const formatTime = useCallback((time) => {
    if (!time) return '0h 0m 0s';
    try {
      const seconds = Math.floor((time / 1000) % 60);
      const minutes = Math.floor((time / (1000 * 60)) % 60);
      const hours = Math.floor(time / (1000 * 60 * 60));
      return `${hours}h ${minutes}m ${seconds}s`;
    } catch (error) {
      console.error('Fehler beim Formatieren der Zeit:', error);
      return '0h 0m 0s';
      }
  }, []);

  // Start-Button Handler
  const handleStart = useCallback(() => {
    if (!projectInfo.projectNumber || !projectInfo.projectName) {
      toast.warning('Bitte geben Sie Projektnummer und Projektname ein');
      return;
    }

    try {
      localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify(projectInfo));
    const newStartTime = Date.now() - elapsedTime;
    setIsTracking(true);
    setStartTime(newStartTime);
    toast.success('Zeiterfassung gestartet');
    } catch (error) {
      console.error('Fehler beim Starten der Zeiterfassung:', error);
      toast.error('Fehler beim Starten der Zeiterfassung');
    }
  }, [projectInfo, elapsedTime]);

  // Stop-Button Handler
  const handleStop = useCallback(async () => {
    if (!isTracking) return;
    
    try {
    setIsTracking(false);
    setLoading(true);
    const duration = Math.floor(elapsedTime / 1000);
    const endTime = new Date();
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Benutzer-ID nicht gefunden. Bitte melden Sie sich erneut an.');
      setLoading(false);
      return;
    }
    
    const requestData = {
      startTime: new Date(startTime),
      endTime,
      duration,
      project: `${projectInfo.projectNumber} - ${projectInfo.projectName}`,
        description: projectInfo.description || 'Keine Beschreibung',
      userId: userId
    };
    
      await timeEntryService.create(requestData);
      if (onTimeEntrySaved) {
        onTimeEntrySaved();
      }
      toast.success('Zeiterfassung erfolgreich gespeichert');
      setElapsedTime(0);
      setStartTime(null);
      setProjectInfo({
        projectNumber: '',
        projectName: '',
        description: ''
      });
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Fehler beim Speichern der Zeiterfassung:', error);
      if (error.response?.status === 401) {
        toast.error('Bitte melden Sie sich erneut an');
        window.location.href = '/login';
      } else {
        toast.error('Fehler beim Speichern der Zeiterfassung');
      }
    } finally {
      setLoading(false);
    }
  }, [elapsedTime, startTime, projectInfo, onTimeEntrySaved, isTracking]);

  // Dialog-Handler
  const handleDialog = useCallback((transcript) => {
    if (!waitingForAnswer || !transcript) return;

    try {
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
      }
    } catch (error) {
      console.error('Fehler in der Dialog-Verarbeitung:', error);
      speak('Es gab einen Fehler bei der Verarbeitung Ihrer Antwort');
      setCurrentQuestion('');
      setWaitingForAnswer(false);
      setIsInDialog(false);
    }
  }, [currentQuestion, waitingForAnswer, speak, handleStart]);

  // Befehlsverarbeitung
  const handleVoiceCommand = useCallback((transcript) => {
    if (!transcript) return;

    try {
      console.log('Sprachbefehl erkannt:', transcript);
      const normalizedCommand = transcript.toLowerCase().trim();

      if (isInDialog) {
        handleDialog(transcript);
        return;
      }

      const matchCommand = (command, alternatives) => {
        return alternatives.some(alt => normalizedCommand.includes(alt));
      };

      if (matchCommand('start', ['start', 'beginn', 'starten', 'beginnen', 'los'])) {
        if (!isTracking) {
          if (!projectInfo.projectNumber && !useLastProject) {
            speak('Welche Projektnummer möchten Sie verwenden?');
            setCurrentQuestion('projekt_nummer');
            setWaitingForAnswer(true);
            setIsInDialog(true);
          } else {
            handleStart();
            speak('Zeiterfassung gestartet');
          }
        } else {
          speak('Zeiterfassung läuft bereits');
        }
        return;
      }

      if (matchCommand('stop', ['stop', 'ende', 'beenden', 'stopp', 'halt'])) {
        if (isTracking) {
          handleStop();
          speak('Zeiterfassung beendet');
        } else {
          speak('Keine aktive Zeiterfassung zum Beenden');
        }
        return;
      }

      if (matchCommand('letztes projekt', ['letztes projekt', 'vorheriges projekt', 'letztes', 'vorheriges'])) {
        const lastProject = localStorage.getItem(LAST_PROJECT_KEY);
        if (lastProject) {
          const savedProject = JSON.parse(lastProject);
          setProjectInfo(savedProject);
          setUseLastProject(true);
          speak(`Letztes Projekt geladen: ${savedProject.projectNumber}`);
        } else {
          speak('Kein letztes Projekt gefunden');
        }
        return;
      }

      if (matchCommand('status', ['status', 'stand', 'zeit', 'dauer'])) {
        if (isTracking) {
          const time = formatTime(elapsedTime);
          speak(`Zeiterfassung läuft für Projekt ${projectInfo.projectNumber} seit ${time}`);
        } else {
          if (projectInfo.projectNumber) {
            speak(`Keine aktive Zeiterfassung. Projekt ${projectInfo.projectNumber} ist ausgewählt`);
          } else {
            speak('Keine aktive Zeiterfassung und kein Projekt ausgewählt');
          }
        }
        return;
      }

      if (matchCommand('hilfe', ['hilfe', 'befehle', 'kommandos', 'help'])) {
        speak('Verfügbare Befehle sind: Start zum Starten, Stop zum Beenden, Letztes Projekt zum Laden des vorherigen Projekts, und Status für den aktuellen Stand.');
        return;
      }

      if (matchCommand('neues projekt', ['neues projekt', 'neu', 'neues'])) {
        setUseLastProject(false);
        setProjectInfo({
          projectNumber: '',
          projectName: '',
          description: ''
        });
        speak('Bitte geben Sie die neue Projektnummer ein');
        setCurrentQuestion('projekt_nummer');
        setWaitingForAnswer(true);
        setIsInDialog(true);
        return;
      }

      speak('Befehl nicht erkannt. Sagen Sie Hilfe für verfügbare Befehle.');
    } catch (error) {
      console.error('Fehler bei der Befehlsverarbeitung:', error);
      speak('Es gab einen Fehler bei der Verarbeitung des Befehls');
    }
  }, [
    isInDialog,
    handleDialog,
    isTracking,
    projectInfo,
    useLastProject,
    handleStart,
    handleStop,
    elapsedTime,
    speak,
    formatTime
  ]);

  // Timer-Effekt
  useEffect(() => {
    let timer;
    if (isTracking && startTime) {
      timer = setInterval(() => {
        try {
          const newElapsedTime = Date.now() - startTime;
          setElapsedTime(newElapsedTime);
        } catch (error) {
          console.error('Fehler bei der Timer-Aktualisierung:', error);
        }
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isTracking, startTime]);

  // Daten laden
  useEffect(() => {
    try {
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
        setProjectInfo(JSON.parse(lastProject));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }, [useLastProject]);

  // Daten speichern
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
    }
  }, [isTracking, startTime, elapsedTime, projectInfo]);

  // Spracherkennung
  useEffect(() => {
    const setupRecognition = () => {
      if (!('webkitSpeechRecognition' in window)) {
        toast.error('Spracherkennung wird in diesem Browser nicht unterstützt');
        setIsListening(false);
        return null;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'de-DE';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsProcessingVoice(true);
        if (!isInDialog) {
          speak('Sprachsteuerung aktiviert. Sagen Sie Hilfe für verfügbare Befehle.');
        }
      };

      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          setLastSpokenCommand(transcript);
          handleVoiceCommand(transcript);
        }
      };

      recognition.onend = () => {
        setIsProcessingVoice(false);
        setLastSpokenCommand('');

        if (isListening && !isInDialog) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (isListening && !isInDialog && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error('Fehler beim Neustart der Spracherkennung:', error);
              }
            }
          }, 1000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Spracherkennungsfehler:', event.error);
        setIsProcessingVoice(false);

        switch (event.error) {
          case 'no-speech':
            if (isListening && !isInDialog) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (error) {
                    console.error('Fehler beim Neustart nach no-speech:', error);
                  }
                }
              }, 1000);
            }
            break;

          case 'network':
            toast.error('Netzwerkfehler bei der Spracherkennung');
            setIsListening(false);
            break;

          case 'not-allowed':
          case 'service-not-allowed':
            toast.error('Keine Berechtigung für Mikrofonzugriff');
            setIsListening(false);
            break;

          default:
            if (event.error !== 'aborted') {
              setIsListening(false);
              speak('Es gab einen Fehler mit der Spracherkennung');
              toast.error('Spracherkennung wurde aufgrund eines Fehlers deaktiviert');
            }
        }
      };

      return recognition;
    };

    if (!isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Fehler beim Stoppen der Spracherkennung:', error);
        }
      }
      clearTimeout(timeoutRef.current);
      window.speechSynthesis.cancel();
      recognitionRef.current = null;
      return;
    }

    recognitionRef.current = setupRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Fehler beim Starten der Spracherkennung:', error);
        setIsListening(false);
        toast.error('Spracherkennung konnte nicht gestartet werden');
      }
    }

    return () => {
      clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Fehler beim Stoppen der Spracherkennung:', error);
        }
      }
      window.speechSynthesis.cancel();
    };
  }, [isListening, speak, isInDialog, handleVoiceCommand]);

  // Toggle Sprachsteuerung
  const toggleVoiceControl = useCallback(() => {
    try {
      setIsListening(prev => !prev);
      setIsInDialog(false);
      setCurrentQuestion('');
      setWaitingForAnswer(false);
      if (isListening) {
        window.speechSynthesis.cancel();
      }
      toast.info(!isListening ? 'Sprachsteuerung aktiviert' : 'Sprachsteuerung deaktiviert');
    } catch (error) {
      console.error('Fehler beim Umschalten der Sprachsteuerung:', error);
      toast.error('Fehler beim Umschalten der Sprachsteuerung');
    }
  }, [isListening]);

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
          <input
            type="text"
            value={projectInfo.projectNumber}
            onChange={(e) => setProjectInfo({ ...projectInfo, projectNumber: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="z.B. PRJ-001"
            disabled={isTracking || useLastProject}
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
            disabled={isTracking || useLastProject}
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

      {/* Sprachsteuerung Button und Status */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex space-x-2 w-full max-w-xs mb-2">
          <button
            onClick={toggleVoiceControl}
            className={`flex-1 px-4 py-2 rounded-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors flex items-center justify-center space-x-2 relative`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <span>{isListening ? 'Deaktivieren' : 'Aktivieren'}</span>
            {isProcessingVoice && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            )}
          </button>
          
          {/* Letztes Projekt Toggle mit Tooltip */}
          <button
            onClick={() => setUseLastProject(!useLastProject)}
            className={`px-4 py-2 rounded-lg ${
              useLastProject 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            } text-white transition-colors relative group`}
            title={useLastProject ? 'Letztes Projekt wird verwendet' : 'Neues Projekt eingeben'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {useLastProject ? 'Klicken um neues Projekt einzugeben' : 'Klicken um letztes Projekt zu verwenden'}
            </div>
          </button>
        </div>
        
        {isListening && (
          <div className="bg-blue-50 p-4 rounded-lg w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-800 font-medium">
                Sprachsteuerung aktiv
                {isInDialog && (
                  <span className="ml-2 text-green-600">
                    (Im Dialog: {currentQuestion === 'projekt_nummer' ? 'Warte auf Projektnummer' : 'Warte auf Beschreibung'})
                  </span>
                )}
              </p>
              {isProcessingVoice && (
                <span className="text-xs text-blue-600">Höre zu...</span>
              )}
            </div>
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
              <div className="mt-2 p-2 bg-white rounded border border-blue-100">
                <p className="text-sm text-gray-600">
                  Letzter Befehl: <span className="font-medium">{lastSpokenCommand}</span>
                </p>
              </div>
            )}
          </div>
        )}
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