import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { TimeEntry } from '../types';

interface StatisticCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const StatisticsScreen = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

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
      setTimeEntries(entries);
    } catch (error) {
      Alert.alert('Fehler', 'Statistiken konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimeEntries();
    setRefreshing(false);
  };

  // Hilfsfunktionen VOR dem useMemo definieren
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWorkingDaysInPeriod = (period: 'week' | 'month' | 'year') => {
    const now = new Date();
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      case 'year':
        return 365;
      default:
        return 30;
    }
  };

  const getDayStatistics = (entries: TimeEntry[]) => {
    const dayMap = new Map<string, number>();
    
    entries.forEach(entry => {
      const day = new Date(entry.startTime).toLocaleDateString('de-DE', { weekday: 'long' });
      const currentHours = dayMap.get(day) || 0;
      dayMap.set(day, currentHours + (entry.duration / 3600));
    });

    return Array.from(dayMap.entries()).map(([day, hours]) => ({
      day,
      hours: Math.round(hours * 10) / 10,
    }));
  };

  const statistics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentWeek = getWeekNumber(now);

    let filteredEntries = timeEntries;

    // Filter nach ausgewähltem Zeitraum
    if (selectedPeriod === 'week') {
      filteredEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return getWeekNumber(entryDate) === currentWeek && entryDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'month') {
      filteredEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'year') {
      filteredEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate.getFullYear() === currentYear;
      });
    }

    // Gesamtarbeitszeit berechnen
    const totalSeconds = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    // Anzahl der Projekte
    const uniqueProjects = new Set(filteredEntries.map(entry => entry.projectNumber));
    const projectCount = uniqueProjects.size;

    // Durchschnittliche Arbeitszeit pro Tag
    const workingDays = getWorkingDaysInPeriod(selectedPeriod);
    const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

    // Produktivster Tag
    const dayStats = getDayStatistics(filteredEntries);
    const mostProductiveDay = dayStats.length > 0 
      ? dayStats.reduce((max, day) => day.hours > max.hours ? day : max)
      : null;

    return {
      totalTime: `${totalHours}h ${totalMinutes}m`,
      projectCount: projectCount.toString(),
      avgHoursPerDay: avgHoursPerDay.toFixed(1) + 'h',
      mostProductiveDay: mostProductiveDay?.day || '-',
      totalEntries: filteredEntries.length.toString(),
    };
  }, [timeEntries, selectedPeriod]);

  const getProjectStatistics = () => {
    const projectMap = new Map<string, { hours: number; entries: number }>();
    
    timeEntries.forEach(entry => {
      const project = entry.projectNumber || 'Unbekannt';
      const current = projectMap.get(project) || { hours: 0, entries: 0 };
      projectMap.set(project, {
        hours: current.hours + (entry.duration / 3600),
        entries: current.entries + 1,
      });
    });

    return Array.from(projectMap.entries())
      .map(([project, stats]) => ({
        project,
        hours: Math.round(stats.hours * 10) / 10,
        entries: stats.entries,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5); // Top 5 Projekte
  };

  const statisticCards: StatisticCard[] = [
    {
      title: 'Gesamtzeit',
      value: statistics.totalTime,
      icon: 'time',
      color: '#007AFF',
    },
    {
      title: 'Projekte',
      value: statistics.projectCount,
      icon: 'folder',
      color: '#34C759',
    },
    {
      title: 'Ø pro Tag',
      value: statistics.avgHoursPerDay,
      icon: 'calendar',
      color: '#FF9500',
    },
    {
      title: 'Einträge',
      value: statistics.totalEntries,
      icon: 'list',
      color: '#AF52DE',
    },
  ];

  const projectStats = getProjectStatistics();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statistiken</Text>
      </View>

      {/* Zeitraum-Auswahl */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'week' ? 'Woche' : period === 'month' ? 'Monat' : 'Jahr'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistik-Karten */}
      <View style={styles.statsGrid}>
        {statisticCards.map((card, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: card.color }]}>
              <Ionicons name={card.icon} size={24} color="white" />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statTitle}>{card.title}</Text>
          </View>
        ))}
      </View>

      {/* Projekt-Übersicht */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Projekte</Text>
        {projectStats.map((project, index) => (
          <View key={project.project} style={styles.projectItem}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{project.project}</Text>
              <Text style={styles.projectDetails}>
                {project.entries} Einträge
              </Text>
            </View>
            <Text style={styles.projectHours}>{project.hours}h</Text>
          </View>
        ))}
      </View>

      {/* Produktivster Tag */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produktivster Tag</Text>
        <View style={styles.productiveDay}>
          <Ionicons name="trophy" size={32} color="#FFD700" />
          <Text style={styles.productiveDayText}>
            {statistics.mostProductiveDay}
          </Text>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  projectDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  projectHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  productiveDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  productiveDayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
});

export default StatisticsScreen;
