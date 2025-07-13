// File: src/components/ui/LoadingSpinner.tsx
import React from 'react'
import { Box, CircularProgress, Typography, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
  color?: 'primary' | 'secondary' | 'inherit'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  overlay = false,
  color = 'primary'
}) => {
  const theme = useTheme()

  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  }

  const spinnerSize = sizeMap[size]

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: overlay ? 4 : 2,
        }}
      >
        {/* Magical Loading Animation */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Main Spinner */}
          <CircularProgress
            size={spinnerSize}
            thickness={4}
            color={color}
            sx={{
              animationDuration: '1.4s',
              filter: `drop-shadow(0 0 8px ${theme.palette[color].main}40)`,
            }}
          />
          
          {/* Outer Glow Ring */}
          <CircularProgress
            size={spinnerSize + 16}
            thickness={1}
            variant="indeterminate"
            color={color}
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              animationDuration: '2s',
              opacity: 0.3,
              animationDirection: 'reverse',
            }}
          />

          {/* Inner Pulsing Dot */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: theme.palette[color].main,
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                '50%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0.5 },
              },
            }}
          />

          {/* Magical Sparkles */}
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: theme.palette.secondary.main,
                top: '50%',
                left: '50%',
                transformOrigin: `${spinnerSize / 2}px 0`,
                transform: `rotate(${i * 60}deg) translateY(-${spinnerSize / 2 + 20}px)`,
                animation: `sparkle-${i} 2s infinite`,
                '@keyframes sparkle-0': {
                  '0%, 100%': { opacity: 0, transform: `rotate(0deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '16%': { opacity: 1, transform: `rotate(60deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
                '@keyframes sparkle-1': {
                  '0%, 100%': { opacity: 0, transform: `rotate(60deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '33%': { opacity: 1, transform: `rotate(120deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
                '@keyframes sparkle-2': {
                  '0%, 100%': { opacity: 0, transform: `rotate(120deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '50%': { opacity: 1, transform: `rotate(180deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
                '@keyframes sparkle-3': {
                  '0%, 100%': { opacity: 0, transform: `rotate(180deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '66%': { opacity: 1, transform: `rotate(240deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
                '@keyframes sparkle-4': {
                  '0%, 100%': { opacity: 0, transform: `rotate(240deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '83%': { opacity: 1, transform: `rotate(300deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
                '@keyframes sparkle-5': {
                  '0%, 100%': { opacity: 0, transform: `rotate(300deg) translateY(-${spinnerSize / 2 + 20}px) scale(0)` },
                  '100%': { opacity: 1, transform: `rotate(360deg) translateY(-${spinnerSize / 2 + 20}px) scale(1)` },
                },
              }}
            />
          ))}
        </Box>

        {text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Typography
              variant={size === 'large' ? 'h6' : size === 'medium' ? 'body1' : 'body2'}
              color="text.primary"
              sx={{
                textAlign: 'center',
                fontWeight: 500,
                fontFamily: size === 'large' ? 'Cinzel, serif' : 'inherit',
              }}
            >
              {text}
            </Typography>
          </motion.div>
        )}
      </Box>
    </motion.div>
  )

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <Box
          sx={{
            background: theme.palette.background.paper,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
          }}
        >
          {content}
        </Box>
      </Box>
    )
  }

  return content
}

export default LoadingSpinner

// File: src/components/ui/Toast.tsx
import React, { useEffect, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Snackbar,
  useTheme,
} from '@mui/material'
import {
  Close,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { Notification } from '../../contexts/NotificationContext'

interface ToastProps {
  notification: Notification
  onClose: () => void
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const Toast: React.FC<ToastProps> = ({ 
  notification, 
  onClose, 
  position = 'top-right' 
}) => {
  const theme = useTheme()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Animation duration
      }, notification.duration)

      return () => clearTimeout(timer)
    }
  }, [notification.duration, onClose])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle />
      case 'error':
        return <Error />
      case 'warning':
        return <Warning />
      case 'info':
        return <Info />
      default:
        return <Info />
    }
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 10000,
    }

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 24, left: 24 }
      case 'top-right':
        return { ...baseStyles, top: 24, right: 24 }
      case 'bottom-left':
        return { ...baseStyles, bottom: 24, left: 24 }
      case 'bottom-right':
        return { ...baseStyles, bottom: 24, right: 24 }
      default:
        return { ...baseStyles, top: 24, right: 24 }
    }
  }

  const getAnimationDirection = () => {
    if (position.includes('left')) {
      return { x: -300 }
    }
    if (position.includes('right')) {
      return { x: 300 }
    }
    return { y: position.includes('top') ? -100 : 100 }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={getAnimationDirection()}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={getAnimationDirection()}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={getPositionStyles()}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            icon={getIcon()}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(onClose, 300)
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 300,
              maxWidth: 500,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette[notification.type].main}40`,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
              '& .MuiAlert-message': {
                padding: '4px 0',
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {notification.title}
            </AlertTitle>
            {notification.message}
            
            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {notification.actions.map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.action}
                    style={{
                      background: 'transparent',
                      border: `1px solid currentColor`,
                      borderRadius: 4,
                      padding: '4px 12px',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </Box>
            )}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast

// File: src/components/ui/Modal.tsx
import React, { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  Slide,
  Fade,
  Zoom,
  Grow,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'
import { motion } from 'framer-motion'

type AnimationType = 'slide' | 'fade' | 'zoom' | 'grow' | 'scale'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  fullScreen?: boolean
  disableBackdropClick?: boolean
  disableEscapeKeyDown?: boolean
  animation?: AnimationType
  showCloseButton?: boolean
}

const getTransitionComponent = (animation: AnimationType) => {
  const SlideTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
    (props, ref) => <Slide direction="up" ref={ref} {...props} />
  )
  
  const FadeTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
    (props, ref) => <Fade ref={ref} {...props} />
  )
  
  const ZoomTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
    (props, ref) => <Zoom ref={ref} {...props} />
  )
  
  const GrowTransition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
    (props, ref) => <Grow ref={ref} {...props} />
  )

  switch (animation) {
    case 'slide':
      return SlideTransition
    case 'fade':
      return FadeTransition
    case 'zoom':
      return ZoomTransition
    case 'grow':
      return GrowTransition
    default:
      return SlideTransition
  }
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  animation = 'slide',
  showCloseButton = true,
}) => {
  const theme = useTheme()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disableEscapeKeyDown && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose, disableEscapeKeyDown])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (!disableBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  const TransitionComponent = getTransitionComponent(animation)

  return (
    <Dialog
      open={open}
      onClose={disableBackdropClick ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      TransitionComponent={TransitionComponent}
      transitionDuration={300}
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: fullScreen ? 0 : 3,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.3)`,
          overflow: 'hidden',
        },
      }}
      BackdropProps={{
        sx: {
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
        onClick: handleBackdropClick,
      }}
    >
      {/* Magic Border Effect */}
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

      {/* Header */}
      {(title || showCloseButton) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}05)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {title && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                {title}
              </Typography>
            </motion.div>
          )}
          
          {showCloseButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <IconButton
                onClick={onClose}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    background: theme.palette.action.hover,
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <Close />
              </IconButton>
            </motion.div>
          )}
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent
        sx={{
          p: 3,
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </DialogContent>

      {/* Actions */}
      {actions && (
        <DialogActions
          sx={{
            p: 3,
            pt: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 8 }}
          >
            {actions}
          </motion.div>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default Modal

// File: src/components/ui/AnimatedButton.tsx
import React, { useState } from 'react'
import { Button, ButtonProps, useTheme, Box } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedButtonProps extends Omit<ButtonProps, 'component'> {
  animation?: 'bounce' | 'pulse' | 'glow' | 'shake' | 'float'
  glowColor?: string
  icon?: React.ReactNode
  magicalEffect?: boolean
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  animation = 'bounce',
  glowColor,
  icon,
  magicalEffect = false,
  ...buttonProps
}) => {
  const theme = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const getAnimationVariants = () => {
    switch (animation) {
      case 'bounce':
        return {
          hover: { scale: 1.05, y: -2 },
          tap: { scale: 0.95, y: 0 },
        }
      case 'pulse':
        return {
          hover: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } },
          tap: { scale: 0.95 },
        }
      case 'glow':
        return {
          hover: { 
            scale: 1.02,
            boxShadow: `0 0 20px ${glowColor || theme.palette.primary.main}80`,
          },
          tap: { scale: 0.98 },
        }
      case 'shake':
        return {
          hover: { x: [0, -2, 2, -2, 2, 0], transition: { duration: 0.5 } },
          tap: { scale: 0.95 },
        }
      case 'float':
        return {
          hover: { y: [-2, -4, -2], transition: { repeat: Infinity, duration: 2 } },
          tap: { scale: 0.95 },
        }
      default:
        return {
          hover: { scale: 1.05 },
          tap: { scale: 0.95 },
        }
    }
  }

  const variants = getAnimationVariants()

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Magical Background Effect */}
      {magicalEffect && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '120%',
                background: `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
                borderRadius: '50%',
                zIndex: -1,
              }}
            />
          )}
        </AnimatePresence>
      )}

      {/* Sparkle Effects */}
      {magicalEffect && isHovered && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.cos((i * 60) * Math.PI / 180) * 30,
                y: Math.sin((i * 60) * Math.PI / 180) * 30,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 4,
                height: 4,
                background: theme.palette.secondary.main,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          ))}
        </>
      )}

      {/* Main Button */}
      <motion.div
        variants={variants}
        whileHover="hover"
        whileTap="tap"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
      >
        <Button
          {...buttonProps}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            background: buttonProps.variant === 'contained' 
              ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
              : undefined,
            '&:hover': {
              background: buttonProps.variant === 'contained'
                ? `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                : undefined,
            },
            '&::before': magicalEffect ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${theme.palette.common.white}20, transparent)`,
              transition: 'left 0.5s',
            } : undefined,
            '&:hover::before': magicalEffect ? {
              left: '100%',
            } : undefined,
            ...buttonProps.sx,
          }}
        >
          {/* Icon with Animation */}
          {icon && (
            <motion.div
              animate={isPressed ? { rotate: 360 } : {}}
              transition={{ duration: 0.3 }}
              style={{ marginRight: children ? 8 : 0, display: 'flex', alignItems: 'center' }}
            >
              {icon}
            </motion.div>
          )}
          
          {/* Button Text */}
          <motion.span
            animate={isHovered ? { y: [0, -1, 0] } : {}}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>

          {/* Ripple Effect on Click */}
          <AnimatePresence>
            {isPressed && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 20,
                  height: 20,
                  background: theme.palette.common.white,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </Box>
  )
}

export default AnimatedButton

// File: src/components/ui/FadeTransition.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FadeTransitionProps {
  children: React.ReactNode
  show: boolean
  duration?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}

const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  show,
  duration = 0.3,
  delay = 0,
  direction = 'up',
  distance = 20,
}) => {
  const getInitialState = () => {
    const baseState = { opacity: 0 }
    
    switch (direction) {
      case 'up':
        return { ...baseState, y: distance }
      case 'down':
        return { ...baseState, y: -distance }
      case 'left':
        return { ...baseState, x: distance }
      case 'right':
        return { ...baseState, x: -distance }
      default:
        return baseState
    }
  }

  const getAnimateState = () => {
    return {
      opacity: 1,
      x: 0,
      y: 0,
    }
  }

  const getExitState = () => {
    const baseState = { opacity: 0 }
    
    switch (direction) {
      case 'up':
        return { ...baseState, y: -distance }
      case 'down':
        return { ...baseState, y: distance }
      case 'left':
        return { ...baseState, x: -distance }
      case 'right':
        return { ...baseState, x: distance }
      default:
        return baseState
    }
  }

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={getInitialState()}
          animate={getAnimateState()}
          exit={getExitState()}
          transition={{
            duration,
            delay,
            ease: "easeInOut",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FadeTransition

// File: src/components/ui/GlowEffect.tsx
import React from 'react'
import { Box, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

interface GlowEffectProps {
  children: React.ReactNode
  color?: string
  intensity?: 'low' | 'medium' | 'high'
  animated?: boolean
  hover?: boolean
  size?: number
}

const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  color,
  intensity = 'medium',
  animated = false,
  hover = false,
  size = 20,
}) => {
  const theme = useTheme()
  const glowColor = color || theme.palette.primary.main

  const getIntensityValue = () => {
    switch (intensity) {
      case 'low':
        return 0.3
      case 'medium':
        return 0.6
      case 'high':
        return 1.0
      default:
        return 0.6
    }
  }

  const intensityValue = getIntensityValue()
  const baseGlow = `0 0 ${size}px ${glowColor}${Math.round(intensityValue * 255).toString(16)}`
  const strongGlow = `0 0 ${size * 2}px ${glowColor}${Math.round(intensityValue * 180).toString(16)}`

  return (
    <Box
      component={motion.div}
      sx={{
        position: 'relative',
        display: 'inline-block',
      }}
      whileHover={hover ? {
        filter: `drop-shadow(${strongGlow})`,
        scale: 1.02,
      } : undefined}
      animate={animated ? {
        filter: [
          `drop-shadow(${baseGlow})`,
          `drop-shadow(${strongGlow})`,
          `drop-shadow(${baseGlow})`,
        ],
      } : {
        filter: `drop-shadow(${baseGlow})`,
      }}
      transition={{
        duration: animated ? 2 : 0.3,
        repeat: animated ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      {children}
      
      {/* Additional Glow Layers for Enhanced Effect */}
      {intensity === 'high' && (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)`,
              borderRadius: '50%',
              zIndex: -1,
              pointerEvents: 'none',
            }}
            component={motion.div}
            animate={animated ? {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150%',
              height: '150%',
              background: `radial-gradient(circle, ${glowColor}08 0%, transparent 70%)`,
              borderRadius: '50%',
              zIndex: -2,
              pointerEvents: 'none',
            }}
            component={motion.div}
            animate={animated ? {
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            } : {}}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </>
      )}
    </Box>
  )
}

export default GlowEffect

// File: src/components/ui/ParchmentCard.tsx
import React from 'react'
import { Card, CardProps, useTheme, Box } from '@mui/material'
import { motion } from 'framer-motion'

interface ParchmentCardProps extends CardProps {
  magical?: boolean
  aged?: boolean
  glowColor?: string
  borderEffect?: boolean
}

const ParchmentCard: React.FC<ParchmentCardProps> = ({
  children,
  magical = false,
  aged = false,
  glowColor,
  borderEffect = false,
  ...cardProps
}) => {
  const theme = useTheme()

  const getParchmentBackground = () => {
    if (aged) {
      return `
        linear-gradient(135deg, 
          #F4F1E8 0%, 
          #E8E2D5 25%, 
          #F0EAD6 50%, 
          #E6DCC6 75%, 
          #F2EDE4 100%
        )
      `
    }
    
    return `
      linear-gradient(135deg, 
        ${theme.palette.background.paper} 0%, 
        ${theme.palette.background.default} 50%, 
        ${theme.palette.background.paper} 100%
      )
    `
  }

  const getBorderStyle = () => {
    if (borderEffect) {
      return {
        border: `2px solid transparent`,
        backgroundImage: `
          ${getParchmentBackground()},
          linear-gradient(45deg, ${glowColor || theme.palette.primary.main}, ${theme.palette.secondary.main})
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'content-box, border-box',
      }
    }
    
    return {
      background: getParchmentBackground(),
      border: `1px solid ${theme.palette.divider}`,
    }
  }

  return (
    <Card
      component={motion.div}
      whileHover={magical ? {
        scale: 1.02,
        boxShadow: `0 8px 25px ${(glowColor || theme.palette.primary.main)}40`,
      } : {
        scale: 1.01,
      }}
      transition={{ duration: 0.3 }}
      {...cardProps}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        ...getBorderStyle(),
        
        // Parchment texture overlay
        '&::before': aged ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(139, 115, 85, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(160, 130, 98, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 115, 85, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        } : undefined,
        
        // Magical shimmer effect
        '&::after': magical ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(
            90deg, 
            transparent, 
            ${(glowColor || theme.palette.primary.main)}20, 
            transparent
          )`,
          animation: 'shimmer 3s infinite',
          pointerEvents: 'none',
        } : undefined,
        
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        
        ...cardProps.sx,
      }}
    >
      {/* Decorative corners for aged effect */}
      {aged && (
        <>
          {/* Top-left corner decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 20,
              height: 20,
              background: `radial-gradient(circle, ${theme.palette.primary.main}30 30%, transparent 30%)`,
              backgroundSize: '4px 4px',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
          
          {/* Bottom-right corner decoration */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 20,
              height: 20,
              background: `radial-gradient(circle, ${theme.palette.secondary.main}30 30%, transparent 30%)`,
              backgroundSize: '4px 4px',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      
      {/* Magical border glow */}
      {magical && (
        <Box
          component={motion.div}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${glowColor || theme.palette.primary.main}, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {children}
    </Card>
  )
}

export default ParchmentCard