# File: .env.example
# Das Magische Zauberbuch - Environment Configuration
# Kopiere diese Datei zu .env.local und fülle die Werte aus

# ==============================================
# SUPABASE KONFIGURATION
# ==============================================
# Supabase Project URL (von deinem Supabase Dashboard)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon Key (öffentlicher Schlüssel für Frontend)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Project Reference (für Service Worker Caching)
VITE_SUPABASE_PROJECT_REF=your-project-ref

# Supabase Service Role Key (nur für Server-Side/Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ==============================================
# OPENROUTER KI-API KONFIGURATION
# ==============================================
# OpenRouter API Key für KI-Szenen-Generierung
VITE_OPENROUTER_API_KEY=your-openrouter-api-key

# OpenRouter Site URL (optional, für API Referrer)
VITE_OPENROUTER_SITE_URL=https://your-domain.com

# OpenRouter Site Name (optional, für API Referrer)
VITE_OPENROUTER_SITE_NAME=Das Magische Zauberbuch

# Standard KI-Modell für Szenen-Generierung
VITE_DEFAULT_AI_MODEL=openai/gpt-4o-mini

# ==============================================
# ANWENDUNGSKONFIGURATION
# ==============================================
# Anwendungs-Umgebung (development, staging, production)
VITE_APP_ENV=development

# Basis-URL der Anwendung
VITE_APP_BASE_URL=http://localhost:3000

# API Base URL (für Edge Functions)
VITE_API_BASE_URL=https://your-project-ref.supabase.co/functions/v1

# ==============================================
# FEATURE FLAGS
# ==============================================
# Admin-Panel aktivieren/deaktivieren
VITE_ENABLE_ADMIN_PANEL=true

# Debug-Modus aktivieren
VITE_ENABLE_DEBUG_MODE=true

# KI-Features aktivieren
VITE_ENABLE_AI_FEATURES=true

# Offline-Modus aktivieren
VITE_ENABLE_OFFLINE_MODE=true

# Export-Features aktivieren
VITE_ENABLE_EXPORT_FEATURES=true

# ==============================================
# EXTERNE SERVICES (Optional)
# ==============================================
# Pollinations.ai für Bild-Generierung (optional)
VITE_POLLINATIONS_API_KEY=your-pollinations-key

# Sentry für Error Tracking (optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Google Analytics (optional)
VITE_GA_TRACKING_ID=your-ga-tracking-id

# ==============================================
# ENTWICKLUNG & TESTING
# ==============================================
# Test-Datenbank URL (für lokale Tests)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# JWT Secret für Tests
TEST_JWT_SECRET=your-test-jwt-secret

# Mock API für Tests aktivieren
VITE_USE_MOCK_API=false

# ==============================================
# SICHERHEITSKONFIGURATION
# ==============================================
# CORS Origins (kommagetrennt)
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Session Timeout (in Minuten)
SESSION_TIMEOUT=60

# Max. Anzahl API-Requests pro Minute
RATE_LIMIT_PER_MINUTE=100

# ==============================================
# ANLEITUNG ZUR EINRICHTUNG
# ==============================================
# 
# 1. Erstelle ein Supabase-Projekt: https://supabase.com
#    - Kopiere Project URL und Anon Key
#    - Führe die Migrations aus: npm run supabase:reset
#
# 2. Erstelle ein OpenRouter-Konto: https://openrouter.ai
#    - Generiere einen API Key
#    - Füge Credits hinzu für KI-Anfragen
#
# 3. Kopiere diese Datei zu .env.local:
#    cp .env.example .env.local
#
# 4. Fülle alle benötigten Werte aus
#
# 5. Starte die Entwicklungsumgebung:
#    npm run dev
#
# ==============================================
# PRODUKTIONS-DEPLOYMENT
# ==============================================
#
# Für Production zusätzlich setzen:
# - VITE_APP_ENV=production
# - VITE_APP_BASE_URL=https://your-domain.com
# - Entferne alle DEBUG-Flags
# - Setze starke Passwörter und Keys