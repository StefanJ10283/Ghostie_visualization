import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Divider, { dividerClasses } from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { paperClasses } from '@mui/material/Paper';
import { listClasses } from '@mui/material/List';
import { listItemIconClasses } from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HistoryIcon from '@mui/icons-material/History';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import StorageIcon from '@mui/icons-material/Storage';
import StarIcon from '@mui/icons-material/Star';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../auth/AuthContext';

const DRAWER_WIDTH = 220;

const navItems = [
  { label: 'Dashboard',          icon: <DashboardIcon />,     path: '/' },
  { label: 'Sentiment Analysis', icon: <AnalyticsIcon />,     path: '/sentiment' },
  { label: 'Leaderboard',        icon: <LeaderboardIcon />,   path: '/leaderboard' },
  { label: 'History',            icon: <HistoryIcon />,       path: '/history' },
  { label: 'Favourites',         icon: <StarIcon />,          path: '/favourites' },
  { label: 'Data Collection',    icon: <CloudDownloadIcon />, path: '/collect' },
  { label: 'Data Retrieval',     icon: <StorageIcon />,       path: '/retrieval' },
];

const MenuItem = styled(MuiMenuItem)({ margin: '2px 0' });

function OptionsMenu({ onLogout, onAddAccount }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { accounts, user, switchAccount } = useAuth();
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  const otherAccounts = accounts.filter((a) => a.user.email !== user?.email);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ borderColor: 'transparent' }}
      >
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          [`& .${listClasses.root}`]: { padding: '4px' },
          [`& .${paperClasses.root}`]: { padding: 0, minWidth: 200 },
          [`& .${dividerClasses.root}`]: { margin: '4px -4px' },
        }}
      >
        {/* Current account */}
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: 12, mr: 1 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <ListItemText
            primary={user?.username}
            secondary={user?.email}
            primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
            secondaryTypographyProps={{ fontSize: 11 }}
          />
          <ListItemIcon sx={{ ml: 1, minWidth: 0 }}>
            <CheckRoundedIcon fontSize="small" color="primary" />
          </ListItemIcon>
        </MenuItem>

        {/* Other saved accounts */}
        {otherAccounts.length > 0 && <Divider />}
        {otherAccounts.map((a) => (
          <MenuItem key={a.user.email} onClick={() => { switchAccount(a.user.email); close(); }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'text.secondary', fontSize: 12, mr: 1 }}>
              {a.user.username?.[0]?.toUpperCase()}
            </Avatar>
            <ListItemText
              primary={a.user.username}
              secondary={a.user.email}
              primaryTypographyProps={{ fontSize: 13 }}
              secondaryTypographyProps={{ fontSize: 11 }}
            />
          </MenuItem>
        ))}

        <Divider />
        <MenuItem onClick={() => { onAddAccount(); close(); }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>Add another account</ListItemText>
        </MenuItem>

        <Divider />
        <MenuItem
          onClick={() => { onLogout(); close(); }}
          sx={{ [`& .${listItemIconClasses.root}`]: { ml: 'auto', minWidth: 0 } }}
        >
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>Logout</ListItemText>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </>
  );
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleAddAccount = () => {
    navigate('/signin', { state: { addAccount: true } });
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: '64px' }}>
      <Box sx={{ mt: 2, flex: 1 }}>
        <Box sx={{ px: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: 'linear-gradient(135deg, hsl(142,69%,58%), hsl(262,83%,74%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AnalyticsIcon sx={{ fontSize: 18, color: 'hsl(234,40%,10%)' }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(210,40%,93%)', lineHeight: 1.2, fontFamily: '"Sora", sans-serif' }}>
              Ghostie
            </Typography>
            <Typography variant="caption" sx={{ color: 'hsl(215,20%,60%)', fontSize: 10 }}>
              Sentiment Analyzer
            </Typography>
          </Box>
        </Box>
        <List>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={active}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2, mx: 1, mb: 0.5,
                    color: active ? 'hsl(142,69%,58%)' : 'hsl(215,20%,60%)',
                    bgcolor: active ? 'rgba(46,200,110,0.1) !important' : 'transparent',
                    boxShadow: active ? '0 0 20px rgba(46,200,110,0.12)' : 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'hsl(210,40%,93%)' },
                    transition: 'all 0.15s',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid hsl(230, 25%, 20%)',
        }}
      >
        <Avatar
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}
        >
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </Avatar>
        <Box sx={{ mr: 'auto', overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }} noWrap>
            {user?.username ?? ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
            {user?.email ?? ''}
          </Typography>
        </Box>
        <OptionsMenu onLogout={handleLogout} onAddAccount={handleAddAccount} />
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'hsl(234, 40%, 14%)' }}>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        borderBottom: '1px solid hsl(230, 25%, 20%)',
        bgcolor: 'hsl(228, 38%, 16%)',
        backdropFilter: 'blur(16px)',
        color: 'hsl(210,40%,93%)',
        left: 0,
        right: 0,
        width: '100%',
      }}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: 'hsl(210,40%,93%)' }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
            Ghostie Business Intelligence
          </Typography>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'hsl(234, 45%, 10%)', borderRight: '1px solid hsl(230, 25%, 20%)' } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'hsl(234, 45%, 10%)',
              borderRight: '1px solid hsl(230, 25%, 20%)',
              top: 0,
              height: '100vh',
            },
          }}>
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, ml: isMobile ? 0 : `${DRAWER_WIDTH}px`, mt: '64px', p: 3, bgcolor: 'hsl(234, 40%, 14%)', minHeight: 'calc(100vh - 64px)', width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` }}>
        {children}
      </Box>
    </Box>
  );
}
