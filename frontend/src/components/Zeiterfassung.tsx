import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';

const API_URL = process.env.REACT_APP_API_URL;

const Zeiterfassung: React.FC = () => {
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 4, md: 8 },
      }}
    >
      <Box
        sx={{
          mb: { xs: 3, md: 0 },
          p: 2,
          borderRadius: 2,
          bgcolor: 'info.light',
          color: 'info.contrastText',
          boxShadow: 1,
          maxWidth: 350,
          minWidth: 220,
          width: '100%',
          fontSize: '1rem',
          mx: { md: 2 },
        }}
      >
        Erfasse deine täglichen Projektzeiten.<br />
        Führe am Ende des Tages einen Tagesausgleich durch.<br />
        Es gibt noch Statistiken und Exporte.
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 0.5 : 2,
          borderRadius: 2,
          width: '100%',
          maxWidth: 340,
          minWidth: 260,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Stack spacing={isMobile ? 1 : 1.5} sx={{ flexGrow: 1, width: '100%' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
            <AccessTimeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: isMobile ? '1.1rem' : '1.2rem' }}>
              {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </Typography>
            {activeTimeEntry && (
              <Chip label="läuft" color="success" size="small" sx={{ ml: 0.5, fontSize: '0.75rem', height: 22 }} />
            )}
          </Stack>
          <Divider sx={{ my: isMobile ? 0.5 : 1 }} />
          <Stack spacing={2}>
            <TextField
              label="Projektnummer"
              placeholder="z.B. PRJ-001"
              fullWidth
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              disabled={!!activeTimeEntry}
              InputProps={{ startAdornment: <AssignmentIcon color="action" sx={{ mr: 0.5, fontSize: '1.1rem' }} /> }}
              sx={{ borderRadius: 2, fontSize: '0.95rem', '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' } }}
              InputLabelProps={{ style: { fontSize: '0.95rem' } }}
            />
            <TextField
              label="Projektname"
              placeholder="z.B. Website-Relaunch"
              fullWidth
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={!!activeTimeEntry}
              sx={{ borderRadius: 2, fontSize: '0.95rem', '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' } }}
              InputLabelProps={{ style: { fontSize: '0.95rem' } }}
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
              sx={{ borderRadius: 2, fontSize: '0.95rem', '& .MuiInputBase-input': { py: 1, fontSize: '0.95rem' } }}
              InputLabelProps={{ style: { fontSize: '0.95rem' } }}
            />
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: isMobile ? 0.5 : 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon fontSize="small" />}
              onClick={() => startTimeEntry.mutate()}
              disabled={!!activeTimeEntry || !projectNumber || !projectName}
              sx={{ minWidth: 80, borderRadius: 2, fontWeight: 600, fontSize: '0.95rem', py: 0.5 }}
            >
              Start
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon fontSize="small" />}
              onClick={() => stopTimeEntry.mutate()}
              disabled={!activeTimeEntry}
              sx={{ minWidth: 80, borderRadius: 2, fontWeight: 600, fontSize: '0.95rem', py: 0.5 }}
            >
              Stop
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Zeiterfassung; 