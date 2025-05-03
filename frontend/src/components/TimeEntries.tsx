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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
}

interface TimeEntryFormData {
  project: string;
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
    project: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [error, setError] = useState('');

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
      
      const response: AxiosResponse<TimeEntry> = await apiClient[method](url, entryData);
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
        project: entry.project?._id || '',
        startTime: new Date(entry.startTime).toISOString().slice(0, 16),
        endTime: new Date(entry.endTime).toISOString().slice(0, 16),
        description: entry.description,
      });
    } else {
      setSelectedEntry(null);
      setFormData({
        project: '',
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
      project: '',
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Zeiteinträge
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Projekt</TableCell>
                <TableCell>Startzeit</TableCell>
                <TableCell>Endzeit</TableCell>
                <TableCell align="right">Dauer</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {abgeschlosseneEintraege
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry: TimeEntry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      {entry.project?.name || entry.projectName || entry.projectNumber || 'Kein Projekt'}
                    </TableCell>
                    <TableCell>{formatDateTime(entry.startTime)}</TableCell>
                    <TableCell>{formatDateTime(entry.endTime)}</TableCell>
                    <TableCell align="right">{formatDuration(entry.duration)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(entry)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteTimeEntry.mutate(entry._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={abgeschlosseneEintraege.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Einträge pro Seite"
        />
      </Paper>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Zeiteintrag bearbeiten
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Projekt"
                  id="dialog-project"
                  value={formData.project}
                  onChange={(e) => handleFormChange('project', e.target.value)}
                >
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Startzeit"
                  id="dialog-starttime"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
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
                  onChange={(e) =>
                    handleFormChange('description', e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => saveTimeEntry.mutate(formData)}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TimeEntries; 