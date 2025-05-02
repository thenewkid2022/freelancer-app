import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  FormHelperText,
} from '@mui/material';
import { useTimeEntry } from '../../hooks/useTimeEntry';

interface TimeEntryFormData {
  description: string;
  startTime: string;
  endTime: string;
  projectId: string;
}

const TimeEntry: React.FC = () => {
  const { createTimeEntry } = useTimeEntry();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<TimeEntryFormData>({
    description: '',
    startTime: '',
    endTime: '',
    projectId: '', // Standardprojekt-ID oder aus Kontext
  });
  const [validationErrors, setValidationErrors] = useState<{
    description?: string;
    time?: string;
  }>({});

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors({});
    setError(null);
  };

  const validateForm = () => {
    const errors: { description?: string; time?: string } = {};
    
    if (!formData.description) {
      errors.description = 'Bitte geben Sie eine Beschreibung ein';
    }
    if (!formData.startTime || !formData.endTime) {
      errors.time = 'Bitte geben Sie gültige Start- und Endzeiten ein';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      await createTimeEntry(formData);
      setSuccess('Zeiteintrag erfolgreich erstellt');
      setFormData({
        description: '',
        startTime: '',
        endTime: '',
        projectId: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} data-testid="time-entry-form">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="error-message">
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="success-message">
          {success}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="description"
        label="Beschreibung"
        name="description"
        value={formData.description}
        onChange={handleTextFieldChange}
        data-testid="description-input"
        error={!!validationErrors.description}
        helperText={validationErrors.description && (
          <span data-testid="description-error">{validationErrors.description}</span>
        )}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="startTime"
        label="Startzeit"
        name="startTime"
        type="time"
        value={formData.startTime}
        onChange={handleTextFieldChange}
        InputLabelProps={{ shrink: true }}
        inputProps={{ 'data-testid': 'start-time-input' }}
        error={!!validationErrors.time}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="endTime"
        label="Endzeit"
        name="endTime"
        type="time"
        value={formData.endTime}
        onChange={handleTextFieldChange}
        InputLabelProps={{ shrink: true }}
        inputProps={{ 'data-testid': 'end-time-input' }}
        error={!!validationErrors.time}
      />

      {validationErrors.time && (
        <FormHelperText error data-testid="time-error">
          {validationErrors.time}
        </FormHelperText>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        data-testid="submit-time-entry"
      >
        Zeiteintrag speichern
      </Button>
    </Box>
  );
};

export default TimeEntry; 