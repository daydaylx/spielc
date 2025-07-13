# Das Magische Zauberbuch - Vollständige Projektstruktur

```
zauberbuch-pwa/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   ├── icon-maskable-192x192.png
│   │   └── icon-maskable-512x512.png
│   ├── images/
│   │   ├── backgrounds/
│   │   │   ├── magic-forest.webp
│   │   │   ├── castle.webp
│   │   │   └── mystical-cave.webp
│   │   └── ui/
│   │       ├── book-texture.webp
│   │       ├── parchment.webp
│   │       └── magical-border.svg
│   ├── fonts/
│   │   ├── Cinzel-Regular.woff2
│   │   ├── Cinzel-Bold.woff2
│   │   ├── CinzelDecorative-Regular.woff2
│   │   └── EBGaramond-Regular.woff2
│   ├── manifest.json
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── BackgroundAnimation.tsx
│   │   ├── game/
│   │   │   ├── GameInterface.tsx
│   │   │   ├── SceneDisplay.tsx
│   │   │   ├── ChoiceCard.tsx
│   │   │   ├── PlayerStats.tsx
│   │   │   ├── InventoryDisplay.tsx
│   │   │   └── StoryProgress.tsx
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── SceneEditor.tsx
│   │   │   ├── CharacterEditor.tsx
│   │   │   ├── FlagManager.tsx
│   │   │   ├── AISceneGenerator.tsx
│   │   │   ├── PreviewModal.tsx
│   │   │   └── ExportDialog.tsx
│   │   ├── ui/
│   │   │   ├── AnimatedButton.tsx
│   │   │   ├── FadeTransition.tsx
│   │   │   ├── GlowEffect.tsx
│   │   │   ├── ParchmentCard.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── common/
│   │       ├── ErrorBoundary.tsx
│   │       ├── ProtectedRoute.tsx
│   │       ├── OfflineIndicator.tsx
│   │       └── ValidationFeedback.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── GamePage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AboutPage.tsx
│   ├── contexts/
│   │   ├── GameContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── OfflineContext.tsx
│   │   └── NotificationContext.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── supabaseClient.ts
│   │   │   ├── authService.ts
│   │   │   ├── gameService.ts
│   │   │   ├── adminService.ts
│   │   │   └── aiService.ts
│   │   ├── storage/
│   │   │   ├── localStorage.ts
│   │   │   ├── gameState.ts
│   │   │   └── cacheManager.ts
│   │   └── utils/
│   │       ├── exportUtils.ts
│   │       ├── validationUtils.ts
│   │       ├── formatUtils.ts
│   │       └── imageUtils.ts
│   ├── hooks/
│   │   ├── useGame.ts
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useOffline.ts
│   │   ├── useNotification.ts
│   │   └── useTheme.ts
│   ├── types/
│   │   ├── game.ts
│   │   ├── scene.ts
│   │   ├── character.ts
│   │   ├── flags.ts
│   │   ├── stats.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── data/
│   │   ├── scenes/
│   │   │   ├── scenes.ts
│   │   │   ├── characters.ts
│   │   │   └── items.ts
│   │   ├── gameConfig.ts
│   │   ├── constants.ts
│   │   └── defaultSettings.ts
│   ├── styles/
│   │   ├── immersiveTheme.ts
│   │   ├── animations.css
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── fonts.css
│   ├── utils/
│   │   ├── gameLogic.ts
│   │   ├── flagProcessor.ts
│   │   ├── statCalculator.ts
│   │   ├── sceneBranching.ts
│   │   └── textParser.ts
│   ├── devtools/
│   │   ├── DevPanel.tsx
│   │   ├── DebugStats.tsx
│   │   ├── SceneSelector.tsx
│   │   ├── FlagEditor.tsx
│   │   └── TestRunner.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_game_tables.sql
│   │   ├── 003_flags_and_stats.sql
│   │   ├── 004_ai_logs.sql
│   │   └── 005_user_profiles.sql
│   ├── functions/
│   │   ├── get-scene/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── generate-scene/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── save-progress/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── get-offline-data/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   └── admin-operations/
│   │       ├── index.ts
│   │       └── package.json
│   ├── seed.sql
│   └── config.toml
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── GAME_DESIGN.md
│   └── TECHNICAL.md
├── tests/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── setup.ts
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
└── LICENSE
```

## 📋 Datei-Kategorien

### **Konfiguration & Build**
- `package.json` - NPM-Abhängigkeiten und Scripts
- `vite.config.ts` - Vite-Konfiguration mit PWA-Plugin
- `tsconfig.json` - TypeScript-Konfiguration
- `tailwind.config.js` - Tailwind CSS-Konfiguration
- `index.html` - Haupt-HTML-Template

### **Frontend Core**
- `src/main.tsx` - Anwendungs-Einstiegspunkt
- `src/App.tsx` - Haupt-App-Komponente mit Routing
- `src/pages/` - Hauptseiten der Anwendung
- `src/components/` - Wiederverwendbare UI-Komponenten

### **Game Logic**
- `src/data/scenes/` - Spielinhalte und Szenen
- `src/utils/` - Spiellogik und Berechnungen
- `src/types/` - TypeScript-Definitionen
- `src/contexts/` - React Context für State Management

### **Backend & API**
- `supabase/migrations/` - Datenbankschema
- `supabase/functions/` - Edge Functions für KI und API
- `src/services/api/` - Frontend-API-Services

### **Styling & Assets**
- `src/styles/` - Theme und CSS-Dateien
- `public/images/` - Spielgrafiken und UI-Assets
- `public/fonts/` - Webfonts
- `public/icons/` - PWA-Icons

### **Development Tools**
- `src/devtools/` - Debug- und Test-Komponenten
- `tests/` - Test-Suites
- `docs/` - Projektdokumentation