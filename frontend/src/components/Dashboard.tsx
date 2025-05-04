import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Container,
  Button,
  TextField,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  useEffect(() => {
    const fetchActiveEntry = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/time-entries/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data._id && data.startTime) {
          setActiveTimeEntry({ id: data._id, startTime: data.startTime });
          // Timer auf Basis von startTime initialisieren
          const start = new Date(data.startTime).getTime();
          setTimer(Math.floor((Date.now() - start) / 1000));
          const id = setInterval(() => {
            setTimer((prev) => prev + 1);
          }, 1000);
          setIntervalId(id);
        }
      }
    };
    fetchActiveEntry();
    // eslint-disable-next-line
  }, []);

  // Zeitformatierung
  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const seconds = timer % 60;

  return (
    <Container maxWidth={isMobile ? 'xs' : 'sm'} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: isMobile ? 1 : 2 }}>
      <Stack spacing={isMobile ? 2 : 4} sx={{ width: '100%', maxWidth: 420 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} align="center" sx={{ fontWeight: 700 }}>
          Zeiterfassung
        </Typography>
        <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: 3, width: '100%' }}>
          <Stack spacing={isMobile ? 2 : 3}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <AccessTimeIcon color="primary" />
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
                {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </Typography>
              {activeTimeEntry && (
                <Chip label="läuft" color="success" size="small" sx={{ ml: 1 }} />
              )}
            </Stack>
            <Divider sx={{ my: isMobile ? 1 : 2 }} />
            <Stack spacing={isMobile ? 1 : 2}>
              <TextField
                label="Projektnummer"
                placeholder="z.B. PRJ-001"
                fullWidth
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                disabled={!!activeTimeEntry}
                InputProps={{ startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} /> }}
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Projektname"
                placeholder="z.B. Website-Relaunch"
                fullWidth
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={!!activeTimeEntry}
                sx={{ borderRadius: 2 }}
              />
              <TextField
                label="Beschreibung"
                placeholder="Kurze Beschreibung der Tätigkeit"
                fullWidth
                multiline
                minRows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!!activeTimeEntry}
                sx={{ borderRadius: 2 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: isMobile ? 1 : 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={() => startTimeEntry.mutate()}
                disabled={!!activeTimeEntry || !projectNumber || !projectName}
                sx={{ minWidth: 110, borderRadius: 2, fontWeight: 600, fontSize: isMobile ? '1rem' : '1.1rem' }}
              >
                Start
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => stopTimeEntry.mutate()}
                disabled={!activeTimeEntry}
                sx={{ minWidth: 110, borderRadius: 2, fontWeight: 600, fontSize: isMobile ? '1rem' : '1.1rem' }}
              >
                Stop
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Dashboard; 