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
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

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
              {t('navbar.title')}
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  const pages = [
    { name: t('navbar.timeTracking'), path: '/dashboard' },
    { name: t('navbar.timeEntries'), path: '/time-entries' },
    { name: t('navbar.statistics'), path: '/statistics' },
    { name: t('navbar.export'), path: '/export' },
  ];

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
            {t('navbar.title')}
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
                  <Typography>{t('navbar.noNotifications')}</Typography>
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
                <Typography>{t('navbar.profile')}</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography>{t('navbar.logout')}</Typography>
              </MenuItem>
              <MenuItem onClick={() => { setHelpOpen(true); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <HelpOutlineIcon fontSize="small" />
                </ListItemIcon>
                <Typography>{t('navbar.help')}</Typography>
              </MenuItem>
            </Menu>

            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>{t('help.title')}</DialogTitle>
              <DialogContent dividers>
                <Typography variant="body1" gutterBottom>
                  {t('help.welcome')}
                  <br /><br />
                  {t('help.instructions')}
                  <br /><br />
                  <b>{t('help.quickGuide')}:</b><br />
                  <ul>
                    <li>{t('help.quickGuide.start')}</li>
                    <li>{t('help.quickGuide.stop')}</li>
                    <li>{t('help.quickGuide.timeEntries')}</li>
                    <li>{t('help.quickGuide.statistics')}</li>
                  </ul>
                  <br />
                  <b>{t('help.dayAdjustment')}:</b><br />
                  <ul>
                    <li>{t('help.dayAdjustment.explanation')}</li>
                  </ul>
                  <br />
                  <b>{t('help.tips')}:</b><br />
                  <ul>
                    <li>{t('help.tips.darkMode')}</li>
                    <li>{t('help.tips.pwa')}</li>
                  </ul>
                  <br />
                  <b>{t('help.faq')}:</b><br />
                  <ul>
                    <li><b>{t('help.faq.closingApp')}:</b> {t('help.faq.closingApp.explanation')}</li>
                    <li><b>{t('help.faq.exportData')}:</b> {t('help.faq.exportData.explanation')}</li>
                  </ul>
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHelpOpen(false)}>{t('help.close')}</Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 