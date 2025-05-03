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
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { apiClient } from '../services/api/client';

interface TimeEntry {
  _id: string;
  project: {
    _id: string;
    name: string;
  };
  duration: number;
  startTime: string;
}

const Statistics: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const theme = useTheme();

  // Zeiteinträge abrufen
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get<TimeEntry[]>('/time-entries');
    },
  });

  // Gefilterte Daten (nur nach Projekt)
  const filteredTimeEntries = timeEntries?.filter((entry: TimeEntry) => {
    const matchesProject = !selectedProject || entry.project._id === selectedProject;
    return matchesProject;
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

  if (isLoadingTimeEntries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Statistiken</Typography>

      {/* Projektverteilung */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Projektverteilung</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={timeByProject}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={50}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {timeByProject.map((entry: { name: string; value: number }, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} h`} />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Gesamtübersicht */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Zeiträume
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>{zeitraeume}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Gesamtstunden
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>{isNaN(totalHours) ? '0.00' : totalHours.toFixed(2)} h</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Durchschnitt/Eintrag
              </Typography>
              <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>{isNaN(avgPerEntry) ? '0.00' : avgPerEntry.toFixed(2)} h</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ bgcolor: theme.palette.background.paper }}>
            <CardContent>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Einträge
              </Typography>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>{totalEntries}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tägliche Übersicht */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Tägliche Übersicht</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zeitraum</TableCell>
                <TableCell>Gesamtstunden</TableCell>
                <TableCell>Einträge</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">Keine Daten vorhanden</TableCell>
                </TableRow>
              ) : (
                dailyData.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.hours.toFixed(2)} h</TableCell>
                    <TableCell>{row.entries}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Statistics; 