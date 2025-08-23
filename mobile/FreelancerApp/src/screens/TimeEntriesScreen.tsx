import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { TimeEntry, TimeEntryFormData } from '../types';

const TimeEntriesScreen = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    projectNumber: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
  });

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimeEntries();
    }
  }, [isAuthenticated]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const entries = await apiClient.getTimeEntries();
      setTimeEntries(entries.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ));
    } catch (error) {
      Alert.alert('Fehler', 'Zeiteinträge konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeEntries();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!formData.projectNumber || !formData.description || !formData.startTime || !formData.endTime) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      if (editingEntry) {
        await apiClient.updateTimeEntry(editingEntry._id, formData);
        Alert.alert('Erfolg', 'Zeiteintrag wurde aktualisiert');
      } else {
        await apiClient.createTimeEntry(formData);
        Alert.alert('Erfolg', 'Zeiteintrag wurde erstellt');
      }
      
      setModalVisible(false);
      resetForm();
      fetchTimeEntries();
    } catch (error) {
      Alert.alert('Fehler', 'Zeiteintrag konnte nicht gespeichert werden');
    }
  };

  const handleDelete = (entry: TimeEntry) => {
    Alert.alert(
      'Löschen bestätigen',
      'Möchten Sie diesen Zeiteintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteTimeEntry(entry._id);
              Alert.alert('Erfolg', 'Zeiteintrag wurde gelöscht');
              fetchTimeEntries();
            } catch (error) {
              Alert.alert('Fehler', 'Zeiteintrag konnte nicht gelöscht werden');
            }
          }
        },
      ]
    );
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      projectNumber: entry.projectNumber,
      description: entry.description,
      startTime: new Date(entry.startTime).toISOString().slice(0, 16),
      endTime: new Date(entry.endTime).toISOString().slice(0, 16),
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      projectNumber: '',
      description: '',
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date().toISOString().slice(0, 16),
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const renderTimeEntry = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.projectNumber}>{item.projectNumber}</Text>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.timeInfo}>
        <Text style={styles.timeText}>
          {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.actionButtonText}>Bearbeiten</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.actionButtonText}>Löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zeiterfassung</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={timeEntries}
        renderItem={renderTimeEntry}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Bearbeiten' : 'Neuer Eintrag'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
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
                placeholder="PRJ-001"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beschreibung</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Beschreibung der Tätigkeit"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Startzeit</Text>
              <TextInput
                style={styles.input}
                value={formData.startTime}
                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                placeholder="YYYY-MM-DDTHH:mm"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Endzeit</Text>
              <TextInput
                style={styles.input}
                value={formData.endTime}
                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                placeholder="YYYY-MM-DDTHH:mm"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
});

export default TimeEntriesScreen;
