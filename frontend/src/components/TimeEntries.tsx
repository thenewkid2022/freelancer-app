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

  // Zeiteinträge abrufen
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get('/time-entries');
    },
  });
  console.log('Geladene timeEntries:', timeEntries);

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

  // Formatierung der Dauer
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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

  // Swipe Actions für mobile Ansicht
  const leadingActions = (entry: TimeEntry) => (
    <LeadingActions>
      <SwipeAction onClick={() => handleOpenDialog(entry)}>
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 2, bgcolor: 'primary.main', color: '#fff', justifyContent: 'flex-end' }}>
          <EditIcon /> Bearbeiten
        </Box>
      </SwipeAction>
    </LeadingActions>
  );

  const trailingActions = (entry: TimeEntry) => (
    <TrailingActions>
      <SwipeAction destructive onClick={() => deleteTimeEntry.mutate(entry._id)}>
        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, bgcolor: 'error.main', color: '#fff' }}>
          <DeleteIcon /> Löschen
        </Box>
      </SwipeAction>
    </TrailingActions>
  );

  const renderMobileView = () => (
    <SwipeableList type={ListType.IOS}>
      {eintraegeFuerTag
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((entry: TimeEntry) => (
          <SwipeableListItem
            key={entry._id}
            leadingActions={leadingActions(entry)}
            trailingActions={trailingActions(entry)}
          >
            <Box sx={{ width: '100%' }}>
              <Card 
                elevation={1}
                sx={{ 
                  width: '100%',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  p: 1.2,
                  mb: 0.5,
                  '@media (max-width: 600px)': {
                    p: 0.7,
                    mb: 0.7,
                  },
                }}
              >
                <CardContent sx={{ p: '8px !important', '&:last-child': { pb: '8px' } }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '1rem', flex: 1, pr: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.project?.name || entry.projectName || entry.projectNumber || 'Kein Projekt'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 'auto', alignItems: 'flex-end', gap: 0.3 }}>
                        <Chip label={formatDuration(entry.duration)} size="small" color="primary" sx={{ fontSize: '0.8rem', height: 22, minWidth: 64, textAlign: 'center' }} />
                        {entry.correctedDuration && entry.correctedDuration !== entry.duration && (
                          <Chip label={formatDuration(entry.correctedDuration)} size="small" color="warning" sx={{ fontSize: '0.8rem', height: 22, minWidth: 64, textAlign: 'center' }} title="Korrigierte Zeit durch Tagesausgleich" />
                        )}
                      </Box>
                    </Box>
                    {entry.description && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
                        <DescriptionIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {entry.description}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </SwipeableListItem>
        ))}
    </SwipeableList>
  );

  const renderDesktopView = () => (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Projekt</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Startzeit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Endzeit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 110 }}>Dauer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beschreibung</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eintraegeFuerTag
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry: TimeEntry) => (
                  <TableRow 
                    key={entry._id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        transition: 'background-color 0.2s'
                      }
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={entry.project?.name || entry.projectName || entry.projectNumber || 'Kein Projekt'}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatTime(entry.startTime)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatTime(entry.endTime)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 110 }}>
                        <Chip
                          label={formatDuration(entry.duration)}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ borderRadius: 1, mb: entry.correctedDuration && entry.correctedDuration !== entry.duration ? 0.5 : 0, minWidth: 64, textAlign: 'center' }}
                        />
                        {entry.correctedDuration && entry.correctedDuration !== entry.duration && (
                          <Chip
                            label={formatDuration(entry.correctedDuration)}
                            size="small"
                            color="warning"
                            variant="filled"
                            sx={{ borderRadius: 1, minWidth: 64, textAlign: 'center' }}
                            title="Korrigierte Zeit durch Tagesausgleich"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <DescriptionIcon fontSize="small" color="action" />
                        <Typography variant="body2" noWrap>
                          {entry.description}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(entry)}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteTimeEntry.mutate(entry._id)}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

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
      </Box>

      {/* Buttons für Tagesausgleich und Rückgängig */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAdjustmentDialogOpen}
          sx={{ borderRadius: 3, fontWeight: 600, px: 4 }}
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
            sx={{ borderRadius: 3, fontWeight: 600, px: 4 }}
          >
            Zurücksetzen
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        <>
          {renderMobileView()}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={eintraegeFuerTag.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Einträge pro Seite"
            sx={{ 
              borderTop: '1px solid', 
              borderColor: 'divider',
              '.MuiTablePagination-select': {
                borderRadius: 1
              }
            }}
          />
        </>
      ) : (
        <>
          {renderDesktopView()}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={eintraegeFuerTag.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Einträge pro Seite"
            sx={{ 
              borderTop: '1px solid', 
              borderColor: 'divider',
              '.MuiTablePagination-select': {
                borderRadius: 1
              }
            }}
          />
        </>
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