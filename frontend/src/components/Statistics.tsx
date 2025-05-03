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
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      const response = await fetch('/api/time-entries');
      if (!response.ok) throw new Error('Fehler beim Laden der Zeiteinträge');
      return response.json();
    },
  });

  // Projekte abrufen
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte');
      return response.json();
    },
  });

  // Zeitraum filtern
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    
    return { start, end: now };
  };

  // Gefilterte Daten
  const { start, end } = getDateRange();
  const filteredTimeEntries = timeEntries?.filter((entry: TimeEntry) => {
    const entryDate = new Date(entry.startTime);
    const matchesDate = entryDate >= start && entryDate <= end;
    const matchesProject = !selectedProject || entry.project._id === selectedProject;
    return matchesDate && matchesProject;
  });

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
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoadingTimeEntries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" component="h1">
                Statistiken
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Zeitraum"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="week">Letzte Woche</MenuItem>
                  <MenuItem value="month">Letzter Monat</MenuItem>
                  <MenuItem value="year">Letztes Jahr</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Projekt"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">Alle Projekte</MenuItem>
                  {projects?.map((project: any) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Gesamtstunden
                    </Typography>
                    <Typography variant="h4">
                      {filteredTimeEntries?.reduce(
                        (sum: number, entry: TimeEntry) => sum + entry.duration / 3600,
                        0
                      ).toFixed(1)}h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Zeitaufwand nach Projekt
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeByProject}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {timeByProject?.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Statistics; 