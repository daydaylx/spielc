// File: src/components/game/InventoryDisplay.tsx
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  Collapse,
  Divider,
} from '@mui/material'
import {
  Inventory,
  ExpandMore,
  ExpandLess,
  Info,
  Delete,
  Star,
  Shield,
  LocalPharmacy,
  MenuBook,
  VpnKey,
  Assignment,
  Category,
  FilterList,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../../hooks/useGame'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'
import { InventoryItem } from '../../types/game'

const InventoryDisplay: React.FC = () => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const { gameState, removeItem } = useGame()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']))

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'weapon': return '⚔️'
      case 'armor': return '🛡️'
      case 'potion': return '🧪'
      case 'scroll': return '📜'
      case 'key': return '🗝️'
      case 'quest': return '📋'
      default: return '📦'
    }
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return <Star sx={{ fontSize: 16 }} />
      case 'armor': return <Shield sx={{ fontSize: 16 }} />
      case 'potion': return <LocalPharmacy sx={{ fontSize: 16 }} />
      case 'scroll': return <MenuBook sx={{ fontSize: 16 }} />
      case 'key': return <VpnKey sx={{ fontSize: 16 }} />
      case 'quest': return <Assignment sx={{ fontSize: 16 }} />
      default: return <Category sx={{ fontSize: 16 }} />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return theme.palette.grey[500]
      case 'uncommon': return theme.palette.success.main
      case 'rare': return theme.palette.info.main
      case 'epic': return theme.palette.secondary.main
      case 'legendary': return theme.palette.warning.main
      default: return theme.palette.text.secondary
    }
  }

  const getRarityGlow = (rarity: string) => {
    const color = getRarityColor(rarity)
    return `0 0 10px ${color}40, 0 0 20px ${color}20`
  }

  const handleItemClick = (item: InventoryItem, event: React.MouseEvent<HTMLElement>) => {
    setSelectedItem(item)
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    setSelectedItem(null)
  }

  const handleUseItem = () => {
    if (selectedItem && selectedItem.usable) {
      // TODO: Implement item usage logic
      console.log('Using item:', selectedItem.name)
      handleCloseMenu()
    }
  }

  const handleRemoveItem = () => {
    if (selectedItem) {
      removeItem(selectedItem.id, 1)
      handleCloseMenu()
    }
  }

  const getFilteredItems = () => {
    if (filterType === 'all') return gameState.inventory
    return gameState.inventory.filter(item => item.type === filterType)
  }

  const getItemsByCategory = () => {
    const items = getFilteredItems()
    const categories = new Map<string, InventoryItem[]>()
    
    items.forEach(item => {
      const category = item.type
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(item)
    })
    
    return categories
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getCategoryName = (type: string) => {
    switch (type) {
      case 'weapon': return 'Waffen'
      case 'armor': return 'Rüstung'
      case 'potion': return 'Tränke'
      case 'scroll': return 'Schriftrollen'
      case 'key': return 'Schlüssel'
      case 'quest': return 'Questgegenstände'
      case 'misc': return 'Verschiedenes'
      default: return 'Unbekannt'
    }
  }

  const itemsByCategory = getItemsByCategory()
  const totalItems = gameState.inventory.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = gameState.inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0)

  return (
    <Card
      elevation={3}
      sx={{
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 246, 240, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.primary.main}40`,
        borderRadius: 2,
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ padding: 3, paddingBottom: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory sx={{ color: theme.palette.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              Inventar
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              // TODO: Implement filter menu
              console.log('Filter menu')
            }}
          >
            <FilterList />
          </IconButton>
        </Box>

        {/* Inventory Stats */}
        <Box
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
            border: `1px solid ${theme.palette.primary.main}20`,
            borderRadius: 1,
            padding: 2,
            mb: 2,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                Gegenstände
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {totalItems}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                Gesamtwert
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                {totalValue} 🪙
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 2 }} />
      </CardContent>

      {/* Items List */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
        {gameState.inventory.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: theme.palette.text.secondary,
            }}
          >
            <Box sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }}>📦</Box>
            <Typography variant="body2">
              Ihr Inventar ist leer
            </Typography>
          </Box>
        ) : (
          <Box>
            {Array.from(itemsByCategory.entries()).map(([category, items]) => (
              <Box key={category} sx={{ mb: 2 }}>
                {/* Category Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': {
                      background: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => toggleCategory(category)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getItemTypeIcon(category)}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {getCategoryName(category)}
                    </Typography>
                    <Chip
                      size="small"
                      label={items.length}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        background: theme.palette.primary.main + '20',
                        color: theme.palette.primary.main,
                      }}
                    />
                  </Box>
                  {expandedCategories.has(category) ? <ExpandLess /> : <ExpandMore />}
                </Box>

                {/* Category Items */}
                <Collapse in={expandedCategories.has(category)}>
                  <Box sx={{ pl: 2 }}>
                    <AnimatePresence>
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              py: 1.5,
                              px: 2,
                              borderRadius: 1,
                              border: `1px solid transparent`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: theme.palette.action.hover,
                                border: `1px solid ${getRarityColor(item.rarity)}40`,
                                transform: 'translateX(4px)',
                                boxShadow: getRarityGlow(item.rarity),
                              },
                            }}
                            onClick={(e) => handleItemClick(item, e)}
                          >
                            {/* Item Icon */}
                            <Box
                              sx={{
                                fontSize: '1.5rem',
                                filter: `drop-shadow(0 0 4px ${getRarityColor(item.rarity)}80)`,
                              }}
                            >
                              {getItemIcon(item.type)}
                            </Box>

                            {/* Item Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: getRarityColor(item.rarity),
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.name}
                                </Typography>
                                {item.quantity > 1 && (
                                  <Chip
                                    size="small"
                                    label={`×${item.quantity}`}
                                    sx={{
                                      height: 18,
                                      fontSize: '0.7rem',
                                      background: theme.palette.secondary.main,
                                      color: 'white',
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  display: 'block',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.description}
                              </Typography>
                            </Box>

                            {/* Item Value */}
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.secondary.main,
                                fontWeight: 600,
                                minWidth: 'fit-content',
                              }}
                            >
                              {item.value} 🪙
                            </Typography>
                          </Box>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Item Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedItem && (
          [
            <MenuItem key="info" disabled>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {selectedItem.name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  {selectedItem.description}
                </Typography>
                {selectedItem.effects && selectedItem.effects.length > 0 && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', mt: 1 }}>
                    Effekte: {selectedItem.effects.map(e => e.type).join(', ')}
                  </Typography>
                )}
              </Box>
            </MenuItem>,
            <Divider key="divider" />,
            selectedItem.usable && (
              <MenuItem key="use" onClick={handleUseItem}>
                <Info sx={{ mr: 1 }} />
                Benutzen
              </MenuItem>
            ),
            <MenuItem key="remove" onClick={handleRemoveItem}>
              <Delete sx={{ mr: 1 }} />
              Entfernen
            </MenuItem>
          ]
        )}
      </Menu>
    </Card>
  )
}

export default InventoryDisplay

// File: src/components/game/StoryProgress.tsx
import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from '@mui/material'
import {
  Timeline,
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useGame } from '../../hooks/useGame'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'
import { scenes } from '../../data/scenes/scenes'

const StoryProgress: React.FC = () => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const { gameState } = useGame()

  // Calculate story progress based on visited scenes
  const visitedScenes = new Set([gameState.currentSceneId]) // In real app, this would be tracked
  const totalScenes = scenes.length
  const progressPercentage = (visitedScenes.size / totalScenes) * 100

  // Get story chapters/milestones
  const getStoryMilestones = () => {
    // In a real app, this would be based on the actual story structure
    return [
      { id: 'start', title: 'Der Beginn', completed: true, current: false },
      { id: 'forest', title: 'Der magische Wald', completed: false, current: true },
      { id: 'castle', title: 'Das Schloss', completed: false, current: false },
      { id: 'dungeon', title: 'Die Verliese', completed: false, current: false },
      { id: 'ending', title: 'Das Finale', completed: false, current: false },
    ]
  }

  const milestones = getStoryMilestones()
  const currentMilestone = milestones.find(m => m.current)
  const completedMilestones = milestones.filter(m => m.completed).length

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card
      elevation={2}
      sx={{
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 246, 240, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.primary.main}20`,
        borderRadius: 2,
        mb: 2,
      }}
    >
      <CardContent sx={{ padding: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              Abenteuer-Fortschritt
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${Math.round(progressPercentage)}%`}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${theme.palette.primary.main}20`,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 4,
                  boxShadow: `0 0 10px ${theme.palette.primary.main}40`,
                },
              }}
            />
          </motion.div>
        </Box>

        {/* Current Chapter */}
        {currentMilestone && (
          <Box
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
              border: `1px solid ${theme.palette.primary.main}30`,
              borderRadius: 1,
              padding: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PlayArrow sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Aktuelles Kapitel
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Cinzel, serif',
                color: theme.palette.primary.main,
                fontWeight: 500,
              }}
            >
              {currentMilestone.title}
            </Typography>
          </Box>
        )}

        {/* Milestones Timeline */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
            Kapitel-Übersicht
          </Typography>
          
          <Box sx={{ position: 'relative' }}>
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 1,
                    position: 'relative',
                  }}
                >
                  {/* Milestone Icon */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: milestone.completed
                        ? theme.palette.success.main
                        : milestone.current
                          ? theme.palette.primary.main
                          : theme.palette.action.disabled,
                      color: 'white',
                      zIndex: 2,
                    }}
                  >
                    {milestone.completed ? (
                      <CheckCircle sx={{ fontSize: 16 }} />
                    ) : milestone.current ? (
                      <PlayArrow sx={{ fontSize: 14 }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: 14 }} />
                    )}
                  </Box>

                  {/* Milestone Title */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: milestone.current ? 600 : 400,
                      color: milestone.completed
                        ? theme.palette.success.main
                        : milestone.current
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      flex: 1,
                    }}
                  >
                    {milestone.title}
                  </Typography>

                  {/* Connection Line */}
                  {index < milestones.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 11.5,
                        top: 32,
                        width: 1,
                        height: 16,
                        background: milestone.completed
                          ? theme.palette.success.main
                          : theme.palette.action.disabled,
                        zIndex: 1,
                      }}
                    />
                  )}
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>

        {/* Game Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 2,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              {completedMilestones}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Kapitel
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
              {formatPlayTime(gameState.totalPlayTime)}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Spielzeit
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
              {visitedScenes.size}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Szenen
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StoryProgress