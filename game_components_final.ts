// File: src/components/game/ChoiceCard.tsx
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  useTheme,
  IconButton,
} from '@mui/material'
import {
  ArrowForward,
  Lock,
  Star,
  Warning,
  Help,
  Favorite,
  FlashOn,
  Shield,
  AttachMoney,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Choice } from '../../types/scene'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'

interface ChoiceCardProps {
  choice: Choice
  onSelect: (choice: Choice) => void
  disabled: boolean
  errorMessage?: string
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ 
  choice, 
  onSelect, 
  disabled, 
  errorMessage 
}) => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const [isHovered, setIsHovered] = useState(false)

  const getMoodColor = () => {
    switch (choice.mood) {
      case 'positive': return theme.palette.success.main
      case 'negative': return theme.palette.error.main
      case 'dangerous': return theme.palette.warning.main
      case 'mysterious': return theme.palette.secondary.main
      default: return theme.palette.primary.main
    }
  }

  const getMoodIcon = () => {
    switch (choice.mood) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      case 'dangerous': return '⚠️'
      case 'mysterious': return '🔮'
      default: return '💭'
    }
  }

  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'stat': return <Star sx={{ fontSize: 14 }} />
      case 'item': return <Shield sx={{ fontSize: 14 }} />
      case 'level': return <FlashOn sx={{ fontSize: 14 }} />
      case 'flag': return <Help sx={{ fontSize: 14 }} />
      default: return <Help sx={{ fontSize: 14 }} />
    }
  }

  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'modify_stat': return <Star />
      case 'add_item': return <Shield />
      case 'set_flag': return <Help />
      case 'add_experience': return <FlashOn />
      default: return <ArrowForward />
    }
  }

  const getEffectDescription = (effect: any) => {
    switch (effect.type) {
      case 'modify_stat':
        const statChange = effect.value > 0 ? `+${effect.value}` : `${effect.value}`
        return `${effect.target}: ${statChange}`
      case 'add_item':
        return `Erhalten: ${effect.description || 'Gegenstand'}`
      case 'add_experience':
        return `+${effect.value} XP`
      case 'set_flag':
        return effect.description || 'Story-Fortschritt'
      default:
        return effect.description || 'Unbekannter Effekt'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        sx={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled
            ? isDarkMode 
              ? 'rgba(60, 60, 60, 0.5)' 
              : 'rgba(240, 240, 240, 0.5)'
            : isDarkMode
              ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 246, 240, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${disabled 
            ? theme.palette.divider 
            : isHovered 
              ? getMoodColor() 
              : `${getMoodColor()}40`}`,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease',
          minHeight: 120,
          '&:hover': {
            boxShadow: disabled 
              ? 'none' 
              : `0 8px 25px ${getMoodColor()}40`,
          },
        }}
        onClick={() => !disabled && onSelect(choice)}
      >
        {/* Mood Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: disabled 
              ? theme.palette.divider 
              : `linear-gradient(90deg, ${getMoodColor()}, ${getMoodColor()}80, ${getMoodColor()})`,
            animation: !disabled && isHovered ? 'shimmer 1.5s infinite' : 'none',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200px 0' },
              '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
            },
          }}
        />

        {/* Lock Indicator for Disabled Choices */}
        {disabled && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              background: theme.palette.error.main,
              color: 'white',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock sx={{ fontSize: 16 }} />
          </Box>
        )}

        {/* Mood Icon */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontSize: '1.5rem',
            opacity: 0.8,
          }}
        >
          {getMoodIcon()}
        </Box>

        <CardContent sx={{ padding: 3, paddingTop: 5 }}>
          {/* Choice Text */}
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              fontFamily: 'Roboto Slab, serif',
              fontWeight: 500,
              color: disabled ? theme.palette.text.disabled : theme.palette.text.primary,
              lineHeight: 1.3,
              mb: 2,
            }}
          >
            {choice.text}
          </Typography>

          {/* Choice Description */}
          {choice.description && (
            <Typography
              variant="body2"
              sx={{
                color: disabled ? theme.palette.text.disabled : theme.palette.text.secondary,
                fontStyle: 'italic',
                mb: 2,
                lineHeight: 1.5,
              }}
            >
              {choice.description}
            </Typography>
          )}

          {/* Requirements */}
          {choice.requirements.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Voraussetzungen:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {choice.requirements.map((req, index) => (
                  <Tooltip key={index} title={req.errorMessage}>
                    <Chip
                      size="small"
                      icon={getRequirementIcon(req.type)}
                      label={`${req.key} ${req.operator} ${req.value}`}
                      sx={{
                        background: disabled 
                          ? theme.palette.error.main + '20'
                          : theme.palette.success.main + '20',
                        color: disabled 
                          ? theme.palette.error.main
                          : theme.palette.success.main,
                        border: `1px solid ${disabled 
                          ? theme.palette.error.main + '40'
                          : theme.palette.success.main + '40'}`,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          )}

          {/* Effects Preview */}
          {choice.effects.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Auswirkungen:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {choice.effects.slice(0, 3).map((effect, index) => (
                  <Tooltip key={index} title={getEffectDescription(effect)}>
                    <Chip
                      size="small"
                      icon={getEffectIcon(effect.type)}
                      label={getEffectDescription(effect)}
                      sx={{
                        background: getMoodColor() + '20',
                        color: getMoodColor(),
                        border: `1px solid ${getMoodColor()}40`,
                        fontSize: '0.7rem',
                        maxWidth: 200,
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      }}
                    />
                  </Tooltip>
                ))}
                {choice.effects.length > 3 && (
                  <Chip
                    size="small"
                    label={`+${choice.effects.length - 3} weitere`}
                    sx={{
                      background: theme.palette.info.main + '20',
                      color: theme.palette.info.main,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Error Message */}
          {disabled && errorMessage && (
            <Box
              sx={{
                background: theme.palette.error.main + '10',
                border: `1px solid ${theme.palette.error.main}40`,
                borderRadius: 1,
                padding: 1,
                mt: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Warning sx={{ fontSize: 14 }} />
                {errorMessage}
              </Typography>
            </Box>
          )}

          {/* Action Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mt: 2,
              pt: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: disabled ? theme.palette.text.disabled : getMoodColor(),
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {disabled ? 'Nicht verfügbar' : 'Auswählen'}
              <motion.div
                animate={{ x: !disabled && isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowForward sx={{ fontSize: 18 }} />
              </motion.div>
            </Box>
          </Box>
        </CardContent>

        {/* Probability Indicator */}
        {choice.probability < 100 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: theme.palette.warning.main,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            {choice.probability}% Chance
          </Box>
        )}

        {/* Hover Glow Effect */}
        {!disabled && isHovered && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at center, ${getMoodColor()}10 0%, transparent 70%)`,
              pointerEvents: 'none',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.5 },
                '50%': { opacity: 0.8 },
              },
            }}
          />
        )}
      </Card>
    </motion.div>
  )
}

export default ChoiceCard

// File: src/components/game/PlayerStats.tsx
import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  Divider,
} from '@mui/material'
import {
  Favorite,
  Star,
  FlashOn,
  Psychology,
  Visibility,
  EmojiEvents,
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useGameStats } from '../../hooks/useGameStats'
import { useGame } from '../../hooks/useGame'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'

const PlayerStats: React.FC = () => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const { gameState } = useGame()
  const { 
    stats, 
    healthPercentage, 
    manaPercentage, 
    isLowHealth, 
    isLowMana,
    canLevelUp,
    experienceToNextLevel,
    experiencePercentage,
    powerLevel
  } = useGameStats()

  const getStatColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100
    if (percentage >= 75) return theme.palette.success.main
    if (percentage >= 50) return theme.palette.warning.main
    if (percentage >= 25) return theme.palette.error.main
    return theme.palette.error.dark
  }

  const StatBar: React.FC<{
    label: string
    value: number
    maxValue: number
    icon: React.ReactNode
    color?: string
    isLow?: boolean
  }> = ({ label, value, maxValue, icon, color, isLow }) => {
    const percentage = (value / maxValue) * 100
    const barColor = color || getStatColor(value, maxValue)

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <motion.div
              animate={{
                scale: isLow ? [1, 1.2, 1] : 1,
                color: isLow ? [barColor, '#ff0000', barColor] : barColor,
              }}
              transition={{
                duration: isLow ? 1 : 0,
                repeat: isLow ? Infinity : 0,
              }}
            >
              {icon}
            </motion.div>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: barColor }}>
            {value}/{maxValue}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: `${barColor}20`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: barColor,
              borderRadius: 4,
            },
          }}
        />
      </Box>
    )
  }

  const StatValue: React.FC<{
    label: string
    value: number
    icon: React.ReactNode
    color?: string
  }> = ({ label, value, icon, color = theme.palette.primary.main }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color }}>
        {value}
      </Typography>
    </Box>
  )

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
      }}
    >
      <CardContent sx={{ padding: 3 }}>
        {/* Player Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            {gameState.playerName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              {gameState.playerName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                size="small"
                label={`Level ${stats.level}`}
                sx={{
                  background: canLevelUp 
                    ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.warning.main})`
                    : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  fontWeight: 600,
                  animation: canLevelUp ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                  },
                }}
              />
              <Chip
                size="small"
                label={`Power: ${powerLevel}`}
                sx={{
                  background: theme.palette.info.main,
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Primary Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
            Lebenswerte
          </Typography>
          
          <StatBar
            label="Gesundheit"
            value={stats.health}
            maxValue={stats.maxHealth}
            icon={<Favorite sx={{ fontSize: 18 }} />}
            color={getStatColor(stats.health, stats.maxHealth)}
            isLow={isLowHealth}
          />
          
          <StatBar
            label="Mana"
            value={stats.mana}
            maxValue={stats.maxMana}
            icon={<Star sx={{ fontSize: 18 }} />}
            color={theme.palette.info.main}
            isLow={isLowMana}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Experience */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Erfahrung
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
              {canLevelUp ? 'Level Up verfügbar!' : `${experienceToNextLevel} XP bis Level ${stats.level + 1}`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={experiencePercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: `${theme.palette.secondary.main}20`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.secondary.main,
                borderRadius: 3,
                animation: canLevelUp ? 'glow 2s infinite' : 'none',
                '@keyframes glow': {
                  '0%, 100%': { boxShadow: `0 0 5px ${theme.palette.secondary.main}` },
                  '50%': { boxShadow: `0 0 20px ${theme.palette.secondary.main}` },
                },
              },
            }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Secondary Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
            Attribute
          </Typography>
          
          <StatValue
            label="Stärke"
            value={stats.strength}
            icon={<FlashOn sx={{ fontSize: 18 }} />}
            color={theme.palette.error.main}
          />
          
          <StatValue
            label="Intelligenz"
            value={stats.intelligence}
            icon={<Psychology sx={{ fontSize: 18 }} />}
            color={theme.palette.info.main}
          />
          
          <StatValue
            label="Weisheit"
            value={stats.wisdom}
            icon={<Visibility sx={{ fontSize: 18 }} />}
            color={theme.palette.success.main}
          />
          
          <StatValue
            label="Charisma"
            value={stats.charisma}
            icon={<EmojiEvents sx={{ fontSize: 18 }} />}
            color={theme.palette.warning.main}
          />
          
          <StatValue
            label="Glück"
            value={stats.luck}
            icon={<Star sx={{ fontSize: 18 }} />}
            color={theme.palette.secondary.main}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Gold */}
        <Box
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.secondary.main}20, ${theme.palette.warning.main}20)`,
            border: `1px solid ${theme.palette.secondary.main}40`,
            borderRadius: 2,
            padding: 2,
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <AttachMoney sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
              {stats.gold.toLocaleString()}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Gold
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PlayerStats