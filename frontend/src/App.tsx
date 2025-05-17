import React, { useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useThemeContext } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Zeiterfassung from './components/Zeiterfassung';
import TimeEntries from './components/TimeEntries';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import Export from './components/Export';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate, useLocation } from 'react-router-dom';

const pages = [
  { name: 'Zeiterfassung', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Zeiteinträge', path: '/time-entries', icon: <ListAltIcon /> },
  { name: 'Statistiken', path: '/statistics', icon: <BarChartIcon /> },
  { name: 'Export', path: '/export', icon: <FileDownloadIcon /> },
];

const App: React.FC = () => {
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    document.addEventListener('visibilitychange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      document.removeEventListener('visibilitychange', setVh);
    };
  }, []);

  const mainStyles = useMemo(() => ({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    pt: { xs: 'calc(56px + env(safe-area-inset-top, 0px))', sm: 'calc(64px + env(safe-area-inset-top, 0px))' },
    pb: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box',
    '& > *': { width: '100%' }
  }), []);

  const MainComponent = React.memo(() => (
    <Box component="main" sx={mainStyles}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Container maxWidth={false} sx={{ p: 0, m: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}><Zeiterfassung /></Container></PrivateRoute>} />
        <Route path="/time-entries" element={<PrivateRoute><Container maxWidth="lg" sx={{ flex: 1, overflow: 'auto', px: { xs: 1, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}><TimeEntries /></Container></PrivateRoute>} />
        <Route path="/statistics" element={<PrivateRoute><Container maxWidth="lg" sx={{ flex: 1, overflow: 'auto', px: { xs: 1, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}><Statistics /></Container></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Container maxWidth="lg" sx={{ flex: 1, overflow: 'auto', px: { xs: 1, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column' }}><Profile /></Container></PrivateRoute>} />
        <Route path="/export" element={<PrivateRoute><Container maxWidth="lg" sx={{ flex: 1, height: '100%' }}><Export /></Container></PrivateRoute>} />
      </Routes>
    </Box>
  ));

  return (
    <Box 
      className={darkMode ? 'dark' : ''} 
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}
    >
      <Navbar />
      <MainComponent />
      {isMobile && (
        <BottomNavigation
          value={location.pathname}
          onChange={(event, newValue) => { navigate(newValue); }}
          showLabels={false}
          sx={{
            position: 'fixed',
            bottom: 'env(safe-area-inset-bottom, 0px)',
            left: 0,
            right: 0,
            height: 56,
            zIndex: 1400,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {pages.map((page) => (
            <BottomNavigationAction
              key={page.path}
              label={page.name}
              icon={page.icon}
              value={page.path}
              showLabel={location.pathname === page.path}
              sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: '100%',
                padding: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '.MuiSvgIcon-root': { fontSize: 28, marginBottom: '2px' },
              }}
            />
          ))}
        </BottomNavigation>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </Box>
  );
};

export default App; 