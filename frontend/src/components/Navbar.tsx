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
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

const pages = [
  { name: 'Zeiterfassung', path: '/dashboard' },
  { name: 'Zeiteinträge', path: '/time-entries' },
  { name: 'Statistiken', path: '/statistics' },
  { name: 'Export', path: '/export' },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [notifications] = useState<string[]>([]);
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
      <AppBar 
        position="static" 
        sx={{ 
          height: '100%',
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth={false}>
          <Toolbar disableGutters sx={{ minHeight: '100%' }}>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'flex' },
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              Freelancer App
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar 
      position="static"
      sx={{ 
        height: '100%',
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ minHeight: '100%' }}>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex' },
              fontWeight: 700,
              color: 'text.primary',
              textDecoration: 'none',
            }}
          >
            Freelancer App
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  onClick={() => handleNavigation(page.path)}
                  sx={{
                    color: 'text.primary',
                    display: 'block',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    backgroundColor: location.pathname === page.path ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {page.name}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: 0, display: 'flex', gap: 1 }}>
            <IconButton
              size="large"
              aria-label="Benachrichtigungen anzeigen"
              aria-controls="menu-notifications"
              aria-haspopup="true"
              onClick={handleOpenNotifications}
              color="inherit"
              sx={{ color: 'text.primary' }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0, ml: 1 }}
            >
              <Avatar 
                alt={user.name || 'Benutzer'} 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                {user.name?.[0] || user.email?.[0] || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              sx={{ mt: '45px' }}
              id="menu-notifications"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'top',
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
                <MenuItem disabled>
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
              <MenuItem onClick={() => { handleNavigation('/profile'); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography>Profil</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography>Abmelden</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 