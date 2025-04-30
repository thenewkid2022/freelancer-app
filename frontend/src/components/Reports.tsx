import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReportData {
  timeEntries: {
    _id: string;
    project: {
      name: string;
      client: {
        name: string;
      };
    };
    startTime: string;
    endTime: string;
    duration: number;
    description: string;
  }[];
  totalHours: number;
  totalAmount: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [reportType, setReportType] = useState('time');
  const [error, setError] = useState('');

  // Kunden abrufen
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Fehler beim Laden der Kunden');
      return response.json();
    },
  });

  // Projekte abrufen
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte');
      return response.json();
    },
  });

  // Berichtsdaten abrufen
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', startDate, endDate, selectedClient, selectedProject, reportType],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        client: selectedClient,
        project: selectedProject,
        type: reportType,
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Fehler beim Laden des Berichts');
      return response.json();
    },
    enabled: Boolean(startDate && endDate),
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        client: selectedClient,
        project: selectedProject,
        type: reportType,
        format,
      });

      const response = await fetch(`/api/reports/export?${params}`);
      if (!response.ok) throw new Error('Fehler beim Exportieren des Berichts');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Fehler beim Exportieren des Berichts');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

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
        <Typography variant="h5" component="h1" gutterBottom>
          Berichte
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Filter */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Startdatum"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Enddatum"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Kunde</InputLabel>
                  <Select
                    value={selectedClient}
                    label="Kunde"
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <MenuItem value="">Alle Kunden</MenuItem>
                    {clients?.map((client: any) => (
                      <MenuItem key={client._id} value={client._id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Projekt</InputLabel>
                  <Select
                    value={selectedProject}
                    label="Projekt"
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <MenuItem value="">Alle Projekte</MenuItem>
                    {projects?.map((project: any) => (
                      <MenuItem key={project._id} value={project._id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Berichtstyp */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Berichtstyp</InputLabel>
              <Select
                value={reportType}
                label="Berichtstyp"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="time">Zeiterfassung</MenuItem>
                <MenuItem value="financial">Finanzen</MenuItem>
                <MenuItem value="project">Projektübersicht</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Export-Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={() => handleExport('pdf')}
                disabled={!reportData}
              >
                Als PDF exportieren
              </Button>
              <Button
                variant="contained"
                startIcon={<ExcelIcon />}
                onClick={() => handleExport('excel')}
                disabled={!reportData}
              >
                Als Excel exportieren
              </Button>
            </Box>
          </Grid>

          {/* Berichtsdaten */}
          {reportData && (
            <Grid item xs={12}>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Zusammenfassung
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gesamtstunden
                      </Typography>
                      <Typography variant="h6">
                        {formatDuration(reportData.totalHours)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gesamtbetrag
                      </Typography>
                      <Typography variant="h6">
                        {formatAmount(reportData.totalAmount)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Datum</TableCell>
                        <TableCell>Projekt</TableCell>
                        <TableCell>Kunde</TableCell>
                        <TableCell>Beschreibung</TableCell>
                        <TableCell align="right">Dauer</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.timeEntries.map((entry: any) => (
                        <TableRow key={entry._id}>
                          <TableCell>
                            {format(new Date(entry.startTime), 'dd.MM.yyyy', {
                              locale: de,
                            })}
                          </TableCell>
                          <TableCell>{entry.project.name}</TableCell>
                          <TableCell>{entry.project.client.name}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell align="right">
                            {formatDuration(entry.duration)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Reports; 