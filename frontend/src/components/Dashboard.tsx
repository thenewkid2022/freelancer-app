import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import TimeEntry from './TimeEntry/TimeEntry';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.name ? `Willkommen, ${user.name}!` : 'Willkommen!'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Hier ist Ihre Zeiterfassungsübersicht
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
                Gesamtarbeitszeit heute: 0 Std.
              </Typography>
              <Typography variant="body1">
                Gesamtarbeitszeit diese Woche: 0 Std.
              </Typography>
              <Typography variant="body1">
                Gesamtarbeitszeit diesen Monat: 0 Std.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Letzte Zeiteinträge
            </Typography>
            {/* Hier können später die letzten Zeiteinträge angezeigt werden */}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 