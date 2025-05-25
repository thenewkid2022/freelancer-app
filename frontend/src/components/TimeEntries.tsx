import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  TablePagination,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Chip,
  DialogContentText,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';
import { AxiosResponse } from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { SwipeableList, SwipeableListItem, Type as ListType, LeadingActions, TrailingActions, SwipeAction } from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { format } from 'date-fns';

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
  project?: Project;
  projectName?: string;
  projectNumber?: string;
  duration: number;
  startTime: string;
  endTime: string;
  description: string;
  correctedDuration?: number;
}

interface TimeEntryFormData {
  startTime: string;
  endTime: string;
  description: string;
}

interface MergedEntry {
  project: { _id: string };
  projectNumber?: string;
  date: string;
  totalDuration: number;
  comments: string[];
  entryIds: string[];
  startTime?: string;
  endTime?: string;
  hasCorrectedDuration: boolean;
  correctedDuration?: number;
}

// Hilfsfunktion für die Dauer-Formatierung
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  } else {
    return '0min';
  }
}

const TimeEntries: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    startTime: '',
    endTime: '',
    description: '',
  });
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    workStart: '',
    workEnd: '',
    lunchBreak: 0,
    otherBreaks: 0
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeDifference, setTimeDifference] = useState<number | null>(null);
  const [roundedDifference, setRoundedDifference] = useState<number | null>(null);
  const [adjustedEntries, setAdjustedEntries] = useState<Array<{id: string, duration: number}>>([]);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [expandedMergeId, setExpandedMergeId] = useState<string | null>(null);

  // Zeiteinträge abrufen
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get('/time-entries');
    },
  }) as { data: TimeEntry[]; isLoading: boolean };
  console.log('Geladene timeEntries:', timeEntries);

  // --- NEU: Zusammengeführte Zeiteinträge für den gewählten Tag ---
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const { data: mergedEntries = [], isLoading: isLoadingMerged } = useQuery({
    queryKey: ['mergedTimeEntries', selectedDateStr],
    queryFn: async () => {
      if (!selectedDateStr) return [];
      return await apiClient.get<MergedEntry[]>('/time-entries/merged', {
        params: { startDate: selectedDateStr, endDate: selectedDateStr },
      });
    },
    enabled: !!selectedDateStr,
  });

  // Zeiteintrag erstellen/aktualisieren
  const saveTimeEntry = useMutation({
    mutationFn: async (entryData: TimeEntryFormData) => {
      const url = selectedEntry
        ? `/time-entries/${selectedEntry._id}`
        : '/time-entries';
      const method = selectedEntry ? 'put' : 'post';
      
      // Zeitfelder korrekt umwandeln
      const payload = {
        ...entryData,
        startTime: new Date(entryData.startTime).toISOString(),
        endTime: new Date(entryData.endTime).toISOString(),
      };

      const response: AxiosResponse<TimeEntry> = await apiClient[method](url, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Zeiteintrag löschen
  const deleteTimeEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const response: AxiosResponse<TimeEntry> = await apiClient.delete(`/time-entries/${entryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Formatierung des Datums in Schweizer Zeit
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Zurich',
    });
  };

  // Hilfsfunktion für Uhrzeit
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (entry?: TimeEntry) => {
    if (entry) {
      setSelectedEntry(entry);
      setFormData({
        startTime: new Date(entry.startTime).toISOString().slice(0, 16),
        endTime: new Date(entry.endTime).toISOString().slice(0, 16),
        description: entry.description,
      });
    } else {
      setSelectedEntry(null);
      setFormData({
        startTime: '',
        endTime: '',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEntry(null);
    setFormData({
      startTime: '',
      endTime: '',
      description: '',
    });
    setError('');
  };

  const handleFormChange = (field: keyof TimeEntryFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Memoize abgeschlosseneEintraege
  const abgeschlosseneEintraege = useMemo(() => 
    Array.isArray(timeEntries)
      ? timeEntries.filter(entry => entry.endTime && !isNaN(new Date(entry.endTime).getTime()))
      : [],
    [timeEntries]
  );

  // Filtere Einträge für den gewählten Tag (nicht nur im Tagesausgleich, sondern für die Hauptansicht)
  const eintraegeFuerTag = useMemo(() => abgeschlosseneEintraege.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return (
      selectedDate &&
      entryDate.getFullYear() === selectedDate.getFullYear() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getDate() === selectedDate.getDate()
    );
  }), [abgeschlosseneEintraege, selectedDate]);

  const handleAdjustmentDialogOpen = () => {
    setIsAdjustmentDialogOpen(true);
  };

  const handleAdjustmentDialogClose = () => {
    setIsAdjustmentDialogOpen(false);
  };

  const handleAdjustmentDataChange = (field: keyof typeof adjustmentData, value: string | number) => {
    setAdjustmentData(prev => ({ ...prev, [field]: value }));
  };

  // Berechne die effektive Arbeitszeit und verteile sie proportional
  const calculateTimeDifference = useCallback(() => {
    if (!selectedDate || !adjustmentData.workStart || !adjustmentData.workEnd) {
      setTimeDifference(null);
      setRoundedDifference(null);
      setAdjustedEntries([]);
      return;
    }

    // Erstelle neue Date-Objekte basierend auf dem ausgewählten Datum
    const workStartDate = new Date(selectedDate.getTime());
    const [startHours, startMinutes] = adjustmentData.workStart.split(':').map(Number);
    workStartDate.setHours(startHours, startMinutes, 0, 0);

    const workEndDate = new Date(selectedDate.getTime());
    const [endHours, endMinutes] = adjustmentData.workEnd.split(':').map(Number);
    workEndDate.setHours(endHours, endMinutes, 0, 0);

    // Berechne die effektive Arbeitszeit
    const totalBreakMinutes = adjustmentData.lunchBreak + adjustmentData.otherBreaks;
    const workDurationMinutes = (workEndDate.getTime() - workStartDate.getTime()) / (1000 * 60) - totalBreakMinutes;
    const effectiveHours = workDurationMinutes / 60;

    // Filtere Einträge für den ausgewählten Tag
    const eintraegeFuerTag = abgeschlosseneEintraege.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return (
        selectedDate &&
        entryDate.getFullYear() === selectedDate.getFullYear() &&
        entryDate.getMonth() === selectedDate.getMonth() &&
        entryDate.getDate() === selectedDate.getDate()
      );
    });

    // Berechne die aktuelle Gesamtzeit
    const totalCurrentHours = eintraegeFuerTag.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    const difference = effectiveHours - totalCurrentHours;
    setTimeDifference(difference);

    // Verteile die effektive Zeit proportional auf die Einträge
    const adjustedEntries = eintraegeFuerTag.map(entry => {
      const proportion = entry.duration / (totalCurrentHours * 3600);
      const adjustedDuration = effectiveHours * proportion * 3600;
      return {
        id: entry._id,
        originalDuration: entry.duration,
        unrounded: adjustedDuration,
        duration: adjustedDuration // wird gleich gerundet
      };
    });

    // Runde jeden Eintrag auf 0,25h
    const roundedEntries = adjustedEntries.map(entry => ({
      ...entry,
      duration: Math.round(entry.duration / (0.25 * 3600)) * (0.25 * 3600)
    }));

    // Berechne die Differenz nach der Rundung
    let roundedTotal = roundedEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    let roundedDiff = effectiveHours - roundedTotal;

    // Korrektur: Verteile die Differenz in 0,25h-Schritten auf die größten Einträge
    if (Math.abs(roundedDiff) >= 0.01) {
      // Sortiere nach ungerundeter Zielzeit (absteigend)
      const sorted = [...roundedEntries].sort((a, b) => b.unrounded - a.unrounded);
      let diffSteps = Math.round(Math.abs(roundedDiff) / 0.25);
      let stepValue = 0.25 * 3600 * (roundedDiff > 0 ? 1 : -1);
      let i = 0;
      while (diffSteps > 0) {
        // Passe nur an, wenn das Ergebnis >= 0 bleibt
        if (sorted[i].duration + stepValue >= 0) {
          sorted[i].duration += stepValue;
          diffSteps--;
        }
        i = (i + 1) % sorted.length;
      }
      // Neue Summe und Differenz berechnen
      roundedTotal = sorted.reduce((sum, entry) => sum + entry.duration / 3600, 0);
      roundedDiff = effectiveHours - roundedTotal;
      setAdjustedEntries(sorted.map(({id, duration}) => ({id, duration})));
    } else {
      setAdjustedEntries(roundedEntries.map(({id, duration}) => ({id, duration})));
    }
    setRoundedDifference(roundedDiff);
  }, [selectedDate, adjustmentData, abgeschlosseneEintraege]);

  // Aktualisiere die Berechnung bei Änderungen
  useEffect(() => {
    calculateTimeDifference();
  }, [calculateTimeDifference]);

  const handleAdjustmentSubmit = async () => {
    try {
      if (!selectedDate) {
        setError('Bitte wählen Sie ein Datum aus');
        return;
      }

      if (!adjustmentData.workStart || !adjustmentData.workEnd) {
        setError('Bitte geben Sie Arbeitsbeginn und Arbeitsende ein');
        return;
      }

      // Überprüfe, ob der User die Differenz akzeptiert
      if (roundedDifference !== null && Math.abs(roundedDifference) > 0.01) {
        const confirmMessage = roundedDifference > 0
          ? `Nach der Rundung fehlen noch ${roundedDifference.toFixed(2)}h. Möchten Sie fortfahren?`
          : `Nach der Rundung sind ${Math.abs(roundedDifference).toFixed(2)}h zu viel. Möchten Sie fortfahren?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      // Speichere die angepassten Einträge
      const updatePromises = adjustedEntries.map(async entry => {
        try {
          await apiClient.put(`/time-entries/${entry.id}`, {
            correctedDuration: entry.duration
          });
        } catch (error) {
          console.error(`Fehler beim Aktualisieren des Zeiteintrags ${entry.id}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      handleAdjustmentDialogClose();
    } catch (error) {
      setError('Fehler beim Speichern der korrigierten Zeiten');
      console.error('Fehler beim Tagesausgleich:', error);
    }
  };

  const handleUndoAdjustment = async (entryId: string) => {
    try {
      await apiClient.put(`/time-entries/${entryId}`, {
        correctedDuration: null
      });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    } catch (error) {
      setError('Fehler beim Rückgängig-Machen des Tagesausgleichs');
      console.error('Fehler beim Undo:', error);
    }
  };

  // Prüfe, ob für den Tag Korrekturen vorliegen
  const hasCorrectionsForDay = eintraegeFuerTag.some(entry => entry.correctedDuration && entry.correctedDuration !== entry.duration);

  // Undo für den ganzen Tag
  const handleUndoAllAdjustments = async () => {
    setIsUndoDialogOpen(false);
    try {
      const undoPromises = eintraegeFuerTag
        .filter(entry => entry.correctedDuration && entry.correctedDuration !== entry.duration)
        .map(entry =>
          apiClient.put(`/time-entries/${entry._id}`, { correctedDuration: null })
        );
      await Promise.all(undoPromises);
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    } catch (error) {
      setError('Fehler beim Rückgängig-Machen des Tagesausgleichs');
      console.error('Fehler beim Undo:', error);
    }
  };

  // Hilfsfunktion: Render Card für einen Merge-Eintrag
  const renderMergeCard = (entry: MergedEntry) => {
    const isExpanded = expandedMergeId === entry.projectNumber + entry.date;
    const commentsText = entry.comments.filter(Boolean).join(' | ');
    const maxChars = 120;
    const shouldTruncate = commentsText.length > maxChars;

    // Dauer aus den zugehörigen Einträgen berechnen (wie früher)
    const entriesForMerge = timeEntries.filter(e => entry.entryIds.includes(e._id));
    const totalDuration = entriesForMerge.reduce((sum, e) => sum + (e.correctedDuration ?? e.duration ?? 0), 0);

    return (
      <Card
        elevation={3}
        sx={{
          width: '100%',
          borderRadius: 3,
          boxShadow: 2,
          p: 2,
          mb: 2,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
        key={entry.projectNumber + entry.date}
      >
        {/* Header: Projekt + Zeitspanne */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Chip
            label={entry.projectNumber || 'Kein Projekt'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '1rem' }}
          />
          <Typography variant="body2" color="text.secondary">
            {entry.startTime ? formatTime(entry.startTime) : '-'} – {entry.endTime ? formatTime(entry.endTime) : '-'}
          </Typography>
        </Box>

        {/* Body: Kommentare */}
        {commentsText && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <DescriptionIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
            <Typography
              variant="body2"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: isExpanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                fontSize: '1rem',
                flex: 1,
              }}
            >
              {commentsText}
            </Typography>
            {shouldTruncate && (
              <Button
                size="small"
                onClick={() => setExpandedMergeId(isExpanded ? null : entry.projectNumber + entry.date)}
                sx={{ minWidth: 0, ml: 1 }}
              >
                {isExpanded ? 'Weniger' : 'Mehr'}
              </Button>
            )}
          </Box>
        )}

        {/* Footer: Dauer + Aktionen */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" color="primary" />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {formatDuration(totalDuration)}
            </Typography>
            {entriesForMerge.some(e => e.correctedDuration && e.correctedDuration !== e.duration) && (
              <Chip label="korrigiert" size="small" color="warning" sx={{ ml: 1 }} />
            )}
          </Box>
          <Box>
            <IconButton size="small" onClick={() => {
              const entryId = entry.entryIds[0];
              const found = timeEntries.find((e: any) => e._id === entryId);
              if (handleOpenDialog && found) handleOpenDialog(found);
            }}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => deleteTimeEntry.mutate && deleteTimeEntry.mutate(entry.entryIds[0])}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
    );
  };

  // Laufende Zeitmessung im localStorage persistieren
  useEffect(() => {
    // Beim Laden prüfen, ob eine laufende Zeitmessung existiert
    const runningEntry = localStorage.getItem('runningTimeEntry');
    if (runningEntry) {
      const parsed = JSON.parse(runningEntry);
      setFormData({
        startTime: parsed.startTime,
        endTime: '',
        description: parsed.description || '',
      });
    }
  }, []);

  const handleStartTimeEntry = (projectNumber: string, description: string) => {
    const startTime = new Date().toISOString();
    setFormData({ startTime, endTime: '', description });
    localStorage.setItem('runningTimeEntry', JSON.stringify({
      projectNumber,
      description,
      startTime
    }));
  };

  const handleStopTimeEntry = () => {
    const endTime = new Date().toISOString();
    setFormData((prev) => ({ ...prev, endTime }));
    localStorage.removeItem('runningTimeEntry');
    // Hier ggf. saveTimeEntry.mutate() aufrufen
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack 
      spacing={3} 
      sx={{ 
        width: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        pb: isMobile ? 2 : 0
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          mb: 2, 
          mt: { xs: 2, sm: 3 },
          pt: 3
        }}
      >
        <DatePicker
          label="Tag auswählen"
          value={selectedDate}
          onChange={setSelectedDate}
          slotProps={{ textField: { fullWidth: false, sx: { minWidth: 180 } } }}
        />
        <Button
          variant="outlined"
          size="small"
          sx={{ ml: 2, height: 40 }}
          onClick={() => setSelectedDate(new Date())}
          disabled={!!selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString()}
        >
          Heute
        </Button>
      </Box>

      {/* Buttons für Tagesausgleich und Rückgängig */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAdjustmentDialogOpen}
          sx={{ borderRadius: 3, fontWeight: 600, px: 4, minWidth: 160 }}
        >
          Tagesausgleich
        </Button>
        {hasCorrectionsForDay && (
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<UndoIcon />}
            onClick={() => setIsUndoDialogOpen(true)}
            sx={{ borderRadius: 3, fontWeight: 600, px: 4, minWidth: 160 }}
          >
            Zurücksetzen
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Gemergte Zeiteinträge Tabelle */}
      {isMobile ? (
        <Stack spacing={1.5} sx={{ width: '100%', mb: 2 }}>
          {mergedEntries.length === 0 ? (
            <Typography color="text.secondary" align="center">Keine Zeiteinträge für diesen Tag.</Typography>
          ) : (
            mergedEntries.map(renderMergeCard)
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mergedEntries.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Einträge pro Seite"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 1,
              '.MuiTablePagination-select': { borderRadius: 1 },
              '.MuiTablePagination-toolbar': { justifyContent: 'flex-end' },
              background: 'transparent',
            }}
          />
        </Stack>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 3, p: { xs: 1, sm: 2 }, mb: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.07)', overflowX: 'auto', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 32px 0 rgba(0,0,0,0.10)' } }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default', borderTopLeftRadius: 12 }}>Projekt</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default' }}>Startzeit</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default' }}>Endzeit</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default' }}>Dauer</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default' }}>Beschreibung</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: 'background.default', borderTopRightRadius: 12 }}>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedEntries.map((entry) => (
                  <TableRow key={`${entry.projectNumber || 'kein-projekt'}-${entry.date}`}
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover', transition: 'background-color 0.2s' },
                      borderRadius: 2
                    }}
                  >
                    <TableCell>
                      <Box sx={{
                        bgcolor: 'info.main',
                        color: 'info.contrastText',
                        borderRadius: 2,
                        minWidth: 48,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}>
                        {entry.projectNumber || 'Kein Projekt'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <span>{entry.startTime ? formatTime(entry.startTime) : '-'}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <span>{entry.endTime ? formatTime(entry.endTime) : '-'}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        minWidth: 60,
                        display: 'inline-block',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textAlign: 'center',
                      }}>
                        {formatDuration(entry.totalDuration)}
                      </Box>
                      {entry.correctedDuration && entry.correctedDuration !== entry.totalDuration && (
                        <Chip label={formatDuration(entry.correctedDuration)} size="small" color="warning" sx={{ ml: 1, fontSize: '0.8rem', height: 22, minWidth: 64, textAlign: 'center' }} title="Korrigierte Zeit durch Tagesausgleich" />
                      )}
                      {entry.hasCorrectedDuration && !entry.correctedDuration && (
                        <Chip label="korrigiert" size="small" color="warning" sx={{ ml: 1, fontSize: '0.8rem', height: 22, minWidth: 64, textAlign: 'center' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DescriptionIcon fontSize="small" color="action" />
                        <span>{entry.comments.filter(c => !!c && c !== '0').join(' | ')}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={() => {
                          const entryId = entry.entryIds[0];
                          const found = timeEntries.find((e: any) => e._id === entryId);
                          if (handleOpenDialog && found) handleOpenDialog(found);
                        }} sx={{ '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText' }, transition: 'background 0.2s' }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteTimeEntry.mutate && deleteTimeEntry.mutate(entry.entryIds[0])} sx={{ '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' }, transition: 'background 0.2s' }}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mergedEntries.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Einträge pro Seite"
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 1,
              '.MuiTablePagination-select': { borderRadius: 1 },
              '.MuiTablePagination-toolbar': { justifyContent: 'flex-end' },
              background: 'transparent',
            }}
          />
        </Paper>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Zeiteintrag bearbeiten
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Startzeit"
                  id="dialog-starttime"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Endzeit"
                  id="dialog-endtime"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Beschreibung"
                  id="dialog-description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ borderRadius: 2 }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={() => saveTimeEntry.mutate(formData)}
            sx={{ borderRadius: 2 }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAdjustmentDialogOpen}
        onClose={handleAdjustmentDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Tagesausgleich
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  label="Tag auswählen"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Arbeitsbeginn"
                  value={adjustmentData.workStart}
                  onChange={(e) => handleAdjustmentDataChange('workStart', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Arbeitsende"
                  value={adjustmentData.workEnd}
                  onChange={(e) => handleAdjustmentDataChange('workEnd', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Mittagspause (Minuten)"
                  value={adjustmentData.lunchBreak}
                  onChange={(e) => handleAdjustmentDataChange('lunchBreak', parseInt(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weitere Pausen (Minuten)"
                  value={adjustmentData.otherBreaks}
                  onChange={(e) => handleAdjustmentDataChange('otherBreaks', parseInt(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              {timeDifference !== null && (
                <Grid item xs={12}>
                  <Alert 
                    severity={Math.abs(timeDifference) < 0.01 ? "success" : "info"}
                    sx={{ borderRadius: 2 }}
                  >
                    {Math.abs(timeDifference) < 0.01 ? (
                      "Die Zeiterfassung ist bereits ausgeglichen."
                    ) : timeDifference > 0 ? (
                      `Es fehlen noch ${timeDifference.toFixed(2)}h zum Tagessoll.`
                    ) : (
                      `Du hast ${Math.abs(timeDifference).toFixed(2)}h zu viel erfasst.`
                    )}
                  </Alert>
                </Grid>
              )}
              {roundedDifference !== null && Math.abs(roundedDifference) > 0.01 && (
                <Grid item xs={12}>
                  <Alert 
                    severity="warning"
                    sx={{ borderRadius: 2 }}
                  >
                    {roundedDifference > 0 ? (
                      `Nach der Rundung auf 0,25h fehlen noch ${roundedDifference.toFixed(2)}h.`
                    ) : (
                      `Nach der Rundung auf 0,25h sind ${Math.abs(roundedDifference).toFixed(2)}h zu viel.`
                    )}
                    <br />
                    Sie können die Differenz manuell anpassen oder die Änderungen übernehmen.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleAdjustmentDialogClose}
            sx={{ borderRadius: 2 }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleAdjustmentSubmit}
            sx={{ borderRadius: 2 }}
          >
            Ausgleichen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isUndoDialogOpen}
        onClose={() => setIsUndoDialogOpen(false)}
      >
        <DialogTitle>Tagesausgleich rückgängig machen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie wirklich alle Korrekturen für diesen Tag entfernen?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUndoDialogOpen(false)}>Abbrechen</Button>
          <Button color="warning" variant="contained" onClick={handleUndoAllAdjustments}>
            Ja, Korrekturen entfernen
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default TimeEntries; 