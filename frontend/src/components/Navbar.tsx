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
  Avatar,
  ListItemIcon,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LogoutIcon from '@mui/icons-material/Logout';

const pages = [
  { name: 'Zeiterfassung', path: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Zeiteinträge', path: '/time-entries', icon: <ListAltIcon /> },
  { name: 'Statistiken', path: '/statistics', icon: <BarChartIcon /> },
  { name: 'Export', path: '/export', icon: <FileDownloadIcon /> },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [notifications] = useState<string[]>([]); // Hier später mit echtem State ersetzen
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleCloseNotifications();
  };

  const handleLogout = () => {
    logout();
    handleCloseNotifications();
    navigate('/login');
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  if (!user) {
    return (
      <AppBar position="static" sx={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
    <AppBar position="fixed" sx={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
            <>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                <IconButton
                  onClick={handleOpenUserMenu}
                  sx={{ p: 0 }}
                >
                  <Avatar alt={user?.email} src="/static/images/avatar/2.jpg" />
                </IconButton>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => {
                    handleCloseUserMenu();
                    navigate('/profile');
                  }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Profil</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    handleCloseUserMenu();
                    handleLogout();
                  }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Abmelden</Typography>
                  </MenuItem>
                </Menu>
              </Box>
              <BottomNavigation
                value={location.pathname}
                onChange={(event, newValue) => {
                  navigate(newValue);
                }}
                showLabels={false}
                sx={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1200,
                  height: '56px',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  boxShadow: '0 -2px 8px 0 rgba(0,0,0,0.04)',
                  bgcolor: 'background.paper',
                  borderTop: 1,
                  borderColor: 'divider',
                  display: { xs: 'flex', sm: 'none' },
                  justifyContent: 'space-around',
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
                      '.MuiSvgIcon-root': {
                        fontSize: 28,
                        marginBottom: '2px',
                      },
                    }}
                  />
                ))}
              </BottomNavigation>
            </>
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
            </Box>
          )}

          {/* Desktop Profile Menu */}
          {!isMobile && (
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
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

              <IconButton
                onClick={handleOpenUserMenu}
                sx={{ p: 0 }}
              >
                <Avatar alt={user?.email} src="/static/images/avatar/2.jpg" />
              </IconButton>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  navigate('/profile');
                }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Profil</Typography>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleCloseUserMenu();
                  handleLogout();
                }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography textAlign="center">Abmelden</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* Notifications Menu (shared between mobile and desktop) */}
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
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 