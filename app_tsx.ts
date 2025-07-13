// File: src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Fade } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'

import { useTheme } from './hooks/useTheme'
import { useAuth } from './hooks/useAuth'
import { useOffline } from './hooks/useOffline'
import { useNotification } from './hooks/useNotification'

import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import OfflineIndicator from './components/common/OfflineIndicator'
import Toast from './components/ui/Toast'

// Lazy Loading für bessere Performance
const HomePage = React.lazy(() => import('./pages/HomePage'))
const GamePage = React.lazy(() => import('./pages/GamePage'))
const AdminPage = React.lazy(() => import('./pages/AdminPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const DevTools = React.lazy(() => import('./devtools/DevPanel'))

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAuth?: boolean }> = ({ 
  children, 
  requireAuth = false 
}) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LoadingSpinner size="large" text="Authentifizierung wird überprüft..." />
      </Box>
    )
  }
  
  if (requireAuth && !user) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

// Page Transition Component
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Suspense Fallback Component
const SuspenseFallback: React.FC<{ page?: string }> = ({ page = "Seite" }) => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
    flexDirection="column"
  >
    <LoadingSpinner 
      size="large" 
      text={`${page} wird geladen...`}
    />
  </Box>
)

const App: React.FC = () => {
  const { theme, isDarkMode } = useTheme()
  const { isOnline } = useOffline()
  const { notifications, clearNotification } = useNotification()
  const location = useLocation()

  // Page Title Management
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Das Magische Zauberbuch - Startseite',
      '/game': 'Das Magische Zauberbuch - Spiel',
      '/admin': 'Das Magische Zauberbuch - Administration',
      '/settings': 'Das Magische Zauberbuch - Einstellungen',
      '/about': 'Das Magische Zauberbuch - Über uns',
      '/dev': 'Das Magische Zauberbuch - Entwicklertools'
    }
    
    const pageTitle = titles[location.pathname] || 'Das Magische Zauberbuch'
    document.title = pageTitle
    
    // Meta Description Update
    const descriptions: Record<string, string> = {
      '/': 'Willkommen zum magischen Textadventure mit KI-gesteuerter Story-Generierung',
      '/game': 'Erlebe dein persönliches Abenteuer in der magischen Welt',
      '/admin': 'Verwalte Szenen, Charaktere und Spielinhalte',
      '/settings': 'Personalisiere dein Spielerlebnis',
      '/about': 'Erfahre mehr über das Projekt und die Technologie'
    }
    
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc && descriptions[location.pathname]) {
      metaDesc.setAttribute('content', descriptions[location.pathname])
    }
  }, [location.pathname])

  // Performance Monitoring
  useEffect(() => {
    // Track page views in development
    if (import.meta.env.DEV) {
      console.log(`📍 Navigation zu: ${location.pathname}`)
    }
  }, [location.pathname])

  // Global Error Handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global Error:', event.error)
      // Hier könnte Sentry oder anderes Error Tracking integriert werden
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global Shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault()
            window.location.href = '/'
            break
          case 'g':
            event.preventDefault()
            window.location.href = '/game'
            break
          case 'd':
            if (import.meta.env.DEV) {
              event.preventDefault()
              window.location.href = '/dev'
            }
            break
        }
      }
      
      // Escape für Modals/Overlays
      if (event.key === 'Escape') {
        // Custom Event für Modal-Schließung
        window.dispatchEvent(new CustomEvent('close-modals'))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{
          minHeight: '100vh',
          background: theme.palette.background.default,
          color: theme.palette.text.primary,
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* Toast Notifications */}
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={() => clearNotification(notification.id)}
          />
        ))}

        {/* Main Application Layout */}
        <Layout>
          <PageTransition>
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/" 
                  element={
                    <Suspense fallback={<SuspenseFallback page="Startseite" />}>
                      <HomePage />
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="/game" 
                  element={
                    <Suspense fallback={<SuspenseFallback page="Spiel" />}>
                      <GamePage />
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="/about" 
                  element={
                    <Suspense fallback={<SuspenseFallback page="Über uns" />}>
                      <AboutPage />
                    </Suspense>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <Suspense fallback={<SuspenseFallback page="Einstellungen" />}>
                      <SettingsPage />
                    </Suspense>
                  } 
                />

                {/* Protected Admin Route */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Suspense fallback={<SuspenseFallback page="Administration" />}>
                        <AdminPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />

                {/* Development Tools (nur im Dev-Mode) */}
                {import.meta.env.DEV && (
                  <Route 
                    path="/dev" 
                    element={
                      <Suspense fallback={<SuspenseFallback page="Entwicklertools" />}>
                        <DevTools />
                      </Suspense>
                    } 
                  />
                )}

                {/* Catch-all Route - 404 Handling */}
                <Route 
                  path="*" 
                  element={
                    <Box 
                      display="flex" 
                      flexDirection="column"
                      justifyContent="center" 
                      alignItems="center" 
                      minHeight="60vh"
                      textAlign="center"
                      p={4}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Box
                          sx={{
                            fontSize: '4rem',
                            mb: 2,
                            color: theme.palette.primary.main
                          }}
                        >
                          🔮
                        </Box>
                        <Box
                          component="h1"
                          sx={{
                            fontFamily: 'Cinzel, serif',
                            fontSize: '2.5rem',
                            mb: 2,
                            color: theme.palette.primary.main
                          }}
                        >
                          Seite nicht gefunden
                        </Box>
                        <Box
                          sx={{
                            fontSize: '1.2rem',
                            mb: 3,
                            color: theme.palette.text.secondary,
                            maxWidth: 500
                          }}
                        >
                          Die gesuchte Seite scheint in den magischen Nebeln verloren gegangen zu sein.
                        </Box>
                        <Box
                          component="button"
                          onClick={() => window.location.href = '/'}
                          sx={{
                            background: theme.palette.primary.main,
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: theme.palette.primary.dark,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Zurück zum Zauberbuch
                        </Box>
                      </motion.div>
                    </Box>
                  } 
                />
              </Routes>
            </Suspense>
          </PageTransition>
        </Layout>

        {/* Development Overlay */}
        {import.meta.env.DEV && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontFamily: 'monospace'
            }}
          >
            🛠️ Dev Mode | Online: {isOnline ? '✅' : '❌'} | Theme: {isDarkMode ? '🌙' : '☀️'}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default App