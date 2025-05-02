import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import TimeEntry from './TimeEntry/TimeEntry';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Willkommen, {user?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Hier ist Ihre Zeiterfassungs-Übersicht
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Neue Zeiterfassung
            </Typography>
            <TimeEntry />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistiken
            </Typography>
            <Box>
              <Typography variant="body1">
                Gesamtarbeitszeit heute: 0h
              </Typography>
              <Typography variant="body1">
                Gesamtarbeitszeit diese Woche: 0h
              </Typography>
              <Typography variant="body1">
                Gesamtarbeitszeit diesen Monat: 0h
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Letzte Einträge
            </Typography>
            {/* Hier können wir später eine Liste der letzten Einträge hinzufügen */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 