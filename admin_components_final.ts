// File: src/components/admin/FlagManager.tsx
import React, { useState, useEffect } from 'react'
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
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
} from '@mui/material'
import {
  Flag,
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  Code,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  Refresh,
  BugReport,
  Category,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { FlagDefinition, FlagGroup } from '../../types/flags'
import { useGame } from '../../hooks/useGame'
import { useNotification } from '../../hooks/useNotification'

interface FlagManagerProps {
  open?: boolean
  onClose?: () => void
}

const FlagManager: React.FC<FlagManagerProps> = ({ open, onClose }) => {
  const theme = useTheme()
  const { gameState, setFlag, getFlag } = useGame()
  const { showSuccess, showError, showInfo } = useNotification()

  const [currentTab, setCurrentTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDebugFlags, setShowDebugFlags] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<FlagDefinition | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [flags, setFlags] = useState<FlagDefinition[]>([])
  const [flagGroups, setFlagGroups] = useState<FlagGroup[]>([])

  // Mock flag definitions - in real app these would come from API
  const mockFlags: FlagDefinition[] = [
    {
      id: 'first_forest_visit',
      name: 'Erster Waldbesuch',
      description: 'Markiert, ob der Spieler den Wald zum ersten Mal besucht hat',
      type: 'boolean',
      defaultValue: false,
      category: 'story',
      isGlobal: false,
      isPersistent: true,
      isDebugVisible: true,
      metadata: {
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_modified: '2024-01-01T00:00:00Z',
        version: 1,
        usage_count: 5,
        dependencies: [],
      },
    },
    {
      id: 'player_level',
      name: 'Spieler Level',
      description: 'Das aktuelle Level des Spielers',
      type: 'number',
      defaultValue: 1,
      category: 'gameplay',
      isGlobal: false,
      isPersistent: true,
      isDebugVisible: true,
      validation: {
        required: true,
        min: 1,
        max: 100,
      },
      metadata: {
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'system',
        last_modified: '2024-01-01T00:00:00Z',
        version: 1,
        usage_count: 25,
        dependencies: [],
      },
    },
    {
      id: 'merchant_met',
      name: 'Händler getroffen',
      description: 'Hat der Spieler den mysteriösen Händler getroffen',
      type: 'boolean',
      defaultValue: false,
      category: 'character',
      isGlobal: false,
      isPersistent: true,
      isDebugVisible: true,
      metadata: {
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_modified: '2024-01-01T00:00:00Z',
        version: 1,
        usage_count: 3,
        dependencies: ['first_forest_visit'],
      },
    },
    {
      id: 'debug_mode',
      name: 'Debug Modus',
      description: 'Aktiviert erweiterte Debug-Funktionen',
      type: 'boolean',
      defaultValue: false,
      category: 'system',
      isGlobal: true,
      isPersistent: false,
      isDebugVisible: true,
      metadata: {
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'system',
        last_modified: '2024-01-01T00:00:00Z',
        version: 1,
        usage_count: 0,
        dependencies: [],
      },
    },
  ]

  const mockGroups: FlagGroup[] = [
    {
      id: 'story_progression',
      name: 'Story-Fortschritt',
      description: 'Flags die den Hauptstory-Verlauf steuern',
      flags: ['first_forest_visit', 'merchant_met'],
      isCollapsed: false,
      color: theme.palette.primary.main,
      icon: '📖',
    },
    {
      id: 'character_interactions',
      name: 'Charakter-Interaktionen',
      description: 'Flags für Begegnungen mit NPCs',
      flags: ['merchant_met'],
      isCollapsed: false,
      color: theme.palette.secondary.main,
      icon: '👥',
    },
    {
      id: 'system_flags',
      name: 'System-Flags',
      description: 'Technische und Debug-Flags',
      flags: ['debug_mode'],
      isCollapsed: true,
      color: theme.palette.info.main,
      icon: '⚙️',
    },
  ]

  useEffect(() => {
    setFlags(mockFlags)
    setFlagGroups(mockGroups)
  }, [])

  const getFilteredFlags = () => {
    let filtered = flags

    if (searchTerm) {
      filtered = filtered.filter(flag =>
        flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(flag => flag.category === filterCategory)
    }

    if (!showDebugFlags) {
      filtered = filtered.filter(flag => flag.isDebugVisible !== false)
    }

    return filtered
  }

  const getFlagCurrentValue = (flagId: string) => {
    return getFlag(flagId) || flags.find(f => f.id === flagId)?.defaultValue
  }

  const handleUpdateFlag = (flagId: string, value: any) => {
    setFlag(flagId, value)
    showSuccess('Flag aktualisiert', `"${flagId}" wurde auf "${value}" gesetzt.`)
  }

  const handleCreateFlag = () => {
    setSelectedFlag(null)
    setIsEditorOpen(true)
  }

  const handleEditFlag = (flag: FlagDefinition) => {
    setSelectedFlag(flag)
    setIsEditorOpen(true)
  }

  const handleDeleteFlag = (flagId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Flag löschen möchten?')) {
      setFlags(prev => prev.filter(f => f.id !== flagId))
      showSuccess('Flag gelöscht', 'Das Flag wurde erfolgreich entfernt.')
    }
  }

  const handleSaveFlag = (flag: FlagDefinition) => {
    if (selectedFlag) {
      setFlags(prev => prev.map(f => f.id === flag.id ? flag : f))
      showSuccess('Flag aktualisiert', 'Das Flag wurde erfolgreich bearbeitet.')
    } else {
      setFlags(prev => [...prev, flag])
      showSuccess('Flag erstellt', 'Das neue Flag wurde hinzugefügt.')
    }
    setIsEditorOpen(false)
    setSelectedFlag(null)
  }

  const exportFlags = () => {
    const exportData = {
      flags,
      groups: flagGroups,
      currentValues: Object.fromEntries(
        flags.map(flag => [flag.id, getFlagCurrentValue(flag.id)])
      ),
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flags_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    showSuccess('Export erfolgreich', 'Flags wurden als JSON-Datei exportiert.')
  }

  const FlagEditor: React.FC<{
    open: boolean
    flag: FlagDefinition | null
    onClose: () => void
    onSave: (flag: FlagDefinition) => void
  }> = ({ open, flag, onClose, onSave }) => {
    const [formData, setFormData] = useState<FlagDefinition>({
      id: '',
      name: '',
      description: '',
      type: 'boolean',
      defaultValue: false,
      category: 'story',
      isGlobal: false,
      isPersistent: true,
      isDebugVisible: true,
      metadata: {
        created_at: new Date().toISOString(),
        created_by: 'admin',
        last_modified: new Date().toISOString(),
        version: 1,
        usage_count: 0,
        dependencies: [],
      },
    })

    useEffect(() => {
      if (flag) {
        setFormData(flag)
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          type: 'boolean',
          defaultValue: false,
          category: 'story',
          isGlobal: false,
          isPersistent: true,
          isDebugVisible: true,
          metadata: {
            created_at: new Date().toISOString(),
            created_by: 'admin',
            last_modified: new Date().toISOString(),
            version: 1,
            usage_count: 0,
            dependencies: [],
          },
        })
      }
    }, [flag, open])

    const handleSave = () => {
      if (!formData.id || !formData.name) {
        showError('Validierungsfehler', 'ID und Name sind erforderlich.')
        return
      }

      onSave(formData)
    }

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {flag ? 'Flag bearbeiten' : 'Neues Flag erstellen'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Flag-ID"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                helperText="Eindeutige Kennung (snake_case empfohlen)"
                disabled={!!flag}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Anzeigename"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Beschreibung"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Datentyp</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  label="Datentyp"
                >
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="array">Array</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  label="Kategorie"
                >
                  <MenuItem value="story">Story</MenuItem>
                  <MenuItem value="character">Character</MenuItem>
                  <MenuItem value="gameplay">Gameplay</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="achievement">Achievement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Standardwert"
                value={formData.defaultValue}
                onChange={(e) => {
                  let value: any = e.target.value
                  if (formData.type === 'boolean') {
                    value = e.target.value === 'true'
                  } else if (formData.type === 'number') {
                    value = parseFloat(e.target.value) || 0
                  }
                  setFormData(prev => ({ ...prev, defaultValue: value }))
                }}
                helperText={`Datentyp: ${formData.type}`}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGlobal: e.target.checked }))}
                  />
                }
                label="Global (gilt für alle Spieler)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPersistent}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPersistent: e.target.checked }))}
                  />
                }
                label="Persistent (wird gespeichert)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDebugVisible}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDebugVisible: e.target.checked }))}
                  />
                }
                label="Im Debug sichtbar"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({
    children,
    value,
    index,
  }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )

  const categories = ['all', 'story', 'character', 'gameplay', 'system', 'achievement']
  const filteredFlags = getFilteredFlags()

  if (open) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Flag sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h5" sx={{ fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
              Flag-Manager
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Flags durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Kategorie"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat === 'all' ? 'Alle' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={showDebugFlags}
                    onChange={(e) => setShowDebugFlags(e.target.checked)}
                  />
                }
                label="Debug-Flags"
              />

              <Box sx={{ flex: 1 }} />

              <Button
                startIcon={<Download />}
                onClick={exportFlags}
                variant="outlined"
                size="small"
              >
                Export
              </Button>

              <Button
                startIcon={<Add />}
                onClick={handleCreateFlag}
                variant="contained"
                size="small"
              >
                Neues Flag
              </Button>
            </Box>

            {/* Tabs */}
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab
                label={
                  <Badge badgeContent={filteredFlags.length} color="primary">
                    Alle Flags
                  </Badge>
                }
              />
              <Tab label="Gruppen" />
              <Tab label="Aktuelle Werte" />
            </Tabs>

            {/* All Flags Tab */}
            <TabPanel value={currentTab} index={0}>
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell>Kategorie</TableCell>
                      <TableCell>Standardwert</TableCell>
                      <TableCell>Aktueller Wert</TableCell>
                      <TableCell>Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFlags.map((flag) => (
                      <TableRow key={flag.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {flag.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {flag.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {flag.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={flag.type} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={flag.category}
                            color={flag.category === 'system' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {String(flag.defaultValue)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {flag.type === 'boolean' ? (
                              <Switch
                                checked={Boolean(getFlagCurrentValue(flag.id))}
                                onChange={(e) => handleUpdateFlag(flag.id, e.target.checked)}
                                size="small"
                              />
                            ) : (
                              <TextField
                                size="small"
                                value={getFlagCurrentValue(flag.id)}
                                onChange={(e) => handleUpdateFlag(flag.id, e.target.value)}
                                sx={{ minWidth: 100 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Bearbeiten">
                              <IconButton size="small" onClick={() => handleEditFlag(flag)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Löschen">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteFlag(flag.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredFlags.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Flag sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6">Keine Flags gefunden</Typography>
                  <Typography variant="body2">
                    Passen Sie Ihre Suchkriterien an oder erstellen Sie ein neues Flag.
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Groups Tab */}
            <TabPanel value={currentTab} index={1}>
              <Grid container spacing={2}>
                {flagGroups.map((group) => (
                  <Grid item xs={12} md={6} key={group.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Box sx={{ fontSize: '1.5rem' }}>{group.icon}</Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {group.name}
                          </Typography>
                          <Chip size="small" label={group.flags.length} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {group.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {group.flags.map((flagId) => {
                            const flag = flags.find(f => f.id === flagId)
                            return flag ? (
                              <Chip
                                key={flagId}
                                size="small"
                                label={flag.name}
                                sx={{ background: `${group.color}20`, color: group.color }}
                              />
                            ) : null
                          })}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Current Values Tab */}
            <TabPanel value={currentTab} index={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Aktuelle Spieler-Flags
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {flags.map((flag) => {
                      const currentValue = getFlagCurrentValue(flag.id)
                      return (
                        <Box
                          key={flag.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {flag.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {flag.id}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {String(currentValue)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Standard: {String(flag.defaultValue)}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </CardContent>
              </Card>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Schließen</Button>
        </DialogActions>

        <FlagEditor
          open={isEditorOpen}
          flag={selectedFlag}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveFlag}
        />
      </Dialog>
    )
  }

  // Inline component for embedded use
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Flag-Manager
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            Flag-Manager-Komponente wird hier eingebettet dargestellt.
            Implementierung erfolgt identisch zur Dialog-Version.
          </Typography>
          <Button
            startIcon={<Flag />}
            onClick={() => setIsEditorOpen(true)}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Flag-Manager öffnen
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default FlagManager

// File: src/components/admin/ExportDialog.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  useTheme,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  CloudDownload,
  CloudUpload,
  Description,
  Image,
  Code,
  Security,
  CheckCircle,
  Warning,
  Error,
  Folder,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Scene } from '../../types/scene'
import { ExportOptions, ImportOptions } from '../../types/api'
import { useNotification } from '../../hooks/useNotification'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  scenes: Scene[]
  onImport: (scenes: Scene[]) => void
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, scenes, onImport }) => {
  const theme = useTheme()
  const { showSuccess, showError, showInfo } = useNotification()

  const [mode, setMode] = useState<'export' | 'import'>('export')
  const [activeStep, setActiveStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeImages: false,
    includeStats: true,
    includeChoices: true,
    compression: false,
    password: '',
  })

  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    validateData: true,
    mergeStrategy: 'append',
    backupBefore: true,
  })

  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<Scene[]>([])

  const exportSteps = ['Optionen wählen', 'Daten vorbereiten', 'Download starten']
  const importSteps = ['Datei auswählen', 'Daten validieren', 'Import durchführen']

  const handleExport = async () => {
    setIsProcessing(true)
    setProgress(0)

    try {
      // Step 1: Prepare data
      setProgress(25)
      showInfo('Export läuft', 'Daten werden vorbereitet...', 1000)

      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        scenes: scenes.map(scene => ({
          ...scene,
          metadata: exportOptions.includeMetadata ? scene.metadata : undefined,
          choices: exportOptions.includeChoices ? scene.choices : [],
          imageUrl: exportOptions.includeImages ? scene.imageUrl : undefined,
        })),
        statistics: exportOptions.includeStats ? {
          totalScenes: scenes.length,
          generatedScenes: scenes.filter(s => s.isGenerated).length,
          totalChoices: scenes.reduce((sum, s) => sum + s.choices.length, 0),
        } : undefined,
      }

      // Step 2: Generate file
      setProgress(60)
      showInfo('Export läuft', 'Datei wird erstellt...', 1000)

      let fileContent: string
      let fileName: string
      let mimeType: string

      switch (exportOptions.format) {
        case 'json':
          fileContent = JSON.stringify(exportData, null, 2)
          fileName = `zauberbuch_export_${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break

        case 'markdown':
          fileContent = generateMarkdownExport(exportData)
          fileName = `zauberbuch_export_${new Date().toISOString().split('T')[0]}.md`
          mimeType = 'text/markdown'
          break

        case 'html':
          fileContent = generateHTMLExport(exportData)
          fileName = `zauberbuch_export_${new Date().toISOString().split('T')[0]}.html`
          mimeType = 'text/html'
          break

        default:
          fileContent = JSON.stringify(exportData, null, 2)
          fileName = `zauberbuch_export_${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
      }

      // Step 3: Download
      setProgress(90)
      showInfo('Export läuft', 'Download wird gestartet...', 1000)

      const blob = new Blob([fileContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      showSuccess('Export erfolgreich', `${scenes.length} Szenen wurden exportiert.`)
      setActiveStep(exportSteps.length)

      setTimeout(() => {
        onClose()
        resetDialog()
      }, 2000)

    } catch (error) {
      showError('Export-Fehler', 'Der Export konnte nicht abgeschlossen werden.')
      console.error('Export error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      showError('Keine Datei', 'Bitte wählen Sie eine Datei zum Importieren aus.')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Step 1: Read file
      setProgress(25)
      showInfo('Import läuft', 'Datei wird gelesen...', 1000)

      const fileContent = await readFileAsText(importFile)
      let importData: any

      try {
        importData = JSON.parse(fileContent)
      } catch (parseError) {
        throw new Error('Datei ist kein gültiges JSON-Format')
      }

      // Step 2: Validate data
      setProgress(50)
      showInfo('Import läuft', 'Daten werden validiert...', 1000)

      if (importOptions.validateData) {
        validateImportData(importData)
      }

      // Step 3: Process import
      setProgress(75)
      showInfo('Import läuft', 'Szenen werden verarbeitet...', 1000)

      const importedScenes: Scene[] = importData.scenes || []
      
      if (importOptions.backupBefore) {
        // Create backup
        const backupData = {
          timestamp: new Date().toISOString(),
          scenes: scenes,
        }
        const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
        const backupUrl = URL.createObjectURL(backupBlob)
        const backupLink = document.createElement('a')
        backupLink.href = backupUrl
        backupLink.download = `backup_${new Date().toISOString().split('T')[0]}.json`
        backupLink.click()
        URL.revokeObjectURL(backupUrl)
      }

      setProgress(100)
      onImport(importedScenes)
      showSuccess('Import erfolgreich', `${importedScenes.length} Szenen wurden importiert.`)
      setActiveStep(importSteps.length)

      setTimeout(() => {
        onClose()
        resetDialog()
      }, 2000)

    } catch (error) {
      showError('Import-Fehler', error instanceof Error ? error.message : 'Unbekannter Fehler')
      console.error('Import error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateMarkdownExport = (data: any): string => {
    let markdown = `# Das Magische Zauberbuch - Export\n\n`
    markdown += `Exportiert am: ${new Date(data.timestamp).toLocaleString('de-DE')}\n\n`
    
    if (data.statistics) {
      markdown += `## Statistiken\n\n`
      markdown += `- Gesamte Szenen: ${data.statistics.totalScenes}\n`
      markdown += `- KI-generierte Szenen: ${data.statistics.generatedScenes}\n`
      markdown += `- Gesamte Auswahlmöglichkeiten: ${data.statistics.totalChoices}\n\n`
    }

    markdown += `## Szenen\n\n`
    
    data.scenes.forEach((scene: Scene, index: number) => {
      markdown += `### ${index + 1}. ${scene.title}\n\n`
      markdown += `**ID:** \`${scene.id}\`\n`
      markdown += `**Typ:** ${scene.type}\n\n`
      markdown += `${scene.content}\n\n`
      
      if (scene.choices.length > 0) {
        markdown += `#### Auswahlmöglichkeiten:\n\n`
        scene.choices.forEach((choice, choiceIndex) => {
          markdown += `${choiceIndex + 1}. **${choice.text}**\n`
          if (choice.description) {
            markdown += `   - ${choice.description}\n`
          }
          markdown += `   - Führt zu: \`${choice.targetSceneId}\`\n`
        })
        markdown += `\n`
      }
      
      markdown += `---\n\n`
    })

    return markdown
  }

  const generateHTMLExport = (data: any): string => {
    const css = `
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #2D5A27; font-family: 'Cinzel', serif; }
        .scene { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .choices { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .choice { margin-bottom: 10px; }
        .metadata { font-size: 0.9em; color: #666; margin-bottom: 15px; }
        code { background: #f1f1f1; padding: 2px 5px; border-radius: 3px; }
      </style>
    `

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Das Magische Zauberbuch - Export</title>${css}</head><body>`
    html += `<h1>Das Magische Zauberbuch - Export</h1>`
    html += `<p><strong>Exportiert am:</strong> ${new Date(data.timestamp).toLocaleString('de-DE')}</p>`

    if (data.statistics) {
      html += `<h2>Statistiken</h2>`
      html += `<ul>`
      html += `<li>Gesamte Szenen: ${data.statistics.totalScenes}</li>`
      html += `<li>KI-generierte Szenen: ${data.statistics.generatedScenes}</li>`
      html += `<li>Gesamte Auswahlmöglichkeiten: ${data.statistics.totalChoices}</li>`
      html += `</ul>`
    }

    html += `<h2>Szenen</h2>`
    
    data.scenes.forEach((scene: Scene, index: number) => {
      html += `<div class="scene">`
      html += `<h3>${index + 1}. ${scene.title}</h3>`
      html += `<div class="metadata">`
      html += `<strong>ID:</strong> <code>${scene.id}</code> | `
      html += `<strong>Typ:</strong> ${scene.type}`
      if (scene.isGenerated) html += ` | <strong>KI-generiert</strong>`
      html += `</div>`
      html += `<p>${scene.content.replace(/\n/g, '<br>')}</p>`
      
      if (scene.choices.length > 0) {
        html += `<div class="choices">`
        html += `<h4>Auswahlmöglichkeiten:</h4>`
        scene.choices.forEach((choice, choiceIndex) => {
          html += `<div class="choice">`
          html += `<strong>${choiceIndex + 1}. ${choice.text}</strong>`
          if (choice.description) {
            html += `<br><em>${choice.description}</em>`
          }
          html += `<br>→ Führt zu: <code>${choice.targetSceneId}</code>`
          html += `</div>`
        })
        html += `</div>`
      }
      
      html += `</div>`
    })

    html += `</body></html>`
    return html
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
      reader.readAsText(file)
    })
  }

  const validateImportData = (data: any) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Ungültiges Datenformat')
    }

    if (!Array.isArray(data.scenes)) {
      throw new Error('Keine Szenen-Daten gefunden')
    }

    data.scenes.forEach((scene: any, index: number) => {
      if (!scene.id || !scene.title || !scene.content) {
        throw new Error(`Szene ${index + 1} hat fehlende Pflichtfelder`)
      }
    })
  }

  const resetDialog = () => {
    setActiveStep(0)
    setProgress(0)
    setImportFile(null)
    setImportPreview([])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      // Preview logic could be added here
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {mode === 'export' ? <CloudDownload /> : <CloudUpload />}
          <Typography variant="h5" sx={{ fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
            {mode === 'export' ? 'Daten exportieren' : 'Daten importieren'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Mode Toggle */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            variant={mode === 'export' ? 'contained' : 'outlined'}
            onClick={() => setMode('export')}
            startIcon={<CloudDownload />}
          >
            Export
          </Button>
          <Button
            variant={mode === 'import' ? 'contained' : 'outlined'}
            onClick={() => setMode('import')}
            startIcon={<CloudUpload />}
          >
            Import
          </Button>
        </Box>

        {/* Progress */}
        {isProcessing && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                background: `${theme.palette.primary.main}20`,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {progress}% abgeschlossen
            </Typography>
          </Box>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {(mode === 'export' ? exportSteps : importSteps).map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Export Mode */}
        {mode === 'export' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Export-Optionen
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    label="Format"
                  >
                    <MenuItem value="json">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Code />
                        JSON (Strukturiert)
                      </Box>
                    </MenuItem>
                    <MenuItem value="markdown">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        Markdown (Lesbar)
                      </Box>
                    </MenuItem>
                    <MenuItem value="html">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        HTML (Webseite)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="password"
                  label="Passwort (optional)"
                  value={exportOptions.password}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leer lassen für unverschlüsselt"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Inhalt
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      />
                    }
                    label="Metadaten einschließen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeChoices}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeChoices: e.target.checked }))}
                      />
                    }
                    label="Auswahlmöglichkeiten einschließen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeStats}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeStats: e.target.checked }))}
                      />
                    }
                    label="Statistiken einschließen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeImages}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                      />
                    }
                    label="Bild-URLs einschließen"
                  />
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {scenes.length} Szenen werden exportiert. Das Format "{exportOptions.format}" wird verwendet.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Import Mode */}
        {mode === 'import' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Import-Optionen
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    background: theme.palette.action.hover,
                  }}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="import-file-input"
                  />
                  <label htmlFor="import-file-input">
                    <Button component="span" variant="outlined" startIcon={<Folder />}>
                      Datei auswählen
                    </Button>
                  </label>
                  {importFile && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Ausgewählt: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Import-Verhalten
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={importOptions.validateData}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                      />
                    }
                    label="Daten vor Import validieren"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={importOptions.backupBefore}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, backupBefore: e.target.checked }))}
                      />
                    }
                    label="Backup vor Import erstellen"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={importOptions.overwriteExisting}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                      />
                    }
                    label="Bestehende Szenen überschreiben"
                  />
                </Box>
              </Grid>
            </Grid>

            {importFile && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Datei bereit zum Import. Klicken Sie auf "Import starten" um fortzufahren.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Abbrechen
        </Button>
        <Button
          onClick={mode === 'export' ? handleExport : handleImport}
          variant="contained"
          disabled={isProcessing || (mode === 'import' && !importFile)}
          startIcon={mode === 'export' ? <CloudDownload /> : <CloudUpload />}
        >
          {mode === 'export' ? 'Export starten' : 'Import starten'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExportDialog

// File: src/components/admin/PreviewModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  useTheme,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Close,
  Visibility,
  Edit,
  PlayArrow,
  Code,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Scene } from '../../types/scene'
import { useTheme as useCustomTheme } from '../../hooks/useTheme'
import SceneDisplay from '../game/SceneDisplay'
import ChoiceCard from '../game/ChoiceCard'

interface PreviewModalProps {
  open: boolean
  scene: Scene | null
  onClose: () => void
  onEdit?: (scene: Scene) => void
}

const PreviewModal: React.FC<PreviewModalProps> = ({ open, scene, onClose, onEdit }) => {
  const theme = useTheme()
  const { isDarkMode } = useCustomTheme()
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  if (!scene) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit(scene)
      onClose()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
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

  const mockChoiceHandler = (choice: any) => {
    console.log('Preview choice selected:', choice.text)
    // In preview mode, we don't actually execute choices
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isFullscreen ? false : 'lg'}
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          height: isFullscreen ? '100vh' : '90vh',
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 240, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Visibility sx={{ color: getSceneTypeColor(), fontSize: 28 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                Szenen-Vorschau
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {scene.title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* View Mode Toggle */}
            <Button
              variant={viewMode === 'preview' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('preview')}
              startIcon={<Visibility />}
            >
              Vorschau
            </Button>
            <Button
              variant={viewMode === 'code' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('code')}
              startIcon={<Code />}
            >
              Code
            </Button>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Controls */}
            <IconButton onClick={toggleFullscreen} title={isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>

            {onEdit && (
              <IconButton onClick={handleEdit} title="Bearbeiten" color="primary">
                <Edit />
              </IconButton>
            )}

            <IconButton onClick={onClose} title="Schließen">
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <DialogContent sx={{ flex: 1, p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'preview' ? (
            // Preview Mode
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Scene Metadata */}
                <Card sx={{ mb: 3, border: `1px solid ${getSceneTypeColor()}40` }}>
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Szenen-Informationen
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showMetadata}
                            onChange={(e) => setShowMetadata(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Details anzeigen"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {scene.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Typ
                        </Typography>
                        <Box>
                          <Chip
                            size="small"
                            label={scene.type}
                            sx={{
                              background: `${getSceneTypeColor()}20`,
                              color: getSceneTypeColor(),
                              border: `1px solid ${getSceneTypeColor()}40`,
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Schwierigkeit
                        </Typography>
                        <Typography variant="body2">
                          {scene.metadata.difficulty}/5
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Auswahlmöglichkeiten
                        </Typography>
                        <Typography variant="body2">
                          {scene.choices.length}
                        </Typography>
                      </Grid>

                      {showMetadata && (
                        <>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Wörter
                            </Typography>
                            <Typography variant="body2">
                              {scene.metadata.wordCount}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Lesezeit
                            </Typography>
                            <Typography variant="body2">
                              ~{scene.metadata.estimatedReadTime} Min
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Generiert
                            </Typography>
                            <Typography variant="body2">
                              {scene.isGenerated ? 'Ja (KI)' : 'Nein (Manuell)'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Tags
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {scene.tags.length > 0 ? scene.tags.map(tag => (
                                <Chip key={tag} size="small" label={tag} />
                              )) : (
                                <Typography variant="body2" color="text.secondary">
                                  Keine Tags
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Scene Display */}
                <SceneDisplay scene={scene} isTransitioning={false} />

                {/* Choices */}
                {scene.choices.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Auswahlmöglichkeiten (Vorschau)
                    </Typography>
                    <Grid container spacing={2}>
                      {scene.choices.map((choice, index) => (
                        <Grid item xs={12} sm={6} key={choice.id}>
                          <ChoiceCard
                            choice={choice}
                            onSelect={mockChoiceHandler}
                            disabled={false}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </motion.div>
            </Box>
          ) : (
            // Code Mode
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                JSON-Struktur
              </Typography>
              <Card>
                <CardContent>
                  <Box
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      overflow: 'auto',
                      background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                      padding: 2,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      maxHeight: 'calc(100vh - 300px)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {formatJSON(scene)}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Szenen-ID: <code>{scene.id}</code>
            </Typography>
            {scene.isGenerated && (
              <Chip
                size="small"
                label="KI-generiert"
                color="secondary"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
          
          <Button onClick={onClose}>
            Schließen
          </Button>
          
          {onEdit && (
            <Button
              onClick={handleEdit}
              variant="contained"
              startIcon={<Edit />}
            >
              Bearbeiten
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default PreviewModal