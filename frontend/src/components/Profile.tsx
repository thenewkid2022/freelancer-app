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
  MenuItem,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  settings: {
    darkMode: boolean;
    language: string;
  };
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    settings: {
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
  const { setDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();

  // Profil abrufen
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Fehler beim Laden des Profils');
      return response.json();
    },
    onSuccess: (data) => {
      setProfile(data.user);
      // Darkmode initial setzen
      if (data?.user?.settings?.darkMode !== undefined) {
        setDarkMode(data.user.settings.darkMode);
      }
    },
  });

  // Profil aktualisieren
  const updateProfile = useMutation({
    mutationFn: async (updatedProfile: Partial<UserProfile>) => {
      const API_URL = process.env.REACT_APP_API_URL || 'https://dein-backend-server.com';
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedProfile),
      });
      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Profils');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setError('');
      // Darkmode nach Speichern übernehmen
      if (data?.user?.settings?.darkMode !== undefined) {
        setDarkMode(data.user.settings.darkMode);
      }
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
    if (field === 'language' && typeof value === 'string') {
      if (i18n.language !== value) {
        i18n.changeLanguage(value);
      } else {
        // Workaround: Sprache kurz auf eine andere setzen und dann zurück
        i18n.changeLanguage('en').then(() => {
          i18n.changeLanguage('de');
        });
      }
      localStorage.setItem('language', value);
    }
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
    <Stack 
      spacing={isMobile ? 2 : 3} 
      sx={{ 
        width: '100%',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch', // Für besseres iOS-Scrolling
        pb: isMobile ? 2 : 0,
        '& .MuiPaper-root': {
          overflow: 'visible'
        }
      }}
    >
      <Paper sx={{ p: isMobile ? 1.5 : 3, boxShadow: isMobile ? 0 : 3, borderRadius: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'center', mb: isMobile ? 2 : 3 }}>
          <Avatar
            sx={{ width: isMobile ? 56 : 64, height: isMobile ? 56 : 64, mb: isMobile ? 1 : 0, mr: isMobile ? 0 : 2 }}
            alt={`${userProfile?.firstName} ${userProfile?.lastName}`}
          />
          <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} component="h1">
              {userProfile?.firstName} {userProfile?.lastName}
            </Typography>
            <Typography color="textSecondary" sx={{ fontSize: isMobile ? '0.95rem' : undefined }}>
              {userProfile?.email}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={isMobile ? 1.5 : 3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : undefined }}>
              {t('profile.personalInfo')}
            </Typography>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('profile.firstName')}
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('profile.lastName')}
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('profile.email')}
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: isMobile ? 1.5 : 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : undefined }}>
              {t('profile.settings')}
            </Typography>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.settings?.darkMode}
                      onChange={(e) => handleSettingsChange('darkMode', e.target.checked)}
                      disabled={!isEditing}
                    />
                  }
                  label={t('profile.darkMode')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label={t('profile.language')}
                  value={i18n.language}
                  onChange={(e) => handleSettingsChange('language', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="it">Italiano</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: isMobile ? 1.5 : 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : undefined }}>
              {t('profile.changePassword')}
            </Typography>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label={t('profile.currentPassword')}
                  value={password.current}
                  onChange={(e) => handlePasswordChange('current', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label={t('profile.newPassword')}
                  value={password.new}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="password"
                  label={t('profile.confirmPassword')}
                  value={password.confirm}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  disabled={!isEditing}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: 2, mt: isMobile ? 2 : 0 }}>
              {isEditing ? (
                <>
                  <Button variant="outlined" onClick={() => setIsEditing(false)} fullWidth={isMobile} sx={{ mb: isMobile ? 1 : 0 }}>
                    {t('profile.cancel')}
                  </Button>
                  <Button variant="contained" onClick={() => {
                    if (userProfile) {
                      const mergedProfile = {
                        ...userProfile,
                        ...profile,
                        settings: {
                          ...userProfile.settings,
                          ...profile.settings
                        }
                      };
                      updateProfile.mutate(mergedProfile);
                    }
                  }} fullWidth={isMobile} sx={{ mb: isMobile ? 1 : 0 }}>
                    {t('profile.save')}
                  </Button>
                </>
              ) : (
                <Button variant="contained" onClick={() => setIsEditing(true)} fullWidth={isMobile} sx={{ mb: isMobile ? 1 : 0 }}>
                  {t('profile.edit')}
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={() => changePassword.mutate(password)}
                disabled={!isEditing || !password.current || !password.new || !password.confirm}
                fullWidth={isMobile}
              >
                {t('profile.changePassword')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
};

export default Profile; 