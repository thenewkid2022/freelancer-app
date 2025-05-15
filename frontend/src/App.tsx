import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      overflow: 'hidden' // Verhindert Scrolling auf der Root-Ebene
    }}>
      <Navbar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 7, sm: 8 }, // Konsistenter Abstand unter dem Header
          pb: 4,
          backgroundColor: '#f8f8f8',
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
                <Container maxWidth="lg">
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
      <ToastContainer />
    </Box>
  );
};

export default App; 