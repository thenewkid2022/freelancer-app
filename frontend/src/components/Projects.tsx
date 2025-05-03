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

interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
}

interface ProjectFormData {
  name: string;
  description: string;
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
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
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
                <TableCell>Startdatum</TableCell>
                <TableCell>Enddatum</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((project: Project) => (
                  <TableRow key={project._id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.startDate}</TableCell>
                    <TableCell>
                      {project.endDate ? project.endDate : '-'}
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
          count={projects?.length || 0}
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
                  fullWidth
                  label="Beschreibung"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            type="submit"
            variant="contained"
            onClick={() => saveProject.mutate(formData)}
            disabled={!formData.name}
          >
            {selectedProject ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects; 