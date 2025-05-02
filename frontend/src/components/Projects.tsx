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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';

interface Client {
  _id: string;
  name: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  hourlyRate: number;
  startDate: string;
  endDate?: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  client: string;
  status: Project['status'];
  hourlyRate: number;
  startDate: string;
  endDate?: string;
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    client: '',
    status: 'active',
    hourlyRate: 0,
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  // Projekte abrufen
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Fehler beim Laden der Projekte');
      return response.json();
    },
  });

  // Kunden abrufen
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Fehler beim Laden der Kunden');
      return response.json();
    },
  });

  // Projekt erstellen/aktualisieren
  const saveProject = useMutation({
    mutationFn: async (projectData: ProjectFormData) => {
      const url = selectedProject
        ? `/api/projects/${selectedProject._id}`
        : '/api/projects';
      const method = selectedProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) throw new Error('Fehler beim Speichern des Projekts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Projekt löschen
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Fehler beim Löschen des Projekts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Status-Chip-Farbe
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'completed':
        return 'info.main';
      case 'on-hold':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  // Status-Text
  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Abgeschlossen';
      case 'on-hold':
        return 'Pausiert';
      default:
        return status;
    }
  };

  // Datum formatieren
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Betrag formatieren
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Filtere Projekte
  const filteredProjects = projects?.filter((project: Project) => {
    const matchesClient = !filterClient || project.client._id === filterClient;
    const matchesStatus = !filterStatus || project.status === filterStatus;
    return matchesClient && matchesStatus;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        client: project.client._id,
        status: project.status,
        hourlyRate: project.hourlyRate,
        startDate: new Date(project.startDate).toISOString().split('T')[0],
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setSelectedProject(null);
      setFormData({
        name: '',
        description: '',
        client: '',
        status: 'active',
        hourlyRate: 0,
        startDate: '',
        endDate: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      client: '',
      status: 'active',
      hourlyRate: 0,
      startDate: '',
      endDate: '',
    });
    setError('');
  };

  const handleFormChange = (
    field: keyof ProjectFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Projekte
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Neues Projekt
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Kunde filtern"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
            >
              <MenuItem value="">Alle Kunden</MenuItem>
              {clients?.map((client: Client) => (
                <MenuItem key={client._id} value={client._id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Status filtern"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">Alle Status</MenuItem>
              <MenuItem value="active">Aktiv</MenuItem>
              <MenuItem value="completed">Abgeschlossen</MenuItem>
              <MenuItem value="on-hold">Pausiert</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Kunde</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Startdatum</TableCell>
                <TableCell>Enddatum</TableCell>
                <TableCell align="right">Stundensatz</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((project: Project) => (
                  <TableRow key={project._id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.client.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(project.status)}
                        sx={{
                          backgroundColor: getStatusColor(project.status),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(project.startDate)}</TableCell>
                    <TableCell>
                      {project.endDate ? formatDate(project.endDate) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {formatAmount(project.hourlyRate)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(project)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteProject.mutate(project._id)}
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
          count={filteredProjects?.length || 0}
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
          {selectedProject ? 'Projekt bearbeiten' : 'Neues Projekt'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Kunde"
                  value={formData.client}
                  onChange={(e) => handleFormChange('client', e.target.value)}
                >
                  {clients?.map((client: Client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={(e) =>
                    handleFormChange('status', e.target.value as Project['status'])
                  }
                >
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                  <MenuItem value="on-hold">Pausiert</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stundensatz"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    handleFormChange('hourlyRate', parseFloat(e.target.value))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Startdatum"
                  value={formData.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Enddatum"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Beschreibung"
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
            onClick={() => saveProject.mutate(formData)}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects; 