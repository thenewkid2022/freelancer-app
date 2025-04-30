import React, { useEffect, useState } from 'react';
import { Payment } from '../types';
import { PaymentService } from '../services/PaymentService';
import { useAuth } from '../hooks/useAuth';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const paymentService = PaymentService.getInstance();

export const PaymentList: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = user?.role === 'freelancer'
        ? await paymentService.getFreelancerPayments()
        : await paymentService.getClientPayments();
      setPayments(data);
    } catch (err) {
      setError('Fehler beim Laden der Zahlungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (loading) {
    return <Typography>Lade Zahlungen...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Zahlungen
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>{user?.role === 'freelancer' ? 'Kunde' : 'Freelancer'}</TableCell>
              <TableCell>Betrag</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zahlungsmethode</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                <TableCell>
                  {user?.role === 'freelancer'
                    ? payment.client.name
                    : payment.freelancer.name}
                </TableCell>
                <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{payment.paymentMethod}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {/* TODO: Implementiere Payment-Details Dialog */}}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 