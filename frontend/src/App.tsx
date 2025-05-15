import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
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

const App: React.FC = () => {
  const { darkMode } = useThemeContext();

  return (
    <Box 
      className={darkMode ? 'dark' : ''}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Navbar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 7, sm: 8 }, // Konsistenter Abstand unter dem Header
          overflow: 'auto', // Ermöglicht Scrolling im Content-Bereich
          height: 'calc(100vh - 64px)', // Volle Höhe minus Header-Höhe
          '& > *': { // Stellt sicher, dass der Container die volle Breite nutzt
            width: '100%'
          }
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Container maxWidth={false} sx={{ p: 0, m: 0, display: 'flex', justifyContent: 'center' }}>
                  <Zeiterfassung />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/time-entries"
            element={
              <PrivateRoute>
                <Container maxWidth="lg">
                  <TimeEntries />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Container maxWidth="lg">
                  <Statistics />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Container 
                  maxWidth="lg" 
                  sx={{ 
                    pb: { xs: 8, sm: 4 }, // Fügt Abstand am unteren Rand hinzu für die mobile Navigation
                    height: '100%',
                    overflow: 'auto',
                    px: { xs: 2, sm: 3 } // Angepasste horizontale Abstände für mobile Geräte
                  }}
                >
                  <Profile />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/export"
            element={
              <PrivateRoute>
                <Container maxWidth="lg">
                  <Export />
                </Container>
              </PrivateRoute>
            }
          />
        </Routes>
      </Box>
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