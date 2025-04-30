import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PlayArrow, Stop, Save } from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Project {
  _id: string;
  name: string;
  client: {
    _id: string;
    name: string;
  };
}

interface TimeEntry {
  _id: string;
  project: Project;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
}

const TimeTracker: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');

  // Projekte abrufen
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte');
      return response.json();
    },
  });

  // Timer-Logik
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Timer starten
  const handleStart = useCallback(() => {
    if (!selectedProject) {
      alert('Bitte wählen Sie ein Projekt aus');
      return;
    }
    setIsRunning(true);
    setStartTime(new Date());
  }, [selectedProject]);

  // Timer stoppen
  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Zeiteintrag speichern
  const saveTimeEntry = useMutation({
    mutationFn: async (timeEntry: Partial<TimeEntry>) => {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeEntry),
      });
      if (!response.ok) throw new Error('Fehler beim Speichern des Zeiteintrags');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      setElapsedTime(0);
      setDescription('');
      setSelectedProject('');
    },
  });

  // Zeit formatieren
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Zeiterfassung
        </Typography>

        {isLoadingProjects ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Projekt</InputLabel>
                <Select
                  value={selectedProject}
                  label="Projekt"
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={isRunning}
                >
                  {projects?.map((project: Project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name} - {project.client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isRunning}
              />
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  my: 2,
                }}
              >
                <Typography variant="h3" component="div">
                  {formatTime(elapsedTime)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                {!isRunning ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={handleStart}
                    disabled={!selectedProject}
                  >
                    Start
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Stop />}
                      onClick={handleStop}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Save />}
                      onClick={() => {
                        if (startTime) {
                          saveTimeEntry.mutate({
                            project: selectedProject,
                            description,
                            startTime: startTime.toISOString(),
                            endTime: new Date().toISOString(),
                            duration: elapsedTime,
                          });
                        }
                      }}
                    >
                      Speichern
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        )}

        {saveTimeEntry.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Fehler beim Speichern des Zeiteintrags
          </Alert>
        )}

        {saveTimeEntry.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Zeiteintrag erfolgreich gespeichert
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default TimeTracker; 