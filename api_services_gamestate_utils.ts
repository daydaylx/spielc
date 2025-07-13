// src/services/gameStateService.ts
import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { cacheService } from './cacheService';
import { eventBus } from '../utils/eventBus';
import type { 
  GameState, 
  SaveSlot, 
  GameProgress, 
  PlayerStats,
  GameFlags,
  InventoryItem,
  Character
} from '../types';

export interface GameSaveData {
  id: string;
  userId: string;
  slotName: string;
  gameState: GameState;
  progress: GameProgress;
  timestamp: string;
  metadata: {
    playtime: number;
    currentScene: string;
    playerLevel: number;
    storyProgress: number;
  };
}

class GameStateService {
  private currentState: GameState | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private readonly MAX_SAVE_SLOTS = 10;

  async initializeNewGame(storyId: string): Promise<GameState> {
    try {
      // Lade Story-Metadaten
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          scenes!inner(
            id,
            title,
            type,
            is_starting_scene
          )
        `)
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      // Finde Starting Scene
      const startingScene = story.scenes.find((scene: any) => scene.is_starting_scene);
      if (!startingScene) {
        throw new Error('No starting scene found for story');
      }

      // Erstelle neuen GameState
      const gameState: GameState = {
        id: crypto.randomUUID(),
        storyId,
        currentSceneId: startingScene.id,
        player: {
          id: crypto.randomUUID(),
          name: 'Spieler',
          level: 1,
          health: 100,
          maxHealth: 100,
          mana: 50,
          maxMana: 50,
          experience: 0,
          gold: 0,
          stats: {
            strength: 10,
            intelligence: 10,
            dexterity: 10,
            charisma: 10,
            luck: 10
          }
        },
        inventory: [],
        flags: new Map(),
        relationships: new Map(),
        progress: {
          scenesVisited: [startingScene.id],
          choicesMade: [],
          achievementsUnlocked: [],
          playtime: 0,
          storyProgress: 0,
          lastSaved: new Date().toISOString()
        },
        settings: {
          textSpeed: 'medium',
          soundEnabled: true,
          musicEnabled: true,
          autoSave: true,
          difficulty: 'normal'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      this.currentState = gameState;
      this.startAutoSave();
      
      eventBus.emit('gameStateInitialized', gameState);
      return gameState;

    } catch (error) {
      console.error('Error initializing new game:', error);
      throw new Error('Failed to initialize new game');
    }
  }

  async loadGame(saveSlotId: string): Promise<GameState> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: saveData, error } = await supabase
        .from('save_slots')
        .select('*')
        .eq('id', saveSlotId)
        .eq('user_id', user.user.id)
        .single();

      if (error) throw error;

      const gameState = saveData.game_state as GameState;
      
      // Validiere GameState
      if (!this.validateGameState(gameState)) {
        throw new Error('Invalid game state data');
      }

      this.currentState = gameState;
      this.startAutoSave();

      // Cache laden
      await cacheService.loadGameCache(gameState.id);
      
      eventBus.emit('gameLoaded', gameState);
      return gameState;

    } catch (error) {
      console.error('Error loading game:', error);
      throw new Error('Failed to load game');
    }
  }

  async saveGame(slotName?: string, isAutoSave = false): Promise<SaveSlot> {
    try {
      if (!this.currentState) {
        throw new Error('No active game state to save');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Update metadata
      this.currentState.metadata.lastModified = new Date().toISOString();
      this.currentState.progress.lastSaved = new Date().toISOString();

      const saveData: Partial<GameSaveData> = {
        userId: user.user.id,
        slotName: slotName || `Auto Save ${new Date().toLocaleString()}`,
        gameState: this.currentState,
        progress: this.currentState.progress,
        metadata: {
          playtime: this.currentState.progress.playtime,
          currentScene: this.currentState.currentSceneId,
          playerLevel: this.currentState.player.level,
          storyProgress: this.currentState.progress.storyProgress
        }
      };

      const { data: savedSlot, error } = await supabase
        .from('save_slots')
        .upsert(saveData)
        .select()
        .single();

      if (error) throw error;

      // Offline backup
      if (isAutoSave) {
        await storageService.set(`autosave_${this.currentState.id}`, this.currentState);
      } else {
        await storageService.set(`manual_save_${savedSlot.id}`, this.currentState);
      }

      eventBus.emit('gameSaved', { slot: savedSlot, isAutoSave });
      return savedSlot;

    } catch (error) {
      console.error('Error saving game:', error);
      throw new Error('Failed to save game');
    }
  }

  async getSaveSlots(): Promise<SaveSlot[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: slots, error } = await supabase
        .from('save_slots')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false })
        .limit(this.MAX_SAVE_SLOTS);

      if (error) throw error;

      return slots || [];

    } catch (error) {
      console.error('Error fetching save slots:', error);
      return [];
    }
  }

  async deleteSaveSlot(slotId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('save_slots')
        .delete()
        .eq('id', slotId)
        .eq('user_id', user.user.id);

      if (error) throw error;

      // Remove offline backup
      await storageService.remove(`manual_save_${slotId}`);
      
      eventBus.emit('saveSlotDeleted', slotId);

    } catch (error) {
      console.error('Error deleting save slot:', error);
      throw new Error('Failed to delete save slot');
    }
  }

  updateGameState(updates: Partial<GameState>): void {
    if (!this.currentState) return;

    this.currentState = {
      ...this.currentState,
      ...updates,
      metadata: {
        ...this.currentState.metadata,
        lastModified: new Date().toISOString()
      }
    };

    eventBus.emit('gameStateUpdated', this.currentState);
  }

  updatePlayerStats(stats: Partial<PlayerStats>): void {
    if (!this.currentState) return;

    this.currentState.player = {
      ...this.currentState.player,
      ...stats
    };

    eventBus.emit('playerStatsUpdated', this.currentState.player);
  }

  addToInventory(item: InventoryItem): void {
    if (!this.currentState) return;

    const existingItem = this.currentState.inventory.find(i => i.id === item.id);
    
    if (existingItem && item.stackable) {
      existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
    } else {
      this.currentState.inventory.push(item);
    }

    eventBus.emit('inventoryUpdated', this.currentState.inventory);
  }

  removeFromInventory(itemId: string, quantity = 1): boolean {
    if (!this.currentState) return false;

    const itemIndex = this.currentState.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return false;

    const item = this.currentState.inventory[itemIndex];
    
    if (item.quantity && item.quantity > quantity) {
      item.quantity -= quantity;
    } else {
      this.currentState.inventory.splice(itemIndex, 1);
    }

    eventBus.emit('inventoryUpdated', this.currentState.inventory);
    return true;
  }

  setFlag(key: string, value: any): void {
    if (!this.currentState) return;

    this.currentState.flags.set(key, value);
    eventBus.emit('flagUpdated', { key, value });
  }

  getFlag(key: string): any {
    return this.currentState?.flags.get(key);
  }

  updateRelationship(characterId: string, change: number): void {
    if (!this.currentState) return;

    const current = this.currentState.relationships.get(characterId) || 0;
    const newValue = Math.max(-100, Math.min(100, current + change));
    
    this.currentState.relationships.set(characterId, newValue);
    eventBus.emit('relationshipUpdated', { characterId, value: newValue, change });
  }

  addPlaytime(seconds: number): void {
    if (!this.currentState) return;

    this.currentState.progress.playtime += seconds;
    eventBus.emit('playtimeUpdated', this.currentState.progress.playtime);
  }

  getCurrentState(): GameState | null {
    return this.currentState;
  }

  isGameActive(): boolean {
    return this.currentState !== null;
  }

  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.currentState?.settings.autoSave) {
        try {
          await this.saveGame(undefined, true);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private validateGameState(state: any): state is GameState {
    return (
      state &&
      typeof state.id === 'string' &&
      typeof state.storyId === 'string' &&
      typeof state.currentSceneId === 'string' &&
      state.player &&
      Array.isArray(state.inventory) &&
      state.progress &&
      state.settings &&
      state.metadata
    );
  }

  async exportGameState(): Promise<string> {
    if (!this.currentState) {
      throw new Error('No active game state to export');
    }

    const exportData = {
      gameState: this.currentState,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importGameState(jsonData: string): Promise<GameState> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.gameState || !this.validateGameState(importData.gameState)) {
        throw new Error('Invalid game state format');
      }

      const gameState = importData.gameState;
      
      // Erstelle neue IDs für Import
      gameState.id = crypto.randomUUID();
      gameState.metadata.lastModified = new Date().toISOString();

      this.currentState = gameState;
      this.startAutoSave();

      eventBus.emit('gameStateImported', gameState);
      return gameState;

    } catch (error) {
      console.error('Error importing game state:', error);
      throw new Error('Failed to import game state');
    }
  }

  cleanup(): void {
    this.stopAutoSave();
    this.currentState = null;
    eventBus.emit('gameStateCleanup');
  }
}

export const gameStateService = new GameStateService();

// src/services/cacheService.ts
import { storageService } from './storageService';
import type { Scene, Choice, Character, Story } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface GameCache {
  scenes: Map<string, Scene>;
  characters: Map<string, Character>;
  stories: Map<string, Story>;
  metadata: {
    lastUpdated: string;
    gameId: string;
  };
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private gameCache: GameCache | null = null;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): Promise<void> {
    // Entferne älteste Einträge wenn Cache voll
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Persistiere wichtige Cache-Daten
    if (this.isImportantCacheKey(key)) {
      await storageService.set(`cache_${key}`, data);
    }
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await storageService.remove(`cache_${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.gameCache = null;
    
    // Entferne persistierte Cache-Daten
    const keys = await storageService.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    
    for (const key of cacheKeys) {
      await storageService.remove(key);
    }
  }

  async loadGameCache(gameId: string): Promise<void> {
    try {
      const cachedData = await storageService.get(`game_cache_${gameId}`);
      
      if (cachedData) {
        this.gameCache = {
          scenes: new Map(cachedData.scenes || []),
          characters: new Map(cachedData.characters || []),
          stories: new Map(cachedData.stories || []),
          metadata: cachedData.metadata || {
            lastUpdated: new Date().toISOString(),
            gameId
          }
        };
      } else {
        this.gameCache = {
          scenes: new Map(),
          characters: new Map(),
          stories: new Map(),
          metadata: {
            lastUpdated: new Date().toISOString(),
            gameId
          }
        };
      }
    } catch (error) {
      console.error('Error loading game cache:', error);
      this.gameCache = {
        scenes: new Map(),
        characters: new Map(),
        stories: new Map(),
        metadata: {
          lastUpdated: new Date().toISOString(),
          gameId
        }
      };
    }
  }

  async saveGameCache(): Promise<void> {
    if (!this.gameCache) return;

    try {
      const cacheData = {
        scenes: Array.from(this.gameCache.scenes.entries()),
        characters: Array.from(this.gameCache.characters.entries()),
        stories: Array.from(this.gameCache.stories.entries()),
        metadata: {
          ...this.gameCache.metadata,
          lastUpdated: new Date().toISOString()
        }
      };

      await storageService.set(`game_cache_${this.gameCache.metadata.gameId}`, cacheData);
    } catch (error) {
      console.error('Error saving game cache:', error);
    }
  }

  cacheScene(scene: Scene): void {
    if (!this.gameCache) return;
    
    this.gameCache.scenes.set(scene.id, scene);
    this.set(`scene_${scene.id}`, scene, 10 * 60 * 1000); // 10 minutes
  }

  getCachedScene(sceneId: string): Scene | null {
    return this.gameCache?.scenes.get(sceneId) || null;
  }

  cacheCharacter(character: Character): void {
    if (!this.gameCache) return;
    
    this.gameCache.characters.set(character.id, character);
    this.set(`character_${character.id}`, character, 15 * 60 * 1000); // 15 minutes
  }

  getCachedCharacter(characterId: string): Character | null {
    return this.gameCache?.characters.get(characterId) || null;
  }

  cacheStory(story: Story): void {
    if (!this.gameCache) return;
    
    this.gameCache.stories.set(story.id, story);
    this.set(`story_${story.id}`, story, 30 * 60 * 1000); // 30 minutes
  }

  getCachedStory(storyId: string): Story | null {
    return this.gameCache?.stories.get(storyId) || null;
  }

  async preloadGameData(storyId: string): Promise<void> {
    try {
      // Implementiere Preloading Logik für bessere Performance
      const cacheKey = `preload_${storyId}`;
      const cached = await this.get(cacheKey);
      
      if (cached) return;

      // Lade häufig benötigte Daten
      // Dies wird in den spezifischen Services implementiert
      await this.set(cacheKey, true, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      console.error('Error preloading game data:', error);
    }
  }

  private isImportantCacheKey(key: string): boolean {
    return key.includes('scene_') || 
           key.includes('character_') || 
           key.includes('story_') ||
           key.includes('user_');
  }

  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: string;
  } {
    const size = this.cache.size;
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      size,
      hitRate: 0, // Würde echte Hit-Rate Tracking benötigen
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
    };
  }
}

export const cacheService = new CacheService();

// src/services/utilityService.ts
import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import type { AppSettings, UserProfile, SystemInfo } from '../types';

class UtilityService {
  private settings: AppSettings | null = null;
  private systemInfo: SystemInfo | null = null;

  async initializeApp(): Promise<void> {
    try {
      // Lade App-Einstellungen
      await this.loadSettings();
      
      // Sammle System-Informationen
      this.systemInfo = await this.getSystemInfo();
      
      // Prüfe App-Updates
      await this.checkForUpdates();
      
      // Initialisiere Performance Monitoring
      this.initializePerformanceMonitoring();
      
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  async loadSettings(): Promise<AppSettings> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (user.user) {
        // Lade Benutzer-spezifische Einstellungen
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.user.id)
          .single();

        if (userSettings) {
          this.settings = userSettings.settings;
          return this.settings;
        }
      }

      // Fallback zu lokalen Einstellungen
      const localSettings = await storageService.get('app_settings');
      
      this.settings = localSettings || this.getDefaultSettings();
      return this.settings;

    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
      return this.settings;
    }
  }

  async saveSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      const updatedSettings = {
        ...this.settings,
        ...newSettings,
        lastModified: new Date().toISOString()
      };

      this.settings = updatedSettings;

      const { data: user } = await supabase.auth.getUser();
      
      if (user.user) {
        // Speichere in Supabase
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.user.id,
            settings: updatedSettings
          });
      }

      // Speichere lokal als Backup
      await storageService.set('app_settings', updatedSettings);

    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  getSettings(): AppSettings {
    return this.settings || this.getDefaultSettings();
  }

  private getDefaultSettings(): AppSettings {
    return {
      theme: 'dark',
      language: 'de',
      textSpeed: 'medium',
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.7,
      musicVolume: 0.5,
      autoSave: true,
      autoSaveInterval: 300, // 5 minutes
      showTutorial: true,
      accessibilityMode: false,
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      offlineMode: false,
      analyticsEnabled: true,
      pushNotifications: false,
      lastModified: new Date().toISOString()
    };
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: 'ontouchstart' in window,
      localStorage: this.isStorageAvailable('localStorage'),
      sessionStorage: this.isStorageAvailable('sessionStorage'),
      webGL: this.checkWebGLSupport(),
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      geolocation: 'geolocation' in navigator,
      performanceAPI: 'performance' in window,
      timestamp: new Date().toISOString()
    };

    this.systemInfo = info;
    return info;
  }

  async generateUniqueId(): Promise<string> {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback für ältere Browser
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async hashString(input: string): Promise<string> {
    if (crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback für ältere Browser (einfacher Hash)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  formatDate(date: string | Date, format = 'full'): string {
    const d = new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      full: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      short: {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit'
      },
      date: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    }[format] || { year: 'numeric', month: 'long', day: 'numeric' };

    return new Intl.DateTimeFormat(this.settings?.language || 'de', options).format(d);
  }

  formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async downloadFile(data: string, filename: string, mimeType = 'application/json'): Promise<void> {
    try {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback für ältere Browser
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  async shareContent(data: ShareData): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        // Fallback: Copy URL to clipboard
        if (data.url) {
          await this.copyToClipboard(data.url);
        } else if (data.text) {
          await this.copyToClipboard(data.text);
        }
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      throw new Error('Failed to share content');
    }
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      // In einer echten App würde hier die Update-Prüfung stattfinden
      const currentVersion = await storageService.get('app_version') || '1.0.0';
      const latestVersion = '1.0.0'; // Würde von API geholt werden
      
      return currentVersion !== latestVersion;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        canvas.getContext('webgl')
      );
    } catch {
      return false;
    }
  }

  private initializePerformanceMonitoring(): void {
    if ('performance' in window && this.settings?.analyticsEnabled) {
      // Performance Observer für kritische Metriken
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              console.log('Navigation timing:', entry);
            }
          });
        });
        
        observer.observe({ entryTypes: ['navigation', 'paint'] });
      }
    }
  }

  getPerformanceMetrics(): {
    loadTime: number;
    renderTime: number;
    memoryUsage?: number;
  } {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      renderTime: paint ? paint.startTime : 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }

  logError(error: Error, context?: string): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Application Error:', errorData);
    
    // In Produktion würde hier ein Error-Tracking Service verwendet werden
    if (this.settings?.analyticsEnabled) {
      // Sende Error an Tracking Service
    }
  }
}

export const utilityService = new UtilityService();