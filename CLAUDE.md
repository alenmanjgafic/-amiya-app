# CLAUDE.md - Amiya App Kontext

## Projekt-Übersicht

**Amiya** ist ein KI-basierter Beziehungscoach mit Voice-first Ansatz. Die App ermöglicht Einzelpersonen und Paaren, in Echtzeit-Sprachsessions über ihre Beziehung zu sprechen.

- **Sprache:** Deutsch
- **Zielgruppe:** Paare & Einzelpersonen die an ihrer Beziehung arbeiten wollen
- **Kernidee:** Therapeutischer KI-Coach der zuhört, reflektiert und sanft herausfordert

### Hauptfunktionen

1. **Solo Sessions** - Ein Partner spricht alleine mit Amiya
2. **Couple Sessions** - Beide Partner gemeinsam in einer moderierten Session
3. **Agreements** - Paare können Vereinbarungen treffen und tracken
4. **Memory System** - Kontextbewusstes Coaching über Sessions hinweg

---

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 14.0.4 (App Router) |
| Frontend | React 18 |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| KI Analyse | Anthropic Claude (claude-sonnet-4-20250514) |
| Voice | ElevenLabs Conversational AI |
| Styling | Inline CSS-in-JS (styles Objekte) |

### Wichtige Dependencies

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@anthropic-ai/sdk": "^0.24.0",
  "@elevenlabs/client": "^0.12.2"
}
```

---

## Architektur-Übersicht

```
/app                      # Next.js App Router
  /page.js               # Solo Session (Hauptseite)
  /auth/                 # Login/Signup
  /profile/              # Benutzereinstellungen
  /onboarding/           # Ersteinrichtung + Memory Consent
  /history/              # Session-Verlauf
  /wir/                  # Paar-Features ("Wir"-Bereich)
    /connect/            # Paar-Verbindung via Code
  /session/couple/       # Couple Session
  /api/                  # Backend API Routes

/components              # React Komponenten
  AgreementsList.js      # Liste aller Vereinbarungen
  AgreementDetail.js     # Einzelansicht + Check-ins
  CreateAgreement.js     # Neue Vereinbarung erstellen
  AnalysisView.js        # Session-Analyse anzeigen
  DisconnectDialog.js    # Paar-Trennung verwalten

/lib                     # Shared Utilities
  AuthContext.js         # Auth State + Profile Management
  sessions.js            # Session CRUD Service
  supabase.js            # Supabase Client
```

---

## Wichtige Design-Entscheidungen

### 1. ElevenLabs Agent ID

```javascript
const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";
```

- Der ElevenLabs Agent ist vorkonfiguriert mit Amiyas Persönlichkeit
- Dynamic Variables werden bei Session-Start übergeben:
  - `user_name`: Name des Users
  - `partner_name`: Name des Partners
  - `user_context`: Kontext aus Memory System (max 4000 Zeichen)

### 2. Memory System mit Consent

Das Memory System speichert Kontext zwischen Sessions, aber **nur mit expliziter Zustimmung**.

**Consent-Flow:**
1. User durchläuft Onboarding (`/onboarding`)
2. Wird zu `/onboarding/memory` weitergeleitet
3. Muss aktiv zustimmen oder ablehnen
4. `memory_consent` + `memory_consent_at` werden in `profiles` gespeichert

**Zwei Kontext-Typen:**
- `personal_context` (nur für den User sichtbar) - in `profiles`
- `shared_context` (für beide Partner) - in `couples`

**Privacy:**
- Transkripte werden nach Analyse gelöscht (`summary: null`)
- Keine Kinder-Namen speichern (GDPR)
- Solo-Aussagen über Partner bleiben privat

### 3. "Gentle Challenger" Therapeutischer Ansatz

Amiya folgt dem **Gottman-Modell** für Beziehungstherapie:

- **Validierung zuerst**, dann sanft herausfordern
- Perpetual Issues als normal anerkennen (69% aller Konflikte)
- Muster erkennen: Pursuer-Distancer, Demand-Withdraw, etc.
- Stärken des Paares betonen
- Vereinbarungen vorschlagen wenn passend

**Analyse-Stil:**
- Warm und unterstützend, nicht klinisch
- Namen verwenden
- Solo: du-Form, Couple: ihr-Form
- Max 400 Wörter (Solo), 2500 tokens (Couple)

---

## DB Schema Übersicht

### profiles

```sql
id              uuid (PK, FK to auth.users)
name            text              -- Eigener Name
partner_name    text              -- Partner Name
email           text
memory_consent  boolean           -- Zustimmung zum Memory System
memory_consent_at timestamp
personal_context jsonb            -- Privater Kontext (Solo Sessions)
couple_id       uuid (FK)         -- Verknüpfung zum Couple
partner_id      uuid (FK)         -- ID des Partners
privacy_accepted_at timestamp
terms_accepted_at timestamp
created_at      timestamp
```

### couples

```sql
id              uuid (PK)
user_a_id       uuid (FK)         -- Erster Partner
user_b_id       uuid (FK)         -- Zweiter Partner
status          text              -- 'active', 'disconnected'
shared_context  jsonb             -- Gemeinsamer Kontext
created_at      timestamp
```

### sessions

```sql
id              uuid (PK)
user_id         uuid (FK)         -- Wer hat gestartet
couple_id       uuid (FK)         -- Für Couple Sessions
type            text              -- 'solo' | 'couple'
status          text              -- 'active' | 'completed'
summary         text              -- Transkript (wird nach Analyse gelöscht)
analysis        text              -- Claude-generierte Analyse
themes          text[]            -- Erkannte Themen
analysis_created_at timestamp
created_at      timestamp
ended_at        timestamp
```

### agreements

```sql
id                      uuid (PK)
couple_id               uuid (FK)
created_by_user_id      uuid (FK)
created_in_session_id   uuid (FK)
title                   text
description             text
underlying_need         text        -- Das Bedürfnis dahinter
type                    text        -- 'behavior', 'commitment', 'experiment'
status                  text        -- 'pending_approval', 'active', 'achieved', 'dissolved'
responsible_user_id     uuid (FK)   -- null = beide verantwortlich
frequency               text
experiment_end_date     date
requires_mutual_approval boolean
approved_by             uuid[]
check_in_frequency_days int (default 14)
next_check_in_at        timestamp
success_streak          int
themes                  text[]
created_at              timestamp
```

### agreement_checkins

```sql
id              uuid (PK)
agreement_id    uuid (FK)
user_id         uuid (FK)
status          text        -- 'good', 'partial', 'missed'
success_count   int
total_count     int
notes           text
created_at      timestamp
```

### agreement_suggestions

```sql
id                  uuid (PK)
couple_id           uuid (FK)
session_id          uuid (FK)
title               text
underlying_need     text
responsible         text        -- 'user_a', 'user_b', 'both'
status              text        -- 'pending', 'accepted', 'dismissed'
created_agreement_id uuid (FK)
created_at          timestamp
```

### invite_codes

```sql
id              uuid (PK)
code            text (unique)   -- 6-stelliger Code
created_by_id   uuid (FK)
used_by_id      uuid (FK)
status          text            -- 'pending', 'used', 'expired'
expires_at      timestamp
created_at      timestamp
```

---

## API Routes Übersicht

### Voice & Chat

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/chat` | POST | Claude Chat (für Text-basierte Interaktion) |
| `/api/speak` | POST | ElevenLabs TTS |

### Session & Analyse

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/analyze` | POST | Session-Analyse mit Claude |
| `/api/check-analysis` | POST | Prüft ob Analyse sinnvoll ist |
| `/api/debug-analyze` | POST | Debug-Endpoint für Analyse |

### Memory System

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/memory/get` | POST | Lädt Kontext für Session-Start |
| `/api/memory/update` | POST | Aktualisiert Kontext nach Session |
| `/api/memory/delete` | POST | Löscht Memory-Daten |

### Agreements

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/agreements` | GET | Liste aller Agreements |
| `/api/agreements` | POST | Neues Agreement erstellen |
| `/api/agreements/[id]` | GET/PATCH/DELETE | Einzelnes Agreement |
| `/api/agreements/[id]/checkin` | POST | Check-in für Agreement |
| `/api/agreements/suggestions` | GET | KI-generierte Vorschläge |

### Couple Management

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/couple/disconnect` | GET/POST | Paar-Verbindung trennen |

---

## Aktueller Stand / Offene Themen

### Implementiert

- [x] Solo Voice Sessions mit ElevenLabs
- [x] Couple Sessions
- [x] Memory System mit Consent
- [x] Session-Analyse mit Agreement-Detection
- [x] Agreement CRUD + Check-ins
- [x] Paar-Verbindung via Invite-Codes
- [x] Paar-Trennung mit Learnings-Option
- [x] Session History

### Bekannte Limitierungen

- **Kontext-Limit:** 4000 Zeichen für ElevenLabs Dynamic Variables
- **Analyse:** Solo max 400 Wörter, Couple detaillierter
- **Check-ins:** Werden proaktiv in Couple Sessions angesprochen

### Potenzielle Erweiterungen

- Push Notifications für Check-in Reminders
- Tiefere Integration mit Gottman-Konzepten
- Fortschritts-Visualisierung
- Export-Funktion für Insights
- Multi-Sprachen Support

---

## Entwicklungs-Hinweise

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
ELEVENLABS_API_KEY=...  (im ElevenLabs Agent konfiguriert)
```

### Lokale Entwicklung

```bash
npm install
npm run dev
```

### Wichtige Konventionen

1. **Styling:** Inline styles via `styles` Objekte am Ende jeder Komponente
2. **State:** React useState + useEffect, kein Redux
3. **API:** Next.js Route Handlers (app/api/*/route.js)
4. **DB:** Supabase Client (Browser) vs Service Role (API Routes)
5. **Sprache:** Alle UI-Texte auf Deutsch

---

## Dokumentation

- **ElevenLabs Agent System Prompt:** Siehe [docs/ELEVENLABS_AGENT.md](docs/ELEVENLABS_AGENT.md) für den vollständigen Voice Agent Prompt mit Amiyas Persönlichkeit, Gesprächsführung, Turn-Taking Regeln und Agreement Detection.

- **Agreement System:** Siehe [docs/AGREEMENT_SYSTEM.md](docs/AGREEMENT_SYSTEM.md) für die vollständige Dokumentation des Vereinbarungssystems - von der Erkennung in der Analyse bis zur Bestätigung durch die verantwortliche Person.
