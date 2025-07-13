// File: src/components/admin/AdminPanel.tsx
import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  SmartToy,
  Flag,
  CloudDownload,
  Analytics,
  Refresh,
  Settings,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import SceneEditor from './SceneEditor'
import AISceneGenerator from './AISceneGenerator'
import FlagManager from './FlagManager'
import ExportDialog from './ExportDialog'
import PreviewModal from './PreviewModal'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'
import { useNotification } from '../../hooks/useNotification'
import { Scene } from '../../types/scene'
import { scenes } from '../../data/scenes/scenes'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    aria-labelledby={`admin-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
)

const AdminPanel: React.FC = () => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const { showSuccess, showError } = useNotification()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [currentTab, setCurrentTab] = useState(0)
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [isSceneEditorOpen, setIsSceneEditorOpen] = useState(false)
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false)
  const [isFlagManagerOpen, setIsFlagManagerOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sceneList, setSceneList] = useState<Scene[]>(scenes)

  // Statistics
  const statistics = {
    totalScenes: sceneList.length,
    generatedScenes: sceneList.filter(s => s.isGenerated).length,
    totalChoices: sceneList.reduce((sum, s) => sum + s.choices.length, 0),
    averageChoicesPerScene: sceneList.length > 0 
      ? Math.round((sceneList.reduce((sum, s) => sum + s.choices.length, 0) / sceneList.length) * 10) / 10 
      : 0,
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleCreateScene = () => {
    setSelectedScene(null)
    setIsSceneEditorOpen(true)
  }

  const handleEditScene = (scene: Scene) => {
    setSelectedScene(scene)
    setIsSceneEditorOpen(true)
  }

  const handleDeleteScene = async (sceneId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Szene löschen möchten?')) {
      try {
        setIsLoading(true)
        // In real app: await adminService.deleteScene(sceneId)
        setSceneList(prev => prev.filter(s => s.id !== sceneId))
        showSuccess('Szene gelöscht', 'Die Szene wurde erfolgreich entfernt.')
      } catch (error) {
        showError('Fehler beim Löschen', 'Die Szene konnte nicht gelöscht werden.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePreviewScene = (scene: Scene) => {
    setSelectedScene(scene)
    setIsPreviewModalOpen(true)
  }

  const handleSaveScene = async (scene: Scene) => {
    try {
      setIsLoading(true)
      // In real app: await adminService.saveScene(scene)
      
      if (selectedScene) {
        // Update existing scene
        setSceneList(prev => prev.map(s => s.id === scene.id ? scene : s))
        showSuccess('Szene aktualisiert', 'Die Änderungen wurden gespeichert.')
      } else {
        // Add new scene
        setSceneList(prev => [...prev, scene])
        showSuccess('Szene erstellt', 'Die neue Szene wurde hinzugefügt.')
      }
      
      setIsSceneEditorOpen(false)
      setSelectedScene(null)
    } catch (error) {
      showError('Speicherfehler', 'Die Szene konnte nicht gespeichert werden.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateScene = async (generatedScene: Scene) => {
    try {
      setIsLoading(true)
      setSceneList(prev => [...prev, generatedScene])
      showSuccess('KI-Szene generiert', 'Eine neue Szene wurde erfolgreich erstellt.')
      setIsAIGeneratorOpen(false)
    } catch (error) {
      showError('Generierungsfehler', 'Die Szene konnte nicht generiert werden.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    try {
      // In real app: const updatedScenes = await adminService.getAllScenes()
      // setSceneList(updatedScenes)
      showSuccess('Daten aktualisiert', 'Alle Szenen wurden neu geladen.')
    } catch (error) {
      showError('Aktualisierungsfehler', 'Die Daten konnten nicht aktualisiert werden.')
    } finally {
      setIsLoading(false)
    }
  }

  const StatsCard: React.FC<{
    title: string
    value: number | string
    icon: React.ReactNode
    color: string
  }> = ({ title, value, icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        elevation={2}
        sx={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 246, 240, 0.9) 100%)',
          border: `1px solid ${color}40`,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color, mb: 0.5 }}>
                {value}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {title}
              </Typography>
            </Box>
            <Box sx={{ color, opacity: 0.7 }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )

  const SceneCard: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        elevation={1}
        sx={{
          background: isDarkMode
            ? 'rgba(26, 26, 26, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            elevation: 3,
            transform: 'translateY(-2px)',
            border: `1px solid ${theme.palette.primary.main}40`,
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {scene.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {scene.content.substring(0, 100)}...
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Badge
                  badgeContent={scene.choices.length}
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Auswahlmöglichkeiten
                  </Typography>
                </Badge>
                {scene.isGenerated && (
                  <Typography
                    variant="caption"
                    sx={{
                      background: theme.palette.secondary.main,
                      color: 'white',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                    }}
                  >
                    KI-generiert
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handlePreviewScene(scene)}
              title="Vorschau"
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEditScene(scene)}
              title="Bearbeiten"
            >
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDeleteScene(scene.id)}
              title="Löschen"
              color="error"
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
              color: theme.palette.primary.main,
              mb: 1,
            }}
          >
            Administration
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Verwalten Sie Szenen, Charaktere und Spielinhalte
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={refreshData} disabled={isLoading} title="Aktualisieren">
            <Refresh />
          </IconButton>
          <IconButton title="Einstellungen">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Loading Bar */}
      {isLoading && (
        <LinearProgress
          sx={{
            mb: 3,
            borderRadius: 1,
            height: 4,
            background: `${theme.palette.primary.main}20`,
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        />
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Gesamte Szenen"
            value={statistics.totalScenes}
            icon={<Edit sx={{ fontSize: 32 }} />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="KI-generiert"
            value={statistics.generatedScenes}
            icon={<SmartToy sx={{ fontSize: 32 }} />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Auswahlmöglichkeiten"
            value={statistics.totalChoices}
            icon={<Flag sx={{ fontSize: 32 }} />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Ø Auswahlmöglichkeiten"
            value={statistics.averageChoicesPerScene}
            icon={<Analytics sx={{ fontSize: 32 }} />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="Admin Panel Tabs"
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          <Tab label="Szenen-Verwaltung" />
          <Tab label="KI-Generator" />
          <Tab label="Flag-Manager" />
          <Tab label="Export/Import" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Scene Management */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Szenen-Verwaltung
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => setIsAIGeneratorOpen(true)}
                sx={{
                  background: theme.palette.secondary.main,
                  color: 'white',
                  '&:hover': { background: theme.palette.secondary.dark },
                }}
                title="KI-Szene generieren"
              >
                <SmartToy />
              </IconButton>
              <IconButton
                onClick={handleCreateScene}
                sx={{
                  background: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': { background: theme.palette.primary.dark },
                }}
                title="Neue Szene erstellen"
              >
                <Add />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {sceneList.map((scene, index) => (
              <Grid item xs={12} sm={6} lg={4} key={scene.id}>
                <SceneCard scene={scene} index={index} />
              </Grid>
            ))}
          </Grid>

          {sceneList.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: theme.palette.text.secondary,
              }}
            >
              <Edit sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Keine Szenen vorhanden
              </Typography>
              <Typography variant="body2">
                Erstellen Sie Ihre erste Szene oder nutzen Sie den KI-Generator.
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <AISceneGenerator
          onGenerate={handleGenerateScene}
          existingScenes={sceneList}
        />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <FlagManager />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <ExportDialog
          scenes={sceneList}
          onImport={(importedScenes) => setSceneList(prev => [...prev, ...importedScenes])}
        />
      </TabPanel>

      {/* Modals */}
      <SceneEditor
        open={isSceneEditorOpen}
        scene={selectedScene}
        onClose={() => {
          setIsSceneEditorOpen(false)
          setSelectedScene(null)
        }}
        onSave={handleSaveScene}
      />

      <AISceneGenerator
        open={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onGenerate={handleGenerateScene}
        existingScenes={sceneList}
      />

      <FlagManager
        open={isFlagManagerOpen}
        onClose={() => setIsFlagManagerOpen(false)}
      />

      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        scenes={sceneList}
        onImport={(importedScenes) => setSceneList(prev => [...prev, ...importedScenes])}
      />

      <PreviewModal
        open={isPreviewModalOpen}
        scene={selectedScene}
        onClose={() => {
          setIsPreviewModalOpen(false)
          setSelectedScene(null)
        }}
      />

      {/* Floating Action Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000,
        }}
      >
        <Fab
          color="secondary"
          onClick={() => setIsAIGeneratorOpen(true)}
          title="KI-Generator"
          sx={{ display: currentTab === 0 ? 'flex' : 'none' }}
        >
          <SmartToy />
        </Fab>
        <Fab
          color="primary"
          onClick={handleCreateScene}
          title="Neue Szene"
          sx={{ display: currentTab === 0 ? 'flex' : 'none' }}
        >
          <Add />
        </Fab>
      </Box>
    </Box>
  )
}

export default AdminPanel