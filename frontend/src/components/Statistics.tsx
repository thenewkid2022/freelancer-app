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
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';

const API_URL = process.env.REACT_APP_API_URL;

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
  const [timeRange, setTimeRange] = useState('month');
  const [selectedProject, setSelectedProject] = useState('');

  // Zeiteinträge abrufen
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get<TimeEntry[]>('/time-entries');
    },
  });

  // Zeitraum filtern
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'week':
        start.setUTCDate(now.getUTCDate() - 7);
        break;
      case 'month':
        start.setUTCMonth(now.getUTCMonth() - 1);
        break;
      case 'year':
        start.setUTCFullYear(now.getUTCFullYear() - 1);
        break;
      default:
        start.setUTCMonth(now.getUTCMonth() - 1);
    }
    
    return { start, end: now };
  };

  // Gefilterte Daten
  const { start, end } = getDateRange();
  const filteredTimeEntries = timeEntries?.filter((entry: TimeEntry) => {
    const matchesProject = !selectedProject || entry.project._id === selectedProject;
    return matchesProject;
  });
  console.log('Gefilterte Zeiteinträge:', filteredTimeEntries); // Debug-Ausgabe

  // Daten für Diagramme
  const timeByProject = filteredTimeEntries?.reduce((acc: any[], entry: TimeEntry) => {
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
  }, []) || [];

  const totalHours = Array.isArray(timeByProject)
    ? timeByProject.reduce(
        (sum: number, entry: { name: string; value: number }) =>
          sum + (typeof entry.value === 'number' ? entry.value : 0),
        0
      )
    : 0;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6666'];

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Gesamtstunden
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                {isNaN(totalHours) ? '0.00' : totalHours.toFixed(2)} h
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  select
                  label="Zeitraum"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="week">Letzte Woche</MenuItem>
                  <MenuItem value="month">Letzter Monat</MenuItem>
                  <MenuItem value="year">Letztes Jahr</MenuItem>
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Zeitaufwand nach Projekt</Typography>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index as number % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} h`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Statistics; 