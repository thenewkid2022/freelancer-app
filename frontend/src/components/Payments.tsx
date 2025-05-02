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

interface Project {
  _id: string;
  name: string;
  client: {
    _id: string;
    name: string;
  };
}

interface Payment {
  _id: string;
  project: Project;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidAt?: string;
}

interface PaymentFormData {
  project: string;
  amount: number;
  dueDate: string;
  description: string;
}

const Payments: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState<PaymentFormData>({
    project: '',
    amount: 0,
    dueDate: '',
    description: '',
  });
  const [error, setError] = useState('');

  // Zahlungen abrufen
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error('Fehler beim Laden der Zahlungen');
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

  // Zahlung erstellen/aktualisieren
  const savePayment = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      const url = selectedPayment
        ? `/api/payments/${selectedPayment._id}`
        : '/api/payments';
      const method = selectedPayment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) throw new Error('Fehler beim Speichern der Zahlung');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Zahlung löschen
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Fehler beim Löschen der Zahlung');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Status-Chip-Farbe
  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'overdue':
        return 'error.main';
      default:
        return 'warning.main';
    }
  };

  // Status-Text
  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Bezahlt';
      case 'overdue':
        return 'Überfällig';
      default:
        return 'Ausstehend';
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

  // Filtere Zahlungen
  const filteredPayments = payments?.filter((payment: Payment) => {
    const matchesProject = !filterProject || payment.project._id === filterProject;
    const matchesStatus = !filterStatus || payment.status === filterStatus;
    return matchesProject && matchesStatus;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedPayment(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Möchten Sie diese Zahlung wirklich löschen?')) {
      deletePayment.mutate(id);
    }
  };

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment);
      setFormData({
        project: payment.project._id,
        amount: payment.amount,
        dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
        description: payment.description,
      });
    } else {
      setSelectedPayment(null);
      setFormData({
        project: '',
        amount: 0,
        dueDate: '',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPayment(null);
    setFormData({
      project: '',
      amount: 0,
      dueDate: '',
      description: '',
    });
    setError('');
  };

  const handleFormChange = (field: keyof PaymentFormData, value: string | number) => {
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
            Zahlungen
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Neue Zahlung
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Projekt filtern"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <MenuItem value="">Alle Projekte</MenuItem>
              {projects?.map((project: Project) => (
                <MenuItem key={project._id} value={project._id}>
                  {project.name}
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
              <MenuItem value="pending">Ausstehend</MenuItem>
              <MenuItem value="paid">Bezahlt</MenuItem>
              <MenuItem value="overdue">Überfällig</MenuItem>
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
                <TableCell>Projekt</TableCell>
                <TableCell>Kunde</TableCell>
                <TableCell align="right">Betrag</TableCell>
                <TableCell>Fälligkeitsdatum</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Beschreibung</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payment: Payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.project.name}</TableCell>
                    <TableCell>{payment.project.client.name}</TableCell>
                    <TableCell align="right">{formatAmount(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.dueDate)}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{ color: getStatusColor(payment.status) }}
                      >
                        {getStatusText(payment.status)}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(payment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deletePayment.mutate(payment._id)}
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
          count={filteredPayments?.length || 0}
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
          {selectedPayment ? 'Zahlung bearbeiten' : 'Neue Zahlung'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Projekt"
                  value={formData.project}
                  onChange={(e) => handleFormChange('project', e.target.value)}
                >
                  {projects?.map((project: Project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Betrag"
                  value={formData.amount}
                  onChange={(e) =>
                    handleFormChange('amount', parseFloat(e.target.value))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fälligkeitsdatum"
                  value={formData.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
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
            onClick={() => savePayment.mutate(formData)}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payments; 