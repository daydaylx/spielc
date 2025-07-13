// File: src/hooks/useGame.ts
import { useContext } from 'react'
import { GameContext } from '../contexts/GameContext'

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameContextProvider')
  }
  return context
}

// File: src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}

// File: src/hooks/useTheme.ts
import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}

// File: src/hooks/useOffline.ts
import { useContext } from 'react'
import { OfflineContext } from '../contexts/OfflineContext'

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineContextProvider')
  }
  return context
}

// File: src/hooks/useNotification.ts
import { useContext } from 'react'
import { NotificationContext } from '../contexts/NotificationContext'

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationContextProvider')
  }
  return context
}

// File: src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((val: T) => T)

interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: SetValue<T>) => void
  removeValue: () => void
  loading: boolean
  error: string | null
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
    validator?: (value: any) => value is T
  }
): UseLocalStorageReturn<T> {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  const serialize = options?.serialize || JSON.stringify
  const deserialize = options?.deserialize || JSON.parse
  const validator = options?.validator

  // Read from localStorage on mount
  useEffect(() => {
    try {
      setLoading(true)
      setError(null)
      
      const item = window.localStorage.getItem(key)
      if (item === null) {
        setStoredValue(initialValue)
      } else {
        const parsed = deserialize(item)
        if (validator && !validator(parsed)) {
          console.warn(`Invalid data for key "${key}", using initial value`)
          setStoredValue(initialValue)
        } else {
          setStoredValue(parsed)
        }
      }
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStoredValue(initialValue)
    } finally {
      setLoading(false)
    }
  }, [key, initialValue, deserialize, validator])

  const setValue = useCallback((value: SetValue<T>) => {
    try {
      setError(null)
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      if (validator && !validator(valueToStore)) {
        throw new Error('Value does not pass validation')
      }
      
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, serialize(valueToStore))
      
      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serialize(valueToStore),
        storageArea: window.localStorage
      }))
    } catch (err) {
      console.error(`Error setting localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [key, serialize, storedValue, validator])

  const removeValue = useCallback(() => {
    try {
      setError(null)
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
      
      // Dispatch storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        storageArea: window.localStorage
      }))
    } catch (err) {
      console.error(`Error removing localStorage key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [key, initialValue])

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        try {
          if (e.newValue === null) {
            setStoredValue(initialValue)
          } else {
            const parsed = deserialize(e.newValue)
            if (validator && !validator(parsed)) {
              console.warn(`Invalid cross-tab data for key "${key}"`)
              return
            }
            setStoredValue(parsed)
          }
        } catch (err) {
          console.error(`Error handling cross-tab storage change for key "${key}":`, err)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, validator, initialValue])

  return {
    value: storedValue,
    setValue,
    removeValue,
    loading,
    error
  }
}

// File: src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      callback(...args)
    }, delay)

    setDebounceTimer(timer)
  }) as T

  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }

  return [debouncedCallback, cancel]
}

// File: src/hooks/useAsync.ts
import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseAsyncOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncOptions = {}
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const { immediate = true, onSuccess, onError } = options
  const mountedRef = useRef(true)

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await asyncFunction()
      
      if (mountedRef.current) {
        setState({ data, loading: false, error: null })
        onSuccess?.(data)
      }
      
      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: err })
        onError?.(err)
      }
      
      throw err
    }
  }, dependencies)

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    ...state,
    execute
  }
}

// File: src/hooks/useKeyboard.ts
import { useEffect, useCallback } from 'react'

type KeyboardHandler = (event: KeyboardEvent) => void

interface UseKeyboardOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
  target?: Window | HTMLElement | null
}

export function useKeyboard(
  key: string | string[],
  handler: KeyboardHandler,
  options: UseKeyboardOptions = {}
) {
  const {
    preventDefault = false,
    stopPropagation = false,
    enabled = true,
    target = window
  } = options

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const keys = Array.isArray(key) ? key : [key]
    const pressed = keys.some(k => {
      if (k.includes('+')) {
        // Handle key combinations like 'Ctrl+S'
        const parts = k.split('+').map(p => p.trim().toLowerCase())
        const keyPressed = event.key.toLowerCase()
        const ctrlPressed = event.ctrlKey || event.metaKey
        const altPressed = event.altKey
        const shiftPressed = event.shiftKey

        return parts.every(part => {
          switch (part) {
            case 'ctrl':
            case 'cmd':
              return ctrlPressed
            case 'alt':
              return altPressed
            case 'shift':
              return shiftPressed
            default:
              return keyPressed === part
          }
        })
      } else {
        return event.key.toLowerCase() === k.toLowerCase()
      }
    })

    if (pressed) {
      if (preventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      handler(event)
    }
  }, [key, handler, preventDefault, stopPropagation, enabled])

  useEffect(() => {
    if (!target || !enabled) return

    target.addEventListener('keydown', handleKeyPress as any)
    return () => target.removeEventListener('keydown', handleKeyPress as any)
  }, [target, handleKeyPress, enabled])
}

// File: src/hooks/useInterval.ts
import { useEffect, useRef } from 'react'

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    function tick() {
      savedCallback.current?.()
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

// File: src/hooks/useTimeout.ts
import { useEffect, useRef } from 'react'

export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay !== null) {
      const id = setTimeout(() => savedCallback.current?.(), delay)
      return () => clearTimeout(id)
    }
  }, [delay])
}

// File: src/hooks/useToggle.ts
import { useState, useCallback } from 'react'

export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue(prev => !prev)
  }, [])

  const setToggle = useCallback((newValue: boolean) => {
    setValue(newValue)
  }, [])

  return [value, toggle, setToggle]
}

// File: src/hooks/usePrevious.ts
import { useRef, useEffect } from 'react'

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  }, [value])
  
  return ref.current
}

// File: src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addListener(handler)
    setMatches(mediaQuery.matches)

    return () => mediaQuery.removeListener(handler)
  }, [query])

  return matches
}

// File: src/hooks/useClickOutside.ts
import { useEffect, useRef } from 'react'

export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled: boolean = true
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handler, enabled])

  return ref
}

// File: src/hooks/useWindowSize.ts
import { useState, useEffect } from 'react'

interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

// File: src/hooks/useScrollDirection.ts
import { useState, useEffect } from 'react'

type ScrollDirection = 'up' | 'down' | null

export function useScrollDirection(threshold: number = 10): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null)

  useEffect(() => {
    let lastScrollY = window.pageYOffset
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false
        return
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up')
      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrollDirection
}

// File: src/hooks/useGameStats.ts
import { useMemo } from 'react'
import { useGame } from './useGame'
import { PlayerStats } from '../types/game'

interface GameStatsCalculations {
  healthPercentage: number
  manaPercentage: number
  totalStats: number
  averageStats: number
  isLowHealth: boolean
  isLowMana: boolean
  canLevelUp: boolean
  experienceToNextLevel: number
  experiencePercentage: number
  powerLevel: number
}

export function useGameStats(): GameStatsCalculations & { stats: PlayerStats } {
  const { gameState } = useGame()
  const { stats } = gameState

  const calculations = useMemo((): GameStatsCalculations => {
    const healthPercentage = (stats.health / stats.maxHealth) * 100
    const manaPercentage = (stats.mana / stats.maxMana) * 100
    
    const totalStats = stats.strength + stats.intelligence + stats.wisdom + stats.charisma + stats.luck
    const averageStats = totalStats / 5
    
    const isLowHealth = healthPercentage <= 25
    const isLowMana = manaPercentage <= 25
    
    // Experience calculations (assuming 100 * level experience needed for next level)
    const experienceNeededForNextLevel = 100 * (stats.level + 1)
    const experienceToNextLevel = experienceNeededForNextLevel - stats.experience
    const canLevelUp = experienceToNextLevel <= 0
    const experiencePercentage = (stats.experience % (100 * stats.level)) / (100 * stats.level) * 100
    
    // Power level calculation
    const powerLevel = Math.floor(
      (totalStats * 0.4) + 
      (stats.level * 10) + 
      (stats.experience * 0.01) +
      (stats.gold * 0.001)
    )
    
    return {
      healthPercentage,
      manaPercentage,
      totalStats,
      averageStats,
      isLowHealth,
      isLowMana,
      canLevelUp,
      experienceToNextLevel: Math.max(0, experienceToNextLevel),
      experiencePercentage,
      powerLevel
    }
  }, [stats])

  return {
    stats,
    ...calculations
  }
}