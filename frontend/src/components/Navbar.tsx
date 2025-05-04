import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  useMediaQuery,
  useTheme,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const pages = [
  { name: 'Zeiterfassung', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Zeiteinträge', path: '/time-entries', icon: <ListAltIcon /> },
  { name: 'Statistiken', path: '/statistics', icon: <BarChartIcon /> },
  { name: 'Profil', path: '/profile', icon: <PersonIcon /> },
  { name: 'Export', path: '/export', icon: <FileDownloadIcon /> },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [notifications] = useState<string[]>([]); // Hier später mit echtem State ersetzen

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleCloseNavMenu();
  };

  const handleLogout = () => {
    logout();
    handleCloseNavMenu();
    navigate('/login');
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const navIcons = [
    <DashboardIcon />,
    <ListAltIcon />,
    <BarChartIcon />,
    <PersonIcon />,
    <FileDownloadIcon />
  ];

  if (!user) {
    return (
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'flex', md: 'flex' } }}
            >
              Freelancer App
            </Typography>
            <Box sx={{ flexGrow: 0 }}>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
              >
                Anmelden
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/register')}
              >
                Registrieren
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
          >
            Freelancer App
          </Typography>

          {/* Mobile Navigation */}
          {isMobile && (
            <BottomNavigation
              value={location.pathname}
              onChange={(event, newValue) => {
                navigate(newValue);
              }}
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                borderTop: '1px solid',
                borderColor: 'divider',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: 'auto',
                  padding: '6px 8px',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    '&.Mui-selected': {
                      fontSize: '0.7rem',
                    },
                  },
                },
                // Abstand für iPhone-Notch und abgerundete Ecken
                paddingLeft: 'env(safe-area-inset-left)',
                paddingRight: 'env(safe-area-inset-right)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {pages.map((page) => (
                <BottomNavigationAction
                  key={page.path}
                  label={page.name}
                  value={page.path}
                  icon={page.icon}
                  sx={{
                    '& .MuiBottomNavigationAction-label': {
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    },
                  }}
                />
              ))}
            </BottomNavigation>
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  onClick={() => handleNavigation(page.path)}
                  sx={{
                    my: 2,
                    color: 'white',
                    display: 'block',
                    ...(location.pathname === page.path && {
                      borderBottom: '2px solid white',
                    }),
                  }}
                >
                  {page.name}
                </Button>
              ))}
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{ my: 2, ml: 2 }}
              >
                Abmelden
              </Button>
            </Box>
          )}

          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              size="large"
              aria-label="show notifications"
              aria-controls="menu-notifications"
              aria-haspopup="true"
              onClick={handleOpenNotifications}
              color="inherit"
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              id="menu-notifications"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotifications}
            >
              {notifications.length === 0 ? (
                <MenuItem onClick={handleCloseNotifications}>
                  <Typography>Keine neuen Benachrichtigungen</Typography>
                </MenuItem>
              ) : (
                notifications.map((notification, index) => (
                  <MenuItem key={index} onClick={handleCloseNotifications}>
                    <Typography>{notification}</Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 