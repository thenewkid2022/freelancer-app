import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Timer as TimerIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, addWeeks, addMonths, addYears } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeEntry {
  _id: string;
  project?: {
    _id: string;
    name: string;
  };
  projectNumber?: string;
  duration: number;
  startTime: string;
}

const Statistics: React.FC = () => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: 'week' | 'month' | 'year' | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  // Zeiteinträge abrufen
  const { data: timeEntries, isLoading: isLoadingTimeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      return await apiClient.get<TimeEntry[]>('/time-entries');
    },
  });

  // Navigation durch Zeiträume
  const navigateTimeRange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    switch (timeRange) {
      case 'week':
        setSelectedDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
      case 'month':
        setSelectedDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
      case 'year':
        setSelectedDate(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
        break;
    }
  };

  // Aktualisiere die gefilterten Daten basierend auf dem ausgewählten Datum
  const filteredTimeEntries = useMemo(() => {
    if (!timeEntries) return [];

    let startDate: Date;
    let endDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(selectedDate, { locale: de });
        endDate = endOfWeek(selectedDate, { locale: de });
        break;
      case 'month':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      case 'year':
        startDate = startOfYear(selectedDate);
        endDate = endOfYear(selectedDate);
        break;
      default:
        startDate = startOfWeek(selectedDate, { locale: de });
        endDate = endOfWeek(selectedDate, { locale: de });
    }

    return timeEntries.filter((entry: TimeEntry) => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [timeEntries, timeRange, selectedDate]);

  // Aktualisiere die Projektverteilung basierend auf den gefilterten Daten
  const timeByProject = useMemo(() => {
    return filteredTimeEntries.reduce((acc: any[], entry: TimeEntry) => {
      const key = entry.project?.name || entry.projectNumber || 'Kein Projekt';
      const existing = acc.find(item => item.name === key);
      if (existing) {
        existing.value += entry.duration / 3600;
      } else {
        acc.push({
          name: key,
          value: entry.duration / 3600,
        });
      }
      return acc;
    }, []);
  }, [filteredTimeEntries]);

  // Gesamtübersicht
  const totalHours = timeByProject.reduce(
    (sum: number, entry: { name: string; value: number }) =>
      sum + (typeof entry.value === 'number' ? entry.value : 0),
    0
  );
  const totalEntries = filteredTimeEntries.length;
  const avgPerEntry = totalEntries > 0 ? totalHours / totalEntries : 0;

  // Aktualisiere die tägliche Übersicht
  const dailyData = useMemo(() => {
    const dailyMap: Record<string, { hours: number; entries: number }> = {};
    
    filteredTimeEntries.forEach(entry => {
      const day = new Date(entry.startTime).toLocaleDateString('de-DE', { timeZone: 'Europe/Zurich' });
      if (!dailyMap[day]) {
        dailyMap[day] = { hours: 0, entries: 0 };
      }
      dailyMap[day].hours += entry.duration / 3600;
      dailyMap[day].entries += 1;
    });

    return Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [filteredTimeEntries]);

  // Farben für das PieChart aus dem Theme
  const COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.primary.light, theme.palette.secondary.light, '#A020F0', '#FF6666'];

  // Hilfsfunktion: Top 5 + Sonstige
  const getTopProjects = (data: any[], topN = 5) => {
    if (data.length <= topN) return data;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    const restSum = rest.reduce((sum, entry) => sum + entry.value, 0);
    return [
      ...top,
      { name: 'Sonstige', value: restSum }
    ];
  };

  const topProjects = getTopProjects(timeByProject, 5);

  // Aktualisiere die wöchentlichen Daten
  const weeklyData = useMemo(() => {
    const now = selectedDate;
    let start: Date;
    let end: Date;

    switch (timeRange) {
      case 'week':
        start = startOfWeek(now, { locale: de });
        end = endOfWeek(now, { locale: de });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfWeek(now, { locale: de });
        end = endOfWeek(now, { locale: de });
    }

    // Erzeuge die Tage explizit als UTC-Daten
    function getUTCDays(start: Date, end: Date) {
      const days = [];
      let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (current <= endUTC) {
        days.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return days;
    }
    const days = getUTCDays(start, end);
    
    return days.map(day => {
      const dayEntries = filteredTimeEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return (
          entryDate.getUTCFullYear() === day.getUTCFullYear() &&
          entryDate.getUTCMonth() === day.getUTCMonth() &&
          entryDate.getUTCDate() === day.getUTCDate()
        );
      });
      const totalHours = dayEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
      
      // Formatierung der X-Achse je nach Modus
      let label;
      if (timeRange === 'year') {
        label = format(day, 'MMM', { locale: de }); // z.B. Jan, Feb, ...
      } else if (timeRange === 'month') {
        label = format(day, 'd', { locale: de }); // z.B. 1, 2, 3, ...
      } else {
        label = format(day, 'EEEE', { locale: de }); // z.B. Montag, Dienstag, ...
      }

      return {
        date: label,
        hours: Number(totalHours.toFixed(1)),
        entries: dayEntries.length,
      };
    });
  }, [filteredTimeEntries, timeRange, selectedDate]);

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'pie' | 'bar' | 'line' | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Erweiterte Kennzahlen
  const stats = useMemo(() => {
    // Produktivster Tag
    const productiveDay = dailyData.reduce((max, day) => 
      day.hours > max.hours ? day : max, 
      { date: '', hours: 0, entries: 0 }
    );

    // Durchschnittliche Arbeitszeit pro Tag
    const daysWithEntries = dailyData.filter(day => day.hours > 0).length;
    const avgHoursPerDay = daysWithEntries > 0 ? totalHours / daysWithEntries : 0;

    // Wochentagsverteilung
    const weekdayDistribution = weeklyData.reduce((acc, day) => {
      acc[day.date] = day.hours;
      return acc;
    }, {} as Record<string, number>);

    // Produktivster Wochentag
    const productiveWeekday = Object.entries(weekdayDistribution)
      .reduce((max, [day, hours]) => hours > max.hours ? { day, hours } : max, 
        { day: '', hours: 0 });

    return {
      productiveDay,
      avgHoursPerDay,
      productiveWeekday,
      daysWithEntries,
    };
  }, [dailyData, weeklyData, totalHours]);

  // Render-Funktion für das aktuelle Diagramm
  const renderChart = (): JSX.Element => {
    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie
            data={topProjects}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={60}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="#222"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  fontWeight={600}
                  style={{ textShadow: '0 0 2px #fff, 0 0 2px #fff' }}
                >
                  {(percent * 100).toFixed(1)}%
                </text>
              );
            }}
            labelLine={false}
          >
            {topProjects.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke={theme.palette.background.paper}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)} h`, '']}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
          />
        </PieChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: theme.palette.text.primary }}
            tickLine={{ stroke: theme.palette.divider }}
          />
          <YAxis 
            tick={{ fill: theme.palette.text.primary }}
            tickLine={{ stroke: theme.palette.divider }}
            label={{ 
              value: 'Stunden', 
              angle: -90, 
              position: 'insideLeft',
              fill: theme.palette.text.primary,
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
            formatter={(value: number) => [`${value.toFixed(1)} h`, '']}
          />
          <Bar 
            dataKey="hours" 
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    }

    // Default: Line Chart
    return (
      <LineChart data={weeklyData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: theme.palette.text.primary }}
          tickLine={{ stroke: theme.palette.divider }}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.primary }}
          tickLine={{ stroke: theme.palette.divider }}
          label={{ 
            value: 'Stunden', 
            angle: -90, 
            position: 'insideLeft',
            fill: theme.palette.text.primary,
          }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
          }}
          formatter={(value: number) => [`${value.toFixed(1)} h`, '']}
        />
        <Line 
          type="monotone" 
          dataKey="hours" 
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ 
            fill: theme.palette.primary.main,
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
            r: 4,
          }}
          activeDot={{ 
            fill: theme.palette.primary.main,
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
            r: 6,
          }}
        />
      </LineChart>
    );
  };

  if (isLoadingTimeEntries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack
      spacing={{ xs: 1, sm: 2, md: 3 }}
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        pb: isMobile ? 2 : 0,
      }}
    >
      <Grid 
        container 
        spacing={{ xs: 0.5, sm: 1, md: 2 }}
        sx={{
          width: '100%',
          margin: 0,
          '& > .MuiGrid-item': {
            padding: { xs: 0.5, sm: 1, md: 2 },
          }
        }}
      >
        {/* Filter-Box als erstes Grid-Item */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 1, sm: 1.5, md: 2 },
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1, md: 2 },
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
              width: '100%',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>
              <IconButton 
                onClick={() => navigateTimeRange('prev')}
                size="medium"
                sx={{ bgcolor: 'background.default', '&:hover': { bgcolor: 'action.hover' }, mx: { xs: 0, sm: 0.5 } }}
              >
                <ChevronLeftIcon fontSize="medium" />
              </IconButton>
              <Typography variant="subtitle1" sx={{ minWidth: 90, textAlign: 'center', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                {format(selectedDate, timeRange === 'year' ? 'yyyy' : 
                  timeRange === 'month' ? 'MMMM yyyy' : 
                  "'KW' w, yyyy", { locale: de })}
              </Typography>
              <IconButton 
                onClick={() => navigateTimeRange('next')}
                size="medium"
                sx={{ bgcolor: 'background.default', '&:hover': { bgcolor: 'action.hover' }, mx: { xs: 0, sm: 0.5 } }}
              >
                <ChevronRightIcon fontSize="medium" />
              </IconButton>
            </Box>
            <Divider orientation={ (typeof window !== 'undefined' && window.innerWidth < 600) ? 'horizontal' : 'vertical' } flexItem sx={{ my: { xs: 1, sm: 0 }, mx: { xs: 0, sm: 2 }, display: { xs: 'block', sm: 'block', md: 'block' } }} />
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="medium"
              sx={{
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'center',
                '& .MuiToggleButton-root': {
                  flex: 1,
                  minWidth: 'auto',
                  px: { xs: 0.5, sm: 1 },
                  whiteSpace: 'nowrap',
                }
              }}
              fullWidth={true}
            >
              <ToggleButton value="week">Woche</ToggleButton>
              <ToggleButton value="month">Monat</ToggleButton>
              <ToggleButton value="year">Jahr</ToggleButton>
            </ToggleButtonGroup>
          </Paper>
        </Grid>
        {/* Linke Spalte: Diagramme */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ 
            p: { xs: 1, sm: 2, md: 3 },
            height: '100%',
            borderRadius: 2,
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
            minHeight: 320,
          }}>
            {/* Diagramm-Typ Auswahl */}
            <Box sx={{ 
              mb: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              pb: 2,
              gap: { xs: 1, sm: 2 },
            }}>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiToggleButton-root': {
                    flex: { xs: 1, sm: 'none' },
                    px: { xs: 1, sm: 3 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    whiteSpace: 'nowrap',
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      mr: { xs: 0.5, sm: 1 }
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="pie">
                  <PieChartIcon />
                  {isMobile ? 'Projekte' : 'Projektverteilung'}
                </ToggleButton>
                <ToggleButton value="bar">
                  <BarChartIcon />
                  {isMobile ? 'Tage' : 'Tagesübersicht'}
                </ToggleButton>
                <ToggleButton value="line">
                  <ShowChartIcon />
                  {isMobile ? 'Verlauf' : 'Wochenverlauf'}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Diagramm-Container */}
            <Box
              sx={{
                height: { xs: 260, sm: 320, md: 400 },
                position: 'relative',
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                overflowX: 'hidden',
                '& .recharts-wrapper': {
                  overflow: 'hidden',
                  width: '100% !important',
                  '& svg': {
                    width: '100% !important',
                    height: 'auto !important',
                  }
                }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        {/* Rechte Spalte: Statistik-Karten */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Gesamtstunden */}
            <Paper sx={{ 
              p: { xs: 0.5, sm: 2, md: 3 },
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
              },
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.contrastText',
                  minWidth: 48,
                  height: 48
                }}>
                  <AccessTimeIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Gesamtstunden
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    mt: 0.5
                  }}>
                    {totalHours.toFixed(1)}h
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Durchschnitt pro Tag */}
            <Paper sx={{ 
              p: { xs: 0.5, sm: 2, md: 3 },
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
              },
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  bgcolor: 'secondary.main',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'secondary.contrastText',
                  minWidth: 48,
                  height: 48
                }}>
                  <TimerIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ø pro Tag
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600,
                    color: 'secondary.main',
                    mt: 0.5
                  }}>
                    {stats.avgHoursPerDay.toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.daysWithEntries} Tage mit Einträgen
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Zeiteinträge */}
            <Paper sx={{ 
              p: { xs: 0.5, sm: 2, md: 3 },
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
              },
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  bgcolor: 'info.main',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'info.contrastText',
                  minWidth: 48,
                  height: 48
                }}>
                  <AssignmentIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Zeiteinträge
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600,
                    color: 'info.main',
                    mt: 0.5
                  }}>
                    {totalEntries}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ø {avgPerEntry.toFixed(1)}h pro Eintrag
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        {/* Unterer Bereich: Detaillierte Statistiken */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
          }}>
            <Grid container spacing={3}>
              {/* Produktivster Tag */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      bgcolor: 'success.main',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'success.contrastText'
                    }}>
                      <EmojiEventsIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Produktivster Tag
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: 'success.main',
                        fontWeight: 600,
                        mt: 0.5
                      }}>
                        {stats.productiveDay.date}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="h5" sx={{ 
                          color: 'success.main',
                          fontWeight: 600
                        }}>
                          {stats.productiveDay.hours.toFixed(1)}h
                        </Typography>
                        <Chip 
                          size="small"
                          label={`${stats.productiveDay.entries} Einträge`}
                          color="success"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              {/* Produktivster Wochentag */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      bgcolor: 'warning.main',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'warning.contrastText'
                    }}>
                      <TrendingUpIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Produktivster Wochentag
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: 'warning.main',
                        fontWeight: 600,
                        mt: 0.5
                      }}>
                        {stats.productiveWeekday.day}
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: 'warning.main',
                        fontWeight: 600,
                        mt: 1
                      }}>
                        {stats.productiveWeekday.hours.toFixed(1)}h
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Zusätzliche Informationen
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <TrendingUpIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Produktivster Wochentag"
                secondary={`${stats.productiveWeekday.day} (${stats.productiveWeekday.hours.toFixed(1)}h)`}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <CalendarTodayIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Aktive Tage"
                secondary={`${stats.daysWithEntries} Tage mit Einträgen`}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <AssignmentIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Durchschnitt pro Eintrag"
                secondary={`${avgPerEntry.toFixed(1)} Stunden`}
              />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </Stack>
  );
};

export default Statistics; 