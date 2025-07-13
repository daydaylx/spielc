// File: src/services/api/adminService.ts
import { supabase, handleSupabaseResponse, SupabaseError } from './supabaseClient'
import { Scene, Choice } from '../../types/scene'
import { FlagDefinition } from '../../types/flags'
import { Character } from '../../types/character'

export interface AdminStatistics {
  totalScenes: number
  totalChoices: number
  totalPlayers: number
  totalSessions: number
  aiGeneratedScenes: number
  mostPopularScenes: Array<{ scene_id: string; play_count: number; title: string }>
  recentActivity: Array<{ timestamp: string; action: string; details: string }>
  flagUsage: Array<{ flag_id: string; usage_count: number }>
  averageSessionLength: number
  completionRate: number
}

export interface SceneAnalytics {
  sceneId: string
  playCount: number
  completionRate: number
  averageTimeSpent: number
  choiceDistribution: Array<{ choiceId: string; selectionCount: number; percentage: number }>
  playerFeedback: Array<{ rating: number; comment?: string; timestamp: string }>
}

class AdminService {
  /**
   * Create new scene
   */
  async createScene(scene: Scene): Promise<Scene> {
    try {
      await this.checkAdminPermissions()

      const sceneData = {
        ...scene,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id
      }

      const response = await supabase
        .from('scenes')
        .insert(sceneData)
        .select()
        .single()

      const savedScene = handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('scene_created', `Created scene: ${scene.title}`, scene.id)
      
      return savedScene
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szene konnte nicht erstellt werden', 'scene-creation-failed')
    }
  }

  /**
   * Update existing scene
   */
  async updateScene(sceneId: string, updates: Partial<Scene>): Promise<Scene> {
    try {
      await this.checkAdminPermissions()

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }

      const response = await supabase
        .from('scenes')
        .update(updateData)
        .eq('id', sceneId)
        .select()
        .single()

      const updatedScene = handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('scene_updated', `Updated scene: ${updatedScene.title}`, sceneId)
      
      return updatedScene
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szene konnte nicht aktualisiert werden', 'scene-update-failed')
    }
  }

  /**
   * Delete scene
   */
  async deleteScene(sceneId: string): Promise<void> {
    try {
      await this.checkAdminPermissions()

      // Check if scene is referenced by other scenes
      const { data: referencingScenes } = await supabase
        .from('scenes')
        .select('id, title')
        .contains('choices', [{ targetSceneId: sceneId }])

      if (referencingScenes && referencingScenes.length > 0) {
        throw new SupabaseError(
          `Szene wird von ${referencingScenes.length} anderen Szenen referenziert und kann nicht gelöscht werden.`,
          'scene-referenced'
        )
      }

      const response = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneId)

      handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('scene_deleted', `Deleted scene: ${sceneId}`, sceneId)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szene konnte nicht gelöscht werden', 'scene-deletion-failed')
    }
  }

  /**
   * Get all scenes with admin metadata
   */
  async getAllScenes(): Promise<Scene[]> {
    try {
      await this.checkAdminPermissions()

      const response = await supabase
        .from('scenes')
        .select('*')
        .order('created_at', { ascending: false })

      return handleSupabaseResponse(response)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szenen konnten nicht geladen werden', 'scenes-fetch-failed')
    }
  }

  /**
   * Get scene analytics
   */
  async getSceneAnalytics(sceneId: string): Promise<SceneAnalytics> {
    try {
      await this.checkAdminPermissions()

      // Get basic scene info
      const { data: scene } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', sceneId)
        .single()

      if (!scene) {
        throw new SupabaseError('Szene nicht gefunden', 'scene-not-found')
      }

      // Get choice analytics
      const { data: choiceStats } = await supabase
        .from('player_choices')
        .select('choice_id, scene_id, timestamp')
        .eq('scene_id', sceneId)

      // Calculate analytics
      const playCount = choiceStats?.length || 0
      const choiceDistribution = this.calculateChoiceDistribution(scene.choices, choiceStats || [])

      return {
        sceneId,
        playCount,
        completionRate: 0, // Would need more data to calculate
        averageTimeSpent: 0, // Would need session tracking
        choiceDistribution,
        playerFeedback: [] // Would need feedback system
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szenen-Analytics konnten nicht geladen werden', 'analytics-fetch-failed')
    }
  }

  /**
   * Get admin statistics dashboard
   */
  async getAdminStatistics(): Promise<AdminStatistics> {
    try {
      await this.checkAdminPermissions()

      // Get scene statistics
      const { data: scenes } = await supabase
        .from('scenes')
        .select('id, title, is_generated, metadata')

      // Get user statistics
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, created_at')

      // Get session statistics
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('id, created_at, updated_at, game_state')

      // Get choice statistics
      const { data: choices } = await supabase
        .from('player_choices')
        .select('scene_id, choice_id, timestamp')

      // Calculate statistics
      const totalScenes = scenes?.length || 0
      const totalChoices = choices?.length || 0
      const totalPlayers = users?.length || 0
      const totalSessions = sessions?.length || 0
      const aiGeneratedScenes = scenes?.filter(s => s.is_generated).length || 0

      // Calculate most popular scenes
      const scenePlayCounts = this.calculateScenePlayCounts(choices || [])
      const mostPopularScenes = scenePlayCounts
        .map(item => ({
          scene_id: item.sceneId,
          play_count: item.count,
          title: scenes?.find(s => s.id === item.sceneId)?.title || 'Unknown'
        }))
        .sort((a, b) => b.play_count - a.play_count)
        .slice(0, 10)

      // Calculate average session length
      const averageSessionLength = sessions?.reduce((sum, session) => {
        const playTime = session.game_state?.totalPlayTime || 0
        return sum + playTime
      }, 0) / (totalSessions || 1)

      return {
        totalScenes,
        totalChoices,
        totalPlayers,
        totalSessions,
        aiGeneratedScenes,
        mostPopularScenes,
        recentActivity: [], // Would need activity log
        flagUsage: [], // Would need flag usage tracking
        averageSessionLength: Math.round(averageSessionLength),
        completionRate: 0 // Would need completion tracking
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Admin-Statistiken konnten nicht geladen werden', 'admin-stats-failed')
    }
  }

  /**
   * Bulk import scenes
   */
  async bulkImportScenes(scenes: Scene[]): Promise<{ success: number; errors: string[] }> {
    try {
      await this.checkAdminPermissions()

      const results = { success: 0, errors: [] as string[] }

      for (const scene of scenes) {
        try {
          await this.createScene(scene)
          results.success++
        } catch (error) {
          results.errors.push(`Scene ${scene.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Log admin action
      await this.logAdminAction(
        'bulk_import', 
        `Imported ${results.success} scenes, ${results.errors.length} errors`,
        'bulk_import'
      )

      return results
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Bulk-Import fehlgeschlagen', 'bulk-import-failed')
    }
  }

  /**
   * Export all scenes
   */
  async exportAllScenes(): Promise<Scene[]> {
    try {
      await this.checkAdminPermissions()

      const scenes = await this.getAllScenes()
      
      // Log admin action
      await this.logAdminAction('export_scenes', `Exported ${scenes.length} scenes`, 'export')
      
      return scenes
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Export fehlgeschlagen', 'export-failed')
    }
  }

  /**
   * Manage flags
   */
  async createFlag(flag: FlagDefinition): Promise<FlagDefinition> {
    try {
      await this.checkAdminPermissions()

      const response = await supabase
        .from('flag_definitions')
        .insert(flag)
        .select()
        .single()

      const savedFlag = handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('flag_created', `Created flag: ${flag.name}`, flag.id)
      
      return savedFlag
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Flag konnte nicht erstellt werden', 'flag-creation-failed')
    }
  }

  /**
   * Get all flags
   */
  async getAllFlags(): Promise<FlagDefinition[]> {
    try {
      await this.checkAdminPermissions()

      const response = await supabase
        .from('flag_definitions')
        .select('*')
        .order('category', { ascending: true })

      return handleSupabaseResponse(response)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Flags konnten nicht geladen werden', 'flags-fetch-failed')
    }
  }

  /**
   * Update flag
   */
  async updateFlag(flagId: string, updates: Partial<FlagDefinition>): Promise<FlagDefinition> {
    try {
      await this.checkAdminPermissions()

      const response = await supabase
        .from('flag_definitions')
        .update(updates)
        .eq('id', flagId)
        .select()
        .single()

      const updatedFlag = handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('flag_updated', `Updated flag: ${flagId}`, flagId)
      
      return updatedFlag
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Flag konnte nicht aktualisiert werden', 'flag-update-failed')
    }
  }

  /**
   * Delete flag
   */
  async deleteFlag(flagId: string): Promise<void> {
    try {
      await this.checkAdminPermissions()

      const response = await supabase
        .from('flag_definitions')
        .delete()
        .eq('id', flagId)

      handleSupabaseResponse(response)
      
      // Log admin action
      await this.logAdminAction('flag_deleted', `Deleted flag: ${flagId}`, flagId)
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Flag konnte nicht gelöscht werden', 'flag-deletion-failed')
    }
  }

  /**
   * Check admin permissions
   */
  private async checkAdminPermissions(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new SupabaseError('Authentifizierung erforderlich', 'auth-required')
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.preferences?.isAdmin === true

    if (!isAdmin) {
      throw new SupabaseError('Admin-Berechtigung erforderlich', 'admin-required')
    }
  }

  /**
   * Log admin action
   */
  private async logAdminAction(action: string, description: string, targetId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('admin_logs')
        .insert({
          user_id: user?.id,
          action,
          description,
          target_id: targetId,
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Could not log admin action:', error)
    }
  }

  /**
   * Calculate choice distribution
   */
  private calculateChoiceDistribution(choices: Choice[], choiceStats: any[]) {
    const choiceCounts = choices.map(choice => {
      const count = choiceStats.filter(stat => stat.choice_id === choice.id).length
      const total = choiceStats.length || 1
      return {
        choiceId: choice.id,
        selectionCount: count,
        percentage: Math.round((count / total) * 100)
      }
    })

    return choiceCounts
  }

  /**
   * Calculate scene play counts
   */
  private calculateScenePlayCounts(choices: any[]) {
    const sceneCounts = new Map<string, number>()
    
    choices.forEach(choice => {
      const current = sceneCounts.get(choice.scene_id) || 0
      sceneCounts.set(choice.scene_id, current + 1)
    })

    return Array.from(sceneCounts.entries()).map(([sceneId, count]) => ({
      sceneId,
      count
    }))
  }
}

export const adminService = new AdminService()
export default adminService

// File: src/services/api/aiService.ts
import { supabase, SupabaseError } from './supabaseClient'
import { Scene, Choice } from '../../types/scene'
import { GameState } from '../../types/game'

export interface AIGenerationRequest {
  prompt: string
  sceneType: 'story' | 'choice' | 'battle' | 'puzzle' | 'ending'
  tone: string
  difficulty: number
  length: 'short' | 'medium' | 'long'
  includeChoices: boolean
  choiceCount: number
  context?: {
    currentScene?: Scene
    gameState?: GameState
    previousChoices?: string[]
  }
}

export interface AIGenerationResponse {
  scene: Scene
  metadata: {
    model: string
    tokensUsed: number
    generationTime: number
    cost: number
    confidence: number
  }
  alternatives?: Scene[]
  warnings?: string[]
}

export interface AIProvider {
  name: string
  models: string[]
  isAvailable: boolean
  costPerToken: number
}

class AIService {
  private readonly openRouterUrl = 'https://openrouter.ai/api/v1'
  private readonly apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  private readonly defaultModel = import.meta.env.VITE_DEFAULT_AI_MODEL || 'openai/gpt-4o-mini'

  /**
   * Generate scene using AI
   */
  async generateScene(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      if (!this.apiKey) {
        throw new SupabaseError('OpenRouter API Key nicht konfiguriert', 'api-key-missing')
      }

      const startTime = Date.now()

      // Call Supabase Edge Function for AI generation
      const response = await supabase.functions.invoke('generate-scene', {
        body: {
          ...request,
          model: this.defaultModel,
          apiKey: this.apiKey
        }
      })

      if (response.error) {
        throw new SupabaseError(
          'KI-Szenengenerierung fehlgeschlagen: ' + response.error.message,
          'ai-generation-failed'
        )
      }

      const generationTime = Date.now() - startTime

      // Log AI usage for analytics
      await this.logAIUsage({
        model: this.defaultModel,
        tokensUsed: response.data.metadata?.tokensUsed || 0,
        generationTime,
        success: true,
        prompt: request.prompt
      })

      return {
        scene: response.data.scene,
        metadata: {
          model: this.defaultModel,
          tokensUsed: response.data.metadata?.tokensUsed || 0,
          generationTime,
          cost: this.calculateCost(response.data.metadata?.tokensUsed || 0),
          confidence: response.data.metadata?.confidence || 0.8
        },
        alternatives: response.data.alternatives,
        warnings: response.data.warnings
      }
    } catch (error) {
      // Log failed AI usage
      await this.logAIUsage({
        model: this.defaultModel,
        tokensUsed: 0,
        generationTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt
      })

      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('KI-Szenengenerierung fehlgeschlagen', 'ai-generation-error')
    }
  }

  /**
   * Generate scene continuation
   */
  async generateContinuation(
    currentScene: Scene,
    choice: Choice,
    gameState: GameState
  ): Promise<Scene> {
    const request: AIGenerationRequest = {
      prompt: `Fortsetzung der Geschichte nach der Auswahl: "${choice.text}"`,
      sceneType: 'story',
      tone: choice.mood || 'neutral',
      difficulty: currentScene.metadata.difficulty,
      length: 'medium',
      includeChoices: true,
      choiceCount: 3,
      context: {
        currentScene,
        gameState,
        previousChoices: [choice.text]
      }
    }

    const response = await this.generateScene(request)
    return response.scene
  }

  /**
   * Improve existing scene with AI
   */
  async improveScene(scene: Scene, improvementPrompt: string): Promise<Scene> {
    try {
      const request: AIGenerationRequest = {
        prompt: `Verbessere diese Szene: "${scene.title}"\n\nAktueller Inhalt: ${scene.content}\n\nVerbesserungsanweisung: ${improvementPrompt}`,
        sceneType: scene.type,
        tone: 'neutral',
        difficulty: scene.metadata.difficulty,
        length: 'medium',
        includeChoices: scene.choices.length > 0,
        choiceCount: scene.choices.length || 3
      }

      const response = await this.generateScene(request)
      
      // Preserve original metadata
      return {
        ...response.scene,
        id: scene.id,
        metadata: {
          ...scene.metadata,
          ...response.scene.metadata
        },
        parentSceneId: scene.id,
        isGenerated: true,
        generatedBy: 'ai'
      }
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Szenen-Verbesserung fehlgeschlagen', 'scene-improvement-failed')
    }
  }

  /**
   * Generate character dialogue
   */
  async generateDialogue(
    character: string,
    context: string,
    mood: string = 'neutral'
  ): Promise<string> {
    try {
      const response = await supabase.functions.invoke('generate-dialogue', {
        body: {
          character,
          context,
          mood,
          model: this.defaultModel,
          apiKey: this.apiKey
        }
      })

      if (response.error) {
        throw new SupabaseError('Dialog-Generierung fehlgeschlagen', 'dialogue-generation-failed')
      }

      return response.data.dialogue
    } catch (error) {
      if (error instanceof SupabaseError) {
        throw error
      }
      throw new SupabaseError('Dialog-Generierung fehlgeschlagen', 'dialogue-error')
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<AIProvider[]> {
    try {
      const response = await fetch(`${this.openRouterUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const data = await response.json()
      
      // Transform to our format
      return data.data.map((model: any) => ({
        name: model.id,
        models: [model.id],
        isAvailable: true,
        costPerToken: model.pricing?.prompt || 0
      }))
    } catch (error) {
      console.warn('Could not fetch AI models:', error)
      
      // Return default models
      return [
        {
          name: 'OpenAI GPT-4o Mini',
          models: ['openai/gpt-4o-mini'],
          isAvailable: true,
          costPerToken: 0.000001
        },
        {
          name: 'OpenAI GPT-4o',
          models: ['openai/gpt-4o'],
          isAvailable: true,
          costPerToken: 0.00001
        }
      ]
    }
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStatistics(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          successRate: 0
        }
      }

      const { data: usageStats } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', user.id)

      if (!usageStats) {
        return {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          successRate: 0
        }
      }

      const totalRequests = usageStats.length
      const successfulRequests = usageStats.filter(log => log.success).length
      const totalTokens = usageStats.reduce((sum, log) => sum + (log.tokens_used || 0), 0)
      const totalCost = totalTokens * 0.000001 // Rough estimate

      return {
        totalRequests,
        totalTokens,
        totalCost,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0
      }
    } catch (error) {
      console.warn('Could not fetch AI usage statistics:', error)
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        successRate: 0
      }
    }
  }

  /**
   * Log AI usage for analytics
   */
  private async logAIUsage(usage: {
    model: string
    tokensUsed: number
    generationTime: number
    success: boolean
    error?: string
    prompt: string
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user?.id,
          model: usage.model,
          tokens_used: usage.tokensUsed,
          generation_time: usage.generationTime,
          success: usage.success,
          error_message: usage.error,
          prompt_preview: usage.prompt.substring(0, 100),
          timestamp: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Could not log AI usage:', error)
    }
  }

  /**
   * Calculate cost based on tokens
   */
  private calculateCost(tokens: number): number {
    // Rough estimate - would need to be adjusted based on actual model pricing
    return tokens * 0.000001
  }

  /**
   * Test AI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.openRouterUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch {
      return false
    }
  }
}

export const aiService = new AIService()
export default aiService

// File: src/services/storage/localStorage.ts
import { GameState } from '../../types/game'

interface StoredData {
  timestamp: string
  version: string
  data: any
}

class LocalStorageService {
  private readonly version = '1.0.0'
  private readonly gameStateKey = 'zauberbuch-game-state'
  private readonly userPreferencesKey = 'zauberbuch-user-preferences'
  private readonly cacheKey = 'zauberbuch-cache'

  /**
   * Save game state to localStorage
   */
  saveGameState(gameState: GameState): void {
    try {
      const data: StoredData = {
        timestamp: new Date().toISOString(),
        version: this.version,
        data: gameState
      }

      localStorage.setItem(this.gameStateKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Could not save game state to localStorage:', error)
    }
  }

  /**
   * Load game state from localStorage
   */
  getGameState(): GameState | null {
    try {
      const stored = localStorage.getItem(this.gameStateKey)
      if (!stored) return null

      const parsedData: StoredData = JSON.parse(stored)
      
      // Check version compatibility
      if (parsedData.version !== this.version) {
        console.warn('Game state version mismatch, clearing localStorage')
        this.clearGameState()
        return null
      }

      // Check if data is not too old (optional)
      const storedTime = new Date(parsedData.timestamp)
      const daysSince = (Date.now() - storedTime.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSince > 30) {
        console.warn('Game state is too old, clearing localStorage')
        this.clearGameState()
        return null
      }

      return parsedData.data
    } catch (error) {
      console.warn('Could not load game state from localStorage:', error)
      this.clearGameState()
      return null
    }
  }

  /**
   * Clear game state from localStorage
   */
  clearGameState(): void {
    try {
      localStorage.removeItem(this.gameStateKey)
    } catch (error) {
      console.warn('Could not clear game state from localStorage:', error)
    }
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(preferences: Record<string, any>): void {
    try {
      const data: StoredData = {
        timestamp: new Date().toISOString(),
        version: this.version,
        data: preferences
      }

      localStorage.setItem(this.userPreferencesKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Could not save user preferences to localStorage:', error)
    }
  }

  /**
   * Load user preferences
   */
  getUserPreferences(): Record<string, any> | null {
    try {
      const stored = localStorage.getItem(this.userPreferencesKey)
      if (!stored) return null

      const parsedData: StoredData = JSON.parse(stored)
      return parsedData.data
    } catch (error) {
      console.warn('Could not load user preferences from localStorage:', error)
      return null
    }
  }

  /**
   * Save data to cache
   */
  saveToCache(key: string, data: any, ttl: number = 3600000): void {
    try {
      const cacheData = {
        timestamp: Date.now(),
        ttl,
        data
      }

      const existingCache = this.getCache()
      existingCache[key] = cacheData

      localStorage.setItem(this.cacheKey, JSON.stringify(existingCache))
    } catch (error) {
      console.warn('Could not save to cache:', error)
    }
  }

  /**
   * Get data from cache
   */
  getFromCache(key: string): any | null {
    try {
      const cache = this.getCache()
      const cacheEntry = cache[key]

      if (!cacheEntry) return null

      // Check if cache is expired
      if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
        delete cache[key]
        localStorage.setItem(this.cacheKey, JSON.stringify(cache))
        return null
      }

      return cacheEntry.data
    } catch (error) {
      console.warn('Could not get from cache:', error)
      return null
    }
  }

  /**
   * Get all cache
   */
  private getCache(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.cacheKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    try {
      const cache = this.getCache()
      const now = Date.now()
      let hasChanges = false

      Object.keys(cache).forEach(key => {
        const entry = cache[key]
        if (now - entry.timestamp > entry.ttl) {
          delete cache[key]
          hasChanges = true
        }
      })

      if (hasChanges) {
        localStorage.setItem(this.cacheKey, JSON.stringify(cache))
      }
    } catch (error) {
      console.warn('Could not clear expired cache:', error)
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey)
    } catch (error) {
      console.warn('Could not clear cache:', error)
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    used: number
    available: number
    quota: number
    percentage: number
  } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // Rough estimate of available localStorage (usually 5-10MB)
      const quota = 5 * 1024 * 1024 // 5MB estimate
      const available = quota - used
      const percentage = (used / quota) * 100

      return {
        used,
        available,
        quota,
        percentage
      }
    } catch {
      return {
        used: 0,
        available: 0,
        quota: 0,
        percentage: 0
      }
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = 'test-localStorage'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Export all stored data
   */
  exportAllData(): string {
    try {
      const allData = {
        gameState: this.getGameState(),
        userPreferences: this.getUserPreferences(),
        cache: this.getCache(),
        timestamp: new Date().toISOString(),
        version: this.version
      }

      return JSON.stringify(allData, null, 2)
    } catch (error) {
      console.error('Could not export data:', error)
      return '{}'
    }
  }

  /**
   * Import data from export
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (data.gameState) {
        this.saveGameState(data.gameState)
      }

      if (data.userPreferences) {
        this.saveUserPreferences(data.userPreferences)
      }

      return true
    } catch (error) {
      console.error('Could not import data:', error)
      return false
    }
  }
}

export const localStorageService = new LocalStorageService()
export default localStorageService