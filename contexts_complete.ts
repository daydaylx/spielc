// File: src/contexts/GameContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { GameState, PlayerStats, GameFlags, InventoryItem, Scene } from '../types/game'
import { gameService } from '../services/api/gameService'
import { localStorageService } from '../services/storage/localStorage'

interface GameContextType {
  gameState: GameState
  isLoading: boolean
  error: string | null
  startNewGame: (playerName: string, difficulty: 'easy' | 'normal' | 'hard') => Promise<void>
  loadGame: (saveId: string) => Promise<void>
  saveGame: () => Promise<void>
  makeChoice: (choiceId: string) => Promise<void>
  updateStats: (stats: Partial<PlayerStats>) => void
  setFlag: (key: string, value: any) => void
  getFlag: (key: string) => any
  addItem: (item: InventoryItem) => void
  removeItem: (itemId: string, quantity?: number) => void
  getCurrentScene: () => Scene | null
  resetGame: () => void
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INITIALIZE_GAME'; payload: GameState }
  | { type: 'UPDATE_SCENE'; payload: string }
  | { type: 'UPDATE_STATS'; payload: Partial<PlayerStats> }
  | { type: 'SET_FLAG'; payload: { key: string; value: any } }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'UPDATE_PLAYTIME'; payload: number }
  | { type: 'RESET_GAME' }

const initialGameState: GameState = {
  currentSceneId: 'start',
  playerId: '',
  playerName: '',
  stats: {
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    strength: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    luck: 10,
    experience: 0,
    level: 1,
    gold: 0
  },
  flags: {},
  inventory: [],
  gameStartTime: '',
  lastSaveTime: '',
  totalPlayTime: 0,
  isGameActive: false,
  difficulty: 'normal',
  sessionId: ''
}

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_LOADING':
      return state
    case 'SET_ERROR':
      return state
    case 'INITIALIZE_GAME':
      return { ...action.payload, isGameActive: true }
    case 'UPDATE_SCENE':
      return { ...state, currentSceneId: action.payload }
    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      }
    case 'SET_FLAG':
      return {
        ...state,
        flags: { ...state.flags, [action.payload.key]: action.payload.value }
      }
    case 'ADD_ITEM':
      const existingItem = state.inventory.find(item => 
        item.id === action.payload.id && item.stackable
      )
      if (existingItem) {
        return {
          ...state,
          inventory: state.inventory.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return {
        ...state,
        inventory: [...state.inventory, action.payload]
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        inventory: state.inventory.reduce((acc, item) => {
          if (item.id === action.payload.itemId) {
            const newQuantity = item.quantity - action.payload.quantity
            if (newQuantity > 0) {
              acc.push({ ...item, quantity: newQuantity })
            }
          } else {
            acc.push(item)
          }
          return acc
        }, [] as InventoryItem[])
      }
    case 'UPDATE_PLAYTIME':
      return {
        ...state,
        totalPlayTime: state.totalPlayTime + action.payload,
        lastSaveTime: new Date().toISOString()
      }
    case 'RESET_GAME':
      return { ...initialGameState }
    default:
      return state
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentScene, setCurrentScene] = React.useState<Scene | null>(null)

  // Auto-save functionality
  useEffect(() => {
    if (gameState.isGameActive) {
      const autoSaveInterval = setInterval(() => {
        saveGame()
      }, 30000) // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval)
    }
  }, [gameState.isGameActive])

  // Load game state on mount
  useEffect(() => {
    const savedGame = localStorageService.getGameState()
    if (savedGame) {
      dispatch({ type: 'INITIALIZE_GAME', payload: savedGame })
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (gameState.isGameActive) {
      localStorageService.saveGameState(gameState)
    }
  }, [gameState])

  const startNewGame = async (playerName: string, difficulty: 'easy' | 'normal' | 'hard') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newGameState: GameState = {
        ...initialGameState,
        playerId: crypto.randomUUID(),
        playerName,
        difficulty,
        gameStartTime: new Date().toISOString(),
        sessionId: crypto.randomUUID(),
        isGameActive: true
      }
      
      dispatch({ type: 'INITIALIZE_GAME', payload: newGameState })
      await gameService.createNewGame(newGameState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Starten des Spiels')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGame = async (saveId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const savedGame = await gameService.loadGame(saveId)
      dispatch({ type: 'INITIALIZE_GAME', payload: savedGame })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Spiels')
    } finally {
      setIsLoading(false)
    }
  }

  const saveGame = async () => {
    if (!gameState.isGameActive) return
    
    try {
      await gameService.saveGame(gameState)
      dispatch({ 
        type: 'UPDATE_STATS', 
        payload: { ...gameState.stats } 
      })
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }

  const makeChoice = async (choiceId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await gameService.makeChoice(gameState.currentSceneId, choiceId, gameState)
      
      // Update scene
      dispatch({ type: 'UPDATE_SCENE', payload: result.nextSceneId })
      
      // Apply choice effects
      if (result.effects) {
        result.effects.forEach(effect => {
          switch (effect.type) {
            case 'modify_stat':
              dispatch({ 
                type: 'UPDATE_STATS', 
                payload: { [effect.target]: gameState.stats[effect.target as keyof PlayerStats] + effect.value }
              })
              break
            case 'set_flag':
              dispatch({ type: 'SET_FLAG', payload: { key: effect.target, value: effect.value } })
              break
            case 'add_item':
              if (effect.value && typeof effect.value === 'object') {
                dispatch({ type: 'ADD_ITEM', payload: effect.value as InventoryItem })
              }
              break
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Auswahl')
    } finally {
      setIsLoading(false)
    }
  }

  const updateStats = (stats: Partial<PlayerStats>) => {
    dispatch({ type: 'UPDATE_STATS', payload: stats })
  }

  const setFlag = (key: string, value: any) => {
    dispatch({ type: 'SET_FLAG', payload: { key, value } })
  }

  const getFlag = (key: string) => {
    return gameState.flags[key]
  }

  const addItem = (item: InventoryItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (itemId: string, quantity: number = 1) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, quantity } })
  }

  const getCurrentScene = () => {
    return currentScene
  }

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' })
    localStorageService.clearGameState()
    setCurrentScene(null)
    setError(null)
  }

  const value: GameContextType = {
    gameState,
    isLoading,
    error,
    startNewGame,
    loadGame,
    saveGame,
    makeChoice,
    updateStats,
    setFlag,
    getFlag,
    addItem,
    removeItem,
    getCurrentScene,
    resetGame
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameContextProvider')
  }
  return context
}

// File: src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

interface ThemeContextType {
  theme: Theme
  isDarkMode: boolean
  toggleTheme: () => void
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void
  themeMode: 'light' | 'dark' | 'auto'
}

const createMagicalTheme = (mode: 'light' | 'dark'): Theme => {
  const isLight = mode === 'light'
  
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isLight ? '#2D5A27' : '#4A9B3E',
        light: isLight ? '#5A8A52' : '#6BB85F',
        dark: isLight ? '#1A3318' : '#2D5A27',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isLight ? '#D4AF37' : '#FFD700',
        light: isLight ? '#E6C757' : '#FFED4A',
        dark: isLight ? '#B8941F' : '#D4AF37',
        contrastText: isLight ? '#000000' : '#1A1A1A',
      },
      background: {
        default: isLight ? '#F8F6F0' : '#0F0F0F',
        paper: isLight ? '#FFFFFF' : '#1A1A1A',
      },
      text: {
        primary: isLight ? '#2C3E50' : '#E8E6E3',
        secondary: isLight ? '#5D6D7E' : '#B0B0B0',
      },
      error: {
        main: isLight ? '#C0392B' : '#E74C3C',
      },
      warning: {
        main: isLight ? '#F39C12' : '#F1C40F',
      },
      success: {
        main: isLight ? '#27AE60' : '#2ECC71',
      },
      info: {
        main: isLight ? '#3498DB' : '#5DADE2',
      },
    },
    typography: {
      fontFamily: '"EB Garamond", "Georgia", serif',
      h1: {
        fontFamily: '"Cinzel", serif',
        fontWeight: 700,
        fontSize: '3rem',
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: '"Cinzel", serif',
        fontWeight: 600,
        fontSize: '2.5rem',
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: '"Cinzel", serif',
        fontWeight: 500,
        fontSize: '2rem',
        lineHeight: 1.4,
      },
      h4: {
        fontFamily: '"Cinzel", serif',
        fontWeight: 500,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontFamily: '"Roboto Slab", serif',
        fontWeight: 500,
        fontSize: '1.25rem',
        lineHeight: 1.5,
      },
      h6: {
        fontFamily: '"Roboto Slab", serif',
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1.1rem',
        lineHeight: 1.7,
        fontWeight: 400,
      },
      body2: {
        fontSize: '1rem',
        lineHeight: 1.6,
        fontWeight: 400,
      },
      button: {
        fontFamily: '"Roboto Slab", serif',
        fontWeight: 500,
        textTransform: 'none',
        fontSize: '1rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      isLight ? '0px 2px 8px rgba(45, 90, 39, 0.15)' : '0px 2px 8px rgba(0, 0, 0, 0.3)',
      isLight ? '0px 4px 16px rgba(45, 90, 39, 0.2)' : '0px 4px 16px rgba(0, 0, 0, 0.4)',
      isLight ? '0px 8px 24px rgba(45, 90, 39, 0.25)' : '0px 8px 24px rgba(0, 0, 0, 0.5)',
      isLight ? '0px 12px 32px rgba(45, 90, 39, 0.3)' : '0px 12px 32px rgba(0, 0, 0, 0.6)',
      // ... weitere Shadow-Definitionen
    ] as any,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '12px 24px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isLight 
                ? '0px 6px 20px rgba(45, 90, 39, 0.3)' 
                : '0px 6px 20px rgba(74, 155, 62, 0.4)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: isLight 
              ? 'linear-gradient(135deg, #FFFFFF 0%, #F8F6F0 100%)'
              : 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(isLight ? '#2D5A27' : '#4A9B3E', 0.1)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  }

  return createTheme(themeOptions)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Auto-detect system theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark' | 'auto' | null
    if (savedTheme) {
      setThemeMode(savedTheme)
    }

    const updateThemeFromSystem = () => {
      if (themeMode === 'auto') {
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDarkMode(systemDarkMode)
      }
    }

    updateThemeFromSystem()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateThemeFromSystem)

    return () => mediaQuery.removeEventListener('change', updateThemeFromSystem)
  }, [themeMode])

  // Update theme when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    
    if (themeMode === 'light') {
      setIsDarkMode(false)
    } else if (themeMode === 'dark') {
      setIsDarkMode(true)
    } else {
      // auto mode
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(systemDarkMode)
    }
  }, [themeMode])

  const theme = createMagicalTheme(isDarkMode ? 'dark' : 'light')

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      if (prevMode === 'light') return 'dark'
      if (prevMode === 'dark') return 'auto'
      return 'light'
    })
  }

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setThemeMode,
    themeMode
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}

// File: src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '../services/api/authService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: any) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', session?.user?.email)
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await authService.signIn(email, password)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true)
    try {
      const { error } = await authService.signUp(email, password, userData)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await authService.signOut()
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email)
    if (error) throw error
  }

  const updateProfile = async (updates: any) => {
    setLoading(true)
    try {
      const { error } = await authService.updateProfile(updates)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}

// File: src/contexts/OfflineContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  isOfflineMode: boolean
  enableOfflineMode: () => void
  disableOfflineMode: () => void
  lastOnlineTime: Date | null
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export const OfflineContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Verbindung wiederhergestellt')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastOnlineTime(new Date())
      console.log('📴 Verbindung verloren')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const enableOfflineMode = () => {
    setIsOfflineMode(true)
    console.log('📴 Offline-Modus aktiviert')
  }

  const disableOfflineMode = () => {
    setIsOfflineMode(false)
    console.log('🌐 Offline-Modus deaktiviert')
  }

  const value: OfflineContextType = {
    isOnline,
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode,
    lastOnlineTime
  }

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineContextProvider')
  }
  return context
}

// File: src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  timestamp: Date
}

export interface NotificationAction {
  label: string
  action: () => void
  color?: 'primary' | 'secondary'
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string
  removeNotification: (id: string) => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (title: string, message: string, duration?: number) => string
  showError: (title: string, message: string, duration?: number) => string
  showWarning: (title: string, message: string, duration?: number) => string
  showInfo: (title: string, message: string, duration?: number) => string
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
    const id = crypto.randomUUID()
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearNotification = (id: string) => {
    removeNotification(id)
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const showSuccess = (title: string, message: string, duration?: number): string => {
    return addNotification({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message: string, duration?: number): string => {
    return addNotification({ type: 'error', title, message, duration })
  }

  const showWarning = (title: string, message: string, duration?: number): string => {
    return addNotification({ type: 'warning', title, message, duration })
  }

  const showInfo = (title: string, message: string, duration?: number): string => {
    return addNotification({ type: 'info', title, message, duration })
  }

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationContextProvider')
  }
  return context
}