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
import { Link } from 'react-router-dom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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
  const [helpOpen, setHelpOpen] = useState(false);

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
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <Container maxWidth={false}>
          <Toolbar disableGutters sx={{ minHeight: '100%' }}>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex' },
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              Zeitrapportierung
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
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ minHeight: '100%' }}>
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex' },
              fontWeight: 700,
              color: 'text.primary',
              textDecoration: 'none',
            }}
          >
            Zeitrapportierung
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

          <Box sx={{ flexGrow: 0, display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
            <IconButton
              size="large"
              aria-label="Benachrichtigungen anzeigen"
              aria-controls="menu-notifications"
              aria-haspopup="true"
              onClick={handleOpenNotifications}
              color="inherit"
              sx={{ color: 'text.primary', order: 1 }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0, ml: 1, order: 2 }}
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

            <IconButton
              onClick={() => setHelpOpen(true)}
              sx={{ p: 0, ml: 1, order: 3 }}
              aria-label="Hilfe anzeigen"
            >
              <HelpOutlineIcon />
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
              <MenuItem onClick={() => { setHelpOpen(true); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <HelpOutlineIcon fontSize="small" />
                </ListItemIcon>
                <Typography>Hilfe</Typography>
              </MenuItem>
            </Menu>

            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Hilfe &amp; Erklärung</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body1" gutterBottom>
                  Willkommen zur Freelancer App!<br /><br />
                  Mit dieser App kannst du deine Projektzeiten einfach erfassen, verwalten und auswerten. <br /><br />
                  <b>Kurzanleitung:</b><br />
                  <ul>
                    <li>Starte die Zeitmessung für ein Projekt mit "Start".</li>
                    <li>Stoppe sie, wenn du fertig bist.</li>
                    <li>Alle Einträge findest du unter "Zeiteinträge".</li>
                    <li>Statistiken und Export findest du in den jeweiligen Menüpunkten.</li>
                  </ul>
                  <br />
                  <b>Tagesausgleich:</b><br />
                  <ul>
                    <li>Mit dem Tagesausgleich kannst du am Ende des Tages deine erfassten Zeiten auf deine tatsächliche Arbeitszeit anpassen. So kannst du z.B. Pausen abziehen oder kleine Rundungen vornehmen, damit die Summe deiner Zeiteinträge genau zu deinem Arbeitstag passt.</li>
                  </ul>
                  <br />
                  <b>Tipps:</b><br />
                  <ul>
                    <li>Du kannst im Profil Darkmode und Sprache einstellen.</li>
                    <li>Die App funktioniert auch als PWA (auf dem Handy installierbar).</li>
                  </ul>
                  <br />
                  <b>FAQ:</b><br />
                  <ul>
                    <li><b>Was passiert, wenn ich die App schließe?</b> – Die laufende Zeitmessung bleibt erhalten.</li>
                    <li><b>Wie kann ich meine Daten exportieren?</b> – Über den Menüpunkt "Export".</li>
                  </ul>
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHelpOpen(false)}>Schließen</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 