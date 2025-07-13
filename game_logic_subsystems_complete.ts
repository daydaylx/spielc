// src/engine/EffectProcessor.ts
// Effektverarbeitungssystem für Das Magische Zauberbuch
// Version: 1.0.0 - Production Ready

import { EventEmitter } from 'events';
import { gameStateService } from '../services/gameStateService';
import { audioService } from '../services/audioService';
import { utilityService } from '../services/utilityService';
import type { GameState, Effects, EffectResult } from '../types';

export interface ProcessedEffect {
  type: string;
  success: boolean;
  value?: any;
  description: string;
  timestamp: string;
}

export class EffectProcessor extends EventEmitter {
  private processing = false;
  private effectQueue: Effects[] = [];

  async initialize(): Promise<void> {
    console.log('[EffectProcessor] Initialized');
  }

  async processEffects(effects: Effects, gameState: GameState): Promise<EffectResult[]> {
    if (this.processing) {
      this.effectQueue.push(effects);
      return [];
    }

    this.processing = true;
    const results: EffectResult[] = [];

    try {
      // Player Stat Changes
      if (effects.health !== undefined) {
        const result = await this.processHealthEffect(effects.health, gameState);
        results.push(result);
      }

      if (effects.mana !== undefined) {
        const result = await this.processManaEffect(effects.mana, gameState);
        results.push(result);
      }

      if (effects.gold !== undefined) {
        const result = await this.processGoldEffect(effects.gold, gameState);
        results.push(result);
      }

      if (effects.experience !== undefined) {
        const result = await this.processExperienceEffect(effects.experience, gameState);
        results.push(result);
      }

      // Stat Modifications
      if (effects.stats) {
        const result = await this.processStatEffects(effects.stats, gameState);
        results.push(result);
      }

      // Flag Changes
      if (effects.flags) {
        const result = await this.processFlagEffects(effects.flags, gameState);
        results.push(result);
      }

      // Inventory Effects
      if (effects.addItems) {
        const result = await this.processAddItemsEffect(effects.addItems, gameState);
        results.push(result);
      }

      if (effects.removeItems) {
        const result = await this.processRemoveItemsEffect(effects.removeItems, gameState);
        results.push(result);
      }

      // Relationship Changes
      if (effects.relationships) {
        const result = await this.processRelationshipEffects(effects.relationships, gameState);
        results.push(result);
      }

      // Audio Effects
      if (effects.sound) {
        await this.processSoundEffect(effects.sound);
      }

      if (effects.music) {
        await this.processMusicEffect(effects.music);
      }

      // Visual Effects
      if (effects.visual) {
        await this.processVisualEffect(effects.visual);
      }

      // Custom Effects
      if (effects.custom) {
        const result = await this.processCustomEffects(effects.custom, gameState);
        results.push(result);
      }

      // Trigger Events
      if (effects.events) {
        await this.processEventEffects(effects.events, gameState);
      }

      this.emit('effectsProcessed', results);
      return results;

    } catch (error) {
      console.error('[EffectProcessor] Error processing effects:', error);
      throw error;
    } finally {
      this.processing = false;
      
      // Process queued effects
      if (this.effectQueue.length > 0) {
        const nextEffects = this.effectQueue.shift()!;
        setTimeout(() => this.processEffects(nextEffects, gameState), 100);
      }
    }
  }

  private async processHealthEffect(healthChange: number, gameState: GameState): Promise<EffectResult> {
    const oldHealth = gameState.player.health;
    const newHealth = Math.max(0, Math.min(gameState.player.maxHealth, oldHealth + healthChange));
    
    gameStateService.updatePlayerStats({ health: newHealth });

    const result: EffectResult = {
      type: 'health',
      success: true,
      oldValue: oldHealth,
      newValue: newHealth,
      change: newHealth - oldHealth,
      description: healthChange > 0 ? 
        `Gesundheit um ${newHealth - oldHealth} wiederhergestellt` : 
        `${oldHealth - newHealth} Schaden erlitten`,
      timestamp: new Date().toISOString()
    };

    // Critical health warning
    if (newHealth <= gameState.player.maxHealth * 0.2) {
      this.emit('criticalHealth', { health: newHealth, maxHealth: gameState.player.maxHealth });
    }

    // Death check
    if (newHealth <= 0) {
      this.emit('playerDeath', { cause: 'health' });
    }

    return result;
  }

  private async processManaEffect(manaChange: number, gameState: GameState): Promise<EffectResult> {
    const oldMana = gameState.player.mana;
    const newMana = Math.max(0, Math.min(gameState.player.maxMana, oldMana + manaChange));
    
    gameStateService.updatePlayerStats({ mana: newMana });

    return {
      type: 'mana',
      success: true,
      oldValue: oldMana,
      newValue: newMana,
      change: newMana - oldMana,
      description: manaChange > 0 ? 
        `Mana um ${newMana - oldMana} aufgefüllt` : 
        `${oldMana - newMana} Mana verbraucht`,
      timestamp: new Date().toISOString()
    };
  }

  private async processGoldEffect(goldChange: number, gameState: GameState): Promise<EffectResult> {
    const oldGold = gameState.player.gold;
    const newGold = Math.max(0, oldGold + goldChange);
    
    gameStateService.updatePlayerStats({ gold: newGold });

    return {
      type: 'gold',
      success: true,
      oldValue: oldGold,
      newValue: newGold,
      change: newGold - oldGold,
      description: goldChange > 0 ? 
        `${newGold - oldGold} Gold erhalten` : 
        `${oldGold - newGold} Gold ausgegeben`,
      timestamp: new Date().toISOString()
    };
  }

  private async processExperienceEffect(expChange: number, gameState: GameState): Promise<EffectResult> {
    const oldExp = gameState.player.experience;
    const newExp = Math.max(0, oldExp + expChange);
    
    // Check for level up
    const oldLevel = gameState.player.level;
    const newLevel = this.calculateLevelFromExperience(newExp);
    
    const updates: any = { experience: newExp };
    
    if (newLevel > oldLevel) {
      updates.level = newLevel;
      updates.health = gameState.player.maxHealth; // Full heal on level up
      updates.mana = gameState.player.maxMana; // Full mana on level up
      
      this.emit('levelUp', { 
        oldLevel, 
        newLevel, 
        experience: newExp 
      });
    }
    
    gameStateService.updatePlayerStats(updates);

    return {
      type: 'experience',
      success: true,
      oldValue: oldExp,
      newValue: newExp,
      change: newExp - oldExp,
      description: expChange > 0 ? 
        `${newExp - oldExp} Erfahrung erhalten${newLevel > oldLevel ? ` - Level ${newLevel} erreicht!` : ''}` : 
        `${oldExp - newExp} Erfahrung verloren`,
      timestamp: new Date().toISOString(),
      metadata: newLevel > oldLevel ? { levelUp: true, newLevel } : undefined
    };
  }

  private calculateLevelFromExperience(experience: number): number {
    // Exponential leveling formula
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  private async processStatEffects(statChanges: Record<string, number>, gameState: GameState): Promise<EffectResult> {
    const oldStats = { ...gameState.player.stats };
    const newStats = { ...oldStats };
    
    for (const [stat, change] of Object.entries(statChanges)) {
      if (newStats[stat] !== undefined) {
        newStats[stat] = Math.max(1, newStats[stat] + change);
      }
    }
    
    gameStateService.updatePlayerStats({ stats: newStats });

    return {
      type: 'stats',
      success: true,
      oldValue: oldStats,
      newValue: newStats,
      description: `Attribute verändert: ${Object.entries(statChanges).map(([stat, change]) => 
        `${stat} ${change > 0 ? '+' : ''}${change}`).join(', ')}`,
      timestamp: new Date().toISOString()
    };
  }

  private async processFlagEffects(flagChanges: Record<string, any>, gameState: GameState): Promise<EffectResult> {
    const changedFlags: Record<string, { old: any, new: any }> = {};
    
    for (const [flag, value] of Object.entries(flagChanges)) {
      const oldValue = gameState.flags.get(flag);
      gameStateService.setFlag(flag, value);
      changedFlags[flag] = { old: oldValue, new: value };
    }

    return {
      type: 'flags',
      success: true,
      description: `Flags gesetzt: ${Object.keys(flagChanges).join(', ')}`,
      timestamp: new Date().toISOString(),
      metadata: { changedFlags }
    };
  }

  private async processAddItemsEffect(items: any[], gameState: GameState): Promise<EffectResult> {
    const addedItems: string[] = [];
    
    for (const itemData of items) {
      const item = {
        id: itemData.id || await utilityService.generateUniqueId(),
        name: itemData.name,
        description: itemData.description,
        type: itemData.type,
        rarity: itemData.rarity || 'common',
        value: itemData.value || 0,
        quantity: itemData.quantity || 1,
        stackable: itemData.stackable || false,
        properties: itemData.properties || {}
      };
      
      gameStateService.addToInventory(item);
      addedItems.push(item.name);
    }

    return {
      type: 'addItems',
      success: true,
      description: `Gegenstände erhalten: ${addedItems.join(', ')}`,
      timestamp: new Date().toISOString(),
      metadata: { itemsAdded: addedItems.length }
    };
  }

  private async processRemoveItemsEffect(items: any[], gameState: GameState): Promise<EffectResult> {
    const removedItems: string[] = [];
    
    for (const itemData of items) {
      const success = gameStateService.removeFromInventory(itemData.id, itemData.quantity || 1);
      if (success) {
        removedItems.push(itemData.name || itemData.id);
      }
    }

    return {
      type: 'removeItems',
      success: removedItems.length > 0,
      description: removedItems.length > 0 ? 
        `Gegenstände entfernt: ${removedItems.join(', ')}` : 
        'Keine Gegenstände entfernt',
      timestamp: new Date().toISOString(),
      metadata: { itemsRemoved: removedItems.length }
    };
  }

  private async processRelationshipEffects(relationships: Record<string, number>, gameState: GameState): Promise<EffectResult> {
    const changedRelationships: Record<string, { old: number, new: number, change: number }> = {};
    
    for (const [characterId, change] of Object.entries(relationships)) {
      const oldValue = gameState.relationships.get(characterId) || 0;
      gameStateService.updateRelationship(characterId, change);
      const newValue = gameState.relationships.get(characterId) || 0;
      
      changedRelationships[characterId] = {
        old: oldValue,
        new: newValue,
        change: change
      };
    }

    return {
      type: 'relationships',
      success: true,
      description: `Beziehungen verändert: ${Object.keys(relationships).join(', ')}`,
      timestamp: new Date().toISOString(),
      metadata: { changedRelationships }
    };
  }

  private async processSoundEffect(sound: string | { file: string, volume?: number, loop?: boolean }): Promise<void> {
    try {
      if (typeof sound === 'string') {
        await audioService.playSound(sound);
      } else {
        await audioService.playSound(sound.file, {
          volume: sound.volume,
          loop: sound.loop
        });
      }
    } catch (error) {
      console.error('[EffectProcessor] Sound effect failed:', error);
    }
  }

  private async processMusicEffect(music: string | { file: string, volume?: number, fadeIn?: boolean }): Promise<void> {
    try {
      if (typeof music === 'string') {
        await audioService.playBackgroundMusic(music);
      } else {
        await audioService.playBackgroundMusic(music.file, {
          volume: music.volume,
          fadeIn: music.fadeIn
        });
      }
    } catch (error) {
      console.error('[EffectProcessor] Music effect failed:', error);
    }
  }

  private async processVisualEffect(visual: any): Promise<void> {
    // Emit visual effect event for UI to handle
    this.emit('visualEffect', visual);
  }

  private async processCustomEffects(customEffects: any[], gameState: GameState): Promise<EffectResult> {
    const results: any[] = [];
    
    for (const effect of customEffects) {
      try {
        const result = await this.executeCustomEffect(effect, gameState);
        results.push(result);
      } catch (error) {
        console.error('[EffectProcessor] Custom effect failed:', error);
        results.push({ error: error.message, effect });
      }
    }

    return {
      type: 'custom',
      success: results.length > 0,
      description: `${results.length} benutzerdefinierte Effekte verarbeitet`,
      timestamp: new Date().toISOString(),
      metadata: { results }
    };
  }

  private async executeCustomEffect(effect: any, gameState: GameState): Promise<any> {
    // Safe execution of custom effects
    switch (effect.type) {
      case 'teleport':
        return this.processTeleportEffect(effect, gameState);
      case 'transform':
        return this.processTransformEffect(effect, gameState);
      case 'summon':
        return this.processSummonEffect(effect, gameState);
      case 'curse':
        return this.processCurseEffect(effect, gameState);
      case 'blessing':
        return this.processBlessingEffect(effect, gameState);
      default:
        throw new Error(`Unknown custom effect type: ${effect.type}`);
    }
  }

  private async processTeleportEffect(effect: any, gameState: GameState): Promise<any> {
    // Handle teleportation to different scenes
    const targetScene = effect.targetScene;
    if (targetScene) {
      this.emit('teleport', { targetScene });
      return { success: true, message: `Teleportiert zu: ${targetScene}` };
    }
    return { success: false, message: 'Teleportation fehlgeschlagen' };
  }

  private async processTransformEffect(effect: any, gameState: GameState): Promise<any> {
    // Handle player transformation
    if (effect.form) {
      gameStateService.setFlag('transformed_form', effect.form);
      return { success: true, message: `Verwandelt zu: ${effect.form}` };
    }
    return { success: false, message: 'Verwandlung fehlgeschlagen' };
  }

  private async processSummonEffect(effect: any, gameState: GameState): Promise<any> {
    // Handle summoning creatures/items
    if (effect.creature) {
      gameStateService.setFlag('summoned_creature', effect.creature);
      return { success: true, message: `Beschworen: ${effect.creature}` };
    }
    return { success: false, message: 'Beschwörung fehlgeschlagen' };
  }

  private async processCurseEffect(effect: any, gameState: GameState): Promise<any> {
    // Handle curse effects
    const curseType = effect.curseType || 'unknown';
    const duration = effect.duration || 3600000; // 1 hour default
    
    gameStateService.setFlag(`curse_${curseType}`, {
      type: curseType,
      startTime: Date.now(),
      duration: duration,
      effects: effect.effects || {}
    });
    
    return { success: true, message: `Verflucht mit: ${curseType}` };
  }

  private async processBlessingEffect(effect: any, gameState: GameState): Promise<any> {
    // Handle blessing effects
    const blessingType = effect.blessingType || 'unknown';
    const duration = effect.duration || 3600000; // 1 hour default
    
    gameStateService.setFlag(`blessing_${blessingType}`, {
      type: blessingType,
      startTime: Date.now(),
      duration: duration,
      effects: effect.effects || {}
    });
    
    return { success: true, message: `Gesegnet mit: ${blessingType}` };
  }

  private async processEventEffects(events: string[], gameState: GameState): Promise<void> {
    for (const eventName of events) {
      this.emit('gameEvent', { 
        event: eventName, 
        gameState,
        timestamp: new Date().toISOString()
      });
    }
  }

  async shutdown(): Promise<void> {
    this.processing = false;
    this.effectQueue = [];
    this.removeAllListeners();
    console.log('[EffectProcessor] Shutdown complete');
  }
}

// src/engine/CharacterManager.ts
// Charakterverwaltungssystem für Das Magische Zauberbuch

import { EventEmitter } from 'events';
import { storyService } from '../services/storyService';
import { gameStateService } from '../services/gameStateService';
import type { Character, GameState, CharacterInteraction } from '../types';

export class CharacterManager extends EventEmitter {
  private loadedCharacters: Map<string, Character> = new Map();
  private characterStates: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    console.log('[CharacterManager] Initialized');
  }

  async loadSceneCharacters(sceneId: string): Promise<Character[]> {
    try {
      const characters = await storyService.getSceneCharacters(sceneId);
      
      for (const character of characters) {
        this.loadedCharacters.set(character.id, character);
        
        // Initialize character state if not exists
        if (!this.characterStates.has(character.id)) {
          this.characterStates.set(character.id, {
            mood: 'neutral',
            lastInteraction: null,
            availableDialogue: this.getAvailableDialogue(character),
            questsAvailable: this.getAvailableQuests(character)
          });
        }
      }

      this.emit('charactersLoaded', characters);
      return characters;

    } catch (error) {
      console.error('[CharacterManager] Failed to load scene characters:', error);
      return [];
    }
  }

  async interactWithCharacter(characterId: string, interactionType: string, gameState: GameState): Promise<CharacterInteraction> {
    try {
      const character = this.loadedCharacters.get(characterId);
      if (!character) {
        throw new Error(`Character not loaded: ${characterId}`);
      }

      const characterState = this.characterStates.get(characterId);
      const relationship = gameState.relationships.get(characterId) || 0;

      let interaction: CharacterInteraction;

      switch (interactionType) {
        case 'talk':
          interaction = await this.processDialogue(character, characterState, relationship, gameState);
          break;
        case 'trade':
          interaction = await this.processTrade(character, characterState, relationship, gameState);
          break;
        case 'quest':
          interaction = await this.processQuest(character, characterState, relationship, gameState);
          break;
        case 'gift':
          interaction = await this.processGift(character, characterState, relationship, gameState);
          break;
        default:
          throw new Error(`Unknown interaction type: ${interactionType}`);
      }

      // Update character state
      characterState.lastInteraction = {
        type: interactionType,
        timestamp: new Date().toISOString(),
        success: interaction.success
      };

      this.emit('characterInteraction', { characterId, interaction });
      return interaction;

    } catch (error) {
      console.error('[CharacterManager] Character interaction failed:', error);
      throw error;
    }
  }

  private async processDialogue(character: Character, state: any, relationship: number, gameState: GameState): Promise<CharacterInteraction> {
    const availableDialogue = this.getAvailableDialogue(character, relationship, gameState);
    
    if (availableDialogue.length === 0) {
      return {
        type: 'talk',
        success: false,
        message: `${character.name} hat nichts zu sagen.`,
        characterId: character.id
      };
    }

    // Select dialogue based on relationship and flags
    const selectedDialogue = this.selectBestDialogue(availableDialogue, relationship, gameState);

    // Update mood based on interaction
    state.mood = this.calculateMoodChange(character, relationship, 'talk');

    return {
      type: 'talk',
      success: true,
      message: selectedDialogue.text,
      characterId: character.id,
      options: selectedDialogue.responses || [],
      metadata: {
        mood: state.mood,
        relationship: relationship
      }
    };
  }

  private async processTrade(character: Character, state: any, relationship: number, gameState: GameState): Promise<CharacterInteraction> {
    const tradeItems = character.metadata?.tradeItems || [];
    
    if (tradeItems.length === 0 || relationship < -50) {
      return {
        type: 'trade',
        success: false,
        message: `${character.name} möchte nicht handeln.`,
        characterId: character.id
      };
    }

    return {
      type: 'trade',
      success: true,
      message: `${character.name} zeigt ihre Waren.`,
      characterId: character.id,
      tradeItems: tradeItems,
      metadata: {
        relationship: relationship,
        priceModifier: this.calculatePriceModifier(relationship)
      }
    };
  }

  private async processQuest(character: Character, state: any, relationship: number, gameState: GameState): Promise<CharacterInteraction> {
    const availableQuests = this.getAvailableQuests(character, gameState);
    
    if (availableQuests.length === 0) {
      return {
        type: 'quest',
        success: false,
        message: `${character.name} hat keine Aufgaben für dich.`,
        characterId: character.id
      };
    }

    const quest = availableQuests[0]; // Take first available quest

    return {
      type: 'quest',
      success: true,
      message: quest.description,
      characterId: character.id,
      quest: quest,
      metadata: {
        questId: quest.id,
        requiredRelationship: quest.requiredRelationship || 0
      }
    };
  }

  private async processGift(character: Character, state: any, relationship: number, gameState: GameState): Promise<CharacterInteraction> {
    const preferences = character.personality?.preferences || {};
    const lastGift = state.lastInteraction?.type === 'gift' ? state.lastInteraction.timestamp : null;
    
    // Check cooldown (can't gift multiple times per day)
    if (lastGift && Date.now() - new Date(lastGift).getTime() < 86400000) {
      return {
        type: 'gift',
        success: false,
        message: `${character.name} möchte heute keine weiteren Geschenke.`,
        characterId: character.id
      };
    }

    return {
      type: 'gift',
      success: true,
      message: `${character.name} freut sich über Geschenke.`,
      characterId: character.id,
      preferences: preferences,
      metadata: {
        relationship: relationship,
        lastGift: lastGift
      }
    };
  }

  private getAvailableDialogue(character: Character, relationship: number = 0, gameState?: GameState): any[] {
    const dialogue = character.dialogue_style?.dialogue || [];
    
    return dialogue.filter((d: any) => {
      // Check relationship requirements
      if (d.minRelationship && relationship < d.minRelationship) {
        return false;
      }
      
      // Check flag requirements
      if (d.requiredFlags && gameState) {
        for (const [flag, value] of Object.entries(d.requiredFlags)) {
          if (gameState.flags.get(flag) !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  private getAvailableQuests(character: Character, gameState?: GameState): any[] {
    const quests = character.metadata?.quests || [];
    
    return quests.filter((quest: any) => {
      // Check if quest is already completed
      if (gameState?.flags.get(`quest_${quest.id}_completed`)) {
        return false;
      }
      
      // Check if quest is already active
      if (gameState?.flags.get(`quest_${quest.id}_active`)) {
        return false;
      }
      
      // Check prerequisites
      if (quest.prerequisites && gameState) {
        for (const prereq of quest.prerequisites) {
          if (!gameState.flags.get(prereq)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  private selectBestDialogue(dialogue: any[], relationship: number, gameState: GameState): any {
    // Sort by priority and relationship compatibility
    const sorted = dialogue.sort((a, b) => {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;
      
      const aRelationshipFit = Math.abs((a.optimalRelationship || 0) - relationship);
      const bRelationshipFit = Math.abs((b.optimalRelationship || 0) - relationship);
      
      return (bPriority - aPriority) || (aRelationshipFit - bRelationshipFit);
    });
    
    return sorted[0] || { text: 'Hallo.', responses: [] };
  }

  private calculateMoodChange(character: Character, relationship: number, interactionType: string): string {
    const personality = character.personality || {};
    
    if (relationship > 50) {
      return 'happy';
    } else if (relationship < -50) {
      return 'angry';
    } else if (personality.traits?.includes('shy') && interactionType === 'talk') {
      return 'nervous';
    } else if (personality.traits?.includes('greedy') && interactionType === 'trade') {
      return 'excited';
    }
    
    return 'neutral';
  }

  private calculatePriceModifier(relationship: number): number {
    // Better relationship = better prices
    const baseModifier = 1.0;
    const relationshipBonus = relationship / 1000; // -0.1 to +0.1
    
    return Math.max(0.5, Math.min(1.5, baseModifier - relationshipBonus));
  }

  getCharacterState(characterId: string): any {
    return this.characterStates.get(characterId);
  }

  updateCharacterMood(characterId: string, mood: string): void {
    const state = this.characterStates.get(characterId);
    if (state) {
      state.mood = mood;
      this.emit('moodChanged', { characterId, mood });
    }
  }

  getLoadedCharacters(): Character[] {
    return Array.from(this.loadedCharacters.values());
  }

  async shutdown(): Promise<void> {
    this.loadedCharacters.clear();
    this.characterStates.clear();
    this.removeAllListeners();
    console.log('[CharacterManager] Shutdown complete');
  }
}

// src/engine/InventoryManager.ts
// Inventarverwaltungssystem für Das Magische Zauberbuch

import { EventEmitter } from 'events';
import { gameStateService } from '../services/gameStateService';
import type { InventoryItem, GameState, ItemUseResult } from '../types';

export class InventoryManager extends EventEmitter {
  private readonly MAX_STACK_SIZE = 99;
  private readonly DEFAULT_INVENTORY_SIZE = 50;

  async initialize(): Promise<void> {
    console.log('[InventoryManager] Initialized');
  }

  async addItem(item: InventoryItem, gameState: GameState): Promise<boolean> {
    try {
      // Check inventory space
      if (!this.hasInventorySpace(gameState, 1)) {
        this.emit('inventoryFull', { item });
        return false;
      }

      // Check if item can be stacked
      if (item.stackable) {
        const existingItem = gameState.inventory.find(i => 
          i.id === item.id || (i.name === item.name && i.type === item.type)
        );

        if (existingItem) {
          const maxStack = existingItem.max_stack || this.MAX_STACK_SIZE;
          const currentStack = existingItem.quantity || 1;
          const addAmount = item.quantity || 1;

          if (currentStack + addAmount <= maxStack) {
            existingItem.quantity = currentStack + addAmount;
            gameStateService.updateGameState({ inventory: gameState.inventory });
            
            this.emit('itemAdded', { item: existingItem, amount: addAmount });
            return true;
          }
        }
      }

      // Add as new item
      gameStateService.addToInventory(item);
      this.emit('itemAdded', { item, amount: item.quantity || 1 });
      return true;

    } catch (error) {
      console.error('[InventoryManager] Failed to add item:', error);
      return false;
    }
  }

  async removeItem(itemId: string, quantity: number, gameState: GameState): Promise<boolean> {
    try {
      const success = gameStateService.removeFromInventory(itemId, quantity);
      
      if (success) {
        this.emit('itemRemoved', { itemId, quantity });
      }
      
      return success;

    } catch (error) {
      console.error('[InventoryManager] Failed to remove item:', error);
      return false;
    }
  }

  async useItem(itemId: string, gameState: GameState): Promise<ItemUseResult> {
    try {
      const item = gameState.inventory.find(i => i.id === itemId);
      
      if (!item) {
        return {
          success: false,
          message: 'Gegenstand nicht gefunden',
          itemId
        };
      }

      // Process item use based on type
      const result = await this.processItemUse(item, gameState);

      // Remove item if it's consumable and use was successful
      if (result.success && item.properties?.consumable) {
        await this.removeItem(itemId, 1, gameState);
      }

      this.emit('itemUsed', { item, result });
      return result;

    } catch (error) {
      console.error('[InventoryManager] Failed to use item:', error);
      return {
        success: false,
        message: 'Gegenstand konnte nicht verwendet werden',
        itemId
      };
    }
  }

  private async processItemUse(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const itemType = item.type;
    const properties = item.properties || {};

    switch (itemType) {
      case 'potion':
        return this.usePotion(item, gameState);
      case 'food':
        return this.useFood(item, gameState);
      case 'weapon':
        return this.equipWeapon(item, gameState);
      case 'armor':
        return this.equipArmor(item, gameState);
      case 'tool':
        return this.useTool(item, gameState);
      case 'key':
        return this.useKey(item, gameState);
      case 'book':
        return this.readBook(item, gameState);
      case 'scroll':
        return this.useScroll(item, gameState);
      default:
        return this.useGenericItem(item, gameState);
    }
  }

  private async usePotion(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const effects = item.properties?.effects || {};
    
    let message = `Du trinkst ${item.name}.`;
    const appliedEffects: string[] = [];

    if (effects.health) {
      const newHealth = Math.min(gameState.player.maxHealth, gameState.player.health + effects.health);
      gameStateService.updatePlayerStats({ health: newHealth });
      appliedEffects.push(`Gesundheit: +${effects.health}`);
    }

    if (effects.mana) {
      const newMana = Math.min(gameState.player.maxMana, gameState.player.mana + effects.mana);
      gameStateService.updatePlayerStats({ mana: newMana });
      appliedEffects.push(`Mana: +${effects.mana}`);
    }

    if (appliedEffects.length > 0) {
      message += ` ${appliedEffects.join(', ')}`;
    }

    return {
      success: true,
      message,
      itemId: item.id,
      effects: appliedEffects
    };
  }

  private async useFood(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const nutrition = item.properties?.nutrition || 10;
    const healthGain = Math.floor(nutrition / 2);
    
    const newHealth = Math.min(gameState.player.maxHealth, gameState.player.health + healthGain);
    gameStateService.updatePlayerStats({ health: newHealth });

    return {
      success: true,
      message: `Du isst ${item.name} und erholst dich etwas.`,
      itemId: item.id,
      effects: [`Gesundheit: +${healthGain}`]
    };
  }

  private async equipWeapon(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const currentWeapon = gameState.player.equipment?.weapon;
    
    // Unequip current weapon
    if (currentWeapon) {
      await this.addItem({
        ...currentWeapon,
        quantity: 1
      }, gameState);
    }

    // Equip new weapon
    const equipment = gameState.player.equipment || {};
    equipment.weapon = item;
    gameStateService.updatePlayerStats({ equipment });

    return {
      success: true,
      message: `Du rüstest ${item.name} aus.`,
      itemId: item.id,
      equipped: true
    };
  }

  private async equipArmor(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const armorSlot = item.properties?.slot || 'chest';
    const currentArmor = gameState.player.equipment?.[armorSlot];
    
    // Unequip current armor
    if (currentArmor) {
      await this.addItem({
        ...currentArmor,
        quantity: 1
      }, gameState);
    }

    // Equip new armor
    const equipment = gameState.player.equipment || {};
    equipment[armorSlot] = item;
    gameStateService.updatePlayerStats({ equipment });

    return {
      success: true,
      message: `Du legst ${item.name} an.`,
      itemId: item.id,
      equipped: true
    };
  }

  private async useTool(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const toolType = item.properties?.toolType;
    
    switch (toolType) {
      case 'lockpick':
        return {
          success: true,
          message: `Du bereitest ${item.name} vor.`,
          itemId: item.id,
          toolReady: true
        };
      case 'rope':
        return {
          success: true,
          message: `Du hältst ${item.name} bereit.`,
          itemId: item.id,
          toolReady: true
        };
      default:
        return {
          success: true,
          message: `Du verwendest ${item.name}.`,
          itemId: item.id
        };
    }
  }

  private async useKey(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const keyId = item.properties?.keyId;
    
    if (keyId) {
      gameStateService.setFlag(`key_${keyId}_used`, true);
    }

    return {
      success: true,
      message: `Du verwendest ${item.name}.`,
      itemId: item.id,
      keyUsed: keyId
    };
  }

  private async readBook(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const knowledge = item.properties?.knowledge || [];
    const experience = item.properties?.experience || 10;
    
    // Add knowledge flags
    for (const know of knowledge) {
      gameStateService.setFlag(`knowledge_${know}`, true);
    }

    // Add experience
    if (experience > 0) {
      gameStateService.updatePlayerStats({ 
        experience: gameState.player.experience + experience 
      });
    }

    return {
      success: true,
      message: `Du liest ${item.name} und lernst etwas Neues.`,
      itemId: item.id,
      experience: experience,
      knowledge: knowledge
    };
  }

  private async useScroll(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    const spell = item.properties?.spell;
    const manaCost = item.properties?.manaCost || 0;
    
    if (manaCost > gameState.player.mana) {
      return {
        success: false,
        message: 'Nicht genug Mana um die Schriftrolle zu verwenden.',
        itemId: item.id
      };
    }

    // Deduct mana
    gameStateService.updatePlayerStats({ 
      mana: gameState.player.mana - manaCost 
    });

    // Apply spell effect
    if (spell) {
      gameStateService.setFlag(`spell_${spell}_cast`, true);
    }

    return {
      success: true,
      message: `Du aktivierst die Schriftrolle und wirkst ${spell || 'einen Zauber'}.`,
      itemId: item.id,
      spell: spell,
      manaCost: manaCost
    };
  }

  private async useGenericItem(item: InventoryItem, gameState: GameState): Promise<ItemUseResult> {
    // Generic item use - just set a flag that it was used
    const itemFlag = `item_${item.id}_used`;
    gameStateService.setFlag(itemFlag, true);

    return {
      success: true,
      message: `Du verwendest ${item.name}.`,
      itemId: item.id
    };
  }

  hasInventorySpace(gameState: GameState, requiredSlots: number = 1): boolean {
    const maxSize = gameState.player.stats?.maxInventorySize || this.DEFAULT_INVENTORY_SIZE;
    const currentSize = gameState.inventory.reduce((sum, item) => 
      sum + (item.quantity || 1), 0
    );
    
    return (currentSize + requiredSlots) <= maxSize;
  }

  getInventoryWeight(gameState: GameState): number {
    return gameState.inventory.reduce((weight, item) => 
      weight + ((item.properties?.weight || 1) * (item.quantity || 1)), 0
    );
  }

  getInventoryValue(gameState: GameState): number {
    return gameState.inventory.reduce((value, item) => 
      value + (item.value * (item.quantity || 1)), 0
    );
  }

  sortInventory(gameState: GameState, sortBy: 'name' | 'type' | 'value' | 'rarity' = 'type'): void {
    gameState.inventory.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'value':
          return b.value - a.value;
        case 'rarity':
          const rarityOrder = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        default:
          return 0;
      }
    });

    gameStateService.updateGameState({ inventory: gameState.inventory });
    this.emit('inventorySorted', { sortBy });
  }

  async shutdown(): Promise<void> {
    this.removeAllListeners();
    console.log('[InventoryManager] Shutdown complete');
  }
}