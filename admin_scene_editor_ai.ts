// File: src/components/admin/SceneEditor.tsx
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material'
import {
  Close,
  Add,
  Delete,
  ExpandMore,
  Preview,
  Save,
  SmartToy,
  Image,
  Flag,
  Star,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { Scene, Choice, SceneCondition, SceneEffect, ChoiceRequirement, ChoiceEffect } from '../../types/scene'
import { useNotification } from '../../hooks/useNotification'

interface SceneEditorProps {
  open: boolean
  scene: Scene | null
  onClose: () => void
  onSave: (scene: Scene) => void
}

const SceneEditor: React.FC<SceneEditorProps> = ({ open, scene, onClose, onSave }) => {
  const theme = useTheme()
  const { showSuccess, showError } = useNotification()

  const [formData, setFormData] = useState<Scene>({
    id: '',
    title: '',
    content: '',
    imageUrl: '',
    backgroundMusic: '',
    type: 'story',
    choices: [],
    conditions: [],
    effects: [],
    metadata: {
      difficulty: 1,
      estimatedReadTime: 1,
      wordCount: 0,
      choiceCount: 0,
      isStartScene: false,
      isEndScene: false,
      branchDepth: 0,
      popularity: 0,
      averageRating: 0,
      playCount: 0,
    },
    isGenerated: false,
    generatedBy: 'admin',
    parentSceneId: undefined,
    tags: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

  useEffect(() => {
    if (scene) {
      setFormData(scene)
    } else {
      // Reset form for new scene
      setFormData({
        id: `scene_${Date.now()}`,
        title: '',
        content: '',
        imageUrl: '',
        backgroundMusic: '',
        type: 'story',
        choices: [],
        conditions: [],
        effects: [],
        metadata: {
          difficulty: 1,
          estimatedReadTime: 1,
          wordCount: 0,
          choiceCount: 0,
          isStartScene: false,
          isEndScene: false,
          branchDepth: 0,
          popularity: 0,
          averageRating: 0,
          playCount: 0,
        },
        isGenerated: false,
        generatedBy: 'admin',
        parentSceneId: undefined,
        tags: [],
      })
    }
    setErrors({})
  }, [scene, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich'
    }
    if (formData.choices.length === 0 && formData.type !== 'ending') {
      newErrors.choices = 'Mindestens eine Auswahlmöglichkeit ist erforderlich (außer bei Ending-Szenen)'
    }

    // Validate choices
    formData.choices.forEach((choice, index) => {
      if (!choice.text.trim()) {
        newErrors[`choice_${index}_text`] = 'Auswahltext ist erforderlich'
      }
      if (!choice.targetSceneId.trim()) {
        newErrors[`choice_${index}_target`] = 'Zielszene ist erforderlich'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      showError('Validierungsfehler', 'Bitte korrigieren Sie die markierten Felder.')
      return
    }

    // Calculate metadata
    const wordCount = formData.content.split(/\s+/).length
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)) // 200 words per minute

    const updatedScene: Scene = {
      ...formData,
      metadata: {
        ...formData.metadata,
        wordCount,
        estimatedReadTime,
        choiceCount: formData.choices.length,
      },
    }

    onSave(updatedScene)
  }

  const addChoice = () => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      text: '',
      description: '',
      requirements: [],
      effects: [],
      targetSceneId: '',
      probability: 100,
      isVisible: true,
      isEnabled: true,
      iconName: '',
      mood: 'neutral',
    }

    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, newChoice],
    }))
  }

  const updateChoice = (index: number, updates: Partial<Choice>) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { ...choice, ...updates } : choice
      ),
    }))
  }

  const removeChoice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
    }))
  }

  const addChoiceRequirement = (choiceIndex: number) => {
    const newRequirement: ChoiceRequirement = {
      type: 'stat',
      key: '',
      operator: '>=',
      value: 0,
      errorMessage: '',
    }

    updateChoice(choiceIndex, {
      requirements: [...formData.choices[choiceIndex].requirements, newRequirement],
    })
  }

  const updateChoiceRequirement = (choiceIndex: number, reqIndex: number, updates: Partial<ChoiceRequirement>) => {
    const updatedRequirements = [...formData.choices[choiceIndex].requirements]
    updatedRequirements[reqIndex] = { ...updatedRequirements[reqIndex], ...updates }
    updateChoice(choiceIndex, { requirements: updatedRequirements })
  }

  const removeChoiceRequirement = (choiceIndex: number, reqIndex: number) => {
    const updatedRequirements = formData.choices[choiceIndex].requirements.filter((_, i) => i !== reqIndex)
    updateChoice(choiceIndex, { requirements: updatedRequirements })
  }

  const addChoiceEffect = (choiceIndex: number) => {
    const newEffect: ChoiceEffect = {
      type: 'modify_stat',
      target: '',
      value: 0,
      description: '',
    }

    updateChoice(choiceIndex, {
      effects: [...formData.choices[choiceIndex].effects, newEffect],
    })
  }

  const updateChoiceEffect = (choiceIndex: number, effectIndex: number, updates: Partial<ChoiceEffect>) => {
    const updatedEffects = [...formData.choices[choiceIndex].effects]
    updatedEffects[effectIndex] = { ...updatedEffects[effectIndex], ...updates }
    updateChoice(choiceIndex, { effects: updatedEffects })
  }

  const removeChoiceEffect = (choiceIndex: number, effectIndex: number) => {
    const updatedEffects = formData.choices[choiceIndex].effects.filter((_, i) => i !== effectIndex)
    updateChoice(choiceIndex, { effects: updatedEffects })
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          background: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
          {scene ? 'Szene bearbeiten' : 'Neue Szene erstellen'}
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Basic Information */}
          <Accordion
            expanded={expandedSections.has('basic')}
            onChange={() => toggleSection('basic')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Grundinformationen
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Szenen-Titel"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Szenen-Typ</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      label="Szenen-Typ"
                    >
                      <MenuItem value="story">Geschichte</MenuItem>
                      <MenuItem value="choice">Entscheidung</MenuItem>
                      <MenuItem value="battle">Kampf</MenuItem>
                      <MenuItem value="puzzle">Rätsel</MenuItem>
                      <MenuItem value="ending">Ende</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Schwierigkeit (1-5)"
                    value={formData.metadata.difficulty}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, difficulty: parseInt(e.target.value) || 1 }
                    }))}
                    inputProps={{ min: 1, max: 5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Szenen-Inhalt"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    error={!!errors.content}
                    helperText={errors.content || 'Beschreiben Sie die Szene detailliert'}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bild-URL (optional)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Hintergrundmusik-URL (optional)"
                    value={formData.backgroundMusic}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundMusic: e.target.value }))}
                    placeholder="https://example.com/music.mp3"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.metadata.isStartScene}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, isStartScene: e.target.checked }
                          }))}
                        />
                      }
                      label="Start-Szene"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.metadata.isEndScene}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, isEndScene: e.target.checked }
                          }))}
                        />
                      }
                      label="End-Szene"
                    />
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Choices */}
          <Accordion
            expanded={expandedSections.has('choices')}
            onChange={() => toggleSection('choices')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Auswahlmöglichkeiten
                </Typography>
                <Chip
                  size="small"
                  label={formData.choices.length}
                  color="primary"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<Add />}
                  onClick={addChoice}
                  variant="outlined"
                  fullWidth
                >
                  Neue Auswahlmöglichkeit hinzufügen
                </Button>
              </Box>

              {formData.choices.map((choice, choiceIndex) => (
                <Card key={choice.id} sx={{ mb: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Auswahl {choiceIndex + 1}
                      </Typography>
                      <IconButton
                        onClick={() => removeChoice(choiceIndex)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Auswahltext"
                          value={choice.text}
                          onChange={(e) => updateChoice(choiceIndex, { text: e.target.value })}
                          error={!!errors[`choice_${choiceIndex}_text`]}
                          helperText={errors[`choice_${choiceIndex}_text`]}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Beschreibung (optional)"
                          value={choice.description}
                          onChange={(e) => updateChoice(choiceIndex, { description: e.target.value })}
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Ziel-Szenen-ID"
                          value={choice.targetSceneId}
                          onChange={(e) => updateChoice(choiceIndex, { targetSceneId: e.target.value })}
                          error={!!errors[`choice_${choiceIndex}_target`]}
                          helperText={errors[`choice_${choiceIndex}_target`] || 'ID der nächsten Szene oder "generate" für KI-Generierung'}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Stimmung</InputLabel>
                          <Select
                            value={choice.mood}
                            onChange={(e) => updateChoice(choiceIndex, { mood: e.target.value as any })}
                            label="Stimmung"
                          >
                            <MenuItem value="neutral">Neutral</MenuItem>
                            <MenuItem value="positive">Positiv</MenuItem>
                            <MenuItem value="negative">Negativ</MenuItem>
                            <MenuItem value="mysterious">Mysteriös</MenuItem>
                            <MenuItem value="dangerous">Gefährlich</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Wahrscheinlichkeit (%)"
                          value={choice.probability}
                          onChange={(e) => updateChoice(choiceIndex, { probability: parseInt(e.target.value) || 100 })}
                          inputProps={{ min: 1, max: 100 }}
                        />
                      </Grid>

                      {/* Requirements */}
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Voraussetzungen
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() => addChoiceRequirement(choiceIndex)}
                            >
                              Hinzufügen
                            </Button>
                          </Box>
                          
                          {choice.requirements.map((req, reqIndex) => (
                            <Box key={reqIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select
                                  value={req.type}
                                  onChange={(e) => updateChoiceRequirement(choiceIndex, reqIndex, { type: e.target.value as any })}
                                >
                                  <MenuItem value="stat">Stat</MenuItem>
                                  <MenuItem value="flag">Flag</MenuItem>
                                  <MenuItem value="item">Item</MenuItem>
                                  <MenuItem value="level">Level</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                size="small"
                                label="Schlüssel"
                                value={req.key}
                                onChange={(e) => updateChoiceRequirement(choiceIndex, reqIndex, { key: e.target.value })}
                                sx={{ flex: 1 }}
                              />
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={req.operator}
                                  onChange={(e) => updateChoiceRequirement(choiceIndex, reqIndex, { operator: e.target.value as any })}
                                >
                                  <MenuItem value="==">==</MenuItem>
                                  <MenuItem value="!=">!=</MenuItem>
                                  <MenuItem value=">">{'>'}</MenuItem>
                                  <MenuItem value="<">{'<'}</MenuItem>
                                  <MenuItem value=">=">{'>='}</MenuItem>
                                  <MenuItem value="<=">{'<='}</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                size="small"
                                label="Wert"
                                value={req.value}
                                onChange={(e) => updateChoiceRequirement(choiceIndex, reqIndex, { value: e.target.value })}
                                sx={{ width: 100 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeChoiceRequirement(choiceIndex, reqIndex)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Grid>

                      {/* Effects */}
                      <Grid item xs={12}>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Auswirkungen
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() => addChoiceEffect(choiceIndex)}
                            >
                              Hinzufügen
                            </Button>
                          </Box>
                          
                          {choice.effects.map((effect, effectIndex) => (
                            <Box key={effectIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={effect.type}
                                  onChange={(e) => updateChoiceEffect(choiceIndex, effectIndex, { type: e.target.value as any })}
                                >
                                  <MenuItem value="modify_stat">Stat ändern</MenuItem>
                                  <MenuItem value="set_flag">Flag setzen</MenuItem>
                                  <MenuItem value="add_item">Item hinzufügen</MenuItem>
                                  <MenuItem value="remove_item">Item entfernen</MenuItem>
                                  <MenuItem value="add_experience">XP hinzufügen</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                size="small"
                                label="Ziel"
                                value={effect.target}
                                onChange={(e) => updateChoiceEffect(choiceIndex, effectIndex, { target: e.target.value })}
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                label="Wert"
                                value={effect.value}
                                onChange={(e) => updateChoiceEffect(choiceIndex, effectIndex, { value: e.target.value })}
                                sx={{ width: 100 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeChoiceEffect(choiceIndex, effectIndex)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              {errors.choices && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {errors.choices}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SceneEditor

// File: src/components/admin/AISceneGenerator.tsx
import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useTheme,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  SmartToy,
  ExpandMore,
  Generate,
  Refresh,
  Save,
  Preview,
  Settings,
  History,
  Star,
  AutoAwesome,
  Psychology,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Scene } from '../../types/scene'
import { useNotification } from '../../hooks/useNotification'

interface AISceneGeneratorProps {
  open?: boolean
  onClose?: () => void
  onGenerate: (scene: Scene) => void
  existingScenes: Scene[]
}

interface GenerationPrompt {
  mainPrompt: string
  sceneType: 'story' | 'choice' | 'battle' | 'puzzle' | 'ending'
  tone: 'epic' | 'mysterious' | 'humorous' | 'dark' | 'romantic' | 'adventurous'
  difficulty: number
  length: 'short' | 'medium' | 'long'
  includeChoices: boolean
  choiceCount: number
  continueFromScene?: string
  themes: string[]
  characters: string[]
  location: string
  timeOfDay: string
}

const AISceneGenerator: React.FC<AISceneGeneratorProps> = ({ 
  onGenerate, 
  existingScenes 
}) => {
  const theme = useTheme()
  const { showSuccess, showError, showInfo } = useNotification()

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedScene, setGeneratedScene] = useState<Scene | null>(null)
  const [generationHistory, setGenerationHistory] = useState<string[]>([])

  const [prompt, setPrompt] = useState<GenerationPrompt>({
    mainPrompt: '',
    sceneType: 'story',
    tone: 'adventurous',
    difficulty: 3,
    length: 'medium',
    includeChoices: true,
    choiceCount: 3,
    continueFromScene: '',
    themes: [],
    characters: [],
    location: '',
    timeOfDay: 'day',
  })

  const toneOptions = [
    { value: 'epic', label: 'Episch', description: 'Große Abenteuer und Heldentaten' },
    { value: 'mysterious', label: 'Mysteriös', description: 'Geheimnisse und Rätsel' },
    { value: 'humorous', label: 'Humorvoll', description: 'Leicht und lustig' },
    { value: 'dark', label: 'Dunkel', description: 'Ernste und düstere Atmosphäre' },
    { value: 'romantic', label: 'Romantisch', description: 'Liebe und Beziehungen' },
    { value: 'adventurous', label: 'Abenteuerlich', description: 'Erkundung und Entdeckung' },
  ]

  const suggestionPrompts = [
    "Ein geheimnisvoller Händler bietet dem Spieler ein magisches Artefakt an",
    "Der Spieler entdeckt eine verborgene Kammer unter dem Schloss",
    "Ein sprechender Waldgeist bittet um Hilfe bei einem alten Fluch",
    "Eine Gruppe von Banditen versperrt den Weg zum nächsten Dorf",
    "Der Spieler findet ein altes Tagebuch mit rätselhaften Einträgen",
    "Ein verzaubertes Portal öffnet sich und führt in eine andere Welt",
  ]

  const simulateGeneration = async (): Promise<Scene> => {
    // Simulate API call with progress updates
    setGenerationProgress(0)
    
    const steps = [
      { message: 'Verbinde mit KI-Service...', progress: 10 },
      { message: 'Analysiere bestehende Szenen...', progress: 25 },
      { message: 'Generiere Story-Inhalt...', progress: 50 },
      { message: 'Erstelle Auswahlmöglichkeiten...', progress: 75 },
      { message: 'Finalisiere Szene...', progress: 90 },
      { message: 'Fertig!', progress: 100 },
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setGenerationProgress(step.progress)
      showInfo('KI-Generierung', step.message, 1000)
    }

    // Create mock generated scene
    const newScene: Scene = {
      id: `ai_scene_${Date.now()}`,
      title: `Der ${prompt.tone === 'mysterious' ? 'Geheimnisvolle' : 'Magische'} ${prompt.location || 'Ort'}`,
      content: `Dies ist eine KI-generierte Szene mit dem Ton "${prompt.tone}" und der Schwierigkeit ${prompt.difficulty}. ${prompt.mainPrompt}\n\nDie Szene entfaltet sich vor Ihnen mit all ihren Möglichkeiten und Herausforderungen. Was werden Sie tun?`,
      imageUrl: '',
      type: prompt.sceneType,
      choices: prompt.includeChoices ? Array.from({ length: prompt.choiceCount }, (_, i) => ({
        id: `ai_choice_${Date.now()}_${i}`,
        text: `Option ${i + 1}: ${['Mutig voranschreiten', 'Vorsichtig erkunden', 'Um Hilfe rufen', 'Zurückziehen'][i] || 'Nachdenken'}`,
        description: `Eine ${prompt.tone} Entscheidung in dieser Situation.`,
        requirements: [],
        effects: [{
          type: 'modify_stat' as const,
          target: ['strength', 'intelligence', 'wisdom'][i % 3],
          value: Math.floor(Math.random() * 5) + 1,
          description: `Erhöht ${['Stärke', 'Intelligenz', 'Weisheit'][i % 3]}`,
        }],
        targetSceneId: 'generate',
        probability: 100,
        isVisible: true,
        isEnabled: true,
        mood: ['positive', 'neutral', 'mysterious', 'dangerous'][i % 4] as any,
      })) : [],
      conditions: [],
      effects: [],
      metadata: {
        difficulty: prompt.difficulty,
        estimatedReadTime: prompt.length === 'short' ? 1 : prompt.length === 'medium' ? 2 : 4,
        wordCount: 150 + (prompt.length === 'short' ? 0 : prompt.length === 'medium' ? 100 : 250),
        choiceCount: prompt.choiceCount,
        isStartScene: false,
        isEndScene: prompt.sceneType === 'ending',
        branchDepth: 0,
        popularity: 0,
        averageRating: 0,
        playCount: 0,
      },
      isGenerated: true,
      generatedBy: 'ai',
      tags: prompt.themes,
    }

    return newScene
  }

  const handleGenerate = async () => {
    if (!prompt.mainPrompt.trim()) {
      showError('Eingabefehler', 'Bitte geben Sie eine Prompt-Beschreibung ein.')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationProgress(0)
      
      const scene = await simulateGeneration()
      setGeneratedScene(scene)
      
      // Add to history
      setGenerationHistory(prev => [prompt.mainPrompt, ...prev.slice(0, 9)])
      
      showSuccess('Szene generiert!', 'Die KI hat eine neue Szene erfolgreich erstellt.')
    } catch (error) {
      showError('Generierungsfehler', 'Die Szene konnte nicht generiert werden. Bitte versuchen Sie es erneut.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleSaveGenerated = () => {
    if (generatedScene) {
      onGenerate(generatedScene)
      setGeneratedScene(null)
    }
  }

  const handleRegenerateWithPrompt = (historicalPrompt: string) => {
    setPrompt(prev => ({ ...prev, mainPrompt: historicalPrompt }))
  }

  const addTheme = (theme: string) => {
    if (theme && !prompt.themes.includes(theme)) {
      setPrompt(prev => ({
        ...prev,
        themes: [...prev.themes, theme],
      }))
    }
  }

  const removeTheme = (theme: string) => {
    setPrompt(prev => ({
      ...prev,
      themes: prev.themes.filter(t => t !== theme),
    }))
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <SmartToy sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  KI-Szenen-Generator
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Lassen Sie künstliche Intelligenz einzigartige Szenen für Ihr Abenteuer erstellen
                </Typography>
              </Box>
            </Box>

            {/* Generation Progress */}
            {isGenerating && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <AutoAwesome sx={{ color: theme.palette.secondary.main }} />
                  <Typography variant="h6">KI arbeitet...</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={generationProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    background: `${theme.palette.secondary.main}20`,
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                      borderRadius: 4,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {generationProgress}% abgeschlossen
                </Typography>
              </Box>
            )}

            {/* Main Configuration */}
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Szenen-Konfiguration
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Szenen-Beschreibung"
                      placeholder="Beschreiben Sie die gewünschte Szene detailliert..."
                      value={prompt.mainPrompt}
                      onChange={(e) => setPrompt(prev => ({ ...prev, mainPrompt: e.target.value }))}
                      helperText="Je detaillierter die Beschreibung, desto besser wird das Ergebnis"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Szenen-Typ</InputLabel>
                      <Select
                        value={prompt.sceneType}
                        onChange={(e) => setPrompt(prev => ({ ...prev, sceneType: e.target.value as any }))}
                        label="Szenen-Typ"
                      >
                        <MenuItem value="story">Geschichte</MenuItem>
                        <MenuItem value="choice">Entscheidung</MenuItem>
                        <MenuItem value="battle">Kampf</MenuItem>
                        <MenuItem value="puzzle">Rätsel</MenuItem>
                        <MenuItem value="ending">Ende</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Ton</InputLabel>
                      <Select
                        value={prompt.tone}
                        onChange={(e) => setPrompt(prev => ({ ...prev, tone: e.target.value as any }))}
                        label="Ton"
                      >
                        {toneOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Schwierigkeit"
                      value={prompt.difficulty}
                      onChange={(e) => setPrompt(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 1 }))}
                      inputProps={{ min: 1, max: 5 }}
                      helperText="1 = Einfach, 5 = Sehr schwer"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Länge</InputLabel>
                      <Select
                        value={prompt.length}
                        onChange={(e) => setPrompt(prev => ({ ...prev, length: e.target.value as any }))}
                        label="Länge"
                      >
                        <MenuItem value="short">Kurz (~150 Wörter)</MenuItem>
                        <MenuItem value="medium">Mittel (~250 Wörter)</MenuItem>
                        <MenuItem value="long">Lang (~400 Wörter)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Anzahl Auswahlmöglichkeiten"
                      value={prompt.choiceCount}
                      onChange={(e) => setPrompt(prev => ({ ...prev, choiceCount: parseInt(e.target.value) || 2 }))}
                      inputProps={{ min: 1, max: 6 }}
                      disabled={!prompt.includeChoices}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ort/Location"
                      value={prompt.location}
                      onChange={(e) => setPrompt(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="z.B. Verzauberter Wald, Dunkle Höhle..."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tageszeit</InputLabel>
                      <Select
                        value={prompt.timeOfDay}
                        onChange={(e) => setPrompt(prev => ({ ...prev, timeOfDay: e.target.value }))}
                        label="Tageszeit"
                      >
                        <MenuItem value="dawn">Morgengrauen</MenuItem>
                        <MenuItem value="day">Tag</MenuItem>
                        <MenuItem value="dusk">Abenddämmerung</MenuItem>
                        <MenuItem value="night">Nacht</MenuItem>
                        <MenuItem value="midnight">Mitternacht</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Quick Suggestions */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Schnelle Vorschläge
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Klicken Sie auf einen Vorschlag, um ihn als Basis zu verwenden:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {suggestionPrompts.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      onClick={() => setPrompt(prev => ({ ...prev, mainPrompt: suggestion }))}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          background: theme.palette.primary.main + '20',
                        },
                      }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Generation History */}
            {generationHistory.length > 0 && (
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Verlauf
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {generationHistory.map((historyPrompt, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': {
                            background: theme.palette.action.hover,
                          },
                        }}
                        onClick={() => handleRegenerateWithPrompt(historyPrompt)}
                      >
                        <ListItemIcon>
                          <Refresh />
                        </ListItemIcon>
                        <ListItemText
                          primary={historyPrompt}
                          secondary={`Generiert vor ${index + 1} Sitzung${index === 0 ? '' : 'en'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Generate Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<SmartToy />}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.mainPrompt.trim()}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.secondary.dark}, ${theme.palette.primary.dark})`,
                  },
                }}
              >
                {isGenerating ? 'Generiere Szene...' : 'Szene generieren'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Generated Scene Preview */}
        {generatedScene && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                    }}
                  >
                    Generierte Szene
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      Neu generieren
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveGenerated}
                    >
                      Szene übernehmen
                    </Button>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Diese Szene wurde von der KI generiert. Sie können sie bearbeiten oder direkt übernehmen.
                  </Typography>
                </Alert>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {generatedScene.title}
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {generatedScene.content}
                </Typography>

                {generatedScene.choices.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Auswahlmöglichkeiten:
                    </Typography>
                    {generatedScene.choices.map((choice, index) => (
                      <Box
                        key={choice.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          background: theme.palette.action.hover,
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                          {choice.text}
                        </Typography>
                        {choice.description && (
                          <Typography variant="body2" color="text.secondary">
                            {choice.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Box>
  )
}

export default AISceneGenerator