import React, { useState } from 'react';
import { PaymentService } from '../services/PaymentService';
import { TimeEntry } from '../types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const paymentService = PaymentService.getInstance();

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  timeEntries: TimeEntry[];
  onSuccess?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onClose,
  timeEntries,
  onSuccess
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalHours = timeEntries
    .filter(entry => selectedEntries.includes(entry.id))
    .reduce((sum, entry) => sum + entry.duration / 3600, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentMethod || selectedEntries.length === 0) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      setLoading(true);
      const selectedEntry = timeEntries.find(entry => entry.id === selectedEntries[0]);
      if (!selectedEntry) {
        throw new Error('Kein Projekt ausgewählt');
      }

      await paymentService.createPayment({
        project: typeof selectedEntry.project === 'string' 
          ? selectedEntry.project 
          : selectedEntry.project.name,
        amount: parseFloat(amount),
        description: `Zahlung für ${selectedEntries.length} Zeitbuchungen`,
        dueDate: new Date()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Fehler beim Erstellen der Zahlung');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy', { locale: de });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Neue Zahlung erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Zeitbuchungen auswählen
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {timeEntries.map((entry) => (
                <Chip
                  key={entry.id}
                  label={`${entry.project} (${formatDate(new Date(entry.startTime))})`}
                  onClick={() => {
                    setSelectedEntries(prev =>
                      prev.includes(entry.id)
                        ? prev.filter(id => id !== entry.id)
                        : [...prev, entry.id]
                    );
                  }}
                  color={selectedEntries.includes(entry.id) ? 'primary' : 'default'}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            {selectedEntries.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Gesamtstunden: {totalHours.toFixed(2)}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            label="Betrag"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Währung</InputLabel>
            <Select
              value={currency}
              label="Währung"
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="CHF">CHF</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Zahlungsmethode</InputLabel>
            <Select
              value={paymentMethod}
              label="Zahlungsmethode"
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <MenuItem value="bank_transfer">Überweisung</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="credit_card">Kreditkarte</MenuItem>
            </Select>
          </FormControl>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || selectedEntries.length === 0}
          >
            {loading ? 'Wird erstellt...' : 'Zahlung erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 