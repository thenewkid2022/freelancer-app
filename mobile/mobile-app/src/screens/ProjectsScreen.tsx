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
import { TimeEntry } from '../types';

interface Project {
  projectNumber: string;
  totalHours: number;
  totalEntries: number;
  lastActivity: string;
  description?: string;
}

const ProjectsScreen = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const entries = await apiClient.getTimeEntries();
      setTimeEntries(entries);
      
      // Projekte aus Zeiteinträgen gruppieren
      const projectMap = new Map<string, {
        totalHours: number;
        totalEntries: number;
        lastActivity: string;
        entries: TimeEntry[];
      }>();

      entries.forEach(entry => {
        const projectNumber = entry.projectNumber || 'Unbekannt';
        const current = projectMap.get(projectNumber) || {
          totalHours: 0,
          totalEntries: 0,
          lastActivity: entry.startTime,
          entries: [],
        };

        projectMap.set(projectNumber, {
          totalHours: current.totalHours + (entry.duration / 3600),
          totalEntries: current.totalEntries + 1,
          lastActivity: new Date(entry.startTime) > new Date(current.lastActivity) 
            ? entry.startTime 
            : current.lastActivity,
          entries: [...current.entries, entry],
        });
      });

      const projectList = Array.from(projectMap.entries()).map(([projectNumber, stats]) => ({
        projectNumber,
        totalHours: Math.round(stats.totalHours * 10) / 10,
        totalEntries: stats.totalEntries,
        lastActivity: stats.lastActivity,
        description: getProjectDescription(stats.entries),
      }));

      // Nach letzter Aktivität sortieren
      projectList.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      
      setProjects(projectList);
    } catch (error) {
      Alert.alert('Fehler', 'Projekte konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const getProjectDescription = (entries: TimeEntry[]): string => {
    // Häufigste Beschreibung als Projekt-Beschreibung verwenden
    const descriptions = entries.map(e => e.description).filter(Boolean);
    if (descriptions.length === 0) return '';
    
    const descriptionCount = descriptions.reduce((acc, desc) => {
      acc[desc] = (acc[desc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(descriptionCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getProjectEntries = (projectNumber: string) => {
    return timeEntries
      .filter(entry => entry.projectNumber === projectNumber)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectNumber}>{item.projectNumber}</Text>
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description || 'Keine Beschreibung'}
          </Text>
        </View>
        <View style={styles.projectStats}>
          <Text style={styles.totalHours}>{item.totalHours}h</Text>
          <Text style={styles.entryCount}>{item.totalEntries} Einträge</Text>
        </View>
      </View>
      
      <View style={styles.projectFooter}>
        <View style={styles.lastActivity}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.lastActivityText}>
            Zuletzt: {formatDate(item.lastActivity)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderProjectEntry = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryItem}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryDescription}>{item.description}</Text>
        <Text style={styles.entryDate}>
          {new Date(item.startTime).toLocaleDateString('de-CH')} - {' '}
          {Math.round(item.duration / 3600 * 10) / 10}h
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projekte</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {projects.length} Projekte
          </Text>
        </View>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.projectNumber}
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
              <Text style={styles.closeButton}>Schließen</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedProject?.projectNumber}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {selectedProject && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.projectDetailCard}>
                <Text style={styles.detailTitle}>Projekt-Übersicht</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gesamtzeit:</Text>
                  <Text style={styles.detailValue}>{selectedProject.totalHours}h</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Einträge:</Text>
                  <Text style={styles.detailValue}>{selectedProject.totalEntries}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Letzte Aktivität:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedProject.lastActivity)}
                  </Text>
                </View>

                {selectedProject.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Beschreibung:</Text>
                    <Text style={styles.detailValue}>{selectedProject.description}</Text>
                  </View>
                )}
              </View>

              <View style={styles.entriesSection}>
                <Text style={styles.sectionTitle}>Zeiteinträge</Text>
                <FlatList
                  data={getProjectEntries(selectedProject.projectNumber)}
                  renderItem={renderProjectEntry}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          )}
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
  headerStats: {
    alignItems: 'flex-end',
  },
  headerStatsText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    marginRight: 16,
  },
  projectNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  projectStats: {
    alignItems: 'flex-end',
  },
  totalHours: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  entryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastActivityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  projectDetailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  entriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  entryItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  entryInfo: {
    flex: 1,
  },
  entryDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProjectsScreen;
