import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Debug-Element für safe-area-inset-bottom erstellen
    const debugDiv = document.createElement('div');
    debugDiv.id = 'safe-area-debug';
    document.body.appendChild(debugDiv);

    // Cleanup-Funktion
    return () => {
      const element = document.getElementById('safe-area-debug');
      if (element) {
        element.remove();
      }
    };
  }, []); // Leeres Dependency Array, da der Effekt nur einmal beim Mounten ausgeführt werden soll

  // Dynamische Viewport-Höhe für mobile Geräte
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01; // Verwende window.innerHeight statt document.documentElement.clientHeight
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight); // Für Gerätedrehungen
  setViewportHeight();

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
          pt: { xs: 'calc(56px + env(safe-area-inset-top, 0px))', sm: 'calc(64px + env(safe-area-inset-top, 0px))' },
          pb: '56px',
          boxSizing: 'border-box',
          overflow: 'auto',
          '& > *': {
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
                <Container maxWidth={false} sx={{ p: 0, m: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <Zeiterfassung />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/time-entries"
            element={
              <PrivateRoute>
                <Container 
                  maxWidth="lg" 
                  sx={{ 
                    height: '100%',
                    flex: 1,
                    overflow: 'hidden',
                    px: { xs: 1, sm: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <TimeEntries />
                </Container>
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <Container 
                  maxWidth="lg" 
                  sx={{ 
                    height: '100%',
                    flex: 1,
                    overflow: 'hidden',
                    px: { xs: 1, sm: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
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
                    height: '100%',
                    flex: 1,
                    overflow: 'hidden',
                    px: { xs: 1, sm: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column'
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
                <Container maxWidth="lg" sx={{ flex: 1, height: '100%' }}>
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