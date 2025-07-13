// File: src/types/common.ts
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface APIResponse<T = any> {
  data: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// File: src/types/game.ts
export interface GameState {
  currentSceneId: string
  playerId: string
  playerName: string
  stats: PlayerStats
  flags: GameFlags
  inventory: InventoryItem[]
  gameStartTime: string
  lastSaveTime: string
  totalPlayTime: number
  isGameActive: boolean
  difficulty: 'easy' | 'normal' | 'hard'
  sessionId: string
}

export interface PlayerStats {
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  strength: number
  intelligence: number
  wisdom: number
  charisma: number
  luck: number
  experience: number
  level: number
  gold: number
}

export interface GameFlags {
  [key: string]: boolean | number | string | null
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  quantity: number
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'key' | 'quest' | 'misc'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  effects?: ItemEffect[]
  usable: boolean
  stackable: boolean
  value: number
}

export interface ItemEffect {
  type: 'stat_bonus' | 'heal' | 'damage' | 'buff' | 'debuff'
  target: string
  value: number
  duration?: number
}

// File: src/types/scene.ts
export interface Scene {
  id: string
  title: string
  content: string
  imageUrl?: string
  backgroundMusic?: string
  type: 'story' | 'choice' | 'battle' | 'puzzle' | 'ending'
  choices: Choice[]
  conditions: SceneCondition[]
  effects: SceneEffect[]
  metadata: SceneMetadata
  isGenerated: boolean
  generatedBy?: 'ai' | 'admin' | 'player'
  parentSceneId?: string
  tags: string[]
}

export interface Choice {
  id: string
  text: string
  description?: string
  requirements: ChoiceRequirement[]
  effects: ChoiceEffect[]
  targetSceneId: string | 'generate' | 'end'
  probability: number
  isVisible: boolean
  isEnabled: boolean
  iconName?: string
  mood: 'neutral' | 'positive' | 'negative' | 'mysterious' | 'dangerous'
}

export interface SceneCondition {
  type: 'flag' | 'stat' | 'item' | 'level' | 'time' | 'random'
  key: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains'
  value: any
  required: boolean
}

export interface SceneEffect {
  type: 'set_flag' | 'modify_stat' | 'add_item' | 'remove_item' | 'play_sound' | 'set_background'
  target: string
  value: any
  delay?: number
  animation?: string
}

export interface ChoiceRequirement {
  type: 'flag' | 'stat' | 'item' | 'level'
  key: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: any
  errorMessage: string
}

export interface ChoiceEffect {
  type: 'set_flag' | 'modify_stat' | 'add_item' | 'remove_item' | 'add_experience'
  target: string
  value: any
  description?: string
}

export interface SceneMetadata {
  difficulty: number
  estimatedReadTime: number
  wordCount: number
  choiceCount: number
  isStartScene: boolean
  isEndScene: boolean
  branchDepth: number
  popularity: number
  averageRating: number
  playCount: number
}

// File: src/types/character.ts
export interface Character {
  id: string
  name: string
  title?: string
  description: string
  avatarUrl?: string
  type: 'npc' | 'companion' | 'enemy' | 'merchant' | 'quest_giver'
  stats: CharacterStats
  personality: CharacterPersonality
  dialogue: DialogueSet[]
  relationships: CharacterRelationship[]
  isAlive: boolean
  location?: string
  questIds: string[]
}

export interface CharacterStats {
  level: number
  health: number
  maxHealth: number
  strength: number
  intelligence: number
  wisdom: number
  charisma: number
  armor: number
  skills: CharacterSkill[]
}

export interface CharacterSkill {
  name: string
  level: number
  experience: number
  maxLevel: number
  description: string
  effects: ItemEffect[]
}

export interface CharacterPersonality {
  traits: string[]
  mood: 'friendly' | 'neutral' | 'hostile' | 'mysterious' | 'wise' | 'playful'
  speechPattern: 'formal' | 'casual' | 'archaic' | 'mystical' | 'gruff'
  interests: string[]
  fears: string[]
  motivations: string[]
}

export interface DialogueSet {
  id: string
  context: 'greeting' | 'quest' | 'shop' | 'battle' | 'random' | 'ending'
  conditions: SceneCondition[]
  lines: DialogueLine[]
  priority: number
}

export interface DialogueLine {
  speaker: 'character' | 'player'
  text: string
  emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'mysterious'
  effects?: SceneEffect[]
  choices?: Choice[]
}

export interface CharacterRelationship {
  characterId: string
  relationshipType: 'friend' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'rival'
  intimacyLevel: number
  trustLevel: number
  history: string[]
}

// File: src/types/flags.ts
export interface FlagDefinition {
  id: string
  name: string
  description: string
  type: 'boolean' | 'number' | 'string' | 'array'
  defaultValue: any
  category: 'story' | 'character' | 'gameplay' | 'system' | 'achievement'
  isGlobal: boolean
  isPersistent: boolean
  isDebugVisible: boolean
  validation?: FlagValidation
  metadata: FlagMetadata
}

export interface FlagValidation {
  required: boolean
  min?: number
  max?: number
  pattern?: string
  allowedValues?: any[]
  customValidator?: string
}

export interface FlagMetadata {
  created_at: string
  created_by: string
  last_modified: string
  version: number
  usage_count: number
  dependencies: string[]
  deprecatedSince?: string
  replacedBy?: string
}

export interface FlagGroup {
  id: string
  name: string
  description: string
  flags: string[]
  isCollapsed: boolean
  color: string
  icon: string
}

// File: src/types/api.ts
export interface AIGenerationRequest {
  prompt: string
  context: AIContext
  parameters: AIParameters
  sceneType: 'story' | 'choice' | 'battle' | 'ending'
  targetLength: 'short' | 'medium' | 'long'
}

export interface AIContext {
  currentScene: Scene
  playerStats: PlayerStats
  gameFlags: GameFlags
  recentChoices: string[]
  storyTheme: string
  difficulty: string
}

export interface AIParameters {
  temperature: number
  maxTokens: number
  model: string
  systemPrompt: string
  userPrompt: string
  stopSequences: string[]
}

export interface AIGenerationResponse {
  sceneId: string
  content: string
  title: string
  choices: Choice[]
  metadata: {
    tokensUsed: number
    generationTime: number
    model: string
    confidence: number
    cost: number
  }
  alternatives?: string[]
  warnings?: string[]
}

export interface ExportOptions {
  format: 'json' | 'markdown' | 'pdf' | 'epub' | 'html'
  includeMetadata: boolean
  includeImages: boolean
  includeStats: boolean
  includeChoices: boolean
  compression: boolean
  password?: string
}

export interface ImportOptions {
  overwriteExisting: boolean
  validateData: boolean
  mergeStrategy: 'replace' | 'merge' | 'append'
  backupBefore: boolean
}

// File: src/types/stats.ts
export interface GameStatistics {
  totalPlayTime: number
  sessionsCount: number
  scenesVisited: number
  choicesMade: number
  achievementsUnlocked: number
  averageSessionLength: number
  favoriteScenes: string[]
  completionRate: number
  difficultySetting: string
  startDate: string
  lastPlayDate: string
}

export interface PlayerProgress {
  currentLevel: number
  totalExperience: number
  skillPoints: number
  unlockedAreas: string[]
  completedQuests: string[]
  activeQuests: string[]
  achievements: Achievement[]
  statistics: GameStatistics
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconUrl: string
  category: 'story' | 'exploration' | 'combat' | 'social' | 'collection' | 'special'
  points: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
  requirements: AchievementRequirement[]
  rewards: AchievementReward[]
  isSecret: boolean
  progress?: number
  maxProgress?: number
}

export interface AchievementRequirement {
  type: 'flag' | 'stat' | 'count' | 'time' | 'sequence'
  target: string
  value: any
  description: string
}

export interface AchievementReward {
  type: 'experience' | 'item' | 'stat_bonus' | 'unlock' | 'cosmetic'
  value: any
  description: string
}