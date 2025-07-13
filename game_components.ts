// File: src/components/game/GameInterface.tsx
import React, { useState, useEffect } from 'react'
import { Box, Fade, useTheme, useMediaQuery } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import SceneDisplay from './SceneDisplay'
import ChoiceCard from './ChoiceCard'
import PlayerStats from './PlayerStats'
import InventoryDisplay from './InventoryDisplay'
import StoryProgress from './StoryProgress'
import { useGame } from '../../hooks/useGame'
import { useNotification } from '../../hooks/useNotification'
import { Scene, Choice } from '../../types/scene'
import { scenes } from '../../data/scenes/scenes'

const GameInterface: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { gameState, makeChoice, isLoading, error } = useGame()
  const { showError, showSuccess } = useNotification()
  
  const [currentScene, setCurrentScene] = useState<Scene | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showStats, setShowStats] = useState(!isMobile)
  const [showInventory, setShowInventory] = useState(false)

  // Load current scene
  useEffect(() => {
    const scene = scenes.find(s => s.id === gameState.currentSceneId)
    if (scene) {
      setCurrentScene(scene)
    } else {
      showError('Szene nicht gefunden', `Szene "${gameState.currentSceneId}" konnte nicht geladen werden.`)
    }
  }, [gameState.currentSceneId, showError])

  // Handle choice selection
  const handleChoiceSelect = async (choice: Choice) => {
    if (isLoading || isTransitioning) return

    try {
      setIsTransitioning(true)
      
      // Validate choice requirements
      const canSelectChoice = validateChoiceRequirements(choice)
      if (!canSelectChoice.valid) {
        showError('Auswahl nicht möglich', canSelectChoice.reason || 'Diese Auswahl ist momentan nicht verfügbar.')
        setIsTransitioning(false)
        return
      }

      // Show success feedback
      showSuccess('Auswahl getroffen', `"${choice.text}" wurde ausgewählt.`)

      // Execute choice
      await makeChoice(choice.id)
      
      // Small delay for transition effect
      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)

    } catch (err) {
      console.error('Error making choice:', err)
      showError('Fehler', 'Die Auswahl konnte nicht verarbeitet werden.')
      setIsTransitioning(false)
    }
  }

  // Validate if choice can be selected
  const validateChoiceRequirements = (choice: Choice) => {
    for (const requirement of choice.requirements) {
      switch (requirement.type) {
        case 'stat':
          const statValue = gameState.stats[requirement.key as keyof typeof gameState.stats] as number
          if (!evaluateCondition(statValue, requirement.operator, requirement.value)) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break
        case 'flag':
          const flagValue = gameState.flags[requirement.key]
          if (!evaluateCondition(flagValue, requirement.operator, requirement.value)) {
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
          if (!evaluateCondition(gameState.stats.level, requirement.operator, requirement.value)) {
            return { valid: false, reason: requirement.errorMessage }
          }
          break
      }
    }
    return { valid: true }
  }

  // Helper function to evaluate conditions
  const evaluateCondition = (value: any, operator: string, targetValue: any): boolean => {
    switch (operator) {
      case '==': return value === targetValue
      case '!=': return value !== targetValue
      case '>': return value > targetValue
      case '<': return value < targetValue
      case '>=': return value >= targetValue
      case '<=': return value <= targetValue
      case 'contains': return String(value).includes(String(targetValue))
      case 'not_contains': return !String(value).includes(String(targetValue))
      default: return false
    }
  }

  if (!gameState.isGameActive) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ fontSize: '4rem', mb: 2 }}>🎮</Box>
          <Box
            component="h2"
            sx={{
              fontFamily: 'Cinzel, serif',
              fontSize: '2rem',
              color: theme.palette.primary.main,
              mb: 2,
            }}
          >
            Kein aktives Spiel
          </Box>
          <Box sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Starten Sie ein neues Abenteuer oder laden Sie einen gespeicherten Spielstand.
          </Box>
        </motion.div>
      </Box>
    )
  }

  if (!currentScene) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              border: `4px solid ${theme.palette.primary.main}`,
              borderTop: `4px solid transparent`,
              borderRadius: '50%',
            }}
          />
        </motion.div>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Main Game Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          minHeight: 0, // Important for flex scrolling
        }}
      >
        {/* Story Progress */}
        <StoryProgress />

        {/* Scene Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 1 }}
          >
            <SceneDisplay 
              scene={currentScene}
              isTransitioning={isTransitioning}
            />
          </motion.div>
        </AnimatePresence>

        {/* Choices */}
        <Box sx={{ minHeight: 200 }}>
          <AnimatePresence>
            {currentScene.choices.length > 0 && !isTransitioning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(auto-fit, minmax(300px, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {currentScene.choices.map((choice, index) => {
                    const validation = validateChoiceRequirements(choice)
                    return (
                      <motion.div
                        key={choice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ChoiceCard
                          choice={choice}
                          onSelect={handleChoiceSelect}
                          disabled={!validation.valid || isLoading}
                          errorMessage={validation.reason}
                        />
                      </motion.div>
                    )
                  })}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Sidebar with Stats and Inventory */}
      <AnimatePresence>
        {(showStats || showInventory) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                width: { xs: '100%', lg: 350 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: { lg: '100vh' },
                overflow: 'hidden',
              }}
            >
              {/* Toggle Buttons for Mobile */}
              {isMobile && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Box
                    component="button"
                    onClick={() => setShowStats(!showStats)}
                    sx={{
                      flex: 1,
                      padding: '8px 16px',
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderRadius: '8px',
                      background: showStats ? theme.palette.primary.main : 'transparent',
                      color: showStats ? 'white' : theme.palette.primary.main,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Spielerstatus
                  </Box>
                  <Box
                    component="button"
                    onClick={() => setShowInventory(!showInventory)}
                    sx={{
                      flex: 1,
                      padding: '8px 16px',
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderRadius: '8px',
                      background: showInventory ? theme.palette.primary.main : 'transparent',
                      color: showInventory ? 'white' : theme.palette.primary.main,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Inventar
                  </Box>
                </Box>
              )}

              {/* Player Stats */}
              <Fade in={showStats}>
                <Box>
                  <PlayerStats />
                </Box>
              </Fade>

              {/* Inventory */}
              <Fade in={showInventory}>
                <Box>
                  <InventoryDisplay />
                </Box>
              </Fade>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              borderRadius: '16px',
            }}
          >
            <Box
              sx={{
                background: theme.palette.background.paper,
                padding: 4,
                borderRadius: 2,
                textAlign: 'center',
                border: `1px solid ${theme.palette.primary.main}40`,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ marginBottom: 16 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    border: `4px solid ${theme.palette.primary.main}`,
                    borderTop: `4px solid transparent`,
                    borderRadius: '50%',
                    margin: '0 auto',
                  }}
                />
              </motion.div>
              <Box sx={{ color: theme.palette.text.primary }}>
                Die Geschichte entwickelt sich...
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: theme.palette.error.main,
            color: 'white',
            padding: 2,
            borderRadius: 2,
            zIndex: 1001,
          }}
        >
          {error}
        </Box>
      )}
    </Box>
  )
}

export default GameInterface

// File: src/components/game/SceneDisplay.tsx
import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { Scene } from '../../types/scene'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'

interface SceneDisplayProps {
  scene: Scene
  isTransitioning: boolean
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({ scene, isTransitioning }) => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [scene.id])

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  const getSceneTypeIcon = () => {
    switch (scene.type) {
      case 'story': return '📖'
      case 'choice': return '🤔'
      case 'battle': return '⚔️'
      case 'puzzle': return '🧩'
      case 'ending': return '🏁'
      default: return '✨'
    }
  }

  const getSceneTypeColor = () => {
    switch (scene.type) {
      case 'story': return theme.palette.info.main
      case 'choice': return theme.palette.warning.main
      case 'battle': return theme.palette.error.main
      case 'puzzle': return theme.palette.secondary.main
      case 'ending': return theme.palette.success.main
      default: return theme.palette.primary.main
    }
  }

  return (
    <motion.div
      animate={{
        opacity: isTransitioning ? 0.6 : 1,
        scale: isTransitioning ? 0.98 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      <Card
        elevation={3}
        sx={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 246, 240, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${getSceneTypeColor()}40`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Scene Type Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
            background: getSceneTypeColor(),
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {getSceneTypeIcon()}
        </Box>

        {/* Magic Border Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${getSceneTypeColor()}, transparent)`,
            animation: 'shimmer 3s infinite',
            '@keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />

        {/* Scene Image */}
        {scene.imageUrl && (
          <Box sx={{ position: 'relative', height: 250, overflow: 'hidden' }}>
            {!imageLoaded && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={250}
                animation="wave"
              />
            )}
            {!imageError && (
              <CardMedia
                component="img"
                height="250"
                image={scene.imageUrl}
                alt={scene.title}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sx={{
                  objectFit: 'cover',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  filter: isDarkMode ? 'brightness(0.8)' : 'brightness(1)',
                }}
              />
            )}
            {imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: isDarkMode
                    ? 'linear-gradient(transparent, rgba(26, 26, 26, 0.8))'
                    : 'linear-gradient(transparent, rgba(255, 255, 255, 0.8))',
                }}
              />
            )}
          </Box>
        )}

        {/* Scene Content */}
        <CardContent sx={{ padding: 4 }}>
          {/* Scene Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
                textAlign: 'center',
                mb: 3,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 2,
                  background: getSceneTypeColor(),
                  borderRadius: 1,
                }
              }}
            >
              {scene.title}
            </Typography>
          </motion.div>

          {/* Scene Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: theme.palette.text.primary,
                textAlign: 'justify',
                '& p': {
                  marginBottom: 2,
                },
                '& em': {
                  fontStyle: 'italic',
                  color: theme.palette.primary.main,
                },
                '& strong': {
                  fontWeight: 600,
                  color: getSceneTypeColor(),
                },
              }}
              dangerouslySetInnerHTML={{
                __html: scene.content.replace(/\n/g, '<br />'),
              }}
            />
          </motion.div>

          {/* Scene Metadata */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 4,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                fontSize: '0.85rem',
                color: theme.palette.text.secondary,
              }}
            >
              <Box>
                Lesezeit: ~{scene.metadata.estimatedReadTime} Min
              </Box>
              <Box>
                Schwierigkeit: {scene.metadata.difficulty}/5
              </Box>
              <Box>
                {scene.isGenerated && (
                  <Box
                    component="span"
                    sx={{
                      background: theme.palette.secondary.main,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    KI-generiert
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
        </CardContent>

        {/* Animated Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            background: `radial-gradient(circle at 20% 50%, ${getSceneTypeColor()} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main} 0%, transparent 50%), radial-gradient(circle at 40% 80%, ${theme.palette.primary.main} 0%, transparent 50%)`,
            pointerEvents: 'none',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-10px) rotate(2deg)' },
            },
          }}
        />
      </Card>
    </motion.div>
  )
}

export default SceneDisplay