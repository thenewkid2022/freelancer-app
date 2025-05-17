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

// Info-Banner Komponente
const InfoBanner = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Fade in={open}>
    <Paper
      sx={{
        position: 'fixed',
        top: { xs: 'calc(56px + env(safe-area-inset-top, 0px))', sm: 'calc(64px + env(safe-area-inset-top, 0px))' },
        left: 0,
        right: 0,
        zIndex: 1200,
        p: 2,
        mx: 2,
        mt: 2,
        borderRadius: 2,
        bgcolor: 'info.light',
        color: 'info.contrastText',
        boxShadow: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <InfoIcon />
        <Typography variant="body2" sx={{ flex: 1 }}>
          Erfasse deine täglichen Projektzeiten. Führe am Ende des Tages einen Tagesausgleich durch.
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  </Fade>
);

// Hauptkomponente
const Zeiterfassung: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const [showInfo, setShowInfo] = useState(true);
  const [projectNumber, setProjectNumber] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTimeEntry, setActiveTimeEntry] = useState<{ id: string; startTime: string } | null>(null);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll-Trigger für AppBar
  const trigger = useScrollTrigger();

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

  // Aktiven Eintrag beim Laden abrufen
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
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Info Banner */}
      <InfoBanner open={showInfo} onClose={() => setShowInfo(false)} />

      {/* Timer Section */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 'calc(56px + env(safe-area-inset-top, 0px))', sm: 'calc(64px + env(safe-area-inset-top, 0px))' },
          zIndex: 1000,
          p: 2,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <Timer seconds={timer} isRunning={!!activeTimeEntry} />
      </Box>

      {/* Form Section */}
      <Box
        ref={formRef}
        sx={{
          flex: 1,
          p: 2,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={3}>
              <TextField
                label="Projektnummer"
                placeholder="z.B. PRJ-001"
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
                label="Projektname"
                placeholder="z.B. Website-Relaunch"
                fullWidth
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={!!activeTimeEntry}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                  }
                }}
              />
              <TextField
                label="Beschreibung"
                placeholder="Kurze Beschreibung der Tätigkeit"
                fullWidth
                multiline
                minRows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!!activeTimeEntry}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                  }
                }}
              />
            </Stack>
          </Paper>

          {/* Action Buttons */}
          <Box
            sx={{
              position: 'sticky',
              bottom: { xs: 'calc(56px + var(--safe-area-bottom, 0px))', sm: 0 },
              left: 0,
              right: 0,
              p: 2,
              bgcolor: 'background.default',
              borderTop: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1000,
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => startTimeEntry.mutate()}
                disabled={!!activeTimeEntry || !projectNumber || !projectName}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                Start
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<StopIcon />}
                onClick={() => stopTimeEntry.mutate()}
                disabled={!activeTimeEntry}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  minWidth: 120,
                }}
              >
                Stop
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Zeiterfassung; 