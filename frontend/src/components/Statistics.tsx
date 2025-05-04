import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { apiClient } from '../services/api/client';
import { AxiosResponse } from 'axios';

interface TimeEntry {
  _id: string;
  project: {
    _id: string;
    name: string;
  };
  duration: number;
  startTime: string;
}

interface TimeEntryFormData {
  project: string;
  startTime: string;
  endTime: string;
  description: string;
}

const Statistics: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Zeiteinträge abrufen
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get<TimeEntry[]>('/time-entries');
    },
  });

  // Gefilterte Daten (nur nach Projekt)
  const filteredTimeEntries = timeEntries?.filter((entry: TimeEntry) => {
    return true;
  }) || [];

  // Projektverteilung für PieChart
  const timeByProject = filteredTimeEntries.reduce((acc: any[], entry: TimeEntry) => {
    const existing = acc.find(item => item.name === entry.project.name);
    if (existing) {
      existing.value += entry.duration / 3600;
    } else {
      acc.push({
        name: entry.project.name,
        value: entry.duration / 3600,
      });
    }
    return acc;
  }, []);

  // Gesamtübersicht
  const totalHours = timeByProject.reduce(
    (sum: number, entry: { name: string; value: number }) =>
      sum + (typeof entry.value === 'number' ? entry.value : 0),
    0
  );
  const totalEntries = filteredTimeEntries.length;
  const avgPerEntry = totalEntries > 0 ? totalHours / totalEntries : 0;
  const zeitraeume = 1; // Platzhalter, falls du Zeiträume berechnen willst

  // Tägliche Übersicht (Gruppierung nach Tag)
  const dailyMap: Record<string, { hours: number; entries: number }> = {};
  filteredTimeEntries.forEach(entry => {
    const day = new Date(entry.startTime).toLocaleDateString('de-DE');
    if (!dailyMap[day]) {
      dailyMap[day] = { hours: 0, entries: 0 };
    }
    dailyMap[day].hours += entry.duration / 3600;
    dailyMap[day].entries += 1;
  });
  const dailyData = Object.entries(dailyMap).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Farben für das PieChart aus dem Theme
  const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.primary.light, theme.palette.secondary.light, '#A020F0', '#FF6666'];

  const saveTimeEntry = useMutation({
    mutationFn: async (entryData: TimeEntryFormData) => {
      const url = selectedEntry
        ? `/time-entries/${selectedEntry._id}`
        : '/time-entries';
      const method = selectedEntry ? 'put' : 'post';

      // HIER: Zeitfelder korrekt umwandeln
      const payload = {
        ...entryData,
        startTime: new Date(entryData.startTime).toISOString(),
        endTime: new Date(entryData.endTime).toISOString(),
      };

      const response: AxiosResponse<TimeEntry> = await apiClient[method](url, payload);
      return response.data;
    },
  });

  // Hilfsfunktion: Top 5 + Sonstige
  const getTopProjects = (data: any[], topN = 5) => {
    if (data.length <= topN) return data;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const restSum = rest.reduce((sum, entry) => sum + entry.value, 0);
    return [
      ...top,
      { name: 'Sonstige', value: restSum }
    ];
  };

  const topProjects = getTopProjects(timeByProject, 5);

  if (isLoadingTimeEntries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        {/* Überschrift nur auf Desktop anzeigen */}
        {!isMobile && (
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Statistiken
          </Typography>
        )}

        {/* Projektverteilung */}
        <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Projektverteilung</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topProjects}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
              >
                {topProjects.map((entry: { name: string; value: number }, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string, props: any) => {
                const project = topProjects[props.payload && props.payload.index];
                return [`${value.toFixed(2)} h`, project ? project.name : name];
              }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Eigene Legende als Liste */}
          <Box sx={{ mt: 2, maxHeight: 120, overflowY: 'auto' }}>
            {topProjects.map((entry, idx) => (
              <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{
                  width: 16, height: 16, bgcolor: COLORS[idx % COLORS.length], borderRadius: '50%', mr: 1
                }} />
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                  {entry.name}: {totalHours > 0 ? (entry.value / totalHours * 100).toFixed(1) : '0.0'}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Gesamtübersicht */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4} md={3}>
            <Card elevation={3} sx={{ bgcolor: theme.palette.background.paper, p: { xs: 1, sm: 2 } }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                  Gesamtstunden
                </Typography>
                <Typography variant="h5" color="success.main" sx={{ fontWeight: 700, fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                  {isNaN(totalHours) ? '0.00' : totalHours.toFixed(2)} h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tägliche Übersicht */}
        <Paper sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Tägliche Übersicht</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <TableContainer sx={{ minWidth: 320 }}>
              <Table size="small" sx={{ minWidth: 320 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>Zeitraum</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>Gesamtstunden</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>Einträge</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 1 }}>Keine Daten vorhanden</TableCell>
                    </TableRow>
                  ) : (
                    dailyData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>{row.date}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>{row.hours.toFixed(2)} h</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, py: 0.5 }}>{row.entries}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Statistics; 