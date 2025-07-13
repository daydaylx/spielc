// File: src/services/api/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL und Anon Key müssen in den Umgebungsvariablen definiert sein.\n' +
    'Stellen Sie sicher, dass VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Ihrer .env Datei gesetzt sind.'
  )
}

// Create Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'das-magische-zauberbuch@1.0.0',
    },
  },
})

// Enhanced error handling for Supabase operations
export class SupabaseError extends Error {
  constructor(
    message: string, 
    public code?: string, 
    public details?: any,
    public hint?: string
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

// Utility function to handle Supabase responses
export const handleSupabaseResponse = <T>(
  response: { data: T | null; error: any }
): T => {
  if (response.error) {
    throw new SupabaseError(
      response.error.message || 'Unbekannter Datenbankfehler',
      response.error.code,
      response.error.details,
      response.error.hint
    )
  }
  
  if (response.data === null) {
    throw new SupabaseError('Keine Daten zurückgegeben')
  }
  
  return response.data
}

// Connection status monitoring
export const monitorConnection = () => {
  let isConnected = true

  supabase.channel('connection-monitor')
    .on('system', { event: '*' }, (payload) => {
      console.log('Supabase system event:', payload)
    })
    .subscribe((status) => {
      const wasConnected = isConnected
      isConnected = status === 'SUBSCRIBED'
      
      if (wasConnected !== isConnected) {
        console.log(`Supabase connection ${isConnected ? 'established' : 'lost'}`)
        
        // Dispatch custom event for app-wide handling
        window.dispatchEvent(new CustomEvent('supabase-connection-change', {
          detail: { isConnected }
        }))
      }
    })

  return () => {
    supabase.removeAllChannels()
  }
}

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .select('id')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}

// Enhanced logging for debugging
if (import.meta.env.DEV) {
  // Log all Supabase operations in development
  const originalFrom = supabase.from
  supabase.from = function(relation: any) {
    console.log(`🔗 Supabase query to: ${relation}`)
    return originalFrom.call(this, relation)
  }
}

export default supabase

// File: src/services/api/authService.ts
import { supabase, handleSupabaseResponse, SupabaseError } from './supabaseClient'
import { 
  AuthResponse, 
  AuthTokenResponse, 
  UserResponse,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials 
} from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  preferences?: Record<string, any>
  game_stats?: {
    total_play_time: number
    games_completed: number
    favorite_scenes: string[]
    achievements: string[]
  }
  created_at: string
  updated_at: string
}

export interface AuthResult {
  user: any
  session: any
  profile?: UserProfile
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const credentials: SignInWithPasswordCredentials = { email, password }
      const response = await supabase.auth.signInWithPassword(credentials)
      
      if (response.error) {
        throw new SupabaseError(
          this.getAuthErrorMessage(response.error.message),
          response.error.message
        )
      }

      // Update last login time
      if (response.data.user) {
        await this.updateLastLogin(response.data.user.id)
      }

      return response
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Anmeldung fehlgeschlagen', 'auth-signin-failed')
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string, 
    password: string, 
    metadata?: Record<string, any>
  ): Promise<AuthResponse> {
    try {
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          data: {
            username: metadata?.username,
            full_name: metadata?.full_name,
            preferences: {
              theme: 'auto',
              language: 'de',
              notifications: true,
              ...metadata?.preferences
            }
          }
        }
      }

      const response = await supabase.auth.signUp(credentials)
      
      if (response.error) {
        throw new SupabaseError(
          this.getAuthErrorMessage(response.error.message),
          response.error.message
        )
      }

      // Create user profile if user was created
      if (response.data.user && !response.data.user.email_confirmed_at) {
        await this.createUserProfile(response.data.user.id, {
          email: response.data.user.email!,
          username: metadata?.username,
          full_name: metadata?.full_name,
        })
      }

      return response
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Registrierung fehlgeschlagen', 'auth-signup-failed')
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: any }> {
    try {
      const response = await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.removeItem('game-state')
      localStorage.removeItem('user-preferences')
      
      return response
    } catch (error) {
      throw new SupabaseError('Abmeldung fehlgeschlagen', 'auth-signout-failed')
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: any }; error: any }> {
    return await supabase.auth.getSession()
  }

  /**
   * Get current user
   */
  async getUser(): Promise<UserResponse> {
    return await supabase.auth.getUser()
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (response.error) {
        throw new SupabaseError(
          this.getAuthErrorMessage(response.error.message),
          response.error.message
        )
      }

      return response
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Passwort-Reset fehlgeschlagen', 'auth-reset-failed')
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: any }> {
    try {
      const response = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (response.error) {
        throw new SupabaseError(
          this.getAuthErrorMessage(response.error.message),
          response.error.message
        )
      }

      return response
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Passwort-Update fehlgeschlagen', 'auth-update-failed')
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('Benutzer nicht authentifiziert', 'auth-not-authenticated')
      }

      // Update auth metadata
      if (updates.username || updates.full_name || updates.preferences) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            username: updates.username,
            full_name: updates.full_name,
            preferences: updates.preferences
          }
        })

        if (authError) {
          throw new SupabaseError(authError.message, authError.message)
        }
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        throw new SupabaseError(profileError.message, profileError.code)
      }

      return { error: null }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Profil-Update fehlgeschlagen', 'profile-update-failed')
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    try {
      let targetUserId = userId
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        targetUserId = user.id
      }

      const response = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      return handleSupabaseResponse(response)
    } catch (error) {
      console.warn('Could not fetch user profile:', error)
      return null
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthTokenResponse> {
    return await supabase.auth.refreshSession()
  }

  /**
   * Create user profile in database
   */
  private async createUserProfile(userId: string, profileData: Partial<UserProfile>) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: profileData.email!,
          username: profileData.username,
          full_name: profileData.full_name,
          preferences: {
            theme: 'auto',
            language: 'de',
            notifications: true,
          },
          game_stats: {
            total_play_time: 0,
            games_completed: 0,
            favorite_scenes: [],
            achievements: []
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
    } catch (error) {
      console.error('Failed to create user profile:', error)
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string) {
    try {
      await supabase
        .from('user_profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } catch (error) {
      console.warn('Could not update last login:', error)
    }
  }

  /**
   * Get user-friendly error messages
   */
  private getAuthErrorMessage(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.',
      'Email not confirmed': 'E-Mail-Adresse nicht bestätigt. Bitte prüfen Sie Ihr E-Mail-Postfach.',
      'User already registered': 'Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert.',
      'Password should be at least 6 characters': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
      'Unable to validate email address: invalid format': 'Ungültiges E-Mail-Format.',
      'Email rate limit exceeded': 'Zu viele E-Mail-Anfragen. Bitte warten Sie einen Moment.',
      'signups not allowed': 'Registrierungen sind derzeit nicht erlaubt.',
      'Database error saving new user': 'Datenbankfehler beim Speichern des neuen Benutzers.',
    }

    return errorMap[errorMessage] || `Authentifizierungsfehler: ${errorMessage}`
  }

  /**
   * Check if user has admin privileges
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const profile = await this.getUserProfile(user.id)
      return profile?.preferences?.isAdmin === true
    } catch {
      return false
    }
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      return error !== null && !data
    } catch {
      return true
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .single()

      return error !== null && !data
    } catch {
      return true
    }
  }
}

export const authService = new AuthService()
export default authService

// File: src/services/api/gameService.ts
import { supabase, handleSupabaseResponse, SupabaseError } from './supabaseClient'
import { GameState, PlayerStats, GameFlags } from '../../types/game'
import { Scene, Choice } from '../../types/scene'
import { scenes } from '../../data/scenes/scenes'

export interface GameSession {
  id: string
  user_id: string
  game_state: GameState
  created_at: string
  updated_at: string
  is_active: boolean
  session_name?: string
}

export interface ChoiceResult {
  nextSceneId: string
  effects: any[]
  generatedScene?: Scene
  success: boolean
  message?: string
}

class GameService {
  /**
   * Create a new game session
   */
  async createNewGame(gameState: GameState): Promise<GameSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('Benutzer nicht authentifiziert', 'auth-required')
      }

      // Deactivate any existing active sessions
      await this.deactivateExistingSessions(user.id)

      const sessionData = {
        user_id: user.id,
        game_state: gameState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        session_name: `${gameState.playerName} - ${new Date().toLocaleDateString('de-DE')}`
      }

      const response = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select()
        .single()

      return handleSupabaseResponse(response)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Spiel konnte nicht erstellt werden', 'game-creation-failed')
    }
  }

  /**
   * Save game state
   */
  async saveGame(gameState: GameState, sessionId?: string): Promise<GameSession> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('Benutzer nicht authentifiziert', 'auth-required')
      }

      let targetSessionId = sessionId

      // If no sessionId provided, find the active session
      if (!targetSessionId) {
        const { data: activeSessions } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)

        if (activeSessions && activeSessions.length > 0) {
          targetSessionId = activeSessions[0].id
        } else {
          // Create new session if none exists
          return await this.createNewGame(gameState)
        }
      }

      const updateData = {
        game_state: gameState,
        updated_at: new Date().toISOString()
      }

      const response = await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('id', targetSessionId)
        .eq('user_id', user.id)
        .select()
        .single()

      return handleSupabaseResponse(response)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Spiel konnte nicht gespeichert werden', 'game-save-failed')
    }
  }

  /**
   * Load game session
   */
  async loadGame(sessionId: string): Promise<GameState> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('Benutzer nicht authentifiziert', 'auth-required')
      }

      const response = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      const session = handleSupabaseResponse(response)
      return session.game_state
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Spiel konnte nicht geladen werden', 'game-load-failed')
    }
  }

  /**
   * Get all game sessions for current user
   */
  async getUserGameSessions(): Promise<GameSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const response = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      return handleSupabaseResponse(response)
    } catch (error) {
      console.warn('Could not fetch game sessions:', error)
      return []
    }
  }

  /**
   * Process player choice and determine next scene
   */
  async makeChoice(
    currentSceneId: string,
    choiceId: string,
    gameState: GameState
  ): Promise<ChoiceResult> {
    try {
      // Find current scene and choice
      const currentScene = scenes.find(s => s.id === currentSceneId)
      if (!currentScene) {
        throw new SupabaseError('Aktuelle Szene nicht gefunden', 'scene-not-found')
      }

      const choice = currentScene.choices.find(c => c.id === choiceId)
      if (!choice) {
        throw new SupabaseError('Auswahl nicht gefunden', 'choice-not-found')
      }

      // Validate choice requirements
      const validationResult = this.validateChoiceRequirements(choice, gameState)
      if (!validationResult.valid) {
        throw new SupabaseError(
          validationResult.reason || 'Auswahl nicht verfügbar',
          'choice-invalid'
        )
      }

      const result: ChoiceResult = {
        nextSceneId: choice.targetSceneId,
        effects: choice.effects || [],
        success: true
      }

      // Handle special target scene IDs
      if (choice.targetSceneId === 'generate') {
        // Generate new scene with AI
        const generatedScene = await this.generateNextScene(currentScene, choice, gameState)
        result.generatedScene = generatedScene
        result.nextSceneId = generatedScene.id
      } else if (choice.targetSceneId === 'end') {
        // Handle game ending
        result.nextSceneId = 'ending'
        result.message = 'Das Abenteuer ist zu Ende!'
      }

      // Log choice for analytics
      await this.logPlayerChoice(currentSceneId, choiceId, gameState.playerId)

      return result
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Auswahl konnte nicht verarbeitet werden', 'choice-processing-failed')
    }
  }

  /**
   * Generate next scene using AI
   */
  private async generateNextScene(
    currentScene: Scene,
    choice: Choice,
    gameState: GameState
  ): Promise<Scene> {
    try {
      const response = await supabase.functions.invoke('generate-scene', {
        body: {
          currentScene,
          choice,
          gameState,
          prompt: `Fortsetzung nach der Auswahl: "${choice.text}"`
        }
      })

      if (response.error) {
        throw new SupabaseError(
          'KI-Szenengenerierung fehlgeschlagen',
          'ai-generation-failed'
        )
      }

      return response.data
    } catch (error) {
      // Fallback: Create a simple continuation scene
      return this.createFallbackScene(currentScene, choice)
    }
  }

  /**
   * Create fallback scene when AI generation fails
   */
  private createFallbackScene(currentScene: Scene, choice: Choice): Scene {
    return {
      id: `fallback_${Date.now()}`,
      title: 'Unerwartete Wendung',
      content: `Nach Ihrer Entscheidung "${choice.text}" entwickelt sich die Geschichte weiter. ` +
               `Sie stehen vor neuen Herausforderungen und müssen entscheiden, wie Sie vorgehen möchten.`,
      type: 'story',
      choices: [
        {
          id: `fallback_choice_${Date.now()}`,
          text: 'Weiter erkunden',
          description: 'Setzen Sie Ihr Abenteuer fort',
          requirements: [],
          effects: [],
          targetSceneId: 'start', // Return to start scene
          probability: 100,
          isVisible: true,
          isEnabled: true,
          mood: 'neutral'
        }
      ],
      conditions: [],
      effects: [],
      metadata: {
        difficulty: currentScene.metadata.difficulty,
        estimatedReadTime: 1,
        wordCount: 50,
        choiceCount: 1,
        isStartScene: false,
        isEndScene: false,
        branchDepth: currentScene.metadata.branchDepth + 1,
        popularity: 0,
        averageRating: 0,
        playCount: 0
      },
      isGenerated: true,
      generatedBy: 'fallback',
      parentSceneId: currentScene.id,
      tags: ['fallback', 'generated']
    }
  }

  /**
   * Validate choice requirements
   */
  private validateChoiceRequirements(choice: Choice, gameState: GameState) {
    for (const requirement of choice.requirements) {
      switch (requirement.type) {
        case 'stat':
          const statValue = gameState.stats[requirement.key as keyof PlayerStats] as number
          if (!this.evaluateCondition(statValue, requirement.operator, requirement.value)) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break

        case 'flag':
          const flagValue = gameState.flags[requirement.key]
          if (!this.evaluateCondition(flagValue, requirement.operator, requirement.value)) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break

        case 'item':
          const hasItem = gameState.inventory.some(item => 
            item.id === requirement.key && item.quantity >= (requirement.value || 1)
          )
          if (!hasItem) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break

        case 'level':
          if (!this.evaluateCondition(gameState.stats.level, requirement.operator, requirement.value)) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break
      }
    }

    return { valid: true }
  }

  /**
   * Evaluate condition based on operator
   */
  private evaluateCondition(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case '==': return value === targetValue
      case '!=': return value !== targetValue
      case '>': return Number(value) > Number(targetValue)
      case '<': return Number(value) < Number(targetValue)
      case '>=': return Number(value) >= Number(targetValue)
      case '<=': return Number(value) <= Number(targetValue)
      case 'contains': return String(value).includes(String(targetValue))
      case 'not_contains': return !String(value).includes(String(targetValue))
      default: return false
    }
  }

  /**
   * Log player choice for analytics
   */
  private async logPlayerChoice(sceneId: string, choiceId: string, playerId: string) {
    try {
      await supabase
        .from('player_choices')
        .insert({
          scene_id: sceneId,
          choice_id: choiceId,
          player_id: playerId,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Could not log player choice:', error)
    }
  }

  /**
   * Deactivate existing active sessions
   */
  private async deactivateExistingSessions(userId: string) {
    try {
      await supabase
        .from('game_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true)
    } catch (error) {
      console.warn('Could not deactivate existing sessions:', error)
    }
  }

  /**
   * Delete game session
   */
  async deleteGameSession(sessionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new SupabaseError('Benutzer nicht authentifiziert', 'auth-required')
      }

      const response = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      handleSupabaseResponse(response)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Spielstand konnte nicht gelöscht werden', 'game-delete-failed')
    }
  }

  /**
   * Get game statistics
   */
  async getGameStatistics(userId?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new SupabaseError('Benutzer-ID erforderlich', 'user-id-required')
      }

      // Get basic session stats
      const { data: sessionStats } = await supabase
        .from('game_sessions')
        .select('game_state, created_at, updated_at')
        .eq('user_id', targetUserId)

      // Get choice analytics
      const { data: choiceStats } = await supabase
        .from('player_choices')
        .select('scene_id, choice_id, timestamp')
        .eq('player_id', targetUserId)

      return {
        totalSessions: sessionStats?.length || 0,
        totalChoices: choiceStats?.length || 0,
        totalPlayTime: sessionStats?.reduce((sum, session) => 
          sum + (session.game_state?.totalPlayTime || 0), 0) || 0,
        lastPlayed: sessionStats?.[0]?.updated_at,
        // Additional statistics could be calculated here
      }
    } catch (error) {
      console.warn('Could not fetch game statistics:', error)
      return {
        totalSessions: 0,
        totalChoices: 0,
        totalPlayTime: 0,
        lastPlayed: null
      }
    }
  }
}

export const gameService = new GameService()
export default gameService