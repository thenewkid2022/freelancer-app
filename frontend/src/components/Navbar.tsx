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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../contexts/AuthContext';

const pages = [
  { name: 'Zeiteinträge', path: '/time-entries' },
  { name: 'Zahlungen', path: '/payments' },
  { name: 'Statistiken', path: '/statistics' },
  { name: 'Profil', path: '/profile' },
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

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  size="large"
                  aria-label="navigation menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{
                    display: { xs: 'block', md: 'none' },
                  }}
                >
                  {pages.map((page) => (
                    <MenuItem
                      key={page.path}
                      onClick={() => handleNavigation(page.path)}
                      selected={location.pathname === page.path}
                    >
                      <Typography textAlign="center">{page.name}</Typography>
                    </MenuItem>
                  ))}
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Abmelden</Typography>
                  </MenuItem>
                </Menu>
              </Box>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}
              >
                Freelancer App
              </Typography>
            </>
          ) : (
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