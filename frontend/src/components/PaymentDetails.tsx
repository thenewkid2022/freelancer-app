import React, { useEffect, useState } from 'react';
import { Payment } from '../types';
import { PaymentService } from '../services/PaymentService';
import { useAuth } from '../hooks/useAuth';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const paymentService = PaymentService.getInstance();

interface PaymentDetailsProps {
  paymentId: string;
  open: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

export const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  paymentId,
  open,
  onClose,
  onStatusUpdate
}) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open && paymentId) {
      loadPayment();
    }
  }, [open, paymentId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPayment(paymentId);
      setPayment(data);
    } catch (err) {
      setError('Fehler beim Laden der Zahlungsdetails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Payment['status']) => {
    if (!payment) return;

    try {
      await paymentService.updatePaymentStatus(payment.id, newStatus);
      await loadPayment();
      onStatusUpdate?.();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Status');
      console.error(err);
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
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>Lade Zahlungsdetails...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !payment) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography color="error">{error || 'Zahlung nicht gefunden'}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Zahlungsdetails
        <Chip
          label={payment.status}
          color={
            payment.status === 'paid'
              ? 'success'
              : payment.status === 'pending'
              ? 'warning'
              : 'error'
          }
          size="small"
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Allgemeine Informationen
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Betrag"
                  secondary={formatAmount(payment.amount, payment.currency)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Zahlungsmethode"
                  secondary={payment.paymentMethod}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Erstellt am"
                  secondary={formatDate(payment.createdAt)}
                />
              </ListItem>
              {payment.paymentDate && (
                <ListItem>
                  <ListItemText
                    primary="Bezahlt am"
                    secondary={formatDate(payment.paymentDate)}
                  />
                </ListItem>
              )}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              {user?.role === 'freelancer' ? 'Kunde' : 'Freelancer'}
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Name"
                  secondary={
                    user?.role === 'freelancer'
                      ? payment.client.name
                      : payment.freelancer.name
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="E-Mail"
                  secondary={
                    user?.role === 'freelancer'
                      ? payment.client.email
                      : payment.freelancer.email
                  }
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Zeitbuchungen
            </Typography>
            <List>
              {payment.timeEntries.map((entry) => (
                <ListItem key={entry.id}>
                  <ListItemText
                    primary={entry.project}
                    secondary={`${formatDate(entry.startTime)} - ${formatDate(
                      entry.endTime
                    )} (${entry.duration / 3600} Stunden)`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {user?.role === 'client' && payment.status === 'pending' && (
          <>
            <Button
              color="success"
              onClick={() => handleStatusUpdate('paid')}
            >
              Als bezahlt markieren
            </Button>
            <Button
              color="error"
              onClick={() => handleStatusUpdate('failed')}
            >
              Als fehlgeschlagen markieren
            </Button>
          </>
        )}
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}; 