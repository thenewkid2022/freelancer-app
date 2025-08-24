import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { TimeEntry, MergedEntry, AdjustmentData, AdjustedEntry } from '../types';

interface TimeEntryFormData {
  startTime: string;
  endTime: string;
  description: string;
  projectNumber: string;
}

const TimeEntriesScreen = () => {
  const { isAuthenticated } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [runningEntry, setRunningEntry] = useState<{
    projectNumber: string;
    description: string;
    startTime: Date;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Neue State für Timer-Anzeige
  
  // Tagesausgleich States
  const [mergedEntries, setMergedEntries] = useState<MergedEntry[]>([]);
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData>({
    workStart: '08:00',
    workEnd: '17:00',
    lunchBreak: 60,
    otherBreaks: 15,
  });
  const [timeDifference, setTimeDifference] = useState<number | null>(null);
  const [roundedDifference, setRoundedDifference] = useState<number | null>(null);
  const [adjustedEntries, setAdjustedEntries] = useState<AdjustedEntry[]>([]);
  const [isAdjustmentModalVisible, setIsAdjustmentModalVisible] = useState(false);
  const [isUndoModalVisible, setIsUndoModalVisible] = useState(false);
  const [expandedMergeId, setExpandedMergeId] = useState<string | null>(null);
  
  // Modal States
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState<TimeEntryFormData>({
    startTime: '',
    endTime: '',
    description: '',
    projectNumber: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimeEntries();
      checkRunningTimer();
      fetchMergedEntries();
    }
  }, [isAuthenticated]);

  // Lade gemergte Einträge für Tagesausgleich
  useEffect(() => {
    if (isAuthenticated) {
      fetchMergedEntries();
    }
  }, [isAuthenticated, selectedDate]);

  // Timer-Zeit aktualisieren
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && runningEntry) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - runningEntry.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 100); // Aktualisiere alle 100ms für flüssigere Anzeige
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, runningEntry]);

  // Prüfe laufenden Timer beim Laden
  const checkRunningTimer = () => {
    // Hier könnte man AsyncStorage prüfen für laufende Timer
    // Für jetzt setzen wir es auf false
    setIsRunning(false);
    setRunningEntry(null);
  };

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const entries = await apiClient.getTimeEntries();
      setTimeEntries(entries);
    } catch (error) {
      Alert.alert('Fehler', 'Zeiteinträge konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const fetchMergedEntries = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7); // Letzte 7 Tage
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7); // Nächste 7 Tage
      
      const merged = await apiClient.getMergedTimeEntries(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setMergedEntries(merged);
    } catch (error) {
      console.error('Fehler beim Laden der gemergten Einträge:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeEntries();
    setRefreshing(false);
  };

  // Filtere Einträge nach ausgewähltem Tag
  const filteredEntries = useMemo(() => {
    if (!selectedDate) return [];
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return (
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getDate() === selectedDate.getDate()
      );
    });
  }, [timeEntries, selectedDate]);

  // Berechne Gesamtzeit für den Tag
  const totalDayTime = useMemo(() => {
    return filteredEntries.reduce((total, entry) => total + entry.duration, 0);
  }, [filteredEntries]);

  // Tagesausgleich-Logik
  const calculateTimeDifference = useCallback(() => {
    if (!selectedDate || !adjustmentData.workStart || !adjustmentData.workEnd) {
      setTimeDifference(null);
      setRoundedDifference(null);
      setAdjustedEntries([]);
      return;
    }

    // Erstelle neue Date-Objekte basierend auf dem ausgewählten Datum
    const workStartDate = new Date(selectedDate.getTime());
    const [startHours, startMinutes] = adjustmentData.workStart.split(':').map(Number);
    workStartDate.setHours(startHours, startMinutes, 0, 0);

    const workEndDate = new Date(selectedDate.getTime());
    const [endHours, endMinutes] = adjustmentData.workEnd.split(':').map(Number);
    workEndDate.setHours(endHours, endMinutes, 0, 0);

    // Berechne die effektive Arbeitszeit
    const totalBreakMinutes = adjustmentData.lunchBreak + adjustmentData.otherBreaks;
    const workDurationMinutes = (workEndDate.getTime() - workStartDate.getTime()) / (1000 * 60) - totalBreakMinutes;
    const effectiveHours = workDurationMinutes / 60;

    // Filtere Einträge für den ausgewählten Tag
    const eintraegeFuerTag = timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return (
        selectedDate &&
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getDate() === selectedDate.getDate()
      );
    });

    // Berechne die aktuelle Gesamtzeit
    const totalCurrentHours = eintraegeFuerTag.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    const difference = effectiveHours - totalCurrentHours;
    setTimeDifference(difference);

    // Verteile die effektive Zeit proportional auf die Einträge
    const adjustedEntries = eintraegeFuerTag.map(entry => {
      const proportion = entry.duration / (totalCurrentHours * 3600);
      const adjustedDuration = effectiveHours * proportion * 3600;
      return {
        id: entry._id,
        originalDuration: entry.duration,
        unrounded: adjustedDuration,
        duration: adjustedDuration
      };
    });

    // Runde jeden Eintrag auf 0,25h
    const roundedEntries = adjustedEntries.map(entry => ({
      ...entry,
      duration: Math.round(entry.duration / (0.25 * 3600)) * (0.25 * 3600)
    }));

    // Berechne die Differenz nach der Rundung
    let roundedTotal = roundedEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    let roundedDiff = effectiveHours - roundedTotal;

    // Korrektur: Verteile die Differenz in 0,25h-Schritten auf die größten Einträge
    if (Math.abs(roundedDiff) >= 0.01) {
      const sorted = [...roundedEntries].sort((a, b) => b.unrounded - a.unrounded);
      let diffSteps = Math.round(Math.abs(roundedDiff) / 0.25);
      let stepValue = 0.25 * 3600 * (roundedDiff > 0 ? 1 : -1);
      let i = 0;
      while (diffSteps > 0) {
        if (sorted[i].duration + stepValue >= 0) {
          sorted[i].duration += stepValue;
          diffSteps--;
        }
        i = (i + 1) % sorted.length;
      }
      roundedTotal = sorted.reduce((sum, entry) => sum + entry.duration / 3600, 0);
      roundedDiff = effectiveHours - roundedTotal;
      setAdjustedEntries(sorted.map(({id, duration, originalDuration, unrounded}) => ({id, duration, originalDuration, unrounded})));
    } else {
      setAdjustedEntries(roundedEntries.map(({id, duration, originalDuration, unrounded}) => ({id, duration, originalDuration, unrounded})));
    }
    setRoundedDifference(roundedDiff);
  }, [selectedDate, adjustmentData, timeEntries]);

  // Aktualisiere die Berechnung bei Änderungen
  useEffect(() => {
    if (selectedDate && adjustmentData.workStart && adjustmentData.workEnd && timeEntries.length > 0) {
      calculateTimeDifference();
    }
  }, [selectedDate, adjustmentData.workStart, adjustmentData.workEnd, calculateTimeDifference]);

  // Starte Timer
  const startTimer = (projectNumber: string, description: string) => {
    if (isRunning) {
      Alert.alert('Timer läuft bereits', 'Stoppen Sie zuerst den aktuellen Timer');
      return;
    }

    const startTime = new Date();
    setRunningEntry({
      projectNumber,
      description,
      startTime,
    });
    setIsRunning(true);
    
    // Setze formData für späteren Gebrauch
    setFormData({
      startTime: startTime.toISOString(),
      endTime: '', // Leer lassen, wird beim Stoppen gesetzt
      description,
      projectNumber,
    });
    
    // Öffne Modal NICHT automatisch - Timer läuft einfach
    // setAddModalVisible(true); // Diese Zeile entfernt
  };

  // Stoppe Timer manuell (ohne Modal)
  const stopTimerManually = () => {
    if (!isRunning || !runningEntry) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - runningEntry.startTime.getTime()) / 1000);

    // Erstelle neuen Zeiteintrag mit Standardwerten
    const newEntry: TimeEntryFormData = {
      projectNumber: runningEntry.projectNumber,
      description: runningEntry.description,
      startTime: runningEntry.startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    console.log('Erstelle Zeiteintrag manuell:', newEntry);
    
    // Speichere Eintrag
    saveTimeEntry(newEntry);

    // Reset Timer
    setIsRunning(false);
    setRunningEntry(null);
    setFormData({
      startTime: '',
      endTime: '',
      description: '',
      projectNumber: '',
    });
  };

  // Stoppe Timer
  const stopTimer = () => {
    if (!isRunning || !runningEntry) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - runningEntry.startTime.getTime()) / 1000);

    // Erstelle neuen Zeiteintrag
    const newEntry: TimeEntryFormData = {
      projectNumber: runningEntry.projectNumber,
      description: formData.description,
      startTime: runningEntry.startTime.toISOString(),
      endTime: endTime.toISOString(),
    };

    console.log('Erstelle Zeiteintrag über Modal:', newEntry);
    // Speichere Eintrag
    saveTimeEntry(newEntry);

    // Reset Timer
    setIsRunning(false);
    setRunningEntry(null);
    setFormData({
      startTime: '',
      endTime: '',
      description: '',
      projectNumber: '',
    });
    setAddModalVisible(false);
  };

  // Speichere Zeiteintrag
  const saveTimeEntry = async (entryData: TimeEntryFormData) => {
    try {
      // Stelle sicher, dass endTime gesetzt ist
      if (!entryData.endTime || entryData.endTime === '') {
        entryData.endTime = new Date().toISOString();
        console.log('endTime war leer, setze auf aktuelle Zeit:', entryData.endTime);
      }
      
      // Stelle sicher, dass startTime gesetzt ist
      if (!entryData.startTime || entryData.startTime === '') {
        entryData.startTime = new Date().toISOString();
        console.log('startTime war leer, setze auf aktuelle Zeit:', entryData.startTime);
      }
      
      console.log('Versuche Zeiteintrag zu speichern:', entryData);
      console.log('Startzeit Typ:', typeof entryData.startTime, 'Wert:', entryData.startTime);
      console.log('Endzeit Typ:', typeof entryData.endTime, 'Wert:', entryData.endTime);
      
      if (selectedEntry) {
        // Bearbeite bestehenden Eintrag
        console.log('Bearbeite bestehenden Eintrag:', selectedEntry._id);
        await apiClient.updateTimeEntry(selectedEntry._id, entryData);
      } else {
        // Erstelle neuen Zeiteintrag
        console.log('Erstelle neuen Zeiteintrag');
        await apiClient.createTimeEntry(entryData);
      }
      
      console.log('Zeiteintrag erfolgreich gespeichert');
      await fetchTimeEntries();
      setSelectedEntry(null);
      setEditModalVisible(false);
      setAddModalVisible(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Zeiteintrags:', error);
      
      let errorMessage = 'Zeiteintrag konnte nicht gespeichert werden';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }
      
      Alert.alert('Fehler', errorMessage);
    }
  };

  // Lösche Zeiteintrag
  const deleteTimeEntry = async (entryId: string) => {
    Alert.alert(
      'Eintrag löschen',
      'Möchten Sie diesen Zeiteintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteTimeEntry(entryId);
              await fetchTimeEntries();
            } catch (error) {
              Alert.alert('Fehler', 'Eintrag konnte nicht gelöscht werden');
            }
          },
        },
      ]
    );
  };

  // Formatiere Dauer
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Formatiere Zeit
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatiere Datum
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Ändere ausgewähltes Datum
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Öffne Bearbeitungs-Modal
  const openEditModal = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setFormData({
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
      projectNumber: entry.projectNumber || '',
    });
    setEditModalVisible(true);
  };

  // Schließe alle Modals und stoppe Timer falls nötig
  const closeModals = () => {
    // Wenn Timer läuft und Modal geschlossen wird, stoppe den Timer
    if (isRunning && addModalVisible) {
      setIsRunning(false);
      setRunningEntry(null);
    }
    
    setAddModalVisible(false);
    setEditModalVisible(false);
    setSelectedEntry(null);
    setFormData({
      startTime: '',
      endTime: '',
      description: '',
      projectNumber: '',
    });
  };

  // Tagesausgleich-Funktionen
  const handleAdjustmentSubmit = async () => {
    try {
      if (!selectedDate) {
        Alert.alert('Fehler', 'Bitte wählen Sie ein Datum aus');
        return;
      }

      if (!adjustmentData.workStart || !adjustmentData.workEnd) {
        Alert.alert('Fehler', 'Bitte geben Sie Arbeitsstart und -ende ein');
        return;
      }

      // Überprüfe, ob der User die Differenz akzeptiert
      if (roundedDifference !== null && Math.abs(roundedDifference) > 0.01) {
        const confirmMessage = roundedDifference > 0
          ? `Nach der Rundung fehlen noch ${roundedDifference.toFixed(2)}h. Fortfahren?`
          : `Nach der Rundung sind ${Math.abs(roundedDifference).toFixed(2)}h zu viel. Fortfahren?`;
        
        Alert.alert('Rundungsdifferenz', confirmMessage, [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Fortfahren', onPress: () => submitAdjustments() }
        ]);
        return;
      }

      await submitAdjustments();
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern der Anpassungen');
      console.error('Fehler beim Tagesausgleich:', error);
    }
  };

  const submitAdjustments = async () => {
    try {
      // Speichere die angepassten Einträge
      const updatePromises = adjustedEntries.map(async entry => {
        try {
          await apiClient.updateTimeEntryDuration(entry.id, entry.duration);
        } catch (error) {
          console.error(`Fehler beim Aktualisieren des Zeiteintrags ${entry.id}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      await fetchTimeEntries();
      await fetchMergedEntries();
      setIsAdjustmentModalVisible(false);
      Alert.alert('Erfolg', 'Tagesausgleich erfolgreich gespeichert');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Speichern der Anpassungen');
    }
  };

  const handleUndoAdjustment = async (entryId: string) => {
    try {
      await apiClient.resetTimeEntryDuration(entryId);
      await fetchTimeEntries();
      await fetchMergedEntries();
      Alert.alert('Erfolg', 'Korrektur wurde zurückgesetzt');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Zurücksetzen der Korrektur');
    }
  };

  const handleUndoAllAdjustments = async () => {
    try {
      const undoPromises = timeEntries
        .filter(entry => {
          const entryDate = new Date(entry.startTime);
          return (
            selectedDate &&
            entryDate.getFullYear() === selectedDate.getFullYear() &&
            entryDate.getMonth() === selectedDate.getMonth() &&
            entryDate.getDate() === selectedDate.getDate() &&
            entry.correctedDuration && 
            entry.correctedDuration !== entry.duration
          );
        })
        .map(entry => apiClient.resetTimeEntryDuration(entry._id));
      
      await Promise.all(undoPromises);
      await fetchTimeEntries();
      await fetchMergedEntries();
      setIsUndoModalVisible(false);
      Alert.alert('Erfolg', 'Alle Korrekturen wurden zurückgesetzt');
    } catch (error) {
      Alert.alert('Fehler', 'Fehler beim Zurücksetzen der Korrekturen');
    }
  };

  // Render Zeiteintrag
  const renderTimeEntry = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.projectNumber}>{item.projectNumber || 'Kein Projekt'}</Text>
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          {item.correctedDuration && item.correctedDuration !== item.duration && (
            <>
              <Text style={styles.correctedDurationLabel}>→</Text>
              <Text style={styles.correctedDuration}>{formatDuration(item.correctedDuration)}</Text>
            </>
          )}
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.entryFooter}>
        <Text style={styles.timeRange}>
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
        
        <View style={styles.entryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          
          {item.correctedDuration && item.correctedDuration !== item.duration && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={() => handleUndoAdjustment(item._id)}
            >
              <Ionicons name="arrow-undo" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteTimeEntry(item._id)}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Zeiterfassung</Text>
      </View>

      {/* Datum-Auswahl */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate('prev')} style={styles.dateButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
        
        <TouchableOpacity onPress={() => changeDate('next')} style={styles.dateButton}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Start/Stop Timer */}
      <View style={styles.timerSection}>
        {!isRunning ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => startTimer('PRJ-001', 'Neue Aufgabe')}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.startButtonText}>Timer starten</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningTimerContainer}>
            <View style={styles.timerInfo}>
              <View style={styles.timerHeader}>
                <Ionicons name="time" size={24} color="#34C759" />
                <Text style={styles.timerStatus}>Timer läuft</Text>
              </View>
              
              <View style={styles.timerDetails}>
                <Text style={styles.timerProject}>{runningEntry?.projectNumber}</Text>
                <Text style={styles.timerDescription}>{runningEntry?.description}</Text>
              </View>
              
              <View style={styles.timerDisplay}>
                <Text style={styles.timerElapsed}>{formatDuration(elapsedTime)}</Text>
              </View>
            </View>
            
            <View style={styles.timerActions}>
              <TouchableOpacity onPress={() => {
                // Wenn Timer läuft, bearbeite nur die Beschreibung - stoppe NICHT den Timer
                if (isRunning && runningEntry) {
                  // Aktualisiere nur die Beschreibung im runningEntry
                  setRunningEntry({
                    ...runningEntry,
                    description: formData.description || runningEntry.description
                  });
                  
                  // Schließe Modal ohne Timer zu stoppen
                  setAddModalVisible(false);
                  
                  console.log('Beschreibung aktualisiert, Timer läuft weiter');
                } else {
                  // Normaler Fall (kein Timer läuft)
                  console.log('Kein Timer läuft, speichere normal:', formData);
                  saveTimeEntry(formData);
                }
              }}>
                <Ionicons name="pencil" size={18} color="white" />
                <Text style={styles.editTimerText}>Bearbeiten</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopTimerManually}
              >
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.stopButtonText}>Stoppen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Tagesübersicht */}
      <View style={styles.daySummary}>
        <Text style={styles.summaryTitle}>Heute ({filteredEntries.length} Einträge)</Text>
        <Text style={styles.summaryTime}>Gesamt: {formatDuration(totalDayTime)}</Text>
        
        {/* Tagesausgleich-Buttons */}
        <View style={styles.adjustmentButtons}>
          <TouchableOpacity
            style={styles.adjustmentButton}
            onPress={() => setIsAdjustmentModalVisible(true)}
          >
            <Ionicons name="calculator" size={20} color="white" />
            <Text style={styles.adjustmentButtonText}>Tagesausgleich</Text>
          </TouchableOpacity>
          
          {timeEntries.some(entry => {
            const entryDate = new Date(entry.startTime);
            return (
              selectedDate &&
              entryDate.getFullYear() === selectedDate.getFullYear() &&
              entryDate.getMonth() === selectedDate.getMonth() &&
              entryDate.getDate() === selectedDate.getDate() &&
              entry.correctedDuration && 
              entry.correctedDuration !== entry.duration
            );
          }) && (
            <TouchableOpacity
              style={styles.undoButton}
              onPress={() => setIsUndoModalVisible(true)}
            >
                             <Ionicons name="arrow-undo" size={20} color="white" />
              <Text style={styles.undoButtonText}>Zurücksetzen</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Tagesausgleich-Info */}
        {timeDifference !== null && (
          <View style={styles.adjustmentInfo}>
            <Text style={[
              styles.adjustmentInfoText,
              { color: Math.abs(timeDifference) < 0.01 ? '#34C759' : '#007AFF' }
            ]}>
              {Math.abs(timeDifference) < 0.01 ? (
                '✓ Zeiterfassung bereits ausgeglichen'
              ) : timeDifference > 0 ? (
                `Fehlende Zeit: ${timeDifference.toFixed(2)}h`
              ) : (
                `Überschuss: ${Math.abs(timeDifference).toFixed(2)}h`
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Zeiteinträge */}
      <View style={styles.entriesSection}>
        <Text style={styles.sectionTitle}>Zeiteinträge</Text>
        
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Keine Einträge für heute</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntries}
            renderItem={renderTimeEntry}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={addModalVisible || editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModals}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editModalVisible ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
            </Text>
            <TouchableOpacity onPress={() => {
              // Wenn Timer läuft, stoppe ihn zuerst und setze endTime
              if (isRunning && runningEntry) {
                const endTime = new Date();
                const updatedFormData = {
                  ...formData,
                  startTime: runningEntry.startTime.toISOString(),
                  endTime: endTime.toISOString(),
                  projectNumber: runningEntry.projectNumber,
                  description: formData.description || runningEntry.description
                };
                console.log('Timer läuft, stoppe und speichere mit:', updatedFormData);
                saveTimeEntry(updatedFormData);
                
                // Reset Timer
                setIsRunning(false);
                setRunningEntry(null);
              } else {
                // Normaler Fall (kein Timer läuft)
                console.log('Kein Timer läuft, speichere normal:', formData);
                saveTimeEntry(formData);
              }
            }}>
              <Text style={styles.saveButton}>Speichern</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Projektnummer</Text>
              <TextInput
                style={styles.input}
                value={formData.projectNumber}
                onChangeText={(text) => setFormData({ ...formData, projectNumber: text })}
                placeholder="z.B. PRJ-001"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beschreibung</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Was haben Sie gemacht?"
                multiline
                numberOfLines={3}
              />
            </View>

            {editModalVisible && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Startzeit</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.startTime}
                    onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                    placeholder="Startzeit"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Endzeit</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.endTime}
                    onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                    placeholder="Endzeit"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Tagesausgleich Modal */}
      <Modal
        visible={isAdjustmentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAdjustmentModalVisible(false)}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tagesausgleich</Text>
            <TouchableOpacity onPress={handleAdjustmentSubmit}>
              <Text style={styles.saveButton}>Ausgleichen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arbeitsstart</Text>
              <TextInput
                style={styles.input}
                value={adjustmentData.workStart}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, workStart: text })}
                placeholder="08:00"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arbeitsende</Text>
              <TextInput
                style={styles.input}
                value={adjustmentData.workEnd}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, workEnd: text })}
                placeholder="17:00"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mittagspause (Minuten)</Text>
              <TextInput
                style={styles.input}
                value={adjustmentData.lunchBreak.toString()}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, lunchBreak: parseInt(text) || 0 })}
                placeholder="60"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Andere Pausen (Minuten)</Text>
              <TextInput
                style={styles.input}
                value={adjustmentData.otherBreaks.toString()}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, otherBreaks: parseInt(text) || 0 })}
                placeholder="15"
                keyboardType="numeric"
              />
            </View>

            {/* Tagesausgleich-Info */}
            {timeDifference !== null && (
              <View style={styles.adjustmentInfo}>
                <Text style={[
                  styles.adjustmentInfoText,
                  { color: Math.abs(timeDifference) < 0.01 ? '#34C759' : '#007AFF' }
                ]}>
                  {Math.abs(timeDifference) < 0.01 ? (
                    '✓ Zeiterfassung bereits ausgeglichen'
                  ) : timeDifference > 0 ? (
                    `Fehlende Zeit: ${timeDifference.toFixed(2)}h`
                  ) : (
                    `Überschuss: ${Math.abs(timeDifference).toFixed(2)}h`
                  )}
                </Text>
              </View>
            )}

            {/* Angepasste Einträge anzeigen */}
            {adjustedEntries.length > 0 && (
              <View style={styles.adjustedEntriesSection}>
                <Text style={styles.sectionTitle}>Angepasste Einträge</Text>
                {adjustedEntries.map((entry) => {
                  const originalEntry = timeEntries.find(e => e._id === entry.id);
                  return (
                    <View key={entry.id} style={styles.adjustedEntryCard}>
                      <Text style={styles.adjustedEntryProject}>
                        {originalEntry?.projectNumber || 'Kein Projekt'}
                      </Text>
                      <Text style={styles.adjustedEntryDescription}>
                        {originalEntry?.description || ''}
                      </Text>
                      <View style={styles.adjustedEntryTimes}>
                        <Text style={styles.adjustedEntryOriginal}>
                          Original: {formatDuration(entry.originalDuration)}
                        </Text>
                        <Text style={styles.adjustedEntryNew}>
                          Neu: {formatDuration(entry.duration)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Undo Modal */}
      <Modal
        visible={isUndoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsUndoModalVisible(false)}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Korrekturen zurücksetzen</Text>
            <TouchableOpacity onPress={handleUndoAllAdjustments}>
              <Text style={styles.saveButton}>Zurücksetzen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.undoMessage}>
              Möchten Sie alle Korrekturen für diesen Tag zurücksetzen? 
              Dies kann nicht rückgängig gemacht werden.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  correctedDurationLabel: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 5,
  },
  correctedDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  timeInfo: {
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateButton: {
    padding: 10,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timerSection: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    gap: 10,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  daySummary: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  entriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  timeRange: {
    fontSize: 14,
    color: '#666',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  runningTimerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerInfo: {
    flex: 1,
    marginRight: 15,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
    textShadowColor: 'rgba(52, 199, 89, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timerDetails: {
    marginBottom: 8,
  },
  timerProject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  timerDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timerDisplay: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timerElapsed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  timerActions: {
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center',
  },
  editTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  editTimerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    marginBottom: 10,
  },
  adjustmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  adjustmentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  undoButton: {
    padding: 8,
  },
  undoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  adjustmentInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'center',
  },
  adjustmentInfoText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  adjustedEntriesSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  adjustedEntryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adjustedEntryProject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  adjustedEntryDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  adjustedEntryTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adjustedEntryOriginal: {
    fontSize: 13,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  adjustedEntryNew: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34C759',
  },
  undoMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default TimeEntriesScreen;
