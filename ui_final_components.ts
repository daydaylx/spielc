// File: src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Card, CardContent, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { 
  Error as ErrorIcon, 
  Refresh, 
  Home, 
  BugReport,
  ExpandMore,
  ExpandLess 
} from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send error to logging service
    // Example: sendErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }))
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onToggleDetails={this.toggleDetails}
        />
      )
    }

    return this.props.children
  }
}

// Separate component for the error display to use hooks
const ErrorDisplay: React.FC<{
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  onRetry: () => void
  onGoHome: () => void
  onToggleDetails: () => void
}> = ({ error, errorInfo, showDetails, onRetry, onGoHome, onToggleDetails }) => {
  // Note: We can't use useTheme hook here directly in class component
  // So we'll use inline styles that match our theme
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  const theme = {
    palette: {
      primary: { main: '#2D5A27' },
      error: { main: '#f44336' },
      background: { 
        paper: isDarkMode ? '#1A1A1A' : '#FFFFFF',
        default: isDarkMode ? '#0F0F0F' : '#F8F6F0'
      },
      text: {
        primary: isDarkMode ? '#E8E6E3' : '#2C3E50',
        secondary: isDarkMode ? '#B0B0B0' : '#5D6D7E'
      }
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 600 }}
      >
        <Card
          elevation={8}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            border: `2px solid ${theme.palette.error.main}40`,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Error Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main}10, ${theme.palette.error.main}20)`,
              p: 3,
              textAlign: 'center',
              borderBottom: `1px solid ${theme.palette.error.main}30`,
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3 
              }}
            >
              <ErrorIcon 
                sx={{ 
                  fontSize: 64, 
                  color: theme.palette.error.main, 
                  mb: 2,
                  filter: `drop-shadow(0 0 10px ${theme.palette.error.main}40)`
                }} 
              />
            </motion.div>
            
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                color: theme.palette.error.main,
                mb: 1,
              }}
            >
              Etwas ist schief gelaufen
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: 400,
                margin: '0 auto',
              }}
            >
              Es tut uns leid, aber es ist ein unerwarteter Fehler aufgetreten. 
              Das magische Zauberbuch konnte diese Aktion nicht ausführen.
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* Error Message */}
            {error && (
              <Box
                sx={{
                  background: isDarkMode ? '#2a1a1a' : '#fff5f5',
                  border: `1px solid ${theme.palette.error.main}30`,
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme.palette.error.main,
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Fehlermeldung:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    color: theme.palette.text.primary,
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message || 'Unbekannter Fehler'}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
                mb: 3,
              }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={onRetry}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, #4A9B3E)`,
                    '&:hover': {
                      background: `linear-gradient(45deg, #1A3318, ${theme.palette.primary.main})`,
                    },
                  }}
                >
                  Erneut versuchen
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={onGoHome}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      background: `${theme.palette.primary.main}10`,
                    },
                  }}
                >
                  Zur Startseite
                </Button>
              </motion.div>
            </Box>

            {/* Technical Details Toggle */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                startIcon={<BugReport />}
                endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                onClick={onToggleDetails}
                sx={{
                  color: theme.palette.text.secondary,
                  textTransform: 'none',
                }}
              >
                {showDetails ? 'Details ausblenden' : 'Technische Details anzeigen'}
              </Button>

              {/* Technical Details */}
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      border: `1px solid ${theme.palette.text.secondary}20`,
                      borderRadius: 2,
                      textAlign: 'left',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.text.secondary,
                        mb: 1,
                        fontWeight: 600,
                      }}
                    >
                      Stack Trace:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: theme.palette.text.primary,
                        overflow: 'auto',
                        maxHeight: 200,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {error?.stack || 'Keine Stack-Trace verfügbar'}
                    </Box>

                    {errorInfo && (
                      <>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            color: theme.palette.text.secondary,
                            mt: 2,
                            mb: 1,
                            fontWeight: 600,
                          }}
                        >
                          Component Stack:
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: theme.palette.text.primary,
                            overflow: 'auto',
                            maxHeight: 200,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {errorInfo.componentStack}
                        </Box>
                      </>
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.text.secondary,
                        mt: 2,
                        fontStyle: 'italic',
                      }}
                    >
                      Zeitstempel: {new Date().toLocaleString('de-DE')}
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </Box>
          </CardContent>

          {/* Magical Bottom Border */}
          <Box
            sx={{
              height: 3,
              background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
              animation: 'shimmer 3s infinite',
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '-200px 0' },
                '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
              },
            }}
          />
        </Card>
      </motion.div>
    </Box>
  )
}

export default ErrorBoundary

// File: src/components/ui/ThemeToggle.tsx
import React from 'react'
import { IconButton, Tooltip, useTheme as useMuiTheme, Box } from '@mui/material'
import { 
  Brightness7, 
  Brightness4, 
  BrightnessAuto,
  Palette 
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  variant?: 'icon' | 'button' | 'fab'
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showLabel = false,
  variant = 'icon'
}) => {
  const muiTheme = useMuiTheme()
  const { isDarkMode, themeMode, toggleTheme, setThemeMode } = useTheme()

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Brightness7 />
      case 'dark':
        return <Brightness4 />
      case 'auto':
        return <BrightnessAuto />
      default:
        return <Palette />
    }
  }

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Hell'
      case 'dark':
        return 'Dunkel'
      case 'auto':
        return 'Auto'
      default:
        return 'Theme'
    }
  }

  const getTooltipText = () => {
    switch (themeMode) {
      case 'light':
        return 'Zu dunklem Modus wechseln'
      case 'dark':
        return 'Zu automatischem Modus wechseln'
      case 'auto':
        return 'Zu hellem Modus wechseln'
      default:
        return 'Theme wechseln'
    }
  }

  const getNextTheme = () => {
    switch (themeMode) {
      case 'light':
        return 'dark'
      case 'dark':
        return 'auto'
      case 'auto':
        return 'light'
      default:
        return 'auto'
    }
  }

  const handleToggle = () => {
    const nextTheme = getNextTheme()
    setThemeMode(nextTheme)
  }

  if (variant === 'button') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Box
          component="button"
          onClick={handleToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: `linear-gradient(45deg, ${muiTheme.palette.primary.main}20, ${muiTheme.palette.secondary.main}20)`,
            border: `1px solid ${muiTheme.palette.primary.main}40`,
            borderRadius: 2,
            padding: '8px 16px',
            color: muiTheme.palette.text.primary,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(45deg, ${muiTheme.palette.primary.main}30, ${muiTheme.palette.secondary.main}30)`,
              border: `1px solid ${muiTheme.palette.primary.main}60`,
            },
          }}
        >
          <motion.div
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {getThemeIcon()}
          </motion.div>
          {showLabel && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {getThemeLabel()}
            </span>
          )}
        </Box>
      </motion.div>
    )
  }

  return (
    <Tooltip title={getTooltipText()} arrow>
      <IconButton
        onClick={handleToggle}
        size={size}
        sx={{
          color: muiTheme.palette.text.primary,
          background: `linear-gradient(45deg, ${muiTheme.palette.primary.main}10, ${muiTheme.palette.secondary.main}10)`,
          border: `1px solid ${muiTheme.palette.primary.main}20`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: `linear-gradient(45deg, ${muiTheme.palette.primary.main}20, ${muiTheme.palette.secondary.main}20)`,
            border: `1px solid ${muiTheme.palette.primary.main}40`,
            transform: 'scale(1.1)',
          },
        }}
        component={motion.button}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={themeMode}
            initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            {getThemeIcon()}
          </motion.div>
        </AnimatePresence>

        {/* Theme Mode Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: themeMode === 'auto' 
              ? `linear-gradient(45deg, ${muiTheme.palette.primary.main}, ${muiTheme.palette.secondary.main})`
              : themeMode === 'dark' 
                ? muiTheme.palette.primary.main
                : muiTheme.palette.secondary.main,
            border: `2px solid ${muiTheme.palette.background.paper}`,
            boxShadow: `0 0 4px ${muiTheme.palette.primary.main}40`,
          }}
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle

// File: src/components/common/OfflineIndicator.tsx
import React from 'react'
import { Box, Typography, Chip, useTheme } from '@mui/material'
import { 
  WifiOff, 
  Wifi, 
  CloudOff, 
  CloudDone 
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '../../hooks/useOffline'

const OfflineIndicator: React.FC = () => {
  const theme = useTheme()
  const { isOnline, lastOnlineTime } = useOffline()

  const formatLastOnlineTime = () => {
    if (!lastOnlineTime) return ''
    
    const now = new Date()
    const diff = now.getTime() - lastOnlineTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `vor ${days} Tag(en)`
    if (hours > 0) return `vor ${hours} Stunde(n)`
    if (minutes > 0) return `vor ${minutes} Minute(n)`
    return 'gerade eben'
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main}90, ${theme.palette.error.dark}90)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.error.main}`,
              borderRadius: 3,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              boxShadow: `0 8px 32px ${theme.palette.error.main}40`,
              minWidth: 280,
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut' 
              }}
            >
              <WifiOff sx={{ color: 'white', fontSize: 24 }} />
            </motion.div>

            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 600,
                  mb: 0.5 
                }}
              >
                Keine Internetverbindung
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem'
                }}
              >
                Zuletzt online {formatLastOnlineTime()}
              </Typography>
            </Box>

            <Chip
              size="small"
              icon={<CloudOff sx={{ fontSize: 14 }} />}
              label="Offline"
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontSize: '0.7rem',
              }}
            />
          </Box>
        </motion.div>
      )}
      
      {/* Online Indicator (briefly shown when reconnecting) */}
      {isOnline && lastOnlineTime && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
          }}
        >
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 2 }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main}90, ${theme.palette.success.dark}90)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.success.main}`,
                borderRadius: 3,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                boxShadow: `0 8px 32px ${theme.palette.success.main}40`,
                minWidth: 280,
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360] 
                }}
                transition={{ 
                  duration: 1, 
                  ease: 'easeInOut' 
                }}
              >
                <Wifi sx={{ color: 'white', fontSize: 24 }} />
              </motion.div>

              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 600,
                    mb: 0.5 
                  }}
                >
                  Verbindung wiederhergestellt
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.75rem'
                  }}
                >
                  Das Zauberbuch ist wieder online
                </Typography>
              </Box>

              <Chip
                size="small"
                icon={<CloudDone sx={{ fontSize: 14 }} />}
                label="Online"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator

// File: src/components/common/ProtectedRoute.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallback = null,
}) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <LoadingSpinner
          size="large"
          text="Authentifizierung wird überprüft..."
        />
      </Box>
    )
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to login with return URL
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  // Check admin requirement
  if (requireAdmin && (!user || !user.user_metadata?.isAdmin)) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to home if not admin
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

// File: src/components/common/ValidationFeedback.tsx
import React from 'react'
import { Box, Typography, Alert, useTheme } from '@mui/material'
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info 
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

interface ValidationRule {
  key: string
  label: string
  isValid: boolean
  message?: string
  type?: 'error' | 'warning' | 'info' | 'success'
}

interface ValidationFeedbackProps {
  rules: ValidationRule[]
  value?: string
  showOnlyInvalid?: boolean
  compact?: boolean
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  rules,
  value = '',
  showOnlyInvalid = false,
  compact = false,
}) => {
  const theme = useTheme()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 16 }} />
      case 'error':
        return <Error sx={{ fontSize: 16 }} />
      case 'warning':
        return <Warning sx={{ fontSize: 16 }} />
      case 'info':
        return <Info sx={{ fontSize: 16 }} />
      default:
        return <CheckCircle sx={{ fontSize: 16 }} />
    }
  }

  const getColor = (rule: ValidationRule) => {
    if (rule.isValid) {
      return theme.palette.success.main
    }
    
    switch (rule.type) {
      case 'error':
        return theme.palette.error.main
      case 'warning':
        return theme.palette.warning.main
      case 'info':
        return theme.palette.info.main
      default:
        return theme.palette.error.main
    }
  }

  const filteredRules = showOnlyInvalid 
    ? rules.filter(rule => !rule.isValid)
    : rules

  const allValid = rules.every(rule => rule.isValid)
  const hasErrors = rules.some(rule => !rule.isValid && rule.type !== 'warning')

  if (compact) {
    return (
      <AnimatePresence>
        {!allValid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity={hasErrors ? 'error' : 'warning'}
              sx={{ mt: 1 }}
            >
              <Typography variant="body2">
                {hasErrors 
                  ? `${rules.filter(r => !r.isValid).length} Validierungsfehler`
                  : 'Einige Anforderungen sind nicht erfüllt'
                }
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {filteredRules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              mt: 2,
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              background: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              Validierung
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredRules.map((rule, index) => (
                <motion.div
                  key={rule.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      borderRadius: 1,
                      background: rule.isValid 
                        ? `${theme.palette.success.main}10`
                        : `${getColor(rule)}10`,
                      border: `1px solid ${getColor(rule)}30`,
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: rule.isValid ? [1, 1.2, 1] : 1,
                        rotate: rule.isValid ? [0, 360, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      style={{ color: getColor(rule) }}
                    >
                      {getIcon(rule.isValid ? 'success' : rule.type || 'error')}
                    </motion.div>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: getColor(rule),
                          textDecoration: rule.isValid ? 'line-through' : 'none',
                          opacity: rule.isValid ? 0.7 : 1,
                        }}
                      >
                        {rule.label}
                      </Typography>
                      {rule.message && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {rule.message}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* Overall Status */}
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <motion.div
                animate={{
                  scale: allValid ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                style={{ 
                  color: allValid 
                    ? theme.palette.success.main 
                    : hasErrors 
                      ? theme.palette.error.main
                      : theme.palette.warning.main
                }}
              >
                {getIcon(allValid ? 'success' : hasErrors ? 'error' : 'warning')}
              </motion.div>
              
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: allValid 
                    ? theme.palette.success.main 
                    : hasErrors 
                      ? theme.palette.error.main
                      : theme.palette.warning.main
                }}
              >
                {allValid 
                  ? 'Alle Anforderungen erfüllt'
                  : hasErrors
                    ? 'Validierung fehlgeschlagen'
                    : 'Warnungen vorhanden'
                }
              </Typography>
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ValidationFeedback