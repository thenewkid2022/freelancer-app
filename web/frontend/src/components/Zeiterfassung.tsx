import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Fade,
  useScrollTrigger,
  Slide,
  AppBar,
  Toolbar,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL;

// Timer-Komponente
const Timer = ({ seconds, isRunning }: { seconds: number; isRunning: boolean }) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 2,
        px: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        position: 'relative',
        overflow: 'hidden',
        '&::after': isRunning ? {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, #4caf50 0%, #2196f3 100%)',
          animation: 'progress 1s linear infinite',
        } : {},
        '@keyframes progress': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}
    >
      <AccessTimeIcon color="primary" />
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 600,
          letterSpacing: 1,
          color: 'text.primary',
        }}
      >
        {`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`}
      </Typography>
      {isRunning && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'success.main',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.5)', opacity: 0.5 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        />
      )}
    </Box>
  );
};

// Hauptkomponente
const Zeiterfassung: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const [projectNumber, setProjectNumber] = useState('');
  const [description, setDescription] = useState('');
  const [activeTimeEntry, setActiveTimeEntry] = useState<{ id: string; startTime: string } | null>(null);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Scroll-Trigger für AppBar
  const trigger = useScrollTrigger();

  // Laufende Zeitmessung aus localStorage wiederherstellen
  useEffect(() => {
    // Prüfe, ob ein laufender Eintrag im localStorage existiert
    const runningEntry = localStorage.getItem('runningTimeEntry');
    if (runningEntry) {
      try {
        const parsed = JSON.parse(runningEntry);
        if (parsed.projectNumber) setProjectNumber(parsed.projectNumber);
        if (parsed.description) setDescription(parsed.description);
      } catch (e) {
        // Fehler ignorieren
      }
    }
  }, []);

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
      // Speichere laufenden Eintrag im localStorage
      localStorage.setItem('runningTimeEntry', JSON.stringify({
        projectNumber,
        description,
        startTime: data.startTime
      }));
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
      setDescription('');
      // Entferne laufenden Eintrag aus localStorage
      localStorage.removeItem('runningTimeEntry');
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  // Timer-Intervall immer korrekt clearen
  useEffect(() => {
    let localIntervalId: NodeJS.Timeout | null = null;
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
          const start = new Date(data.startTime).getTime();
          setTimer(Math.floor((Date.now() - start) / 1000));
          if (localIntervalId) clearInterval(localIntervalId);
          localIntervalId = setInterval(() => {
            setTimer((prev) => prev + 1);
          }, 1000);
          setIntervalId(localIntervalId);
        }
      }
    };
    fetchActiveEntry();
    return () => {
      if (localIntervalId) clearInterval(localIntervalId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Beim Starten der Zeiterfassung vorheriges Intervall clearen
  const handleStart = () => {
    if (intervalId) clearInterval(intervalId);
    startTimeEntry.mutate();
  };

  // Beim Stoppen der Zeiterfassung Intervall clearen
  const handleStop = () => {
    if (intervalId) clearInterval(intervalId);
    stopTimeEntry.mutate();
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
      }}
    >
      {/* Hauptinhalt */}
      <Stack
        spacing={3}
        sx={{
          width: '100%',
          maxWidth: { sm: 600 },
          mx: { xs: 0, sm: 'auto' },
          p: { xs: 1, sm: 2 },
          boxSizing: 'border-box',
        }}
      >
        {/* Timer */}
        <Box sx={{ mb: 2 }}>
          <Timer seconds={timer} isRunning={!!activeTimeEntry} />
        </Box>

        {/* Formular */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <TextField
              label={t('zeiterfassung.projectNumber')}
              placeholder={t('zeiterfassung.projectNumberPlaceholder')}
              fullWidth
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              disabled={!!activeTimeEntry}
              InputProps={{
                startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />,
                sx: { borderRadius: 2 }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                }
              }}
            />
            <TextField
              label={t('zeiterfassung.description')}
              placeholder={t('zeiterfassung.descriptionPlaceholder')}
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!!activeTimeEntry}
              InputProps={{ sx: { borderRadius: 2 } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                }
              }}
            />
          </Stack>
        </Paper>

        {/* Action-Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={!!activeTimeEntry || !projectNumber}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              minWidth: 120,
              boxShadow: 2,
            }}
          >
            {t('zeiterfassung.start')}
          </Button>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon />}
            onClick={handleStop}
            disabled={!activeTimeEntry}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              minWidth: 120,
              boxShadow: 2,
            }}
          >
            {t('zeiterfassung.stop')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Zeiterfassung; 