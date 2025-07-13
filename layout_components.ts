// File: src/components/layout/Layout.tsx
import React, { ReactNode, useState } from 'react'
import { Box, useMediaQuery, useTheme as useMuiTheme } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './Header'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'
import BackgroundAnimation from './BackgroundAnimation'
import { useGame } from '../../hooks/useGame'
import { useTheme } from '../../hooks/useTheme'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useMuiTheme()
  const { isDarkMode } = useTheme()
  const { gameState } = useGame()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusBarVisible, setStatusBarVisible] = useState(true)
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleStatusBar = () => {
    setStatusBarVisible(!statusBarVisible)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 50%, #0F0F0F 100%)'
          : 'linear-gradient(135deg, #F8F6F0 0%, #E8E6E3 50%, #F8F6F0 100%)',
        transition: 'all 0.5s ease',
      }}
    >
      {/* Animated Background Layer */}
      <BackgroundAnimation />
      
      {/* Header */}
      <Header 
        onToggleSidebar={toggleSidebar}
        onToggleStatusBar={toggleStatusBar}
        sidebarOpen={sidebarOpen}
        statusBarVisible={statusBarVisible}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          display: 'flex',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || !isMobile) && (
            <motion.div
              initial={{ x: isMobile ? -300 : -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? -300 : -250, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                position: isMobile ? 'fixed' : 'relative',
                zIndex: isMobile ? 1200 : 'auto',
                height: isMobile ? '100vh' : 'auto',
                top: isMobile ? 0 : 'auto',
              }}
            >
              <Sidebar 
                open={sidebarOpen || !isMobile}
                onClose={() => setSidebarOpen(false)}
                variant={isMobile ? 'temporary' : 'persistent'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            marginLeft: (!isMobile && !sidebarOpen) ? 0 : 0,
            transition: 'margin-left 0.3s ease',
            minHeight: 'calc(100vh - 64px)', // Account for header height
            padding: {
              xs: 1,
              sm: 2,
              md: 3,
            },
          }}
        >
          {/* Content with Magic Border */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              flex: 1,
              position: 'relative',
              borderRadius: '16px',
              background: isDarkMode
                ? 'rgba(26, 26, 26, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDarkMode ? 'rgba(74, 155, 62, 0.2)' : 'rgba(45, 90, 39, 0.2)'}`,
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(45, 90, 39, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Magic Glow Effect */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                animation: 'shimmer 3s infinite',
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              }}
            />
            
            {/* Scrollable Content Area */}
            <Box
              sx={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: {
                  xs: 2,
                  sm: 3,
                  md: 4,
                },
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.primary.main,
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.primary.dark,
                  },
                },
              }}
            >
              {children}
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* Status Bar */}
      <AnimatePresence>
        {statusBarVisible && gameState.isGameActive && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatusBar onClose={() => setStatusBarVisible(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </Box>
  )
}

export default Layout

// File: src/components/layout/Header.tsx
import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
  Badge,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Settings,
  AccountCircle,
  Notifications,
  Home,
  GamepadOutlined,
  AdminPanelSettings,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../hooks/useNotification'
import { useGame } from '../../hooks/useGame'

interface HeaderProps {
  onToggleSidebar: () => void
  onToggleStatusBar: () => void
  sidebarOpen: boolean
  statusBarVisible: boolean
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleStatusBar,
  sidebarOpen,
  statusBarVisible,
}) => {
  const theme = useMuiTheme()
  const { isDarkMode, toggleTheme, themeMode } = useTheme()
  const { user, signOut } = useAuth()
  const { notifications } = useNotification()
  const { gameState } = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Startseite'
      case '/game':
        return gameState.playerName ? `${gameState.playerName}s Abenteuer` : 'Spiel'
      case '/admin':
        return 'Administration'
      case '/settings':
        return 'Einstellungen'
      case '/about':
        return 'Über uns'
      case '/dev':
        return 'Entwicklertools'
      default:
        return 'Das Magische Zauberbuch'
    }
  }

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Brightness7 />
      case 'dark':
        return <Brightness4 />
      default:
        return isDarkMode ? <Brightness4 /> : <Brightness7 />
    }
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 240, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(74, 155, 62, 0.2)' : 'rgba(45, 90, 39, 0.2)'}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          padding: { xs: '0 16px', sm: '0 24px' },
        }}
      >
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onToggleSidebar}
          sx={{
            marginRight: 2,
            '&:hover': {
              background: theme.palette.primary.main + '20',
            },
          }}
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <MenuIcon />
          </motion.div>
        </IconButton>

        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', flex: 1 }}
        >
          <Box
            component="img"
            src="/icons/icon-192x192.png"
            alt="Zauberbuch Logo"
            sx={{
              height: { xs: 32, sm: 40 },
              width: { xs: 32, sm: 40 },
              marginRight: 2,
              borderRadius: '8px',
              boxShadow: `0 2px 8px ${theme.palette.primary.main}40`,
            }}
          />
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              Das Magische Zauberbuch
            </Typography>
            {!isMobile && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  opacity: 0.7,
                  fontSize: '0.75rem',
                  fontStyle: 'italic',
                }}
              >
                {getPageTitle()}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Navigation Shortcuts */}
          {!isMobile && (
            <>
              <IconButton
                color="inherit"
                onClick={() => navigate('/')}
                title="Startseite"
                sx={{
                  opacity: location.pathname === '/' ? 1 : 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                <Home />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={() => navigate('/game')}
                title="Spiel"
                sx={{
                  opacity: location.pathname === '/game' ? 1 : 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                <GamepadOutlined />
              </IconButton>
              {user && (
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/admin')}
                  title="Administration"
                  sx={{
                    opacity: location.pathname === '/admin' ? 1 : 0.7,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <AdminPanelSettings />
                </IconButton>
              )}
            </>
          )}

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            title="Benachrichtigungen"
          >
            <Badge badgeContent={notifications.length} color="secondary">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Theme Toggle */}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            title={`Theme: ${themeMode} (${isDarkMode ? 'dunkel' : 'hell'})`}
          >
            <motion.div
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {getThemeIcon()}
            </motion.div>
          </IconButton>

          {/* Settings */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/settings')}
            title="Einstellungen"
          >
            <Settings />
          </IconButton>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            title={user ? user.email : 'Anmelden'}
          >
            {user ? (
              <Avatar
                src={user.user_metadata?.avatar_url}
                sx={{ width: 32, height: 32 }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {user ? (
            [
              <MenuItem key="profile" onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 2 }} />
                Profil
              </MenuItem>,
              <MenuItem key="settings" onClick={() => { handleMenuClose(); navigate('/settings') }}>
                <Settings sx={{ mr: 2 }} />
                Einstellungen
              </MenuItem>,
              <MenuItem key="logout" onClick={() => { handleMenuClose(); signOut() }}>
                Abmelden
              </MenuItem>
            ]
          ) : (
            <MenuItem onClick={() => { handleMenuClose(); navigate('/auth') }}>
              Anmelden
            </MenuItem>
          )}
        </Menu>

        {/* Notification Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: { maxWidth: 300, maxHeight: 400 }
          }}
        >
          {notifications.length === 0 ? (
            <MenuItem disabled>Keine Benachrichtigungen</MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem key={notification.id} onClick={handleNotificationClose}>
                <Box>
                  <Typography variant="subtitle2">{notification.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header

// File: src/components/layout/Sidebar.tsx
import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  useTheme as useMuiTheme,
} from '@mui/material'
import {
  Home,
  GamepadOutlined,
  AdminPanelSettings,
  Settings,
  Info,
  ExpandLess,
  ExpandMore,
  Flag,
  Person,
  Inventory,
  TrendingUp,
  Build,
  Save,
  CloudDownload,
  BugReport,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useGame } from '../../hooks/useGame'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  open: boolean
  onClose: () => void
  variant: 'temporary' | 'persistent'
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const theme = useMuiTheme()
  const { isDarkMode } = useTheme()
  const { gameState } = useGame()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [gameMenuOpen, setGameMenuOpen] = React.useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = React.useState(false)
  const [devMenuOpen, setDevMenuOpen] = React.useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    if (variant === 'temporary') {
      onClose()
    }
  }

  const sidebarWidth = 280

  const mainMenuItems = [
    {
      text: 'Startseite',
      icon: <Home />,
      path: '/',
    },
    {
      text: 'Spiel',
      icon: <GamepadOutlined />,
      path: '/game',
      hasSubmenu: true,
      submenuOpen: gameMenuOpen,
      onToggle: () => setGameMenuOpen(!gameMenuOpen),
      badge: gameState.isGameActive ? 'Aktiv' : undefined,
    },
    {
      text: 'Administration',
      icon: <AdminPanelSettings />,
      path: '/admin',
      hasSubmenu: true,
      submenuOpen: adminMenuOpen,
      onToggle: () => setAdminMenuOpen(!adminMenuOpen),
      requireAuth: true,
    },
    {
      text: 'Einstellungen',
      icon: <Settings />,
      path: '/settings',
    },
    {
      text: 'Über uns',
      icon: <Info />,
      path: '/about',
    },
  ]

  const gameSubmenuItems = [
    {
      text: 'Spielerstatus',
      icon: <Person />,
      action: () => console.log('Show player status'),
    },
    {
      text: 'Inventar',
      icon: <Inventory />,
      action: () => console.log('Show inventory'),
    },
    {
      text: 'Statistiken',
      icon: <TrendingUp />,
      action: () => console.log('Show statistics'),
    },
    {
      text: 'Spiel speichern',
      icon: <Save />,
      action: () => console.log('Save game'),
      disabled: !gameState.isGameActive,
    },
    {
      text: 'Spiel laden',
      icon: <CloudDownload />,
      action: () => console.log('Load game'),
    },
  ]

  const adminSubmenuItems = [
    {
      text: 'Szenen verwalten',
      icon: <Flag />,
      path: '/admin/scenes',
    },
    {
      text: 'KI-Generator',
      icon: <Build />,
      path: '/admin/ai-generator',
    },
    {
      text: 'Export/Import',
      icon: <CloudDownload />,
      path: '/admin/export',
    },
  ]

  const devSubmenuItems = [
    {
      text: 'Debug-Panel',
      icon: <BugReport />,
      path: '/dev/debug',
    },
    {
      text: 'Flag-Editor',
      icon: <Flag />,
      path: '/dev/flags',
    },
    {
      text: 'Test-Runner',
      icon: <Build />,
      path: '/dev/tests',
    },
  ]

  if (import.meta.env.DEV) {
    mainMenuItems.push({
      text: 'Entwicklertools',
      icon: <BugReport />,
      path: '/dev',
      hasSubmenu: true,
      submenuOpen: devMenuOpen,
      onToggle: () => setDevMenuOpen(!devMenuOpen),
    } as any)
  }

  const isActive = (path: string) => location.pathname === path

  const drawerContent = (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100%',
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 240, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${isDarkMode ? 'rgba(74, 155, 62, 0.2)' : 'rgba(45, 90, 39, 0.2)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          padding: 3,
          borderBottom: `1px solid ${isDarkMode ? 'rgba(74, 155, 62, 0.2)' : 'rgba(45, 90, 39, 0.2)'}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Cinzel, serif',
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          Navigation
        </Typography>
        {gameState.isGameActive && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              opacity: 0.7,
              mt: 1,
            }}
          >
            {gameState.playerName} • Level {gameState.stats.level}
          </Typography>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ padding: 1 }}>
        {mainMenuItems.map((item, index) => {
          if (item.requireAuth && !user) return null

          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={item.hasSubmenu ? item.onToggle : () => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                      border: `1px solid ${theme.palette.primary.main}40`,
                    },
                    '&:hover': {
                      background: `${theme.palette.primary.main}10`,
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 400,
                    }}
                  />
                  {item.badge && (
                    <Box
                      sx={{
                        background: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {item.badge}
                    </Box>
                  )}
                  {item.hasSubmenu && (
                    item.submenuOpen ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Submenu for Game */}
              {item.text === 'Spiel' && (
                <Collapse in={item.submenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {gameSubmenuItems.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding sx={{ pl: 4 }}>
                        <ListItemButton
                          onClick={subItem.action}
                          disabled={subItem.disabled}
                          sx={{
                            borderRadius: 2,
                            mx: 1,
                            opacity: subItem.disabled ? 0.5 : 1,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {/* Submenu for Admin */}
              {item.text === 'Administration' && (
                <Collapse in={item.submenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {adminSubmenuItems.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding sx={{ pl: 4 }}>
                        <ListItemButton
                          onClick={() => handleNavigation(subItem.path)}
                          selected={isActive(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            mx: 1,
                            '&.Mui-selected': {
                              background: `${theme.palette.primary.main}20`,
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}

              {/* Submenu for Dev Tools */}
              {item.text === 'Entwicklertools' && (
                <Collapse in={item.submenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {devSubmenuItems.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding sx={{ pl: 4 }}>
                        <ListItemButton
                          onClick={() => handleNavigation(subItem.path)}
                          selected={isActive(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            mx: 1,
                            '&.Mui-selected': {
                              background: `${theme.palette.primary.main}20`,
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </motion.div>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Drawer
      variant={variant}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          border: 'none',
          background: 'transparent',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar