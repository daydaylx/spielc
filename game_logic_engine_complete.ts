// src/engine/GameEngine.ts
// Das Magische Zauberbuch - Hauptspiel-Engine
// Version: 1.0.0 - Production Ready

import { EventEmitter } from 'events';
import { gameStateService } from '../services/gameStateService';
import { storyService } from '../services/storyService';
import { audioService } from '../services/audioService';
import { SceneProcessor } from './SceneProcessor';
import { ChoiceProcessor } from './ChoiceProcessor';
import { ConditionEvaluator } from './ConditionEvaluator';
import { EffectProcessor } from './EffectProcessor';
import { CharacterManager } from './CharacterManager';
import { InventoryManager } from './InventoryManager';
import { eventBus } from '../utils/eventBus';
import type {
  GameState,
  Scene,
  Choice,
  GameEngineOptions,
  GameEngineState,
  ProcessedScene,
  GameEvent
} from '../types';

export interface GameEngineConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  textSpeed: 'slow' | 'medium' | 'fast';
  skipAnimations: boolean;
  debugMode: boolean;
}

export class GameEngine extends EventEmitter {
  private isInitialized = false;
  private isRunning = false;
  private config: GameEngineConfig;
  private gameState: GameState | null = null;
  private currentScene: ProcessedScene | null = null;
  private sceneProcessor: SceneProcessor;
  private choiceProcessor: ChoiceProcessor;
  private conditionEvaluator: ConditionEvaluator;
  private effectProcessor: EffectProcessor;
  private characterManager: CharacterManager;
  private inventoryManager: InventoryManager;
  private playtimeTracker: NodeJS.Timeout | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<GameEngineConfig> = {}) {
    super();
    
    this.config = {
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      soundEnabled: true,
      musicEnabled: true,
      textSpeed: 'medium',
      skipAnimations: false,
      debugMode: false,
      ...config
    };

    // Initialisiere Subsysteme
    this.conditionEvaluator = new ConditionEvaluator();
    this.effectProcessor = new EffectProcessor();
    this.sceneProcessor = new SceneProcessor(this.conditionEvaluator);
    this.choiceProcessor = new ChoiceProcessor(this.conditionEvaluator);
    this.characterManager = new CharacterManager();
    this.inventoryManager = new InventoryManager();

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('Engine already initialized');
      return;
    }

    try {
      this.log('Initializing Game Engine...');

      // Initialisiere Subsysteme
      await this.conditionEvaluator.initialize();
      await this.effectProcessor.initialize();
      await this.sceneProcessor.initialize();
      await this.choiceProcessor.initialize();
      await this.characterManager.initialize();
      await this.inventoryManager.initialize();

      this.isInitialized = true;
      this.log('Game Engine initialized successfully');
      
      this.emit('engineInitialized');
      eventBus.emit('gameEngineReady');

    } catch (error) {
      this.error('Engine initialization failed:', error);
      throw new Error(`Game Engine initialization failed: ${error.message}`);
    }
  }

  async startNewGame(storyId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }

    try {
      this.log(`Starting new game with story: ${storyId}`);

      // Erstelle neuen Game State
      this.gameState = await gameStateService.initializeNewGame(storyId);
      
      // Lade und verarbeite erste Szene
      const startingScene = await this.loadScene(this.gameState.currentSceneId);
      await this.processScene(startingScene);

      // Starte Engine Services
      this.startPlaytimeTracking();
      this.startAutoSave();
      this.isRunning = true;

      this.log('New game started successfully');
      this.emit('gameStarted', { gameState: this.gameState });
      eventBus.emit('gameStarted', this.gameState);

    } catch (error) {
      this.error('Failed to start new game:', error);
      throw new Error(`Failed to start new game: ${error.message}`);
    }
  }

  async loadGame(saveSlotId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }

    try {
      this.log(`Loading game from save slot: ${saveSlotId}`);

      // Lade Game State
      this.gameState = await gameStateService.loadGame(saveSlotId);
      
      // Lade aktuelle Szene
      const currentScene = await this.loadScene(this.gameState.currentSceneId);
      await this.processScene(currentScene);

      // Starte Engine Services
      this.startPlaytimeTracking();
      this.startAutoSave();
      this.isRunning = true;

      this.log('Game loaded successfully');
      this.emit('gameLoaded', { gameState: this.gameState });
      eventBus.emit('gameLoaded', this.gameState);

    } catch (error) {
      this.error('Failed to load game:', error);
      throw new Error(`Failed to load game: ${error.message}`);
    }
  }

  async makeChoice(choiceId: string): Promise<void> {
    if (!this.isRunning || !this.gameState || !this.currentScene) {
      throw new Error('Game not running or no active scene');
    }

    try {
      this.log(`Processing choice: ${choiceId}`);

      // Finde Choice
      const choice = this.currentScene.choices.find(c => c.id === choiceId);
      if (!choice) {
        throw new Error(`Choice not found: ${choiceId}`);
      }

      // Verarbeite Choice Effects
      await this.processChoiceEffects(choice);

      // Aktualisiere Game State
      this.gameState.progress.choicesMade.push({
        choiceId,
        sceneId: this.currentScene.id,
        timestamp: new Date().toISOString(),
        choice: choice.text
      });

      // Navigiere zur Zielszene
      if (choice.target_scene_id) {
        await this.navigateToScene(choice.target_scene_id);
      } else {
        this.log('Choice has no target scene - ending game');
        await this.endGame();
      }

      this.emit('choiceMade', { choice, gameState: this.gameState });
      eventBus.emit('choiceMade', { choice, gameState: this.gameState });

    } catch (error) {
      this.error('Failed to process choice:', error);
      throw new Error(`Failed to process choice: ${error.message}`);
    }
  }

  async navigateToScene(sceneId: string): Promise<void> {
    if (!this.gameState) {
      throw new Error('No active game state');
    }

    try {
      this.log(`Navigating to scene: ${sceneId}`);

      // Lade neue Szene
      const scene = await this.loadScene(sceneId);
      
      // Aktualisiere Game State
      this.gameState.currentSceneId = sceneId;
      this.gameState.progress.scenesVisited.push(sceneId);
      
      // Verarbeite neue Szene
      await this.processScene(scene);

      // Aktualisiere Progress
      await this.updateStoryProgress();

      this.emit('sceneChanged', { scene: this.currentScene, gameState: this.gameState });
      eventBus.emit('sceneChanged', { scene: this.currentScene, gameState: this.gameState });

    } catch (error) {
      this.error('Failed to navigate to scene:', error);
      throw new Error(`Failed to navigate to scene: ${error.message}`);
    }
  }

  private async loadScene(sceneId: string): Promise<Scene> {
    try {
      const scene = await storyService.getScene(sceneId);
      if (!scene) {
        throw new Error(`Scene not found: ${sceneId}`);
      }
      return scene;
    } catch (error) {
      this.error('Failed to load scene:', error);
      throw error;
    }
  }

  private async processScene(scene: Scene): Promise<void> {
    if (!this.gameState) {
      throw new Error('No active game state');
    }

    try {
      this.log(`Processing scene: ${scene.id}`);

      // Verarbeite Szene mit Scene Processor
      this.currentScene = await this.sceneProcessor.processScene(scene, this.gameState);

      // Verarbeite Scene Effects
      await this.processSceneEffects(this.currentScene);

      // Lade Characters für Szene
      await this.characterManager.loadSceneCharacters(scene.id);

      // Spiele Background Music
      if (this.config.musicEnabled && this.currentScene.background_music_url) {
        await audioService.playBackgroundMusic(this.currentScene.background_music_url);
      }

      // Verarbeite automatische Effekte
      await this.processAutomaticEffects();

      this.log('Scene processed successfully');

    } catch (error) {
      this.error('Failed to process scene:', error);
      throw error;
    }
  }

  private async processChoiceEffects(choice: Choice): Promise<void> {
    if (!this.gameState || !choice.effects) {
      return;
    }

    try {
      this.log(`Processing choice effects for: ${choice.id}`);
      
      await this.effectProcessor.processEffects(choice.effects, this.gameState);
      
      // Spiele Sound Effect
      if (this.config.soundEnabled && choice.effects.sound) {
        await audioService.playSound(choice.effects.sound);
      }

    } catch (error) {
      this.error('Failed to process choice effects:', error);
    }
  }

  private async processSceneEffects(scene: ProcessedScene): Promise<void> {
    if (!this.gameState || !scene.effects) {
      return;
    }

    try {
      this.log(`Processing scene effects for: ${scene.id}`);
      
      await this.effectProcessor.processEffects(scene.effects, this.gameState);

    } catch (error) {
      this.error('Failed to process scene effects:', error);
    }
  }

  private async processAutomaticEffects(): Promise<void> {
    if (!this.gameState || !this.currentScene) {
      return;
    }

    // Prüfe und verarbeite zeitbasierte Effekte
    const timeEffects = this.currentScene.metadata?.timeEffects;
    if (timeEffects) {
      setTimeout(async () => {
        await this.effectProcessor.processEffects(timeEffects, this.gameState!);
      }, timeEffects.delay || 0);
    }

    // Prüfe Achievement Triggers
    await this.checkAchievements();
  }

  private async checkAchievements(): Promise<void> {
    if (!this.gameState) return;

    try {
      // Implementiere Achievement-Prüfung basierend auf Game State
      const achievements = await storyService.getStoryAchievements(this.gameState.storyId);
      
      for (const achievement of achievements) {
        const isUnlocked = this.gameState.progress.achievementsUnlocked.includes(achievement.id);
        
        if (!isUnlocked && this.conditionEvaluator.evaluateConditions(achievement.conditions, this.gameState)) {
          await this.unlockAchievement(achievement.id);
        }
      }

    } catch (error) {
      this.error('Failed to check achievements:', error);
    }
  }

  private async unlockAchievement(achievementId: string): Promise<void> {
    if (!this.gameState) return;

    try {
      this.gameState.progress.achievementsUnlocked.push(achievementId);
      
      this.log(`Achievement unlocked: ${achievementId}`);
      this.emit('achievementUnlocked', { achievementId });
      eventBus.emit('achievementUnlocked', { achievementId });

      // Zeige Achievement Notification
      if (this.config.soundEnabled) {
        await audioService.playSound('achievement-unlock');
      }

    } catch (error) {
      this.error('Failed to unlock achievement:', error);
    }
  }

  private async updateStoryProgress(): Promise<void> {
    if (!this.gameState) return;

    try {
      // Berechne Story Progress basierend auf besuchten Szenen
      const totalScenes = await storyService.getSceneCount(this.gameState.storyId);
      const visitedScenes = new Set(this.gameState.progress.scenesVisited).size;
      
      const progressPercentage = Math.round((visitedScenes / totalScenes) * 100);
      this.gameState.progress.storyProgress = progressPercentage;

      this.emit('progressUpdated', { progress: progressPercentage });

    } catch (error) {
      this.error('Failed to update story progress:', error);
    }
  }

  private startPlaytimeTracking(): void {
    if (this.playtimeTracker) {
      clearInterval(this.playtimeTracker);
    }

    this.playtimeTracker = setInterval(() => {
      if (this.gameState && this.isRunning) {
        gameStateService.addPlaytime(1); // Add 1 second
      }
    }, 1000);
  }

  private startAutoSave(): void {
    if (!this.config.autoSave) return;

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      if (this.gameState && this.isRunning) {
        try {
          await gameStateService.saveGame(undefined, true);
          this.log('Auto-save completed');
        } catch (error) {
          this.error('Auto-save failed:', error);
        }
      }
    }, this.config.autoSaveInterval);
  }

  async saveGame(slotName?: string): Promise<void> {
    if (!this.gameState) {
      throw new Error('No active game to save');
    }

    try {
      await gameStateService.saveGame(slotName);
      this.log('Game saved successfully');
      this.emit('gameSaved');
      eventBus.emit('gameSaved');

    } catch (error) {
      this.error('Failed to save game:', error);
      throw error;
    }
  }

  async pauseGame(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.playtimeTracker) {
      clearInterval(this.playtimeTracker);
    }
    
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    await audioService.pauseAll();

    this.log('Game paused');
    this.emit('gamePaused');
    eventBus.emit('gamePaused');
  }

  async resumeGame(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startPlaytimeTracking();
    this.startAutoSave();

    await audioService.resumeAll();

    this.log('Game resumed');
    this.emit('gameResumed');
    eventBus.emit('gameResumed');
  }

  async endGame(): Promise<void> {
    try {
      this.log('Ending game...');

      this.isRunning = false;
      
      if (this.playtimeTracker) {
        clearInterval(this.playtimeTracker);
      }
      
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }

      // Final save
      if (this.gameState) {
        await gameStateService.saveGame('Game Completed', false);
      }

      await audioService.stopAll();

      this.log('Game ended');
      this.emit('gameEnded', { gameState: this.gameState });
      eventBus.emit('gameEnded', this.gameState);

    } catch (error) {
      this.error('Failed to end game properly:', error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.log('Shutting down Game Engine...');

      if (this.isRunning) {
        await this.pauseGame();
      }

      // Cleanup resources
      if (this.playtimeTracker) {
        clearInterval(this.playtimeTracker);
      }
      
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }

      // Shutdown subsystems
      await this.sceneProcessor.shutdown();
      await this.choiceProcessor.shutdown();
      await this.characterManager.shutdown();
      await this.inventoryManager.shutdown();

      this.removeAllListeners();
      this.isInitialized = false;

      this.log('Game Engine shut down');

    } catch (error) {
      this.error('Error during shutdown:', error);
    }
  }

  // Configuration Management
  updateConfig(newConfig: Partial<GameEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply config changes
    if (this.isRunning) {
      if (newConfig.autoSave !== undefined) {
        if (newConfig.autoSave) {
          this.startAutoSave();
        } else if (this.autoSaveTimer) {
          clearInterval(this.autoSaveTimer);
        }
      }

      if (newConfig.soundEnabled !== undefined) {
        audioService.setSoundEnabled(newConfig.soundEnabled);
      }

      if (newConfig.musicEnabled !== undefined) {
        audioService.setMusicEnabled(newConfig.musicEnabled);
      }
    }

    this.emit('configUpdated', this.config);
  }

  // State Access
  getGameState(): GameState | null {
    return this.gameState;
  }

  getCurrentScene(): ProcessedScene | null {
    return this.currentScene;
  }

  getEngineState(): GameEngineState {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      config: this.config,
      hasActiveGame: this.gameState !== null,
      currentSceneId: this.currentScene?.id || null
    };
  }

  // Event Handlers
  private setupEventHandlers(): void {
    // Handle inventory changes
    this.inventoryManager.on('itemAdded', (item) => {
      this.emit('inventoryChanged', { action: 'added', item });
    });

    this.inventoryManager.on('itemRemoved', (item) => {
      this.emit('inventoryChanged', { action: 'removed', item });
    });

    // Handle character interactions
    this.characterManager.on('relationshipChanged', (data) => {
      this.emit('relationshipChanged', data);
    });

    // Handle effect processing
    this.effectProcessor.on('effectProcessed', (effect) => {
      this.emit('effectProcessed', effect);
    });
  }

  // Utility Methods
  private log(message: string, ...args: any[]): void {
    if (this.config.debugMode) {
      console.log(`[GameEngine] ${message}`, ...args);
    }
  }

  private error(message: string, ...args: any[]): void {
    console.error(`[GameEngine] ${message}`, ...args);
  }

  // Public Utility Methods
  isGameRunning(): boolean {
    return this.isRunning;
  }

  isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  hasActiveGame(): boolean {
    return this.gameState !== null;
  }

  getPlaytime(): number {
    return this.gameState?.progress.playtime || 0;
  }

  getStoryProgress(): number {
    return this.gameState?.progress.storyProgress || 0;
  }

  getVisitedScenes(): string[] {
    return this.gameState?.progress.scenesVisited || [];
  }

  getChoicesMade(): any[] {
    return this.gameState?.progress.choicesMade || [];
  }

  getUnlockedAchievements(): string[] {
    return this.gameState?.progress.achievementsUnlocked || [];
  }
}

// src/engine/SceneProcessor.ts
// Szenen-Verarbeitungssystem für Das Magische Zauberbuch

import { EventEmitter } from 'events';
import { ConditionEvaluator } from './ConditionEvaluator';
import type { Scene, GameState, ProcessedScene, Choice } from '../types';

export class SceneProcessor extends EventEmitter {
  private conditionEvaluator: ConditionEvaluator;

  constructor(conditionEvaluator: ConditionEvaluator) {
    super();
    this.conditionEvaluator = conditionEvaluator;
  }

  async initialize(): Promise<void> {
    console.log('[SceneProcessor] Initialized');
  }

  async processScene(scene: Scene, gameState: GameState): Promise<ProcessedScene> {
    try {
      // Evaluiere Scene Conditions
      const isAccessible = this.conditionEvaluator.evaluateConditions(
        scene.conditions || {}, 
        gameState
      );

      if (!isAccessible) {
        throw new Error(`Scene ${scene.id} is not accessible under current conditions`);
      }

      // Verarbeite Scene Content
      const processedContent = await this.processSceneContent(scene.content, gameState);

      // Lade und verarbeite Choices
      const choices = await this.processSceneChoices(scene.id, gameState);

      // Erstelle ProcessedScene
      const processedScene: ProcessedScene = {
        ...scene,
        content: processedContent,
        choices: choices,
        isAccessible: true,
        metadata: {
          ...scene.metadata,
          processedAt: new Date().toISOString(),
          availableChoices: choices.length,
          contentLength: processedContent.length
        }
      };

      this.emit('sceneProcessed', processedScene);
      return processedScene;

    } catch (error) {
      console.error('[SceneProcessor] Failed to process scene:', error);
      throw error;
    }
  }

  private async processSceneContent(content: string, gameState: GameState): Promise<string> {
    // Ersetze Platzhalter im Content
    let processedContent = content;

    // Ersetze Player-Variablen
    processedContent = processedContent.replace(/\{player\.name\}/g, gameState.player.name);
    processedContent = processedContent.replace(/\{player\.level\}/g, gameState.player.level.toString());
    processedContent = processedContent.replace(/\{player\.health\}/g, gameState.player.health.toString());
    processedContent = processedContent.replace(/\{player\.gold\}/g, gameState.player.gold.toString());

    // Ersetze Flag-Variablen
    const flagMatches = processedContent.match(/\{flag\.([^}]+)\}/g);
    if (flagMatches) {
      for (const match of flagMatches) {
        const flagName = match.replace(/\{flag\.([^}]+)\}/, '$1');
        const flagValue = gameState.flags.get(flagName) || '';
        processedContent = processedContent.replace(match, String(flagValue));
      }
    }

    // Ersetze Inventory-Variablen
    const inventoryMatches = processedContent.match(/\{inventory\.count\.([^}]+)\}/g);
    if (inventoryMatches) {
      for (const match of inventoryMatches) {
        const itemName = match.replace(/\{inventory\.count\.([^}]+)\}/, '$1');
        const itemCount = gameState.inventory.filter(item => item.name === itemName).length;
        processedContent = processedContent.replace(match, itemCount.toString());
      }
    }

    return processedContent;
  }

  private async processSceneChoices(sceneId: string, gameState: GameState): Promise<Choice[]> {
    try {
      // Hier würde normalerweise ein API-Call zu choiceService stehen
      // Für jetzt nehmen wir an, dass Choices bereits in der Scene enthalten sind
      const choices: Choice[] = []; // await choiceService.getSceneChoices(sceneId);

      const processedChoices: Choice[] = [];

      for (const choice of choices) {
        // Evaluiere Choice Conditions
        const isAvailable = this.conditionEvaluator.evaluateConditions(
          choice.conditions || {},
          gameState
        );

        if (isAvailable) {
          // Verarbeite Choice Text
          const processedText = await this.processChoiceText(choice.text, gameState);
          
          processedChoices.push({
            ...choice,
            text: processedText,
            is_available: true
          });
        }
      }

      return processedChoices;

    } catch (error) {
      console.error('[SceneProcessor] Failed to process scene choices:', error);
      return [];
    }
  }

  private async processChoiceText(text: string, gameState: GameState): Promise<string> {
    // Ähnliche Textverarbeitung wie bei Scene Content
    let processedText = text;

    // Ersetze Platzhalter
    processedText = processedText.replace(/\{player\.name\}/g, gameState.player.name);
    processedText = processedText.replace(/\{player\.level\}/g, gameState.player.level.toString());

    // Füge Requirement-Hinweise hinzu
    if (text.includes('{require:')) {
      const requirementMatches = text.match(/\{require:([^}]+)\}/g);
      if (requirementMatches) {
        for (const match of requirementMatches) {
          const requirement = match.replace(/\{require:([^}]+)\}/, '$1');
          processedText = processedText.replace(match, `[Benötigt: ${requirement}]`);
        }
      }
    }

    return processedText;
  }

  async shutdown(): Promise<void> {
    this.removeAllListeners();
    console.log('[SceneProcessor] Shutdown complete');
  }
}

// src/engine/ChoiceProcessor.ts
// Entscheidungsverarbeitungssystem

import { EventEmitter } from 'events';
import { ConditionEvaluator } from './ConditionEvaluator';
import type { Choice, GameState, ChoiceResult } from '../types';

export class ChoiceProcessor extends EventEmitter {
  private conditionEvaluator: ConditionEvaluator;

  constructor(conditionEvaluator: ConditionEvaluator) {
    super();
    this.conditionEvaluator = conditionEvaluator;
  }

  async initialize(): Promise<void> {
    console.log('[ChoiceProcessor] Initialized');
  }

  async processChoice(choice: Choice, gameState: GameState): Promise<ChoiceResult> {
    try {
      // Validiere Choice
      if (!this.validateChoice(choice, gameState)) {
        throw new Error(`Choice ${choice.id} is not valid for current game state`);
      }

      // Erstelle Choice Result
      const result: ChoiceResult = {
        choiceId: choice.id,
        success: true,
        targetSceneId: choice.target_scene_id,
        effects: choice.effects || {},
        consequences: await this.calculateConsequences(choice, gameState),
        timestamp: new Date().toISOString()
      };

      this.emit('choiceProcessed', result);
      return result;

    } catch (error) {
      console.error('[ChoiceProcessor] Failed to process choice:', error);
      
      return {
        choiceId: choice.id,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private validateChoice(choice: Choice, gameState: GameState): boolean {
    // Prüfe Bedingungen
    if (choice.conditions && !this.conditionEvaluator.evaluateConditions(choice.conditions, gameState)) {
      return false;
    }

    // Prüfe Verfügbarkeit
    if (!choice.is_available) {
      return false;
    }

    // Prüfe spezielle Choice Types
    if (choice.type === 'conditional' && !this.evaluateConditionalChoice(choice, gameState)) {
      return false;
    }

    if (choice.type === 'timed' && !this.evaluateTimedChoice(choice, gameState)) {
      return false;
    }

    return true;
  }

  private evaluateConditionalChoice(choice: Choice, gameState: GameState): boolean {
    // Implementiere conditional choice logic
    const conditions = choice.metadata?.conditions || {};
    return this.conditionEvaluator.evaluateConditions(conditions, gameState);
  }

  private evaluateTimedChoice(choice: Choice, gameState: GameState): boolean {
    // Implementiere timed choice logic
    const timeLimit = choice.metadata?.timeLimit || 30000; // 30 seconds default
    const choiceStartTime = choice.metadata?.startTime || Date.now();
    
    return Date.now() - choiceStartTime < timeLimit;
  }

  private async calculateConsequences(choice: Choice, gameState: GameState): Promise<any[]> {
    const consequences = [];

    // Analysiere mögliche Auswirkungen
    if (choice.effects) {
      if (choice.effects.health) {
        consequences.push({
          type: 'health',
          change: choice.effects.health,
          description: choice.effects.health > 0 ? 'Gesundheit wiederhergestellt' : 'Gesundheit verloren'
        });
      }

      if (choice.effects.gold) {
        consequences.push({
          type: 'gold',
          change: choice.effects.gold,
          description: choice.effects.gold > 0 ? 'Gold erhalten' : 'Gold ausgegeben'
        });
      }

      if (choice.effects.flags) {
        for (const [flag, value] of Object.entries(choice.effects.flags)) {
          consequences.push({
            type: 'flag',
            flag,
            value,
            description: `Flag ${flag} auf ${value} gesetzt`
          });
        }
      }

      if (choice.effects.relationships) {
        for (const [characterId, change] of Object.entries(choice.effects.relationships)) {
          consequences.push({
            type: 'relationship',
            characterId,
            change,
            description: change > 0 ? 'Beziehung verbessert' : 'Beziehung verschlechtert'
          });
        }
      }
    }

    return consequences;
  }

  async shutdown(): Promise<void> {
    this.removeAllListeners();
    console.log('[ChoiceProcessor] Shutdown complete');
  }
}

// src/engine/ConditionEvaluator.ts
// Bedingungsauswertungssystem

import type { GameState, Conditions } from '../types';

export class ConditionEvaluator {
  async initialize(): Promise<void> {
    console.log('[ConditionEvaluator] Initialized');
  }

  evaluateConditions(conditions: Conditions, gameState: GameState): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // Keine Bedingungen = immer wahr
    }

    try {
      return this.evaluateConditionGroup(conditions, gameState);
    } catch (error) {
      console.error('[ConditionEvaluator] Error evaluating conditions:', error);
      return false;
    }
  }

  private evaluateConditionGroup(conditions: any, gameState: GameState): boolean {
    // AND-Verknüpfung (alle Bedingungen müssen erfüllt sein)
    if (conditions.and && Array.isArray(conditions.and)) {
      return conditions.and.every((condition: any) => 
        this.evaluateConditionGroup(condition, gameState)
      );
    }

    // OR-Verknüpfung (mindestens eine Bedingung muss erfüllt sein)
    if (conditions.or && Array.isArray(conditions.or)) {
      return conditions.or.some((condition: any) => 
        this.evaluateConditionGroup(condition, gameState)
      );
    }

    // NOT-Verknüpfung (Bedingung darf nicht erfüllt sein)
    if (conditions.not) {
      return !this.evaluateConditionGroup(conditions.not, gameState);
    }

    // Einzelne Bedingungen
    return this.evaluateSingleCondition(conditions, gameState);
  }

  private evaluateSingleCondition(condition: any, gameState: GameState): boolean {
    // Player Level Bedingungen
    if (condition.playerLevel !== undefined) {
      return this.evaluateComparison(
        gameState.player.level,
        condition.playerLevel,
        condition.playerLevelOperator || 'gte'
      );
    }

    // Player Health Bedingungen
    if (condition.playerHealth !== undefined) {
      return this.evaluateComparison(
        gameState.player.health,
        condition.playerHealth,
        condition.playerHealthOperator || 'gte'
      );
    }

    // Player Gold Bedingungen
    if (condition.playerGold !== undefined) {
      return this.evaluateComparison(
        gameState.player.gold,
        condition.playerGold,
        condition.playerGoldOperator || 'gte'
      );
    }

    // Flag Bedingungen
    if (condition.flag !== undefined) {
      const flagValue = gameState.flags.get(condition.flag);
      
      if (condition.flagValue !== undefined) {
        return this.evaluateComparison(
          flagValue,
          condition.flagValue,
          condition.flagOperator || 'eq'
        );
      }
      
      return flagValue !== undefined && flagValue !== false;
    }

    // Inventory Bedingungen
    if (condition.hasItem !== undefined) {
      return gameState.inventory.some(item => item.id === condition.hasItem);
    }

    if (condition.itemCount !== undefined) {
      const itemCount = gameState.inventory.filter(item => 
        item.id === condition.itemCountId
      ).reduce((sum, item) => sum + (item.quantity || 1), 0);
      
      return this.evaluateComparison(
        itemCount,
        condition.itemCount,
        condition.itemCountOperator || 'gte'
      );
    }

    // Scene Visit Bedingungen
    if (condition.visitedScene !== undefined) {
      return gameState.progress.scenesVisited.includes(condition.visitedScene);
    }

    if (condition.notVisitedScene !== undefined) {
      return !gameState.progress.scenesVisited.includes(condition.notVisitedScene);
    }

    // Relationship Bedingungen
    if (condition.relationship !== undefined) {
      const relationshipValue = gameState.relationships.get(condition.relationship) || 0;
      
      return this.evaluateComparison(
        relationshipValue,
        condition.relationshipValue || 0,
        condition.relationshipOperator || 'gte'
      );
    }

    // Achievement Bedingungen
    if (condition.hasAchievement !== undefined) {
      return gameState.progress.achievementsUnlocked.includes(condition.hasAchievement);
    }

    // Playtime Bedingungen
    if (condition.playtime !== undefined) {
      return this.evaluateComparison(
        gameState.progress.playtime,
        condition.playtime,
        condition.playtimeOperator || 'gte'
      );
    }

    // Choice History Bedingungen
    if (condition.madeChoice !== undefined) {
      return gameState.progress.choicesMade.some(choice => 
        choice.choiceId === condition.madeChoice
      );
    }

    // Zeitbasierte Bedingungen
    if (condition.timeOfDay !== undefined) {
      const currentHour = new Date().getHours();
      return this.checkTimeOfDay(currentHour, condition.timeOfDay);
    }

    // Story Progress Bedingungen
    if (condition.storyProgress !== undefined) {
      return this.evaluateComparison(
        gameState.progress.storyProgress,
        condition.storyProgress,
        condition.storyProgressOperator || 'gte'
      );
    }

    console.warn('[ConditionEvaluator] Unknown condition type:', condition);
    return false;
  }

  private evaluateComparison(value: any, target: any, operator: string): boolean {
    switch (operator) {
      case 'eq': return value === target;
      case 'ne': return value !== target;
      case 'gt': return value > target;
      case 'gte': return value >= target;
      case 'lt': return value < target;
      case 'lte': return value <= target;
      case 'in': return Array.isArray(target) && target.includes(value);
      case 'nin': return Array.isArray(target) && !target.includes(value);
      case 'exists': return value !== undefined && value !== null;
      case 'nexists': return value === undefined || value === null;
      default:
        console.warn('[ConditionEvaluator] Unknown operator:', operator);
        return false;
    }
  }

  private checkTimeOfDay(currentHour: number, timeOfDay: string): boolean {
    switch (timeOfDay) {
      case 'morning': return currentHour >= 6 && currentHour < 12;
      case 'afternoon': return currentHour >= 12 && currentHour < 18;
      case 'evening': return currentHour >= 18 && currentHour < 22;
      case 'night': return currentHour >= 22 || currentHour < 6;
      default: return false;
    }
  }

  // Utility-Methoden für erweiterte Condition-Checks
  evaluateCustomCondition(conditionFunction: string, gameState: GameState): boolean {
    try {
      // Sichere Evaluation von benutzerdefinierten Bedingungen
      const func = new Function('gameState', conditionFunction);
      return Boolean(func(gameState));
    } catch (error) {
      console.error('[ConditionEvaluator] Custom condition evaluation failed:', error);
      return false;
    }
  }

  checkInventorySpace(requiredSpace: number, gameState: GameState): boolean {
    const maxInventorySize = gameState.player.stats?.maxInventorySize || 50;
    const currentSize = gameState.inventory.reduce((sum, item) => 
      sum + (item.quantity || 1), 0
    );
    
    return (currentSize + requiredSpace) <= maxInventorySize;
  }

  checkResourceAvailability(resources: Record<string, number>, gameState: GameState): boolean {
    for (const [resource, required] of Object.entries(resources)) {
      const available = this.getResourceAmount(resource, gameState);
      if (available < required) {
        return false;
      }
    }
    return true;
  }

  private getResourceAmount(resource: string, gameState: GameState): number {
    switch (resource) {
      case 'gold': return gameState.player.gold;
      case 'health': return gameState.player.health;
      case 'mana': return gameState.player.mana;
      case 'experience': return gameState.player.experience;
      default:
        // Check inventory for custom resources
        const item = gameState.inventory.find(item => item.name === resource);
        return item ? (item.quantity || 1) : 0;
    }
  }
}