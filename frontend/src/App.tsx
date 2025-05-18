import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
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
import { useResponsive } from './hooks/useResponsive';
import { PageContainer } from './components/layout/Container';
import { useAuth } from './contexts/AuthContext';
import { setupViewportListeners } from './utils/viewport';

const pages = [
  { name: 'Zeiterfassung', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Zeiteinträge', path: '/time-entries', icon: <ListAltIcon /> },
  { name: 'Statistiken', path: '/statistics', icon: <BarChartIcon /> },
  { name: 'Export', path: '/export', icon: <FileDownloadIcon /> },
];

const App: React.FC = () => {
  const { darkMode } = useThemeContext();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const MainComponent = React.memo(() => (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <PageContainer noPadding>
            <Zeiterfassung />
          </PageContainer>
        </PrivateRoute>
      } />
      <Route path="/time-entries" element={
        <PrivateRoute>
          <PageContainer>
            <TimeEntries />
          </PageContainer>
        </PrivateRoute>
      } />
      <Route path="/statistics" element={
        <PrivateRoute>
          <PageContainer>
            <Statistics />
          </PageContainer>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <PageContainer>
            <Profile />
          </PageContainer>
        </PrivateRoute>
      } />
      <Route path="/export" element={
        <PrivateRoute>
          <PageContainer>
            <Export />
          </PageContainer>
        </PrivateRoute>
      } />
    </Routes>
  ));

  useEffect(() => {
    const updateMainHeight = () => {
      if (mainRef.current && headerRef.current && footerRef.current) {
        const headerHeight = headerRef.current.clientHeight;
        const footerHeight = isMobile ? footerRef.current.clientHeight : 0; // Footer nur auf Mobilgeräten
        const vh = window.innerHeight;
        mainRef.current.style.height = `${vh - headerHeight - footerHeight}px`;
      }
    };

    updateMainHeight();

    window.addEventListener('resize', updateMainHeight);
    window.visualViewport?.addEventListener('resize', updateMainHeight);

    return () => {
      window.removeEventListener('resize', updateMainHeight);
      window.visualViewport?.removeEventListener('resize', updateMainHeight);
    };
  }, [isMobile]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        margin: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        ref={headerRef}
        component="header"
        sx={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1200,
          transition: 'background-color 0.3s ease-in-out',
          transform: 'translateZ(0)',
        }}
      >
        <Navbar />
      </Box>

      <Box
        component="main"
        ref={mainRef}
        sx={{
          flex: 1,
          overflow: 'auto',
        }}
      >
        <MainComponent />
      </Box>

      {isMobile && (
        <Box
          ref={footerRef}
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 'env(safe-area-inset-bottom, 0px)',
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
            width: '100%',
            zIndex: 1100,
          }}
        >
          <BottomNavigation
            value={location.pathname}
            onChange={(event, newValue) => { navigate(newValue); }}
            showLabels={false}
            sx={{
              height: '100%',
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                padding: '6px 0',
                '.MuiSvgIcon-root': { 
                  fontSize: { xs: 24, sm: 28 },
                  marginBottom: '2px',
                  transition: 'font-size 0.2s ease-in-out',
                },
              }
            }}
          >
            {pages.map((page) => (
              <BottomNavigationAction
                key={page.path}
                label={page.name}
                icon={page.icon}
                value={page.path}
                showLabel={location.pathname === page.path}
              />
            ))}
          </BottomNavigation>
        </Box>
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