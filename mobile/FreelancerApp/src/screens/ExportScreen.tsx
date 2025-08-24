import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { MergedEntry } from '../types';

const ExportScreen = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mergedEntries, setMergedEntries] = useState<MergedEntry[]>([]);
  
  // Zeitraum-Auswahl
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Standard: aktueller Monat
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Lade gemergte Einträge für Export
  const loadMergedEntries = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Fehler', 'Bitte wählen Sie Start- und Enddatum aus');
      return;
    }

    try {
      setLoading(true);
      const entries = await apiClient.getMergedTimeEntries(startDate, endDate);
      setMergedEntries(entries);
      
      if (entries.length === 0) {
        Alert.alert('Info', 'Keine Einträge im gewählten Zeitraum gefunden');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Einträge konnten nicht geladen werden');
      console.error('Export Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  // CSV-Export
  const exportCSV = async () => {
    if (mergedEntries.length === 0) {
      Alert.alert('Fehler', 'Keine Einträge zum Exportieren vorhanden');
      return;
    }

    try {
      setExporting(true);
      
      // CSV-Header
      const header = [
        'Projektnummer',
        'Datum',
        'Startzeit',
        'Endzeit',
        'Kommentare',
        'Dauer [min]',
        'Korrigiert [min]'
      ];

      // CSV-Zeilen
      const rows = mergedEntries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => [
          entry.projectNumber || 'Kein Projekt',
          new Date(entry.date).toLocaleDateString('de-DE'),
          entry.startTime ? new Date(entry.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          entry.endTime ? new Date(entry.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          entry.comments && entry.comments.length > 0
            ? entry.comments.map((c, i) => `${i + 1}. ${c}`).join(' | ')
            : '',
          Math.round(entry.totalDuration / 60).toString(),
          entry.correctedDuration ? Math.round(entry.correctedDuration / 60).toString() : ''
        ]);

      // CSV-Inhalt erstellen
      const csvContent = [header, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Datei speichern
      const fileName = `zeiteintraege_${startDate}_${endDate}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Datei teilen
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Zeiteinträge exportieren',
        });
      } else {
        Alert.alert('Erfolg', `CSV wurde gespeichert: ${fileName}`);
      }
    } catch (error) {
      Alert.alert('Fehler', 'CSV-Export fehlgeschlagen');
      console.error('CSV Export Fehler:', error);
    } finally {
      setExporting(false);
    }
  };

  // Excel-Export (als CSV mit .xlsx Endung für Kompatibilität)
  const exportExcel = async () => {
    if (mergedEntries.length === 0) {
      Alert.alert('Fehler', 'Keine Einträge zum Exportieren vorhanden');
      return;
    }

    try {
      setExporting(true);
      
      // Excel-kompatible Daten
      const header = [
        'Projektnummer',
        'Datum',
        'Startzeit',
        'Endzeit',
        'Kommentare',
        'Dauer [min]',
        'Korrigiert [min]'
      ];

      const rows = mergedEntries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => [
          entry.projectNumber || 'Kein Projekt',
          new Date(entry.date).toLocaleDateString('de-DE'),
          entry.startTime ? new Date(entry.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          entry.endTime ? new Date(entry.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          entry.comments && entry.comments.length > 0
            ? entry.comments.map((c, i) => `${i + 1}. ${c}`).join(' | ')
            : '',
          Math.round(entry.totalDuration / 60).toString(),
          entry.correctedDuration ? Math.round(entry.correctedDuration / 60).toString() : ''
        ]);

      // Excel-kompatibler Inhalt (TSV für bessere Excel-Kompatibilität)
      const excelContent = [header, ...rows]
        .map(row => row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t'))
        .join('\n');

      // Datei speichern
      const fileName = `zeiteintraege_${startDate}_${endDate}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, excelContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Datei teilen
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Zeiteinträge exportieren',
        });
      } else {
        Alert.alert('Erfolg', `Excel wurde gespeichert: ${fileName}`);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Excel-Export fehlgeschlagen');
      console.error('Excel Export Fehler:', error);
    } finally {
      setExporting(false);
    }
  };

  // PDF-Export (als HTML für bessere Mobile-Kompatibilität)
  const exportPDF = async () => {
    if (mergedEntries.length === 0) {
      Alert.alert('Fehler', 'Keine Einträge zum Exportieren vorhanden');
      return;
    }

    try {
      setExporting(true);
      
      // HTML für PDF-Export
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Zeiteinträge Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #007AFF; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { text-align: right; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Zeiteinträge Export</h1>
            <p>Zeitraum: ${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}</p>
            <p>Exportiert am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Projektnummer</th>
                <th>Datum</th>
                <th>Startzeit</th>
                <th>Endzeit</th>
                <th>Kommentare</th>
                <th>Dauer [min]</th>
                <th>Korrigiert [min]</th>
              </tr>
            </thead>
            <tbody>
              ${mergedEntries
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(entry => `
                  <tr>
                    <td>${entry.projectNumber || 'Kein Projekt'}</td>
                    <td>${new Date(entry.date).toLocaleDateString('de-DE')}</td>
                    <td>${entry.startTime ? new Date(entry.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td>${entry.endTime ? new Date(entry.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td>${entry.comments && entry.comments.length > 0 ? entry.comments.map((c, i) => `${i + 1}. ${c}`).join('<br>') : ''}</td>
                    <td>${Math.round(entry.totalDuration / 60)}</td>
                    <td>${entry.correctedDuration ? Math.round(entry.correctedDuration / 60) : ''}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Gesamtdauer: ${Math.round(mergedEntries.reduce((sum, e) => sum + (e.totalDuration || 0), 0) / 60)} Minuten
          </div>
        </body>
        </html>
      `;

      // Datei speichern
      const fileName = `zeiteintraege_${startDate}_${endDate}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Datei teilen
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: 'Zeiteinträge exportieren',
        });
      } else {
        Alert.alert('Erfolg', `HTML wurde gespeichert: ${fileName}`);
      }
    } catch (error) {
      Alert.alert('Fehler', 'PDF-Export fehlgeschlagen');
      console.error('PDF Export Fehler:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export</Text>
      </View>

      {/* Zeitraum-Auswahl */}
      <View style={styles.dateSection}>
        <Text style={styles.sectionTitle}>Zeitraum auswählen</Text>
        
        <View style={styles.dateInputs}>
          <View style={styles.dateInput}>
            <Text style={styles.label}>Startdatum</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          
          <View style={styles.dateInput}>
            <Text style={styles.label}>Enddatum</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.loadButton}
          onPress={loadMergedEntries}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.loadButtonText}>Einträge laden</Text>
            </>
          )}
        </TouchableOpacity>

        {mergedEntries.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {mergedEntries.length} Einträge gefunden
            </Text>
            <Text style={styles.summaryText}>
              Gesamt: {Math.round(mergedEntries.reduce((sum, e) => sum + (e.totalDuration || 0), 0) / 60)} Minuten
            </Text>
          </View>
        )}
      </View>

      {/* Export-Buttons */}
      <View style={styles.exportSection}>
        <Text style={styles.sectionTitle}>Export-Format wählen</Text>
        
        <TouchableOpacity
          style={[styles.exportButton, styles.pdfButton]}
          onPress={exportPDF}
          disabled={exporting || mergedEntries.length === 0}
        >
          <Ionicons name="document-text" size={24} color="white" />
          <Text style={styles.exportButtonText}>HTML/PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.excelButton]}
          onPress={exportExcel}
          disabled={exporting || mergedEntries.length === 0}
        >
          <Ionicons name="grid" size={24} color="white" />
          <Text style={styles.exportButtonText}>Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.csvButton]}
          onPress={exportCSV}
          disabled={exporting || mergedEntries.length === 0}
        >
          <Ionicons name="document" size={24} color="white" />
          <Text style={styles.exportButtonText}>CSV</Text>
        </TouchableOpacity>

        {exporting && (
          <View style={styles.exportingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.exportingText}>Exportiere...</Text>
          </View>
        )}
      </View>

      {/* Export-Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Export-Informationen</Text>
        <Text style={styles.infoText}>
          • Alle Exporte enthalten die gleichen Daten wie die Web-Version
        </Text>
        <Text style={styles.infoText}>
          • Tagesausgleich-Korrekturen werden mit exportiert
        </Text>
        <Text style={styles.infoText}>
          • Exporte werden über die Teilen-Funktion Ihres Geräts gesendet
        </Text>
        <Text style={styles.infoText}>
          • Unterstützte Formate: HTML, Excel (.xlsx), CSV
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
    textAlign: 'center',
  },
  dateSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
  },
  loadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  exportSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButton: {
    backgroundColor: '#FF3B30',
  },
  excelButton: {
    backgroundColor: '#34C759',
  },
  csvButton: {
    backgroundColor: '#007AFF',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  exportingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default ExportScreen;
