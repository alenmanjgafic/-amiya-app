# CLAUDE.md - Amiya App Kontext

## Projekt-Übersicht

**Amiya** ist ein KI-basierter Beziehungscoach mit Voice-first Ansatz. Die App ermöglicht Einzelpersonen und Paaren, in Echtzeit-Sprachsessions über ihre Beziehung zu sprechen.

- **Sprache:** Deutsch
- **Zielgruppe:** Paare & Einzelpersonen die an ihrer Beziehung arbeiten wollen
- **Kernidee:** Therapeutischer KI-Coach der zuhört, reflektiert und sanft herausfordert

### Hauptfunktionen

1. **Solo Sessions** - Ein Partner spricht alleine mit Amiya (Voice)
2. **Couple Sessions** - Beide Partner gemeinsam in einer moderierten Session (Voice)
3. **Nachrichtenanalyse** - Chat-Nachrichten (WhatsApp, iMessage, etc.) analysieren lassen
4. **Worte finden** - Message Coach hilft bei der Formulierung von Nachrichten
5. **Archetypen-Quiz** - 24 Fragen zu 4 Dimensionen → einer von 11 Beziehungstypen
6. **Agreements** - Paare können Vereinbarungen treffen und tracken
7. **Memory System** - Kontextbewusstes Coaching über Sessions hinweg

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
  /page.js               # Home mit Feature-Carousel
  /auth/                 # Login/Signup
  /profile/              # Benutzereinstellungen
  /onboarding/           # Ersteinrichtung (3 Schritte)
    /memory/             # Schritt 2: Memory Consent
    /analysis/           # Schritt 3: Analyse-Einstellungen
  /history/              # Session-Verlauf (alle Session-Typen)
  /wir/                  # Paar-Features ("Wir"-Bereich)
    /connect/            # Paar-Verbindung via Code
    /archetypen/         # Paar-Vergleich der Archetypen
  /session/
    /solo/               # Solo Session (Voice) - Dedicated page
    /couple/             # Couple Session (Voice)
  /analyze/message/      # Nachrichtenanalyse (Text einfügen + analysieren)
  /coach/message/        # Message Coach ("Worte finden")
  /quiz/                 # Archetypen-Quiz
    /questions/          # 24 Quiz-Fragen
    /result/             # Ergebnis-Seite
  /api/                  # Backend API Routes

/components              # React Komponenten
  FeatureCarousel.js     # Swipeable Carousel für Home
  AgreementsList.js      # Liste aller Vereinbarungen
  AgreementDetail.js     # Einzelansicht + Check-ins
  CreateAgreement.js     # Neue Vereinbarung erstellen
  AnalysisView.js        # Session-Analyse anzeigen
  DisconnectDialog.js    # Paar-Trennung verwalten
  ArchetypeIcons.js      # SVG Icons für 11 Archetypen
  QuizComparisonCard.js  # Quiz-Sharing Status in "Wir"
  /slides/               # Carousel Slides
    SoloSessionSlide.js  # Solo Voice Session starten
    CoupleSessionSlide.js # Couple Session starten
    MessageAnalyzerSlide.js # Nachrichtenanalyse starten
    WordsFinderSlide.js  # Worte finden (Message Coach)
    QuizSlide.js         # Archetypen-Quiz starten

/lib                     # Shared Utilities
  AuthContext.js         # Auth State + Profile Management
  ThemeContext.js        # Theme Provider (Light/Dark Mode)
  sessions.js            # Session CRUD Service
  supabase.js            # Supabase Client
  quizLogic.js           # Archetypen-Quiz Logik, Fragen, Typen, Scoring
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

### 2. Memory System v2 mit Privacy auf Daten-Ebene

Das Memory System speichert Kontext zwischen Sessions, aber **nur mit expliziter Zustimmung**.
Vollständige Dokumentation: [docs/MEMORY_SYSTEM.md](docs/MEMORY_SYSTEM.md)

**Unified Consent Model (2-Step Onboarding):**
1. `/onboarding` - Name + Partner-Name eingeben
2. `/onboarding/memory` - Unified Consent: "Mit Analyse" oder "Ohne Analyse"

**Die Entscheidung setzt BEIDE Werte gleichzeitig:**
- "Mit Analyse" → `memory_consent=true`, `auto_analyze=true`
- "Ohne Analyse" → `memory_consent=false`, `auto_analyze=false`

**Consent-Upgrade via Session-Ende Dialog:**
- Wer "Ohne Analyse" wählt, sieht nach jeder Session einen Dialog
- Dialog erklärt Vorteile der Analyse (nicht aufdringlich)
- Bei Klick auf "Mit Analyse" wird Consent DAUERHAFT aktiviert
- So werden User regelmässig an die Vorteile erinnert

**Privacy-Matrix (auf DATEN-Ebene geschützt!):**
| Datenquelle | Solo Session | Couple Session |
|-------------|--------------|----------------|
| Eigene Solo-Sessions | ✅ Ja | ❌ Nein |
| Partner's Solo-Sessions | ❌ Nein | ❌ Nein |
| Couple-Sessions | ✅ Ja | ✅ Ja |
| Shared Facts | ✅ Ja | ✅ Ja |
| Agreements | ✅ Ja | ✅ Ja |

**Zwei Analyse-Outputs:**
1. `analysis` - User-facing, warm (Solo) oder neutral (Couple)
2. `summary_for_coach` - Internes Summary für Amiyas Gedächtnis

**GDPR-Konformität:**
- Transkripte werden nach Analyse gelöscht (`summary: null`)
- Keine Kinder-Namen in Kontext (nur "Kind (10)")
- Solo-Aussagen über Partner bleiben privat

### 3. Session-Analyse System

Das Analyse-System prüft ob genug Inhalt für eine sinnvolle Analyse vorhanden ist.

**Viability Check (`/api/check-analysis`):**
- Transkript mind. 200 Zeichen
- Mind. 2 User-Nachrichten
- Mind. 50 Zeichen User-Content
- Claude prüft ob substanzieller Inhalt vorhanden

**Analyse-Einstellung (Unified Consent Model):**
- `auto_analyze=true` (= `memory_consent=true`): Automatische Analyse + Memory
- `auto_analyze=false` (= `memory_consent=false`): Dialog zeigt Vorteile + Consent-Upgrade möglich

**Flow bei Session-Ende:**
```
Session endet
     │
     ▼
auto_analyze?
     │
  ┌──────┴──────┐
  │             │
 true         false
  │             │
  ▼             ▼
Viability    Dialog mit
Check        Vorteilen zeigen
  │             │
  │         ┌───┴───┐
  │         │       │
  │      "Ohne"  "Mit Analyse"
  │         │       │
  │         ▼       ▼
  │      Session  Consent-Upgrade:
  │      beenden  memory_consent=true
  │               auto_analyze=true
  │               (dauerhaft!)
  │               │
  ┌──┴──┐         │
  │     │         │
 OK    Zu kurz    │
  │     │         │
  ▼     ▼         ▼
Analyse Modal    Analyse
+Memory "zu kurz" +Memory
+Metrics          +Metrics
```

**Session-Ende Dialog (bei auto_analyze=false):**
- Zeigt Vorteile der Analyse (Muster erkennen, nächste Schritte, Amiya lernt)
- "Empfohlen" Badge auf "Mit Analyse" Button
- Hinweis: "Mit Analyse aktivierst du das Memory-System dauerhaft"
- Bei "Mit Analyse": Consent wird DAUERHAFT auf true gesetzt (kein temporäres Override)
- Gilt für Solo UND Couple Sessions

**"Zu kurz" Modal:**
- Freundliche Erklärung warum keine Analyse möglich
- Tipp für nächstes Mal
- Hinweis dass Session nicht gespeichert wurde
- Session wird automatisch aus DB gelöscht

### 4. Adaptive Coaching System

Das Adaptive Coaching System lernt den Kommunikationsstil jedes Users und passt Amiyas Coaching-Ansatz entsprechend an.

**Engagement-Metriken (pro Session):**
```javascript
{
  user_messages: 5,        // Anzahl User-Nachrichten
  user_chars: 230,         // Zeichen vom User
  ai_chars: 890,           // Zeichen von Amiya
  ratio: 0.21,             // User-Anteil am Gespräch
  avg_msg_length: 46,      // Durchschnitt pro Nachricht
  duration_sec: 340,       // Session-Dauer
  trend: "opening_up"      // Verlauf innerhalb Session
}
```

**Coaching-Profil (aggregiert über alle Sessions):**
```javascript
{
  communication_style: "avoider" | "validator" | "volatile" | "balanced",
  avg_engagement_ratio: 0.32,
  sessions_analyzed: 8,
  trust_level: "building" | "established" | "deep",
  trend: "stable" | "opening_up" | "withdrawing",
  best_approach: "gentle_questions" | "direct_reflection" | "structured",
  notes: ["öffnet sich bei Gefühlsfragen", "braucht Zeit"]
}
```

**Lern-Logik:**
- Gewichteter Durchschnitt: 60% neuere Sessions, 40% ältere
- Stil ändert sich nur bei konsistenten Mustern (2-3 Sessions)
- Durchbrüche werden erkannt (> 2x normaler Ratio)
- Trust-Level basiert auf Session-Anzahl + Engagement

**Kommunikationsstile (nach Gottman):**
| Stil | Beschreibung | Coaching-Ansatz |
|------|--------------|-----------------|
| Avoider | Kurze Antworten, braucht Zeit | Geduld, offene Fragen |
| Validator | Teilt offen, sucht Bestätigung | Direkte Reflexion |
| Volatile | Emotional, schwankend | Struktur geben |
| Balanced | Ausgewogen | Standard-Ansatz |

**Memory-Integration:**
Amiya erhält Coaching-Hinweise im Kontext:
```
COACHING-HINWEISE:
- Kommunikationsstil: zurückhaltend (baut noch Vertrauen auf)
- Trend: Öffnet sich zunehmend
- Ansatz: Geduldig Raum geben, nicht drängen
- Hinweise: Hat sich in letzter Session mehr geöffnet
```

**GDPR:**
- Nur bei `memory_consent = true` gespeichert
- Löschbar via `/api/memory/delete` (deleteType: "personal" oder "all")
- Keine Inhalte, nur Verhaltens-Metriken

### 5. "Gentle Challenger" Therapeutischer Ansatz

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

### 6. Nachrichtenanalyse (Message Analysis)

Die Nachrichtenanalyse ermöglicht es Usern, Chat-Verläufe aus WhatsApp, iMessage oder anderen Messengern analysieren zu lassen.

**Zugang:**
- Via Home-Carousel (3. Slide "Nachricht analysieren")
- Direktlink: `/analyze/message`

**Flow:**
```
1. User kopiert Chat-Verlauf aus Messenger
2. Fügt Text in Textarea ein
3. Gibt optionalen Kontext/Frage ein
4. Klickt "Analysieren"
5. Claude analysiert die Kommunikation
6. Ergebnis wird als Session gespeichert (type: "message_analysis")
7. Optional: "Darüber sprechen" → Solo Session mit Analyse-Kontext
```

**Analyse-Methodik (Gottman + NVC):**

Die Analyse kombiniert zwei therapeutische Frameworks:

1. **Gottman-Methode:**
   - Erkennung der "Four Horsemen" (Kritik, Verachtung, Defensive, Mauern)
   - Positive vs. negative Interaktionen (5:1 Ratio)
   - Repair Attempts (Versöhnungsversuche)
   - Soft vs. Harsh Startup

2. **Gewaltfreie Kommunikation (NVC):**
   - Beobachtung vs. Bewertung
   - Gefühle identifizieren
   - Bedürfnisse erkennen
   - Bitten formulieren

**Analyse-Output:**
- Zusammenfassung des Gesprächsverlaufs
- Erkannte Muster (positiv & problematisch)
- Emotionale Dynamik beider Seiten
- Konkrete Verbesserungsvorschläge
- Alternative Formulierungen (NVC-basiert)

**API Route:** `/api/message-analyze`
- POST: Analysiert eingefügten Text
- Speichert als Session mit `type: "message_analysis"`
- Nutzt Claude claude-sonnet-4-20250514 für Analyse
- Ruft `/api/memory/update` nach Analyse (speichert Erkenntnisse)

**Session-Speicherung:**
```javascript
{
  type: "message_analysis",
  user_id: userId,
  couple_id: coupleId || null,
  summary: originalText,        // Der eingefügte Chat
  analysis: analysisResult,     // Die Analyse
  themes: ["Kommunikation"],
  status: "completed"
}
```

**UI-Besonderheiten:**
- Grosse Textarea für langen Chat-Text
- Optionales Kontext-Feld ("Was beschäftigt dich?")
- Lade-Animation während Analyse
- Ergebnis inline angezeigt (kein Modal)
- "Im Verlauf speichern" erfolgt automatisch

**"Darüber sprechen" Button:**
- Erscheint nach erfolgreicher Analyse
- Navigiert zu `/session/solo?analysisId={sessionId}`
- Solo Session lädt Analyse-Kontext und startet mit Bezug darauf

**Privacy:**
- Eingefügter Text wird NICHT im Memory gespeichert
- Nur die Analyse (ohne Original-Chat) bleibt im Kontext
- User kann Session jederzeit löschen

---

### 7. Worte finden (Message Coach)

"Worte finden" ermöglicht es Usern, direkt mit Amiyas Message Coach zu sprechen, ohne vorherige Nachrichtenanalyse.

**Konzept:**
- User hat Gedanken/Gefühle die er dem Partner mitteilen möchte
- Amiya hilft, diese in klare Worte zu fassen
- Betonung: User formuliert, AI unterstützt (nicht umgekehrt)

**Zugang:**
- Via Home-Carousel (4. Slide "Worte finden")
- Direktlink: `/coach/message`

**UI-Slide:**
```
"Worte finden"
"Deine Gedanken, klar formuliert."
[Nachricht verfassen] Button
"Amiya hilft dir, das auszudrücken was du sagen möchtest"
```

**Message Coach Page (`/coach/message`):**

Zwei Modi:
1. **Mit Analyse-Kontext** (von "Darüber sprechen" Button)
   - Lädt vorherige Nachrichtenanalyse
   - Konversation startet mit Bezug auf die Analyse

2. **Standalone Mode** (von "Worte finden" Slide)
   - Kein Kontext
   - Freier Einstieg: "Was möchtest du sagen?"

**Flow (Standalone):**
```
1. User öffnet "Worte finden"
2. Amiya fragt: "Was möchtest du deinem Partner sagen?"
3. User beschreibt Situation/Gefühle
4. Amiya hilft bei Formulierung
5. Iteratives Verfeinern bis User zufrieden
6. Optional: Kopieren der finalen Nachricht
```

**Technische Komponenten:**
- `/components/slides/WordsFinderSlide.js` - Carousel Slide
- `/app/coach/message/page.js` - Message Coach Page (beide Modi)

**Philosophie:**
- AI gibt NICHT vor was zu schreiben ist
- AI hilft Gedanken zu ordnen und klar zu formulieren
- User behält volle Kontrolle über die Nachricht
- Partner soll nicht das Gefühl haben "AI schreibt"

---

### 8. Archetypen-Quiz

Das Archetypen-Quiz hilft Usern, ihren Beziehungstyp zu entdecken und mit dem Partner zu vergleichen.

**Konzept:**
- 24 Fragen zu 4 Dimensionen
- Ergebnis: Einer von 11 Archetypen
- "Sealed Letter" Sharing: Beide Partner teilen unabhängig, dann wird der Vergleich freigeschaltet

**Zugang:**
- Via Home-Carousel (5. Slide "Archetypen-Quiz")
- Direktlink: `/quiz`
- Nach Completion: `/quiz/result`
- Paar-Vergleich: `/wir/archetypen`

#### Die 4 Dimensionen

| Dimension | Schlüssel | Farbe | Bedeutung |
|-----------|-----------|-------|-----------|
| **Nähe** | `naehe` | Lavender | Bedürfnis nach emotionaler Verbundenheit |
| **Autonomie** | `autonomie` | Sky | Bedürfnis nach Unabhängigkeit und eigenem Raum |
| **Intensität** | `intensitaet` | Rose | Bedürfnis nach Leidenschaft und Aufregung |
| **Sicherheit** | `sicherheit` | Mint | Bedürfnis nach Stabilität und Verlässlichkeit |

Jede Dimension wird mit 6 Fragen gemessen (24 total). Antworten auf 7-Punkt-Skala. Invertierte Items werden automatisch umgerechnet.

#### Die 11 Archetypen

**4 Basis-Typen** (dominante einzelne Dimension):

| Archetyp | Dimension | Kurzformel |
|----------|-----------|------------|
| **Der Verbinder** | Nähe | "Lass mich ganz nah ran" |
| **Der Entdecker** | Autonomie | "Liebe mich, aber lass mich fliegen" |
| **Die Liebende** | Intensität | "Halt die Flamme am Brennen" |
| **Der Beschützer** | Sicherheit | "Gib mir Boden unter den Füssen" |

**6 Kombinations-Typen** (Top 2 Dimensionen nahe beieinander):

| Archetyp | Dimensionen | Kurzformel |
|----------|-------------|------------|
| **Der Weise** | Nähe + Autonomie | "Verbunden, aber eigenständig" |
| **Der Künstler** | Nähe + Intensität | "Alles oder nichts" |
| **Der Heiler** | Nähe + Sicherheit | "Sicher geborgen, tief verbunden" |
| **Der Rebell** | Autonomie + Intensität | "Frei und leidenschaftlich" |
| **Der Denker** | Autonomie + Sicherheit | "Stabil und eigenständig" |
| **Der Krieger** | Intensität + Sicherheit | "Beständige Leidenschaft" |

**1 Balance-Typ** (alle Dimensionen ähnlich):

| Archetyp | Bedingung | Kurzformel |
|----------|-----------|------------|
| **Der Wanderer** | Range < 20 | "Flexibel und ausgewogen" |

#### Scoring-Algorithmus

```javascript
// 1. Rohwerte: Summe pro Dimension (6 Fragen × 1-7 = 6-42)
// 2. Normalisierung: ((raw - 6) / 36) × 100 = 0-100%
// 3. Typ-Bestimmung:
//    - Range < 20 → Wanderer (balanced)
//    - Top1 - Top2 < 10 → Kombi-Typ
//    - Sonst → Einzel-Typ
```

#### Type Affinity (Facetten)

Zeigt wie stark der User zu JEDEM Typ passt, nicht nur seinem primären:

```javascript
// Ideal-Profile pro Typ (0-1 pro Dimension)
typeProfiles = {
  verbinder: { naehe: 1, autonomie: 0, intensitaet: 0.3, sicherheit: 0.3 },
  rebell: { naehe: 0.2, autonomie: 0.8, intensitaet: 0.8, sicherheit: 0.2 },
  // ...
}

// Ähnlichkeit = gewichtete Distanz zum Ideal-Profil
```

#### Sharing-Mechanismus ("Sealed Letter")

**Konzept:** Beide Partner machen das Quiz unabhängig. Erst wenn BEIDE teilen, wird der Vergleich freigeschaltet.

**States:**
1. User hat Quiz nicht gemacht → "Quiz starten" Button
2. User completed, nicht geteilt → Eigenes Ergebnis sichtbar + "Teilen" Button
3. User geteilt, Partner nicht → Warte-Status
4. Beide geteilt → Vergleich freigeschaltet!

**DB Felder (profiles):**
- `quiz_completed_at` - Timestamp wann Quiz abgeschlossen
- `quiz_shared_at` - Timestamp wann mit Partner geteilt
- `quiz_results` - JSONB mit Antworten, Scores, Typ

```javascript
// quiz_results Struktur
{
  version: "1.0",
  completedAt: "2024-...",
  answers: { N1: 5, N2: 6, ... },
  scores: {
    raw: { naehe: 32, autonomie: 28, ... },
    normalized: { naehe: 72, autonomie: 61, ... }
  },
  primaryType: "verbinder",
  secondaryType: "liebende" // oder null bei Kombi-Typen
}
```

#### Paar-Dynamiken

Wenn beide geteilt haben, werden automatisch Dynamiken analysiert:

```javascript
// Differenz > 30% pro Dimension → Spannungsfeld
analyzePairDynamic(partner1Scores, partner2Scores)
// Returns: [{ type: "tension", area: "naehe", title: "...", tip: "..." }]
```

**Spannungsfelder:**
- Unterschiedliche Nähe-Bedürfnisse
- Unterschiedliche Raum-Bedürfnisse
- Unterschiedliche Intensitäts-Level
- Unterschiedliche Stabilitäts-Bedürfnisse

**Stärken:**
- Wenn keine grossen Differenzen → "Gut ausbalanciert"

#### Technische Dateien

| Datei | Beschreibung |
|-------|--------------|
| `/lib/quizLogic.js` | Alle Quiz-Logik, Fragen, Typen, Scoring |
| `/components/ArchetypeIcons.js` | SVG Icons für alle 11 Archetypen (Aurora-Stil) |
| `/components/slides/QuizSlide.js` | Home-Carousel Slide |
| `/components/QuizComparisonCard.js` | "Wir"-Bereich Card mit Sharing-Status |
| `/app/quiz/page.js` | Quiz Intro |
| `/app/quiz/questions/page.js` | 24 Fragen UI |
| `/app/quiz/result/page.js` | Ergebnis-Seite |
| `/app/wir/archetypen/page.js` | Paar-Vergleich |

#### Archetypen-Icons

Jeder Archetyp hat ein eigenes SVG-Icon im Aurora-Stil:

```javascript
import { ArchetypeIconMap } from "../components/ArchetypeIcons";

// Verwendung:
const IconComponent = ArchetypeIconMap["verbinder"];
<IconComponent size={56} />
```

Icons sind Aurora-Gradient-basiert und funktionieren in Light/Dark Mode.

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
auto_analyze    boolean (default true) -- Automatisch analysieren oder fragen
personal_context jsonb            -- Privater Kontext (Solo Sessions)
coaching_profile jsonb            -- Adaptive Coaching (Kommunikationsstil, etc.)
couple_id       uuid (FK)         -- Verknüpfung zum Couple
partner_id      uuid (FK)         -- ID des Partners
quiz_completed_at timestamp       -- Wann Archetypen-Quiz abgeschlossen
quiz_shared_at  timestamp         -- Wann Quiz-Ergebnis mit Partner geteilt
quiz_results    jsonb             -- Antworten, Scores, primaryType, secondaryType
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
id                  uuid (PK)
user_id             uuid (FK)         -- Wer hat gestartet
couple_id           uuid (FK)         -- Für Couple Sessions
type                text              -- 'solo' | 'couple' | 'message_analysis'
status              text              -- 'active' | 'completed'
summary             text              -- Transkript (wird nach Analyse gelöscht!)
analysis            text              -- User-facing Analyse
summary_for_coach   text              -- Internes Coach-Summary (v2)
key_points          jsonb             -- Strukturierte Extraktion (v2)
engagement_metrics  jsonb             -- Adaptive Coaching Metriken (v2)
themes              text[]            -- Erkannte Themen
analysis_created_at timestamp
created_at          timestamp
ended_at            timestamp
```

**key_points JSONB Struktur:**
```json
{
  "topic": "Hauptthema in 3-5 Wörtern",
  "discussed": ["Punkt 1", "Punkt 2"],
  "emotions": ["Frustration", "Hoffnung"],
  "statements": ["Wichtige Aussage 1"],
  "open_questions": ["Was nicht geklärt wurde"],
  "follow_up": ["Konkrete Follow-up Frage"],
  "insights": [{"type": "breakthrough", "content": "..."}]
}
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
| `/api/analyze` | POST | Session-Analyse mit Claude (Voice Sessions) |
| `/api/analyze/message` | POST | Nachrichtenanalyse (Chat-Text) |
| `/api/check-analysis` | POST | Prüft ob Analyse sinnvoll ist |
| `/api/debug-analyze` | POST | Debug-Endpoint für Analyse |

### Memory System

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/memory/get` | POST | Lädt Kontext für Session-Start (Privacy-Filter!) |
| `/api/memory/update` | POST | Aktualisiert Kontext nach Session |
| `/api/memory/delete` | POST | Löscht Memory-Daten (GDPR) |

### Adaptive Coaching

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/coaching-profile/update` | POST | Aktualisiert Coaching-Profil nach Session |

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
- [x] Nachrichtenanalyse (Chat-Text mit Gottman + NVC)
- [x] "Darüber sprechen" - Von Analyse direkt in Solo Session mit Kontext
- [x] "Worte finden" - Message Coach ohne vorherige Analyse
- [x] Archetypen-Quiz (24 Fragen, 4 Dimensionen, 11 Typen)
- [x] Quiz-Sharing ("Sealed Letter" - beide müssen teilen für Vergleich)
- [x] Paar-Vergleich der Archetypen mit Dynamik-Analyse
- [x] Memory System mit Consent
- [x] Session-Analyse mit Agreement-Detection
- [x] Session-Viability-Check (zu kurze Sessions werden abgelehnt)
- [x] Auto-Analyze Preference (User kann wählen ob automatisch oder manuell)
- [x] "Session zu kurz" Modal mit freundlicher Erklärung
- [x] Agreement CRUD + Check-ins
- [x] Paar-Verbindung via Invite-Codes
- [x] Paar-Trennung mit Learnings-Option
- [x] Session History (mit visueller Unterscheidung pro Typ)
- [x] Home-Carousel (swipeable mit Solo/Couple/Message/Worte finden/Quiz Slides)
- [x] Light/Dark Mode (Amiya Aurora Design System)
- [x] Lucide Icons (statt Emojis)
- [x] Custom Archetype Icons (Aurora-Stil SVGs)

### Bekannte Limitierungen

- **Kontext-Limit:** 4000 Zeichen für ElevenLabs Dynamic Variables
- **Analyse:** Solo max 400 Wörter, Couple detaillierter
- **Check-ins:** Werden proaktiv in Couple Sessions angesprochen

### Technical Debt: Memory-Integration Nachrichtenanalyse

**Status:** Nachrichtenanalyse ist NICHT vollständig in das Memory-System integriert.

**Aktueller Stand:**
| Funktion | Status | Details |
|----------|--------|---------|
| Memory UPDATE | ✅ Funktioniert | `/api/memory/update` akzeptiert `message_analysis` Sessions |
| Memory GET | ❌ Fehlt | `/api/memory/get` lädt KEINE `message_analysis` Sessions |
| Solo ← Message | ❌ Fehlt | Solo Sessions kennen vorherige Nachrichtenanalysen NICHT |
| Couple ← Message | ❌ Bewusst | Soll nicht implementiert werden |

**Auswirkung:**
- Wenn User eine Nachricht analysiert, werden Erkenntnisse in `personal_context` gespeichert
- Aber: Nächste Solo Session lädt diese Erkenntnisse nicht in den Kontext
- Das bedeutet: Amiya "vergisst" die Nachrichtenanalyse

**Identifizierte Architektur-Probleme:**

1. **Inkonsistente Feldnamen:**
   - Solo/Couple Sessions: `summary_for_coach` für Coach-Summary
   - Message Analysis: `analysis` (kein separates Coach-Summary)
   - Memory GET filtert auf `summary_for_coach.not.is.null` → findet keine message_analysis

2. **Unbegrenztes JSONB-Wachstum:**
   - `personal_context` in `profiles` wächst mit jeder Session
   - Keine Cleanup-Logik für alte Einträge
   - Bei aktiven Usern wird das Feld sehr gross (50KB+)

3. **Claude macht JSON-Manipulation:**
   - Memory UPDATE lässt Claude bestehenden JSONB erweitern
   - Risiko: Bestehende Daten können beschädigt werden
   - Keine Versionierung oder Rollback

**Empfohlene Fixes (nicht implementiert):**

1. **Quick Fix:** Memory GET erweitern für `message_analysis` Sessions
2. **Mittelfristig:** Konsistente Feldnamen (`summary_for_coach` überall)
3. **Langfristig:** JSONB-Cleanup-Logik (älteste Einträge entfernen)

**Entscheidung:** Architektur bleibt vorerst so. Bei Product-Market-Fit Refactoring planen.

---

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

### Test-Modus (Debug Panel)

Für schnelleres Testen ohne echte Voice-Sessions gibt es einen Test-Modus.

**Aktivierung:** `?testMode=true` an die URL anhängen
```
https://amiya.app/?testMode=true
https://localhost:3000/?testMode=true
```

**Debug Panel:**
- Lila Bug-Button erscheint rechts unten
- Klick öffnet das Debug-Panel

**Verfügbare Test-Funktionen:**

| Button | Funktion |
|--------|----------|
| **Fake-Session starten** | Fügt 6 Beispiel-Nachrichten hinzu, simuliert laufende Session (3 Min) |
| **Ende-Dialog anzeigen** | Zeigt den Session-Ende-Dialog (Mit/Ohne Analyse) |
| **"Zu kurz" Modal anzeigen** | Zeigt das Modal für zu kurze Sessions |
| **Analyse-Ladescreen (3s)** | Simuliert den Analyse-Ladebildschirm für 3 Sekunden |

**Angezeigter Profil-Status:**
- `memory_consent`: Zeigt ob Memory-System aktiviert
- `auto_analyze`: Zeigt ob automatische Analyse aktiviert
- `Messages`: Anzahl der Nachrichten in der aktuellen Session

**Typischer Test-Workflow:**
1. URL mit `?testMode=true` öffnen
2. Bug-Button klicken
3. "Fake-Session starten" klicken
4. "Beenden" klicken oder "Ende-Dialog anzeigen"
5. Dialog-Verhalten testen (Mit/Ohne Analyse)

**Hinweis:** Der Test-Modus ist auf Start-Screen und Session-Screen verfügbar.

### Wichtige Konventionen

1. **Styling:** Inline styles mit Theme Tokens aus `ThemeContext` (Light/Dark Mode)
2. **Icons:** Lucide React Icons (kein Emoji)
3. **State:** React useState + useEffect, kein Redux
4. **API:** Next.js Route Handlers (app/api/*/route.js)
5. **DB:** Supabase Client (Browser) vs Service Role (API Routes)
6. **Sprache:** Alle UI-Texte auf Deutsch

### Theme System (Amiya Aurora)

Design Tokens werden über `useTheme()` Hook bezogen:

```javascript
const { tokens, isDarkMode, toggleTheme } = useTheme();

// Verwendung:
style={{ background: tokens.colors.bg.deep }}
style={{ color: tokens.colors.text.primary }}
style={{ borderRadius: tokens.radii.lg }}
```

Key Token-Kategorien:
- `tokens.colors.bg.*` - Hintergrundfarben (deep, surface, elevated, soft)
- `tokens.colors.text.*` - Textfarben (primary, secondary, muted)
- `tokens.colors.aurora.*` - Brand-Farben (lavender, rose, mint, sky)
- `tokens.radii.*` - Border-Radien (sm, md, lg, xl, xxl, pill)
- `tokens.shadows.*` - Schatten (soft, medium, large, glow)
- `tokens.fonts.*` - Schriftarten (display, body)

---

## Dokumentation

- **Memory System v2:** Siehe [docs/MEMORY_SYSTEM.md](docs/MEMORY_SYSTEM.md) für die vollständige Dokumentation des Memory Systems - Privacy-Matrix, ElevenLabs Tools, Analyse-Prompts und API-Architektur.

- **ElevenLabs Agent System Prompt:** Siehe [docs/ELEVENLABS_AGENT.md](docs/ELEVENLABS_AGENT.md) für den vollständigen Voice Agent Prompt mit Amiyas Persönlichkeit, Gesprächsführung, Turn-Taking Regeln und Agreement Detection.

- **Agreement System:** Siehe [docs/AGREEMENT_SYSTEM.md](docs/AGREEMENT_SYSTEM.md) für die vollständige Dokumentation des Vereinbarungssystems - von der Erkennung in der Analyse bis zur Bestätigung durch die verantwortliche Person.
