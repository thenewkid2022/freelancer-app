import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTimeEntry, setActiveTimeEntry] = useState<{ id: string; startTime: string } | null>(null);

  // Projekte abrufen
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte');
      return response.json();
    },
  });

  // Starten der Zeiterfassung
  const startTimeEntry = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: selectedProject, startTime: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Fehler beim Starten der Zeiterfassung');
      return response.json();
    },
    onSuccess: (data) => {
      setActiveTimeEntry({ id: data._id, startTime: data.startTime });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Stoppen der Zeiterfassung
  const stopTimeEntry = useMutation({
    mutationFn: async () => {
      if (!activeTimeEntry) return;
      const response = await fetch(`/api/time-entries/${activeTimeEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endTime: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Fehler beim Stoppen der Zeiterfassung');
      return response.json();
    },
    onSuccess: () => {
      setActiveTimeEntry(null);
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.name ? `Willkommen, ${user.name}!` : 'Willkommen!'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Hier ist Ihre Zeiterfassungsübersicht
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Neue Zeiterfassung
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Projekt auswählen</InputLabel>
                <Select
                  value={selectedProject}
                  label="Projekt auswählen"
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  {projects?.map((project: any) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!activeTimeEntry ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => startTimeEntry.mutate()}
                  disabled={!selectedProject}
                >
                  Start
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => stopTimeEntry.mutate()}
                >
                  Stop
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}></Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Letzte Zeiteinträge
            </Typography>
            {/* Hier können später die letzten Zeiteinträge angezeigt werden */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 