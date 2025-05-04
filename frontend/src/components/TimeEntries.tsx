import React, { useState } from 'react';
import {
  Container,
  Paper,
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
  MenuItem,
  Alert,
  CircularProgress,
  TablePagination,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api/client';
import { AxiosResponse } from 'axios';

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
  const { user } = useAuth();
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

  // Formatierung des Datums
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  // Nur abgeschlossene Zeiteinträge anzeigen
  const abgeschlosseneEintraege = Array.isArray(timeEntries)
    ? timeEntries.filter(entry => entry.endTime && !isNaN(new Date(entry.endTime).getTime()))
    : [];

  const handleAdjustmentDialogOpen = () => {
    setIsAdjustmentDialogOpen(true);
  };

  const handleAdjustmentDialogClose = () => {
    setIsAdjustmentDialogOpen(false);
  };

  const handleAdjustmentDataChange = (field: keyof typeof adjustmentData, value: string | number) => {
    setAdjustmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdjustmentSubmit = async () => {
    try {
      // Berechnung des Tagessolls und Verteilung der Differenz
      const workStartDate = new Date(adjustmentData.workStart);
      const workEndDate = new Date(adjustmentData.workEnd);
      const totalBreakMinutes = adjustmentData.lunchBreak + adjustmentData.otherBreaks;
      const workDurationMinutes = (workEndDate.getTime() - workStartDate.getTime()) / (1000 * 60) - totalBreakMinutes;
      const targetHours = workDurationMinutes / 60;
      const totalCurrentHours = abgeschlosseneEintraege.reduce((sum, entry) => sum + entry.duration / 3600, 0);
      const difference = targetHours - totalCurrentHours;

      // Verteilung der Differenz proportional auf die Einträge und Speichern im Backend
      const updatePromises = abgeschlosseneEintraege.map(async entry => {
        const proportion = entry.duration / (totalCurrentHours * 3600);
        const correction = difference * proportion;
        const correctedDuration = entry.duration + correction * 3600;

        try {
          await apiClient.put(`/time-entries/${entry._id}`, {
            ...entry,
            correctedDuration
          });
        } catch (error) {
          console.error(`Fehler beim Aktualisieren des Zeiteintrags ${entry._id}:`, error);
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
      const entry = abgeschlosseneEintraege.find(e => e._id === entryId);
      if (entry) {
        await apiClient.put(`/time-entries/${entryId}`, {
          ...entry,
          correctedDuration: undefined
        });
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      }
    } catch (error) {
      setError('Fehler beim Zurücksetzen der korrigierten Zeit');
      console.error('Fehler beim Undo:', error);
    }
  };

  const renderMobileView = () => (
    <Stack spacing={2}>
      {abgeschlosseneEintraege
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((entry: TimeEntry) => (
          <Card 
            key={entry._id}
            elevation={0}
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 1,
                transition: 'box-shadow 0.2s'
              }
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={entry.project?.name || entry.projectName || entry.projectNumber || 'Kein Projekt'}
                    size="small"
                    sx={{ borderRadius: 1 }}
                  />
                  <Stack direction="row" spacing={1}>
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
                    {entry.correctedDuration && (
                      <IconButton
                        size="small"
                        onClick={() => handleUndoAdjustment(entry._id)}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'warning.light',
                            color: 'warning.contrastText'
                          }
                        }}
                      >
                        <UndoIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Start: {formatDateTime(entry.startTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Ende: {formatDateTime(entry.endTime)}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={formatDuration(entry.duration)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                </Box>

                {entry.description && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <DescriptionIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                    <Typography variant="body2">
                      {entry.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
    </Stack>
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
                <TableCell align="right" sx={{ fontWeight: 600 }}>Dauer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Beschreibung</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {abgeschlosseneEintraege
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
                          {formatDateTime(entry.startTime)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDateTime(entry.endTime)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatDuration(entry.duration)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                      {entry.correctedDuration && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Korrigiert: {formatDuration(entry.correctedDuration)}
                        </Typography>
                      )}
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
                        {entry.correctedDuration && (
                          <IconButton
                            size="small"
                            onClick={() => handleUndoAdjustment(entry._id)}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'warning.light',
                                color: 'warning.contrastText'
                              }
                            }}
                          >
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        )}
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Zeiteinträge
          </Typography>
          <Button
            variant="contained"
            onClick={handleAdjustmentDialogOpen}
            sx={{ borderRadius: 2 }}
          >
            Tagesausgleich
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {isMobile ? renderMobileView() : renderDesktopView()}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={abgeschlosseneEintraege.length}
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
      </Stack>

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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
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
                  type="datetime-local"
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
    </Container>
  );
};

export default TimeEntries; 