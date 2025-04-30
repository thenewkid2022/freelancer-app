import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  path,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            color: theme.palette.primary.main,
          }}
        >
          {icon}
          <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => navigate(path)}
        >
          Mehr erfahren
        </Button>
      </CardActions>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dashboardItems = [
    {
      title: 'Zeiterfassung',
      description: 'Erfassen Sie Ihre Arbeitszeit und verfolgen Sie Ihre Projekte.',
      icon: <TimerIcon fontSize="large" />,
      path: '/time-tracker',
    },
    {
      title: 'Zeiteinträge',
      description: 'Verwalten und analysieren Sie Ihre gesammelten Zeiteinträge.',
      icon: <ReceiptIcon fontSize="large" />,
      path: '/time-entries',
    },
    {
      title: 'Zahlungen',
      description: 'Überwachen Sie Ihre Einnahmen und verwalten Sie Rechnungen.',
      icon: <PaymentIcon fontSize="large" />,
      path: '/payments',
    },
    {
      title: 'Statistiken',
      description: 'Gewinnen Sie Einblicke in Ihre Arbeitszeit und Einnahmen.',
      icon: <BarChartIcon fontSize="large" />,
      path: '/statistics',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Willkommen, {user?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Hier ist Ihre Übersicht für {user?.role === 'freelancer' ? 'Freelancer' : 'Kunden'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <DashboardCard {...item} />
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          p: 3,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Benötigen Sie Hilfe?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Entdecken Sie unsere Anleitungen und Ressourcen, um das Beste aus der App herauszuholen.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.open('/help', '_blank')}
        >
          Hilfe anzeigen
        </Button>
      </Paper>
    </Container>
  );
};

export default Dashboard; 