import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid as MuiGrid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hooks/useAuth';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { formatDuration as sharedFormatDuration } from './TimeEntries';

interface TimeEntry {
  _id: string;
  projectNumber?: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'timeEntry' | 'event';
  project?: {
    name: string;
    client: {
      name: string;
    };
  };
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Zeiteinträge und Termine abrufen
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const response = await fetch(
        `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!response.ok) throw new Error('Fehler beim Laden der Kalenderdaten');
      return response.json();
    },
  });

  // Neuen Termin erstellen
  const createEvent = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error('Fehler beim Erstellen des Termins');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
    setError('');
  };

  const handleCreateEvent = (eventData: Partial<Event>) => {
    createEvent.mutate(eventData);
  };

  const getEventsForDate = (date: Date) => {
    return events?.filter((event: Event) =>
      isSameDay(new Date(event.start), date)
    );
  };

  const formatDuration = (seconds: number): string => {
    return sharedFormatDuration(seconds);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

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
            Kalender
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePreviousMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6">
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <MuiGrid container spacing={1}>
          {/* Wochentage */}
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
            <MuiGrid item xs={1} key={day}>
              <Box
                sx={{
                  p: 1,
                  textAlign: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2">{day}</Typography>
              </Box>
            </MuiGrid>
          ))}

          {/* Kalendertage */}
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <MuiGrid item xs={1} key={day.toISOString()}>
                <Box
                  sx={{
                    p: 1,
                    minHeight: 100,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: isCurrentDay ? 'action.selected' : 'background.paper',
                    opacity: isCurrentMonth ? 1 : 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <Typography
                    variant="subtitle2"
                    color={isCurrentDay ? 'primary' : 'text.primary'}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {dayEvents?.map((event: Event) => (
                    <Box
                      key={event._id}
                      sx={{
                        mt: 0.5,
                        p: 0.5,
                        bgcolor: event.type === 'timeEntry' ? 'info.light' : 'success.light',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                      }}
                    >
                      <Typography noWrap variant="caption">
                        {event.type === 'timeEntry'
                          ? `${event.project?.name} (${formatDuration(
                              new Date(event.end).getTime() -
                                new Date(event.start).getTime()
                            )})`
                          : event.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </MuiGrid>
            );
          })}
        </MuiGrid>
      </Paper>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDate
            ? `Termin am ${format(selectedDate, 'dd.MM.yyyy', { locale: de })}`
            : 'Neuer Termin'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <MuiGrid container spacing={2}>
              <MuiGrid item xs={12}>
                <TextField
                  fullWidth
                  label="Titel"
                  name="title"
                  required
                />
              </MuiGrid>
              <MuiGrid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Startzeit"
                  name="start"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </MuiGrid>
              <MuiGrid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Endzeit"
                  name="end"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </MuiGrid>
              <MuiGrid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Beschreibung"
                  name="description"
                />
              </MuiGrid>
            </MuiGrid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button variant="contained" onClick={() => handleCreateEvent({})}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Calendar; 