import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  settings: {
    emailNotifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    settings: {
      emailNotifications: true,
      darkMode: false,
      language: 'de',
    },
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Profil abrufen
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/users/profile');
      if (!response.ok) throw new Error('Fehler beim Laden des Profils');
      return response.json();
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  // Profil aktualisieren
  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: Partial<UserProfile>) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });
      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Profils');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Passwort ändern
  const changePassword = useMutation({
    mutationFn: async (passwords: typeof password) => {
      if (passwords.new !== passwords.confirm) {
        throw new Error('Die Passwörter stimmen nicht überein');
      }
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwords),
      });
      if (!response.ok) throw new Error('Fehler beim Ändern des Passworts');
      return response.json();
    },
    onSuccess: () => {
      setPassword({ current: '', new: '', confirm: '' });
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: keyof UserProfile['settings'], value: boolean | string) => {
    setProfile((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      } as UserProfile['settings'],
    }));
  };

  const handlePasswordChange = (field: keyof typeof password, value: string) => {
    setPassword((prev) => ({
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        {!isMobile && (
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Profil
          </Typography>
        )}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{ width: 64, height: 64, mr: 2 }}
              alt={userProfile?.name}
            />
            <Box>
              <Typography variant="h5" component="h1">
                {userProfile?.name}
              </Typography>
              <Typography color="textSecondary">
                {userProfile?.email}
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Persönliche Informationen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-Mail"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Einstellungen
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings?.emailNotifications}
                        onChange={(e) =>
                          handleSettingsChange('emailNotifications', e.target.checked)
                        }
                        disabled={!isEditing}
                      />
                    }
                    label="E-Mail-Benachrichtigungen"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profile.settings?.darkMode}
                        onChange={(e) =>
                          handleSettingsChange('darkMode', e.target.checked)
                        }
                        disabled={!isEditing}
                      />
                    }
                    label="Dunkles Design"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Sprache"
                    value={profile.settings?.language}
                    onChange={(e) =>
                      handleSettingsChange('language', e.target.value)
                    }
                    disabled={!isEditing}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </TextField>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Passwort ändern
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Aktuelles Passwort"
                    value={password.current}
                    onChange={(e) => handlePasswordChange('current', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Neues Passwort"
                    value={password.new}
                    onChange={(e) => handlePasswordChange('new', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Passwort bestätigen"
                    value={password.confirm}
                    onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {isEditing ? (
                  <>
                    <Button variant="outlined" onClick={() => setIsEditing(false)}>
                      Abbrechen
                    </Button>
                    <Button variant="contained" onClick={() => updateProfile.mutate(profile)}>
                      Speichern
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={() => setIsEditing(true)}>
                    Bearbeiten
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => changePassword.mutate(password)}
                  disabled={!password.current || !password.new || !password.confirm}
                >
                  Passwort ändern
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Profile; 