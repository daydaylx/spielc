// src/App.tsx
// Das Magische Zauberbuch - Hauptanwendung
// Version: 1.0.0 - Production Ready Final

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, LinearProgress, Alert, Snackbar } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// Pages
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { AdminPanel } from './pages/AdminPanel';
import { LoginPage } from './pages/LoginPage';
import { OfflinePage } from './pages/OfflinePage';

// Components
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorFallback } from './components/common/ErrorFallback';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { UpdateNotification } from './components/common/UpdateNotification';

// Hooks
import { useAuth } from './hooks/useAuth';
import { usePWA } from './hooks/usePWA';
import { useErrorHandler } from './hooks/useErrorHandler';

// Services
import { utilityService } from './services/utilityService';
import { pwaManager } from './utils/pwaUtils';
import { eventBus } from './utils/eventBus';

// Types
import { ThemeMode } from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [showOffline, setShowOffline] = useState(false);
  
  const { user, loading: authLoading, error: authError } = useAuth();
  const { isOnline, isInstallAvailable, isUpdateAvailable } = usePWA();
  const { handleError, clearError, errorMessage } = useErrorHandler();

  // Erstelle Theme basierend auf Modus
  const theme = React.useMemo(
    () => createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        secondary: {
          main: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
        },
        background: {
          default: themeMode === 'dark' ? '#0F0F23' : '#F8FAFC',
          paper: themeMode === 'dark' ? '#1E1E3F' : '#FFFFFF',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 700,
        },
        h2: {
          fontWeight: 600,
        },
        h3: {
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: themeMode === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    }),
    [themeMode]
  );

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Theme aus Einstellungen laden
    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    // Offline-Status überwachen
    setShowOffline(!isOnline);
  }, [isOnline]);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing application...');
      
      // PWA initialisieren
      await pwaManager.initialize();
      
      // Utility Service initialisieren
      await utilityService.initializeApp();
      
      // Event Listeners setup
      setupEventListeners();
      
      setIsInitialized(true);
      console.log('[App] Application initialized successfully');
      
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      handleError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const settings = await utilityService.loadSettings();
      if (settings.theme) {
        setThemeMode(settings.theme as ThemeMode);
      }
    } catch (error) {
      console.error('[App] Failed to load user preferences:', error);
    }
  };

  const setupEventListeners = () => {
    // PWA Events
    eventBus.on('pwaInstallAvailable', () => {
      console.log('[App] PWA installation available');
    });

    eventBus.on('pwaUpdateAvailable', () => {
      console.log('[App] PWA update available');
    });

    // Game Events
    eventBus.on('gameError', (error) => {
      handleError(new Error(error.message || 'Game error occurred'));
    });

    // Network Events
    eventBus.on('networkStatusChanged', ({ isOnline }) => {
      setShowOffline(!isOnline);
    });

    // Theme Events
    eventBus.on('themeChanged', ({ theme }) => {
      setThemeMode(theme);
    });
  };

  const handleThemeToggle = async () => {
    const newTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
    
    try {
      await utilityService.saveSettings({ theme: newTheme });
      eventBus.emit('themeChanged', { theme: newTheme });
    } catch (error) {
      console.error('[App] Failed to save theme preference:', error);
    }
  };

  // Loading Screen während Initialisierung
  if (isLoading || authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen 
          message="Lade Das Magische Zauberbuch..." 
          subMessage="Bereite dein Abenteuer vor..."
        />
      </ThemeProvider>
    );
  }

  // Offline-Modus
  if (showOffline && !isInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OfflinePage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('[App] Error Boundary caught:', error, errorInfo);
          // In Produktion: Error an Tracking Service senden
        }}
        onReset={() => window.location.reload()}
      >
        <Router>
          <Layout 
            user={user}
            onThemeToggle={handleThemeToggle}
            themeMode={themeMode}
          >
            <Routes>
              {/* Öffentliche Routen */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/offline" element={<OfflinePage />} />
              
              {/* Geschützte Spiel-Routen */}
              <Route 
                path="/game/*" 
                element={
                  user ? <GamePage /> : <Navigate to="/login" replace />
                } 
              />
              
              {/* Admin-Routen */}
              <Route 
                path="/admin/*" 
                element={
                  user ? <AdminPanel /> : <Navigate to="/login" replace />
                } 
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>

          {/* PWA Components */}
          <PWAInstallPrompt 
            isAvailable={isInstallAvailable}
            onInstall={() => pwaManager.showInstallPrompt()}
          />
          
          <UpdateNotification 
            isAvailable={isUpdateAvailable}
            onUpdate={() => pwaManager.applyUpdate()}
          />

          {/* Global Notifications */}
          <Snackbar
            open={!!errorMessage}
            autoHideDuration={6000}
            onClose={clearError}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={clearError}>
              {errorMessage}
            </Alert>
          </Snackbar>

          {/* Auth Error */}
          {authError && (
            <Snackbar
              open={!!authError}
              autoHideDuration={6000}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert severity="error">
                Authentifizierungsfehler: {authError}
              </Alert>
            </Snackbar>
          )}

          {/* Offline Indicator */}
          {showOffline && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
              }}
            >
              <Alert 
                severity="warning" 
                sx={{ borderRadius: 0 }}
                action={
                  <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    Offline-Modus
                  </Box>
                }
              >
                Keine Internetverbindung. Du spielst im Offline-Modus.
              </Alert>
            </Box>
          )}
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;

// src/hooks/useErrorHandler.ts
// Zentralisierte Fehlerbehandlung für die Anwendung

import { useState, useCallback } from 'react';
import { utilityService } from '../services/utilityService';

interface UseErrorHandlerReturn {
  handleError: (error: Error, context?: string) => void;
  clearError: () => void;
  errorMessage: string | null;
  isError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback((error: Error, context?: string) => {
    console.error('[ErrorHandler]', error, { context });
    
    // Log error to utility service
    utilityService.logError(error, context);
    
    // Set user-friendly error message
    const userMessage = getUserFriendlyMessage(error);
    setErrorMessage(userMessage);
    
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const getUserFriendlyMessage = (error: Error): string => {
    // Übersetze technische Fehlermeldungen in benutzerfreundliche Nachrichten
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Netzwerkfehler. Bitte prüfe deine Internetverbindung.';
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'Anmeldung erforderlich. Bitte melde dich erneut an.';
    }
    
    if (message.includes('not found')) {
      return 'Die angeforderte Ressource wurde nicht gefunden.';
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'Du hast keine Berechtigung für diese Aktion.';
    }
    
    if (message.includes('storage') || message.includes('quota')) {
      return 'Speicherplatz-Problem. Bitte prüfe den verfügbaren Speicher.';
    }
    
    // Fallback für unbekannte Fehler
    return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.';
  };

  return {
    handleError,
    clearError,
    errorMessage,
    isError: errorMessage !== null
  };
};

// src/components/common/ErrorFallback.tsx
// Error Boundary Fallback Component

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Container
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box textAlign="center">
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          🔮 Magischer Fehler aufgetreten!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Ein unerwarteter Zauber hat die Anwendung gestört.
        </Typography>

        <Card sx={{ mt: 4, textAlign: 'left' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Was ist passiert?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ein technischer Fehler hat die normale Funktionsweise unterbrochen. 
              Dies kann verschiedene Ursachen haben.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Was kannst du tun?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Versuche die Seite neu zu laden<br/>
              • Gehe zur Startseite zurück<br/>
              • Prüfe deine Internetverbindung<br/>
              • Versuche es später erneut
            </Typography>

            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="div">
                  <strong>Entwicklermodus - Fehlermeldung:</strong>
                </Typography>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {error.message}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={resetErrorBoundary}
            >
              Erneut versuchen
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReload}
            >
              Seite neu laden
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
            >
              Zur Startseite
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Container>
  );
};

// src/components/common/PWAInstallPrompt.tsx
// PWA Installation Prompt Component

import React, { useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon
} from '@mui/icons-material';

interface PWAInstallPromptProps {
  isAvailable: boolean;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  isAvailable,
  onInstall
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await onInstall();
      if (success) {
        setDismissed(true);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Merke die Entscheidung für 24 Stunden
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Prüfe ob kürzlich dismissed
  const wasRecentlyDismissed = () => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) return false;
    
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return parseInt(dismissedTime) > oneDayAgo;
  };

  if (!isAvailable || dismissed || wasRecentlyDismissed()) {
    return null;
  }

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ maxWidth: 'sm' }}
    >
      <Alert
        severity="info"
        action={
          <Box display="flex" gap={1}>
            <Button
              color="inherit"
              size="small"
              startIcon={<InstallIcon />}
              onClick={handleInstall}
              disabled={installing}
            >
              {installing ? 'Installiere...' : 'Installieren'}
            </Button>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleDismiss}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            🔮 Das Magische Zauberbuch installieren
          </Typography>
          <Typography variant="body2">
            Installiere die App für eine bessere Spielerfahrung!
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

// src/components/common/UpdateNotification.tsx
// PWA Update Notification Component

import React, { useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography
} from '@mui/material';
import {
  Update as UpdateIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface UpdateNotificationProps {
  isAvailable: boolean;
  onUpdate: () => Promise<void>;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isAvailable,
  onUpdate
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await onUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setUpdating(false);
    }
  };

  if (!isAvailable || dismissed) {
    return null;
  }

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ maxWidth: 'sm' }}
    >
      <Alert
        severity="info"
        action={
          <Box display="flex" gap={1}>
            <Button
              color="inherit"
              size="small"
              startIcon={<UpdateIcon />}
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? 'Aktualisiere...' : 'Aktualisieren'}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={() => setDismissed(true)}
            >
              Später
            </Button>
          </Box>
        }
      >
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Neue Version verfügbar!
          </Typography>
          <Typography variant="body2">
            Eine Aktualisierung mit Verbesserungen ist bereit.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

// src/pages/OfflinePage.tsx
// Offline-Modus Seite

import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Games as GameIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

export const OfflinePage: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  const offlineFeatures = [
    {
      icon: <GameIcon />,
      title: 'Gespeicherte Spiele',
      description: 'Spiele deine lokal gespeicherten Abenteuer weiter'
    },
    {
      icon: <StorageIcon />,
      title: 'Lokale Speicherstände',
      description: 'Zugriff auf alle offline verfügbaren Spielstände'
    },
    {
      icon: <SettingsIcon />,
      title: 'Einstellungen',
      description: 'Verwalte deine App-Einstellungen auch offline'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box textAlign="center">
        <OfflineIcon sx={{ fontSize: 120, color: 'warning.main', mb: 3 }} />
        
        <Typography variant="h3" component="h1" gutterBottom>
          🔮 Offline-Zauber aktiv
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Du bist momentan nicht mit dem Internet verbunden, aber die Magie geht weiter!
        </Typography>

        <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant="subtitle2" gutterBottom>
            Im Offline-Modus verfügbar:
          </Typography>
          <Typography variant="body2">
            Du kannst deine gespeicherten Geschichten weiterspielen und neue Abenteuer 
            erleben. Alle Fortschritte werden lokal gespeichert und später synchronisiert.
          </Typography>
        </Alert>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Verfügbare Funktionen
            </Typography>
            
            <List>
              {offlineFeatures.map((feature, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<GameIcon />}
            href="/game"
          >
            Offline spielen
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
          >
            Verbindung prüfen
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Die App synchronisiert automatisch, sobald die Internetverbindung wiederhergestellt ist.
        </Typography>
      </Box>
    </Container>
  );
};

// src/utils/testUtils.ts
// Test-Utilities für Das Magische Zauberbuch
// Version: 1.0.0 - Production Ready Testing Framework

import { GameEngine } from '../engine/GameEngine';
import { storyService } from '../services/storyService';
import { gameStateService } from '../services/gameStateService';
import type { Story, Scene, Choice, GameState } from '../types';

export class TestFramework {
  private static instance: TestFramework;
  private testResults: Map<string, TestResult> = new Map();

  public static getInstance(): TestFramework {
    if (!TestFramework.instance) {
      TestFramework.instance = new TestFramework();
    }
    return TestFramework.instance;
  }

  async runAllTests(): Promise<TestSummary> {
    console.log('[TestFramework] Starting comprehensive test suite...');
    
    const tests = [
      () => this.testStoryCreation(),
      () => this.testSceneNavigation(),
      () => this.testChoiceProcessing(),
      () => this.testFlagSystem(),
      () => this.testGameEngine(),
      () => this.testOfflineMode(),
      () => this.testPerformance(),
      () => this.testErrorHandling()
    ];

    const results: TestResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        this.testResults.set(result.name, result);
      } catch (error) {
        console.error('[TestFramework] Test failed:', error);
        results.push({
          name: 'Unknown Test',
          success: false,
          duration: 0,
          errors: [error.message],
          warnings: []
        });
      }
    }

    const summary = this.generateSummary(results);
    console.log('[TestFramework] Test suite completed:', summary);
    
    return summary;
  }

  private async testStoryCreation(): Promise<TestResult> {
    const testName = 'Story Creation Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test Story-Erstellung
      const testStory = await this.createTestStory();
      
      if (!testStory.id) {
        errors.push('Story ID not generated');
      }
      
      if (!testStory.title) {
        errors.push('Story title missing');
      }

      // Test Szenen-Erstellung
      const testScene = await this.createTestScene(testStory.id);
      
      if (!testScene.id) {
        errors.push('Scene ID not generated');
      }

      // Test Choice-Erstellung
      const testChoice = await this.createTestChoice(testScene.id);
      
      if (!testChoice.id) {
        errors.push('Choice ID not generated');
      }

      // Cleanup
      await this.cleanupTestData(testStory.id);

    } catch (error) {
      errors.push(`Story creation failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testSceneNavigation(): Promise<TestResult> {
    const testName = 'Scene Navigation Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Erstelle Test-Story mit mehreren Szenen
      const story = await this.createTestStory();
      const scene1 = await this.createTestScene(story.id, true); // Start scene
      const scene2 = await this.createTestScene(story.id, false);
      
      // Erstelle Choice von Scene1 zu Scene2
      const choice = await storyService.createChoice({
        scene_id: scene1.id,
        text: 'Gehe zu Szene 2',
        target_scene_id: scene2.id,
        type: 'standard',
        order_index: 0,
        conditions: {},
        effects: {},
        is_available: true,
        metadata: {}
      });

      // Test Game Engine Navigation
      const gameEngine = new GameEngine();
      await gameEngine.initialize();
      await gameEngine.startNewGame(story.id);
      
      const currentScene = gameEngine.getCurrentScene();
      if (currentScene?.id !== scene1.id) {
        errors.push('Game did not start with correct scene');
      }

      // Test Choice Navigation
      await gameEngine.makeChoice(choice.id);
      
      const newScene = gameEngine.getCurrentScene();
      if (newScene?.id !== scene2.id) {
        errors.push('Navigation to target scene failed');
      }

      // Cleanup
      await gameEngine.shutdown();
      await this.cleanupTestData(story.id);

    } catch (error) {
      errors.push(`Navigation test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testChoiceProcessing(): Promise<TestResult> {
    const testName = 'Choice Processing Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test verschiedene Choice-Typen
      const story = await this.createTestStory();
      const scene = await this.createTestScene(story.id, true);
      
      // Standard Choice
      const standardChoice = await storyService.createChoice({
        scene_id: scene.id,
        text: 'Standard Choice',
        target_scene_id: null,
        type: 'standard',
        order_index: 0,
        conditions: {},
        effects: {},
        is_available: true,
        metadata: {}
      });

      // Conditional Choice
      const conditionalChoice = await storyService.createChoice({
        scene_id: scene.id,
        text: 'Conditional Choice',
        target_scene_id: null,
        type: 'conditional',
        order_index: 1,
        conditions: { flag: 'test_flag', flagValue: true },
        effects: { flags: { 'test_flag': true } },
        is_available: true,
        metadata: {}
      });

      // Test Game Engine mit Choices
      const gameEngine = new GameEngine();
      await gameEngine.initialize();
      await gameEngine.startNewGame(story.id);

      // Test Standard Choice
      const gameState = gameEngine.getGameState();
      if (!gameState) {
        errors.push('Game state not available');
      }

      // Cleanup
      await gameEngine.shutdown();
      await this.cleanupTestData(story.id);

    } catch (error) {
      errors.push(`Choice processing test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testFlagSystem(): Promise<TestResult> {
    const testName = 'Flag System Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const gameEngine = new GameEngine();
      await gameEngine.initialize();
      
      const story = await this.createTestStory();
      await gameEngine.startNewGame(story.id);

      // Test Flag setzen
      gameEngine.setFlag('test_flag', 'test_value');
      const flagValue = gameEngine.getFlag('test_flag');
      
      if (flagValue !== 'test_value') {
        errors.push('Flag value not set correctly');
      }

      // Test Flag in Conditions
      const hasFlag = gameEngine.getFlag('test_flag') !== undefined;
      if (!hasFlag) {
        errors.push('Flag existence check failed');
      }

      await gameEngine.shutdown();
      await this.cleanupTestData(story.id);

    } catch (error) {
      errors.push(`Flag system test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testGameEngine(): Promise<TestResult> {
    const testName = 'Game Engine Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const gameEngine = new GameEngine();
      
      // Test Initialization
      await gameEngine.initialize();
      if (!gameEngine.isEngineInitialized()) {
        errors.push('Game engine initialization failed');
      }

      // Test Game State
      const story = await this.createTestStory();
      await gameEngine.startNewGame(story.id);
      
      if (!gameEngine.isGameRunning()) {
        errors.push('Game failed to start');
      }

      if (!gameEngine.hasActiveGame()) {
        errors.push('No active game detected');
      }

      // Test Save/Load
      await gameEngine.saveGame('Test Save');
      
      // Test Shutdown
      await gameEngine.shutdown();
      if (gameEngine.isEngineInitialized()) {
        warnings.push('Engine cleanup may be incomplete');
      }

      await this.cleanupTestData(story.id);

    } catch (error) {
      errors.push(`Game engine test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testOfflineMode(): Promise<TestResult> {
    const testName = 'Offline Mode Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test Storage APIs
      if (typeof Storage === 'undefined') {
        errors.push('Local storage not available');
      }

      // Test Service Worker
      if (!('serviceWorker' in navigator)) {
        warnings.push('Service Worker not supported');
      }

      // Test Offline Capabilities
      const offlineData = { test: 'offline_test' };
      localStorage.setItem('offline_test', JSON.stringify(offlineData));
      
      const retrievedData = JSON.parse(localStorage.getItem('offline_test') || '{}');
      if (retrievedData.test !== 'offline_test') {
        errors.push('Offline data persistence failed');
      }

      // Cleanup
      localStorage.removeItem('offline_test');

    } catch (error) {
      errors.push(`Offline mode test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testPerformance(): Promise<TestResult> {
    const testName = 'Performance Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test Game Engine Performance
      const gameEngine = new GameEngine();
      
      const initStart = performance.now();
      await gameEngine.initialize();
      const initTime = performance.now() - initStart;
      
      if (initTime > 1000) {
        warnings.push(`Game engine initialization took ${initTime.toFixed(2)}ms (>1000ms)`);
      }

      // Test Story Loading Performance
      const story = await this.createTestStory();
      
      const loadStart = performance.now();
      await gameEngine.startNewGame(story.id);
      const loadTime = performance.now() - loadStart;
      
      if (loadTime > 500) {
        warnings.push(`Game start took ${loadTime.toFixed(2)}ms (>500ms)`);
      }

      // Test Memory Usage (wenn verfügbar)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          warnings.push(`High memory usage: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      await gameEngine.shutdown();
      await this.cleanupTestData(story.id);

    } catch (error) {
      errors.push(`Performance test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async testErrorHandling(): Promise<TestResult> {
    const testName = 'Error Handling Test';
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const gameEngine = new GameEngine();
      await gameEngine.initialize();

      // Test ungültige Story ID
      try {
        await gameEngine.startNewGame('invalid-story-id');
        errors.push('Should have thrown error for invalid story ID');
      } catch (expectedError) {
        // Erwarteter Fehler - gut!
      }

      // Test ungültige Choice ID
      try {
        await gameEngine.makeChoice('invalid-choice-id');
        errors.push('Should have thrown error for invalid choice ID');
      } catch (expectedError) {
        // Erwarteter Fehler - gut!
      }

      // Test Engine ohne Initialisierung
      const uninitializedEngine = new GameEngine();
      try {
        await uninitializedEngine.startNewGame('any-id');
        errors.push('Should have thrown error for uninitialized engine');
      } catch (expectedError) {
        // Erwarteter Fehler - gut!
      }

      await gameEngine.shutdown();

    } catch (error) {
      errors.push(`Error handling test failed: ${error.message}`);
    }

    return {
      name: testName,
      success: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings
    };
  }

  private async createTestStory(): Promise<Story> {
    return await storyService.createStory({
      title: `Test Story ${Date.now()}`,
      description: 'Test story for automated testing',
      author_id: 'test-author',
      status: 'draft',
      difficulty: 'normal',
      tags: ['test'],
      metadata: { isTest: true },
      settings: {}
    });
  }

  private async createTestScene(storyId: string, isStart = false): Promise<Scene> {
    return await storyService.createScene({
      story_id: storyId,
      title: `Test Scene ${Date.now()}`,
      content: 'This is a test scene for automated testing.',
      type: 'story',
      order_index: 0,
      is_starting_scene: isStart,
      is_ending_scene: false,
      conditions: {},
      effects: {},
      metadata: { isTest: true }
    });
  }

  private async createTestChoice(sceneId: string): Promise<Choice> {
    return await storyService.createChoice({
      scene_id: sceneId,
      text: `Test Choice ${Date.now()}`,
      target_scene_id: null,
      type: 'standard',
      order_index: 0,
      conditions: {},
      effects: {},
      is_available: true,
      metadata: { isTest: true }
    });
  }

  private async cleanupTestData(storyId: string): Promise<void> {
    try {
      await storyService.deleteStory(storyId);
    } catch (error) {
      console.warn('[TestFramework] Cleanup failed:', error);
    }
  }

  private generateSummary(results: TestResult[]): TestSummary {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total,
      passed,
      failed,
      duration: totalDuration,
      errors: totalErrors,
      warnings: totalWarnings,
      results,
      success: failed === 0
    };
  }

  getTestResults(): Map<string, TestResult> {
    return this.testResults;
  }
}

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  errors: number;
  warnings: number;
  results: TestResult[];
  success: boolean;
}

// Export Test Framework Instance
export const testFramework = TestFramework.getInstance();