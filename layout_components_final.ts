// File: src/components/layout/StatusBar.tsx
import React from 'react'
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Favorite,
  Star,
  AttachMoney,
  Close,
  Wifi,
  WifiOff,
  CloudDone,
  CloudOff,
  Timer,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useGame } from '../../hooks/useGame'
import { useGameStats } from '../../hooks/useGameStats'
import { useOffline } from '../../hooks/useOffline'
import { useTheme } from '../../hooks/useTheme'

interface StatusBarProps {
  onClose: () => void
}

const StatusBar: React.FC<StatusBarProps> = ({ onClose }) => {
  const theme = useMuiTheme()
  const { isDarkMode } = useTheme()
  const { gameState } = useGame()
  const { stats, healthPercentage, manaPercentage, isLowHealth, isLowMana } = useGameStats()
  const { isOnline, lastOnlineTime } = useOffline()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getHealthColor = () => {
    if (healthPercentage > 60) return theme.palette.success.main
    if (healthPercentage > 30) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getManaColor = () => {
    if (manaPercentage > 60) return theme.palette.info.main
    if (manaPercentage > 30) return theme.palette.warning.main
    return theme.palette.error.main
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 240, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: `2px solid ${theme.palette.primary.main}40`,
          borderRadius: 0,
          padding: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1200,
            margin: '0 auto',
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* Player Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {gameState.playerName}
              </Typography>
              <Chip
                size="small"
                label={`Lvl ${stats.level}`}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </Box>

          {/* Health Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <Tooltip title={`Gesundheit: ${stats.health}/${stats.maxHealth}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <motion.div
                  animate={{
                    scale: isLowHealth ? [1, 1.2, 1] : 1,
                    color: isLowHealth ? [getHealthColor(), '#ff0000', getHealthColor()] : getHealthColor(),
                  }}
                  transition={{
                    duration: isLowHealth ? 1 : 0,
                    repeat: isLowHealth ? Infinity : 0,
                  }}
                >
                  <Favorite sx={{ fontSize: 16, color: getHealthColor() }} />
                </motion.div>
                <Box sx={{ width: { xs: 60, sm: 80 } }}>
                  <LinearProgress
                    variant="determinate"
                    value={healthPercentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${getHealthColor()}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getHealthColor(),
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
                {!isMobile && (
                  <Typography variant="caption" sx={{ minWidth: 40, fontSize: '0.7rem' }}>
                    {stats.health}/{stats.maxHealth}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          </Box>

          {/* Mana Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <Tooltip title={`Mana: ${stats.mana}/${stats.maxMana}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <motion.div
                  animate={{
                    scale: isLowMana ? [1, 1.2, 1] : 1,
                    color: isLowMana ? [getManaColor(), '#0066ff', getManaColor()] : getManaColor(),
                  }}
                  transition={{
                    duration: isLowMana ? 1 : 0,
                    repeat: isLowMana ? Infinity : 0,
                  }}
                >
                  <Star sx={{ fontSize: 16, color: getManaColor() }} />
                </motion.div>
                <Box sx={{ width: { xs: 60, sm: 80 } }}>
                  <LinearProgress
                    variant="determinate"
                    value={manaPercentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${getManaColor()}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getManaColor(),
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
                {!isMobile && (
                  <Typography variant="caption" sx={{ minWidth: 40, fontSize: '0.7rem' }}>
                    {stats.mana}/{stats.maxMana}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          </Box>

          {/* Gold */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              {stats.gold.toLocaleString()}
            </Typography>
          </Box>

          {/* Experience */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                XP
              </Typography>
              <Box sx={{ width: 60 }}>
                <LinearProgress
                  variant="determinate"
                  value={(stats.experience % (100 * stats.level)) / (100 * stats.level) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: `${theme.palette.secondary.main}20`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.secondary.main,
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Play Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer sx={{ fontSize: 14, opacity: 0.7 }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
              {formatPlayTime(gameState.totalPlayTime)}
            </Typography>
          </Box>

          {/* Connection Status */}
          <Tooltip title={isOnline ? 'Online' : `Offline seit ${lastOnlineTime?.toLocaleTimeString()}`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isOnline ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wifi sx={{ fontSize: 16, color: theme.palette.success.main }} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <WifiOff sx={{ fontSize: 16, color: theme.palette.error.main }} />
                </motion.div>
              )}
            </Box>
          </Tooltip>

          {/* Close Button */}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              opacity: 0.7,
              '&:hover': { opacity: 1 },
            }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Magic Glow Effect */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
            animation: 'shimmer 3s infinite',
            '@keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />
      </Paper>
    </motion.div>
  )
}

export default StatusBar

// File: src/components/layout/BackgroundAnimation.tsx
import React, { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  life: number
  maxLife: number
}

const BackgroundAnimation: React.FC = () => {
  const { isDarkMode } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })

  const colors = isDarkMode
    ? ['#4A9B3E', '#6BB85F', '#D4AF37', '#FFD700', '#2D5A27']
    : ['#2D5A27', '#4A9B3E', '#D4AF37', '#E6C757', '#1A3318']

  const createParticle = (canvas: HTMLCanvasElement): Particle => {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 100,
    }
  }

  const updateParticle = (particle: Particle, canvas: HTMLCanvasElement) => {
    particle.x += particle.vx
    particle.y += particle.vy
    particle.life++

    // Bounce off edges
    if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1
    if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1

    // Mouse interaction
    const dx = mouseRef.current.x - particle.x
    const dy = mouseRef.current.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 100) {
      const force = (100 - distance) / 100
      particle.vx += (dx / distance) * force * 0.01
      particle.vy += (dy / distance) * force * 0.01
    }

    // Lifecycle
    const ageRatio = particle.life / particle.maxLife
    particle.opacity = 0.5 * (1 - ageRatio) + 0.1

    return particle.life < particle.maxLife
  }

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.fillStyle = particle.color
    ctx.shadowBlur = 10
    ctx.shadowColor = particle.color
    
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    
    // Add sparkle effect
    if (Math.random() < 0.1) {
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 0.5
      ctx.globalAlpha = particle.opacity * 0.5
      ctx.beginPath()
      ctx.moveTo(particle.x - particle.size * 2, particle.y)
      ctx.lineTo(particle.x + particle.size * 2, particle.y)
      ctx.moveTo(particle.x, particle.y - particle.size * 2)
      ctx.lineTo(particle.x, particle.y + particle.size * 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }

  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    if (isDarkMode) {
      gradient.addColorStop(0, 'rgba(15, 15, 15, 0.1)')
      gradient.addColorStop(0.5, 'rgba(26, 26, 26, 0.05)')
      gradient.addColorStop(1, 'rgba(15, 15, 15, 0.1)')
    } else {
      gradient.addColorStop(0, 'rgba(248, 246, 240, 0.1)')
      gradient.addColorStop(0.5, 'rgba(232, 230, 227, 0.05)')
      gradient.addColorStop(1, 'rgba(248, 246, 240, 0.1)')
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      const alive = updateParticle(particle, canvas)
      if (alive) {
        drawParticle(ctx, particle)
      }
      return alive
    })

    // Add new particles
    while (particlesRef.current.length < 50) {
      particlesRef.current.push(createParticle(canvas))
    }

    // Draw connections between nearby particles
    ctx.strokeStyle = isDarkMode ? 'rgba(74, 155, 62, 0.1)' : 'rgba(45, 90, 39, 0.1)'
    ctx.lineWidth = 0.5
    
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p1 = particlesRef.current[i]
        const p2 = particlesRef.current[j]
        const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
        
        if (distance < 80) {
          ctx.globalAlpha = (80 - distance) / 80 * 0.3
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const handleMouseMove = (event: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    // Initialize particles
    particlesRef.current = []
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push(createParticle(canvas))
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDarkMode])

  return (
    <>
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -2,
          pointerEvents: 'none',
        }}
      />

      {/* CSS-based Background Elements */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Floating Orbs */}
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: isDarkMode
                ? 'radial-gradient(circle, rgba(74, 155, 62, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(45, 90, 39, 0.1) 0%, transparent 70%)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.3, 0.6, 0.3, 0.3],
            }}
            transition={{
              duration: 20 + index * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Magical Wisps */}
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={`wisp-${index}`}
            style={{
              position: 'absolute',
              width: '200px',
              height: '2px',
              background: isDarkMode
                ? 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)',
              left: `-200px`,
              top: `${20 + index * 20}%`,
            }}
            animate={{
              x: ['-200px', `${window.innerWidth + 200}px`],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 15 + index * 3,
              repeat: Infinity,
              ease: "linear",
              delay: index * 2,
            }}
          />
        ))}

        {/* Pulsing Magic Circles */}
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={`circle-${index}`}
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              border: isDarkMode
                ? '1px solid rgba(74, 155, 62, 0.1)'
                : '1px solid rgba(45, 90, 39, 0.1)',
              left: `${10 + index * 30}%`,
              top: `${10 + index * 25}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 25 + index * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </Box>
    </>
  )
}

export default BackgroundAnimation