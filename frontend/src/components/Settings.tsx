import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';

interface Settings {
  _id: string;
  user: string;
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
  timeFormat: '12h' | '24h';
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'EUR' | 'USD' | 'CHF';
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  defaultHourlyRate: number;
  taxRate: number;
  invoicePrefix: string;
  invoiceNumber: number;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Einstellungen abrufen
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Fehler beim Laden der Einstellungen');
      return response.json();
    },
  });

  // Einstellungen speichern
  const saveSettings = useMutation({
    mutationFn: async (settingsData: Partial<Settings>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) throw new Error('Fehler beim Speichern der Einstellungen');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccess('Einstellungen erfolgreich gespeichert');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleChange = (field: string, value: any) => {
    saveSettings.mutate({ [field]: value });
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
          Einstellungen
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Erscheinungsbild */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Erscheinungsbild
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Design</InputLabel>
                  <Select
                    value={settings?.theme || 'system'}
                    label="Design"
                    onChange={(e) => handleChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Hell</MenuItem>
                    <MenuItem value="dark">Dunkel</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sprache</InputLabel>
                  <Select
                    value={settings?.language || 'de'}
                    label="Sprache"
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Datum und Zeit */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Datum und Zeit
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Zeitformat</InputLabel>
                  <Select
                    value={settings?.timeFormat || '24h'}
                    label="Zeitformat"
                    onChange={(e) => handleChange('timeFormat', e.target.value)}
                  >
                    <MenuItem value="12h">12-Stunden (AM/PM)</MenuItem>
                    <MenuItem value="24h">24-Stunden</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Datumsformat</InputLabel>
                  <Select
                    value={settings?.dateFormat || 'DD.MM.YYYY'}
                    label="Datumsformat"
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                  >
                    <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Benachrichtigungen */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Benachrichtigungen
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.notifications?.email || false}
                      onChange={(e) =>
                        handleChange('notifications', {
                          ...settings?.notifications,
                          email: e.target.checked,
                        })
                      }
                    />
                  }
                  label="E-Mail-Benachrichtigungen"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.notifications?.browser || false}
                      onChange={(e) =>
                        handleChange('notifications', {
                          ...settings?.notifications,
                          browser: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Browser-Benachrichtigungen"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.notifications?.sound || false}
                      onChange={(e) =>
                        handleChange('notifications', {
                          ...settings?.notifications,
                          sound: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Sound-Benachrichtigungen"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Settings; 