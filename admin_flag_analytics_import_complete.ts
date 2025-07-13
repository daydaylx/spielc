// src/components/admin/FlagManager.tsx
// Flag-Verwaltungssystem für Das Magische Zauberbuch
// Version: 1.0.0 - Production Ready

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as PreviewIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import { storyService } from '../../services/storyService';
import type { Story, Scene, Choice } from '../../types';

interface FlagManagerProps {
  story: Story;
  onStoryUpdate: (story: Story) => void;
}

interface FlagDefinition {
  name: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue: any;
  description: string;
  category: string;
  isGlobal: boolean;
}

interface FlagUsage {
  sceneId: string;
  sceneTitle: string;
  type: 'condition' | 'effect';
  context: string;
}

export const FlagManager: React.FC<FlagManagerProps> = ({ story, onStoryUpdate }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [flagDefinitions, setFlagDefinitions] = useState<FlagDefinition[]>([]);
  const [flagUsages, setFlagUsages] = useState<Map<string, FlagUsage[]>>(new Map());
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FlagDefinition | null>(null);
  const [formData, setFormData] = useState<FlagDefinition>({
    name: '',
    type: 'boolean',
    defaultValue: false,
    description: '',
    category: 'story',
    isGlobal: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [story.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storyScenes, storyChoices] = await Promise.all([
        storyService.getStoryScenes(story.id),
        storyService.getStoryChoices(story.id)
      ]);
      
      setScenes(storyScenes);
      setChoices(storyChoices);
      
      // Analysiere Flag-Verwendung
      const flagsUsed = new Map<string, FlagUsage[]>();
      const flagsDefinitions: FlagDefinition[] = [];
      
      // Analysiere Szenen
      storyScenes.forEach(scene => {
        analyzeObjectForFlags(scene.conditions, scene.id, scene.title, 'condition', flagsUsed);
        analyzeObjectForFlags(scene.effects, scene.id, scene.title, 'effect', flagsUsed);
      });
      
      // Analysiere Choices
      storyChoices.forEach(choice => {
        const scene = storyScenes.find(s => s.id === choice.scene_id);
        const sceneTitle = scene?.title || 'Unbekannte Szene';
        analyzeObjectForFlags(choice.conditions, scene?.id || '', sceneTitle, 'condition', flagsUsed);
        analyzeObjectForFlags(choice.effects, scene?.id || '', sceneTitle, 'effect', flagsUsed);
      });
      
      // Erstelle Flag-Definitionen basierend auf Verwendung
      flagsUsed.forEach((usages, flagName) => {
        if (!flagsDefinitions.find(f => f.name === flagName)) {
          flagsDefinitions.push({
            name: flagName,
            type: inferFlagType(flagName, usages),
            defaultValue: getDefaultValueForType(inferFlagType(flagName, usages)),
            description: generateFlagDescription(flagName, usages),
            category: inferFlagCategory(flagName),
            isGlobal: false
          });
        }
      });
      
      setFlagDefinitions(flagsDefinitions.sort((a, b) => a.name.localeCompare(b.name)));
      setFlagUsages(flagsUsed);
      
    } catch (err) {
      setError('Fehler beim Laden der Flag-Daten');
      console.error('Failed to load flag data:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeObjectForFlags = (
    obj: any, 
    sceneId: string, 
    sceneTitle: string, 
    type: 'condition' | 'effect', 
    flagsUsed: Map<string, FlagUsage[]>
  ) => {
    if (!obj || typeof obj !== 'object') return;
    
    const findFlags = (data: any, path: string = '') => {
      if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'flag' && typeof value === 'string') {
            const usage: FlagUsage = {
              sceneId,
              sceneTitle,
              type,
              context: path
            };
            
            if (!flagsUsed.has(value)) {
              flagsUsed.set(value, []);
            }
            flagsUsed.get(value)!.push(usage);
          } else if (key.startsWith('flag.')) {
            const flagName = key.substring(5);
            const usage: FlagUsage = {
              sceneId,
              sceneTitle,
              type,
              context: path + key
            };
            
            if (!flagsUsed.has(flagName)) {
              flagsUsed.set(flagName, []);
            }
            flagsUsed.get(flagName)!.push(usage);
          } else if (typeof value === 'object') {
            findFlags(value, path + key + '.');
          }
        });
      }
    };
    
    findFlags(obj);
  };

  const inferFlagType = (flagName: string, usages: FlagUsage[]): 'boolean' | 'string' | 'number' => {
    // Einfache Heuristik basierend auf Flag-Namen
    if (flagName.includes('count') || flagName.includes('level') || flagName.includes('score')) {
      return 'number';
    }
    if (flagName.includes('name') || flagName.includes('text') || flagName.includes('message')) {
      return 'string';
    }
    return 'boolean';
  };

  const getDefaultValueForType = (type: 'boolean' | 'string' | 'number'): any => {
    switch (type) {
      case 'boolean': return false;
      case 'string': return '';
      case 'number': return 0;
    }
  };

  const generateFlagDescription = (flagName: string, usages: FlagUsage[]): string => {
    const conditionUsages = usages.filter(u => u.type === 'condition').length;
    const effectUsages = usages.filter(u => u.type === 'effect').length;
    
    return `Automatisch erkannt. Verwendet in ${conditionUsages} Bedingungen und ${effectUsages} Effekten.`;
  };

  const inferFlagCategory = (flagName: string): string => {
    if (flagName.includes('player') || flagName.includes('name')) return 'player';
    if (flagName.includes('story') || flagName.includes('plot')) return 'story';
    if (flagName.includes('quest') || flagName.includes('mission')) return 'quest';
    if (flagName.includes('character') || flagName.includes('npc')) return 'character';
    return 'story';
  };

  const handleNewFlag = () => {
    setSelectedFlag(null);
    setFormData({
      name: '',
      type: 'boolean',
      defaultValue: false,
      description: '',
      category: 'story',
      isGlobal: false
    });
    setEditDialog(true);
  };

  const handleEditFlag = (flag: FlagDefinition) => {
    setSelectedFlag(flag);
    setFormData({ ...flag });
    setEditDialog(true);
  };

  const handleSaveFlag = () => {
    if (!formData.name.trim()) return;
    
    // Validiere Flag-Name
    const flagNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!flagNameRegex.test(formData.name)) {
      setError('Flag-Name muss mit einem Buchstaben beginnen und darf nur Buchstaben, Zahlen und Unterstriche enthalten');
      return;
    }
    
    // Prüfe auf Duplikate
    const existingFlag = flagDefinitions.find(f => f.name === formData.name && f !== selectedFlag);
    if (existingFlag) {
      setError('Ein Flag mit diesem Namen existiert bereits');
      return;
    }
    
    // Aktualisiere Default Value basierend auf Typ
    const updatedFormData = {
      ...formData,
      defaultValue: formData.type === 'boolean' ? 
        Boolean(formData.defaultValue) :
        formData.type === 'number' ?
        Number(formData.defaultValue) || 0 :
        String(formData.defaultValue)
    };
    
    if (selectedFlag) {
      // Update existing flag
      setFlagDefinitions(flagDefinitions.map(f => 
        f === selectedFlag ? updatedFormData : f
      ));
    } else {
      // Add new flag
      setFlagDefinitions([...flagDefinitions, updatedFormData].sort((a, b) => a.name.localeCompare(b.name)));
    }
    
    setEditDialog(false);
    setError(null);
  };

  const handleDeleteFlag = () => {
    if (!selectedFlag) return;
    
    setFlagDefinitions(flagDefinitions.filter(f => f !== selectedFlag));
    setDeleteDialog(false);
    setSelectedFlag(null);
  };

  const handlePreviewFlag = (flag: FlagDefinition) => {
    setSelectedFlag(flag);
    setPreviewDialog(true);
  };

  const exportFlagDocumentation = () => {
    const documentation = {
      story: {
        id: story.id,
        title: story.title,
        version: '1.0.0'
      },
      flags: flagDefinitions.map(flag => ({
        ...flag,
        usages: flagUsages.get(flag.name) || []
      })),
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(documentation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${story.title}_flags.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFlags = flagDefinitions.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boolean': return 'success';
      case 'string': return 'info';
      case 'number': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'player': return 'primary';
      case 'story': return 'secondary';
      case 'quest': return 'success';
      case 'character': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Flag-Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <TextField
                label="Flags durchsuchen"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 250 }}
              />
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<ExportIcon />}
                  onClick={exportFlagDocumentation}
                >
                  Dokumentation exportieren
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewFlag}
                >
                  Neues Flag
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Flag Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistiken
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Gesamt Flags
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {flagDefinitions.length}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Verwendete Flags
                </Typography>
                <Typography variant="h4" color="success.main">
                  {flagUsages.size}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ungenutzte Flags
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {flagDefinitions.length - flagUsages.size}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Flag List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Flag-Definitionen ({filteredFlags.length})
            </Typography>
            
            {filteredFlags.length === 0 ? (
              <Alert severity="info">
                {searchTerm ? 'Keine Flags gefunden, die den Suchkriterien entsprechen.' : 'Noch keine Flags definiert.'}
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell>Kategorie</TableCell>
                      <TableCell>Standard</TableCell>
                      <TableCell>Verwendungen</TableCell>
                      <TableCell>Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFlags.map((flag) => (
                      <TableRow key={flag.name}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {flag.name}
                            </Typography>
                            {flag.isGlobal && (
                              <Chip label="Global" size="small" color="primary" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={flag.type} 
                            color={getTypeColor(flag.type)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={flag.category} 
                            color={getCategoryColor(flag.category)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <code>{JSON.stringify(flag.defaultValue)}</code>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {flagUsages.get(flag.name)?.length || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handlePreviewFlag(flag)}
                            >
                              <PreviewIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditFlag(flag)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedFlag(flag);
                                setDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Flag Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedFlag ? 'Flag bearbeiten' : 'Neues Flag erstellen'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Flag-Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Nur Buchstaben, Zahlen und Unterstriche. Muss mit Buchstaben beginnen."
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Typ</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    type: e.target.value as any,
                    defaultValue: getDefaultValueForType(e.target.value as any)
                  })}
                  label="Typ"
                >
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Kategorie"
                >
                  <MenuItem value="story">Story</MenuItem>
                  <MenuItem value="player">Player</MenuItem>
                  <MenuItem value="quest">Quest</MenuItem>
                  <MenuItem value="character">Character</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            margin="dense"
            label="Standardwert"
            fullWidth
            variant="outlined"
            value={formData.defaultValue}
            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
            sx={{ mb: 2 }}
            type={formData.type === 'number' ? 'number' : 'text'}
          />

          <TextField
            margin="dense"
            label="Beschreibung"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isGlobal}
                onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
              />
            }
            label="Globales Flag (story-übergreifend)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveFlag} variant="contained" disabled={!formData.name.trim()}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Flag löschen</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Diese Aktion kann nicht rückgängig gemacht werden!
          </Alert>
          <Typography>
            Möchtest du das Flag "{selectedFlag?.name}" wirklich löschen?
          </Typography>
          {selectedFlag && flagUsages.get(selectedFlag.name) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Dieses Flag wird in {flagUsages.get(selectedFlag.name)!.length} Stellen verwendet.
              Die Löschung kann Probleme verursachen.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteFlag} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Flag-Details: {selectedFlag?.name}
        </DialogTitle>
        <DialogContent>
          {selectedFlag && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Typ:</Typography>
                  <Chip label={selectedFlag.type} color={getTypeColor(selectedFlag.type)} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>Kategorie:</Typography>
                  <Chip label={selectedFlag.category} color={getCategoryColor(selectedFlag.category)} variant="outlined" />
                </Grid>
              </Grid>

              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>Standardwert:</Typography>
                <code style={{ padding: '4px 8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  {JSON.stringify(selectedFlag.defaultValue)}
                </code>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>Beschreibung:</Typography>
                <Typography variant="body2">
                  {selectedFlag.description || 'Keine Beschreibung verfügbar'}
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Verwendungen ({flagUsages.get(selectedFlag.name)?.length || 0}):
              </Typography>
              
              {flagUsages.get(selectedFlag.name) && flagUsages.get(selectedFlag.name)!.length > 0 ? (
                <List>
                  {flagUsages.get(selectedFlag.name)!.map((usage, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={usage.sceneTitle}
                        secondary={
                          <Box>
                            <Chip 
                              label={usage.type} 
                              size="small" 
                              color={usage.type === 'condition' ? 'primary' : 'secondary'} 
                              sx={{ mr: 1 }}
                            />
                            {usage.context && (
                              <Typography variant="caption" color="text.secondary">
                                Kontext: {usage.context}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Dieses Flag wird noch nicht verwendet.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// src/components/admin/StoryAnalytics.tsx
// Story-Analyse-Dashboard für Das Magische Zauberbuch
// Version: 1.0.0 - Production Ready

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  AccountTree as TreeIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { storyService } from '../../services/storyService';
import type { Story, Scene, Choice } from '../../types';

interface StoryAnalyticsProps {
  story: Story;
}

interface AnalyticsData {
  sceneCount: number;
  choiceCount: number;
  orphanedScenes: Scene[];
  deadEndScenes: Scene[];
  unreachableScenes: Scene[];
  flagUsage: Map<string, number>;
  averageChoicesPerScene: number;
  maxPathDepth: number;
  estimatedPlaytime: number;
  issues: Issue[];
  recommendations: string[];
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  sceneId?: string;
  choiceId?: string;
}

export const StoryAnalytics: React.FC<StoryAnalyticsProps> = ({ story }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeStory();
  }, [story.id]);

  const analyzeStory = async () => {
    try {
      setLoading(true);
      const [scenes, choices] = await Promise.all([
        storyService.getStoryScenes(story.id),
        storyService.getStoryChoices(story.id)
      ]);

      const analyticsData = performAnalysis(scenes, choices);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Fehler bei der Story-Analyse');
      console.error('Failed to analyze story:', err);
    } finally {
      setLoading(false);
    }
  };

  const performAnalysis = (scenes: Scene[], choices: Choice[]): AnalyticsData => {
    const issues: Issue[] = [];
    const recommendations: string[] = [];

    // Grundstatistiken
    const sceneCount = scenes.length;
    const choiceCount = choices.length;
    const averageChoicesPerScene = sceneCount > 0 ? choiceCount / sceneCount : 0;

    // Startszenen-Analyse
    const startingScenes = scenes.filter(s => s.is_starting_scene);
    if (startingScenes.length === 0) {
      issues.push({
        type: 'error',
        title: 'Keine Startszene',
        description: 'Die Story hat keine als Startszene markierte Szene.'
      });
    } else if (startingScenes.length > 1) {
      issues.push({
        type: 'warning',
        title: 'Mehrere Startszenen',
        description: `${startingScenes.length} Szenen sind als Startszene markiert.`
      });
    }

    // Szenen-Konnektivitäts-Analyse
    const sceneConnections = new Map<string, string[]>();
    choices.forEach(choice => {
      if (choice.target_scene_id) {
        if (!sceneConnections.has(choice.scene_id)) {
          sceneConnections.set(choice.scene_id, []);
        }
        sceneConnections.get(choice.scene_id)!.push(choice.target_scene_id);
      }
    });

    // Finde verwaiste Szenen (keine eingehenden Verbindungen)
    const referencedScenes = new Set<string>();
    startingScenes.forEach(s => referencedScenes.add(s.id));
    choices.forEach(choice => {
      if (choice.target_scene_id) {
        referencedScenes.add(choice.target_scene_id);
      }
    });

    const orphanedScenes = scenes.filter(s => 
      !referencedScenes.has(s.id) && !s.is_starting_scene
    );

    // Finde Sackgassen (keine ausgehenden Verbindungen)
    const deadEndScenes = scenes.filter(s => 
      !sceneConnections.has(s.id) && !s.is_ending_scene
    );

    // Finde unerreichbare Szenen
    const reachableScenes = new Set<string>();
    if (startingScenes.length > 0) {
      const queue = [...startingScenes.map(s => s.id)];
      while (queue.length > 0) {
        const currentSceneId = queue.shift()!;
        if (reachableScenes.has(currentSceneId)) continue;
        
        reachableScenes.add(currentSceneId);
        const connections = sceneConnections.get(currentSceneId) || [];
        queue.push(...connections);
      }
    }

    const unreachableScenes = scenes.filter(s => !reachableScenes.has(s.id));

    // Flag-Verwendungs-Analyse
    const flagUsage = new Map<string, number>();
    const analyzeObjectForFlags = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      const findFlags = (data: any) => {
        if (typeof data === 'object') {
          Object.entries(data).forEach(([key, value]) => {
            if (key === 'flag' && typeof value === 'string') {
              flagUsage.set(value, (flagUsage.get(value) || 0) + 1);
            } else if (key.startsWith('flag.')) {
              const flagName = key.substring(5);
              flagUsage.set(flagName, (flagUsage.get(flagName) || 0) + 1);
            } else if (typeof value === 'object') {
              findFlags(value);
            }
          });
        }
      };
      
      findFlags(obj);
    };

    scenes.forEach(scene => {
      analyzeObjectForFlags(scene.conditions);
      analyzeObjectForFlags(scene.effects);
    });

    choices.forEach(choice => {
      analyzeObjectForFlags(choice.conditions);
      analyzeObjectForFlags(choice.effects);
    });

    // Pfadtiefe berechnen
    let maxPathDepth = 0;
    if (startingScenes.length > 0) {
      const calculateDepth = (sceneId: string, visited: Set<string> = new Set(), depth = 0): number => {
        if (visited.has(sceneId)) return depth; // Zyklus vermeiden
        visited.add(sceneId);
        
        const connections = sceneConnections.get(sceneId) || [];
        if (connections.length === 0) return depth;
        
        return Math.max(...connections.map(targetId => 
          calculateDepth(targetId, new Set(visited), depth + 1)
        ));
      };
      
      maxPathDepth = Math.max(...startingScenes.map(s => 
        calculateDepth(s.id)
      ));
    }

    // Geschätzte Spielzeit (basierend auf Wortanzahl)
    const totalWords = scenes.reduce((sum, scene) => 
      sum + (scene.content?.split(' ').length || 0), 0
    );
    const estimatedPlaytime = Math.round(totalWords / 200); // 200 Wörter pro Minute

    // Probleme sammeln
    orphanedScenes.forEach(scene => {
      issues.push({
        type: 'warning',
        title: 'Verwaiste Szene',
        description: `Szene "${scene.title}" ist von anderen Szenen aus nicht erreichbar.`,
        sceneId: scene.id
      });
    });

    deadEndScenes.forEach(scene => {
      issues.push({
        type: 'warning',
        title: 'Sackgasse',
        description: `Szene "${scene.title}" hat keine Auswahlmöglichkeiten und ist nicht als Ende markiert.`,
        sceneId: scene.id
      });
    });

    unreachableScenes.forEach(scene => {
      issues.push({
        type: 'error',
        title: 'Unerreichbare Szene',
        description: `Szene "${scene.title}" ist von der Startszene aus nicht erreichbar.`,
        sceneId: scene.id
      });
    });

    // Empfehlungen generieren
    if (averageChoicesPerScene < 2) {
      recommendations.push('Erwäge mehr Entscheidungsmöglichkeiten zu schaffen, um die Interaktivität zu erhöhen.');
    }

    if (maxPathDepth < 5) {
      recommendations.push('Die Story könnte von längeren Handlungssträngen profitieren.');
    }

    if (flagUsage.size === 0) {
      recommendations.push('Verwende Flags, um personalisierte und verzweigte Handlungsverläufe zu erstellen.');
    }

    if (sceneCount < 10) {
      recommendations.push('Füge weitere Szenen hinzu, um eine reichhaltigere Spielerfahrung zu schaffen.');
    }

    return {
      sceneCount,
      choiceCount,
      orphanedScenes,
      deadEndScenes,
      unreachableScenes,
      flagUsage,
      averageChoicesPerScene,
      maxPathDepth,
      estimatedPlaytime,
      issues,
      recommendations
    };
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <CheckIcon color="info" />;
      default: return <CheckIcon />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Story-Analyse</Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Analysiere Story-Struktur...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Story-Analyse</Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Story-Analyse</Typography>
        <Alert severity="info">Keine Analysedaten verfügbar</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Story-Analyse
      </Typography>

      {/* Übersichts-Statistiken */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Szenen
              </Typography>
              <Typography variant="h4" component="div">
                {analytics.sceneCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Entscheidungen
              </Typography>
              <Typography variant="h4" component="div">
                {analytics.choiceCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Maximale Pfadtiefe
              </Typography>
              <Typography variant="h4" component="div">
                {analytics.maxPathDepth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Geschätzte Spielzeit
              </Typography>
              <Typography variant="h4" component="div">
                {analytics.estimatedPlaytime} Min.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Probleme und Warnungen */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Probleme und Warnungen ({analytics.issues.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {analytics.issues.length === 0 ? (
            <Alert severity="success" icon={<CheckIcon />}>
              Keine Probleme gefunden! Deine Story-Struktur sieht gut aus.
            </Alert>
          ) : (
            <List>
              {analytics.issues.map((issue, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getIssueIcon(issue.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {issue.title}
                        </Typography>
                        <Chip 
                          label={issue.type} 
                          color={getIssueColor(issue.type)} 
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={issue.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Detailanalyse */}
      <Grid container spacing={2}>
        {/* Flag-Verwendung */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Flag-Verwendung ({analytics.flagUsage.size})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {analytics.flagUsage.size === 0 ? (
                <Alert severity="info">
                  Keine Flags verwendet. Flags ermöglichen komplexere Story-Verzweigungen.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Flag-Name</TableCell>
                        <TableCell>Verwendungen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from(analytics.flagUsage.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([flagName, count]) => (
                          <TableRow key={flagName}>
                            <TableCell>{flagName}</TableCell>
                            <TableCell>{count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Empfehlungen */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Empfehlungen ({analytics.recommendations.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {analytics.recommendations.length === 0 ? (
                <Alert severity="success">
                  Keine spezifischen Empfehlungen. Deine Story ist gut strukturiert!
                </Alert>
              ) : (
                <List>
                  {analytics.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

// src/components/admin/ImportExportPanel.tsx
// Import/Export-Panel für Das Magische Zauberbuch
// Version: 1.0.0 - Production Ready

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  FileUpload as ImportIcon,
  GetApp as ExportIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { storyService } from '../../services/storyService';
import { utilityService } from '../../services/utilityService';
import type { Story } from '../../types';

interface ImportExportPanelProps {
  stories: Story[];
  onStoriesUpdate: (stories: Story[]) => void;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
}

interface ImportResult {
  success: boolean;
  story?: Story;
  errors: string[];
  warnings: string[];
}

const exportFormats: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON (Vollständig)',
    description: 'Vollständiger Export aller Story-Daten im JSON-Format',
    extension: 'json',
    mimeType: 'application/json'
  },
  {
    id: 'zauberbuch',
    name: 'Zauberbuch-Format',
    description: 'Optimiertes Format für Das Magische Zauberbuch',
    extension: 'zauberbuch',
    mimeType: 'application/zauberbuch'
  },
  {
    id: 'twine',
    name: 'Twine-kompatibel',
    description: 'Export in einem Twine-ähnlichen Format',
    extension: 'twee',
    mimeType: 'text/plain'
  }
];

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  stories,
  onStoriesUpdate
}) => {
  const [exportDialog, setExportDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(exportFormats[0]);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExportStory = async () => {
    if (!selectedStory) return;

    try {
      setLoading(true);
      
      let exportData: string;
      let filename: string;
      
      switch (selectedFormat.id) {
        case 'json':
          exportData = await exportAsJSON(selectedStory);
          filename = `${selectedStory.title}.json`;
          break;
        case 'zauberbuch':
          exportData = await exportAsZauberbuch(selectedStory);
          filename = `${selectedStory.title}.zauberbuch`;
          break;
        case 'twine':
          exportData = await exportAsTwine(selectedStory);
          filename = `${selectedStory.title}.twee`;
          break;
        default:
          throw new Error('Unbekanntes Export-Format');
      }

      await utilityService.downloadFile(exportData, filename, selectedFormat.mimeType);
      setExportDialog(false);
      
    } catch (err) {
      setError('Fehler beim Exportieren der Story');
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportStory = async () => {
    if (!importFile) return;

    try {
      setLoading(true);
      
      const fileContent = await readFileContent(importFile);
      const result = await importStoryFromFile(fileContent, importFile.name);
      
      setImportResult(result);
      
      if (result.success && result.story) {
        onStoriesUpdate([...stories, result.story]);
      }
      
    } catch (err) {
      setError('Fehler beim Importieren der Story');
      console.error('Import failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportAsJSON = async (story: Story): Promise<string> => {
    // Vollständiger Export mit allen Daten
    const [scenes, choices] = await Promise.all([
      storyService.getStoryScenes(story.id),
      storyService.getStoryChoices(story.id)
    ]);

    const exportData = {
      format: 'zauberbuch-json',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      story: {
        ...story,
        scenes: scenes.map(scene => ({
          ...scene,
          choices: choices.filter(choice => choice.scene_id === scene.id)
        }))
      }
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportAsZauberbuch = async (story: Story): Promise<string> => {
    // Optimiertes Format für Das Magische Zauberbuch
    const [scenes, choices] = await Promise.all([
      storyService.getStoryScenes(story.id),
      storyService.getStoryChoices(story.id)
    ]);

    const exportData = {
      format: 'zauberbuch',
      version: '1.0.0',
      story: {
        title: story.title,
        description: story.description,
        metadata: {
          ...story.metadata,
          exportDate: new Date().toISOString()
        }
      },
      scenes: scenes.map(scene => ({
        id: scene.id,
        title: scene.title,
        content: scene.content,
        type: scene.type,
        isStart: scene.is_starting_scene,
        isEnd: scene.is_ending_scene,
        order: scene.order_index,
        conditions: scene.conditions,
        effects: scene.effects,
        choices: choices
          .filter(choice => choice.scene_id === scene.id)
          .map(choice => ({
            id: choice.id,
            text: choice.text,
            target: choice.target_scene_id,
            type: choice.type,
            conditions: choice.conditions,
            effects: choice.effects
          }))
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportAsTwine = async (story: Story): Promise<string> => {
    // Twine-kompatibles Format
    const [scenes, choices] = await Promise.all([
      storyService.getStoryScenes(story.id),
      storyService.getStoryChoices(story.id)
    ]);

    let twineContent = `:: ${story.title}\n`;
    twineContent += `${story.description || ''}\n\n`;

    scenes.forEach(scene => {
      twineContent += `:: ${scene.title}`;
      if (scene.is_starting_scene) {
        twineContent += ` [start]`;
      }
      twineContent += `\n`;
      twineContent += `${scene.content}\n`;
      
      const sceneChoices = choices.filter(choice => choice.scene_id === scene.id);
      sceneChoices.forEach(choice => {
        const targetScene = scenes.find(s => s.id === choice.target_scene_id);
        const targetTitle = targetScene?.title || 'Unknown';
        twineContent += `[[${choice.text}|${targetTitle}]]\n`;
      });
      
      twineContent += `\n`;
    });

    return twineContent;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const importStoryFromFile = async (content: string, filename: string): Promise<ImportResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let storyData: any;

      // Erkenne Dateiformat
      if (filename.endsWith('.json') || filename.endsWith('.zauberbuch')) {
        storyData = JSON.parse(content);
      } else if (filename.endsWith('.twee') || filename.endsWith('.tw')) {
        // Twine-Import (vereinfacht)
        storyData = parseTwineContent(content);
      } else {
        errors.push('Unbekanntes Dateiformat');
        return { success: false, errors, warnings };
      }

      // Validiere Story-Daten
      const validationResult = validateImportData(storyData);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (errors.length > 0) {
        return { success: false, errors, warnings };
      }

      // Importiere Story
      const importedStory = await storyService.importStory(storyData);
      
      return {
        success: true,
        story: importedStory,
        errors,
        warnings
      };

    } catch (err) {
      errors.push(`Parsing-Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
      return { success: false, errors, warnings };
    }
  };

  const parseTwineContent = (content: string): any => {
    // Vereinfachter Twine-Parser
    const passages = content.split('::').filter(p => p.trim());
    const storyTitle = passages[0]?.trim() || 'Importierte Story';
    
    const scenes = passages.slice(1).map((passage, index) => {
      const lines = passage.trim().split('\n');
      const titleLine = lines[0] || `Szene ${index + 1}`;
      const title = titleLine.replace(/\[.*?\]/g, '').trim();
      const isStart = titleLine.includes('[start]');
      
      const content = lines.slice(1).join('\n').trim();
      
      return {
        title,
        content,
        isStart,
        order: index
      };
    });

    return {
      format: 'twine-import',
      story: {
        title: storyTitle,
        description: 'Aus Twine importiert'
      },
      scenes
    };
  };

  const validateImportData = (data: any): { errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.story) {
      errors.push('Keine Story-Daten gefunden');
      return { errors, warnings };
    }

    if (!data.story.title) {
      errors.push('Story-Titel fehlt');
    }

    if (!data.scenes || !Array.isArray(data.scenes)) {
      errors.push('Keine Szenen-Daten gefunden');
      return { errors, warnings };
    }

    if (data.scenes.length === 0) {
      warnings.push('Story enthält keine Szenen');
    }

    const startingScenes = data.scenes.filter((s: any) => s.isStart || s.is_starting_scene);
    if (startingScenes.length === 0) {
      warnings.push('Keine Startszene gefunden');
    } else if (startingScenes.length > 1) {
      warnings.push('Mehrere Startszenen gefunden');
    }

    return { errors, warnings };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Import & Export
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ExportIcon color="primary" />
                <Typography variant="h6">
                  Story exportieren
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Exportiere deine Geschichten in verschiedene Formate für Backup oder 
                zur Verwendung in anderen Tools.
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                Wähle eine Story und ein Format zum Exportieren aus.
              </Alert>
            </CardContent>
            
            <CardActions>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
                disabled={stories.length === 0}
              >
                Exportieren
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Import Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ImportIcon color="primary" />
                <Typography variant="h6">
                  Story importieren
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Importiere Geschichten aus JSON-, Zauberbuch- oder Twine-Dateien.
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                Beim Import werden neue Story-IDs vergeben. Bestehende Referenzen 
                können verloren gehen.
              </Alert>
            </CardContent>
            
            <CardActions>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setImportDialog(true)}
              >
                Importieren
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Format Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Unterstützte Formate
            </Typography>
            
            <Grid container spacing={2}>
              {exportFormats.map((format) => (
                <Grid item xs={12} md={4} key={format.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {format.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format.description}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Dateiendung: .{format.extension}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Story exportieren</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Story auswählen</InputLabel>
            <Select
              value={selectedStory?.id || ''}
              onChange={(e) => {
                const story = stories.find(s => s.id === e.target.value);
                setSelectedStory(story || null);
              }}
              label="Story auswählen"
            >
              {stories.map((story) => (
                <MenuItem key={story.id} value={story.id}>
                  {story.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Export-Format</InputLabel>
            <Select
              value={selectedFormat.id}
              onChange={(e) => {
                const format = exportFormats.find(f => f.id === e.target.value);
                setSelectedFormat(format || exportFormats[0]);
              }}
              label="Export-Format"
            >
              {exportFormats.map((format) => (
                <MenuItem key={format.id} value={format.id}>
                  {format.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info">
            {selectedFormat.description}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleExportStory}
            variant="contained"
            disabled={!selectedStory || loading}
          >
            Exportieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Story importieren</DialogTitle>
        <DialogContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <input
            accept=".json,.zauberbuch,.twee,.tw"
            style={{ display: 'none' }}
            id="import-file-input"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="import-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Datei auswählen
            </Button>
          </label>

          {importFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Ausgewählte Datei: {importFile.name}
            </Alert>
          )}

          {importResult && (
            <Box sx={{ mb: 2 }}>
              {importResult.success ? (
                <Alert severity="success" icon={<SuccessIcon />}>
                  Import erfolgreich! Story "{importResult.story?.title}" wurde erstellt.
                </Alert>
              ) : (
                <Alert severity="error">
                  Import fehlgeschlagen
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="error">
                    Fehler:
                  </Typography>
                  <List dense>
                    {importResult.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {importResult.warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="warning.main">
                    Warnungen:
                  </Typography>
                  <List dense>
                    {importResult.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>
            {importResult?.success ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!importResult?.success && (
            <Button
              onClick={handleImportStory}
              variant="contained"
              disabled={!importFile || loading}
            >
              Importieren
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};