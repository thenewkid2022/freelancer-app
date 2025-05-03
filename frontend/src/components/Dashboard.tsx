import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectNumber, setProjectNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTimeEntry, setActiveTimeEntry] = useState<{ id: string; startTime: string } | null>(null);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Starten der Zeiterfassung
  const startTimeEntry = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-entries`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectNumber,
          projectName,
          description,
          startTime: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Fehler beim Starten der Zeiterfassung');
      return response.json();
    },
    onSuccess: (data) => {
      setActiveTimeEntry({ id: data._id, startTime: data.startTime });
      setTimer(0);
      const id = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setIntervalId(id);
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Stoppen der Zeiterfassung
  const stopTimeEntry = useMutation({
    mutationFn: async () => {
      if (!activeTimeEntry) return;
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-entries/${activeTimeEntry.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endTime: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Fehler beim Stoppen der Zeiterfassung');
      return response.json();
    },
    onSuccess: () => {
      setActiveTimeEntry(null);
      if (intervalId) clearInterval(intervalId);
      setIntervalId(null);
      setTimer(0);
      setProjectNumber('');
      setProjectName('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Zeitformatierung
  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const seconds = timer % 60;

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 4 }}>
        Zeiterfassung
      </Typography>
      <Paper elevation={3} sx={{ p: 5, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 2 }}>
          Zeiterfassung
        </Typography>
        <Typography align="center" sx={{ mb: 3 }}>
          Aktuelle Zeit: <b>{hours}h {minutes}m {seconds}s</b>
        </Typography>
        <TextField
          label="Projektnummer"
          placeholder="z.B. PRJ-001"
          fullWidth
          margin="normal"
          value={projectNumber}
          onChange={(e) => setProjectNumber(e.target.value)}
          disabled={!!activeTimeEntry}
        />
        <TextField
          label="Projektname"
          placeholder="z.B. Website-Relaunch"
          fullWidth
          margin="normal"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={!!activeTimeEntry}
        />
        <TextField
          label="Beschreibung"
          placeholder="Kurze Beschreibung der Tätigkeit"
          fullWidth
          margin="normal"
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!!activeTimeEntry}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 3, width: '100%', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => startTimeEntry.mutate()}
            disabled={!!activeTimeEntry || !projectNumber || !projectName}
            sx={{ minWidth: 100 }}
          >
            Start
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => stopTimeEntry.mutate()}
            disabled={!activeTimeEntry}
            sx={{ minWidth: 100 }}
          >
            Stop
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard; 