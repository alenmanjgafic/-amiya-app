# Amiya Memory System - Dokumentation

Version 2.0 - Mit ElevenLabs Tools

---

## Übersicht

Das Memory System ermöglicht Amiya, sich an vergangene Sessions zu erinnern und kontextbewusstes Coaching zu bieten.

### Kernprinzipien

1. **Privacy auf Daten-Ebene** - Solo-Sessions sind privat, Couple-Sessions geteilt
2. **Gottman-basiert** - Therapeutische Konzepte aus evidenzbasierter Paartherapie
3. **GDPR-konform** - Keine Kindernamen, Transkripte werden gelöscht

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION START                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/memory/get                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Solo Session:                                            │    │
│  │ - Eigene Solo-Sessions (user_id = X)                    │    │
│  │ - Alle Couple-Sessions (couple_id = Y)                  │    │
│  │ - Shared Facts + Agreements                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Couple Session:                                          │    │
│  │ - NUR Couple-Sessions (couple_id = Y)                   │    │
│  │ - Shared Facts + Agreements                              │    │
│  │ - ❌ KEINE Solo-Sessions (Privacy!)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│       │                                                          │
│       ▼                                                          │
│  ElevenLabs erhält:                                              │
│  - user_name, partner_name                                       │
│  - session_mode ("solo" | "couple")                              │
│  - user_context (Basis-Kontext)                                  │
│  - Tools für dynamische Abfragen                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WÄHREND SESSION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ElevenLabs Agent kann Tools aufrufen:                          │
│                                                                  │
│  🔧 get_topic_history(theme)                                    │
│     → Lädt alle Sessions zu einem Thema                         │
│                                                                  │
│  🔧 check_statements(claim)                                     │
│     → Prüft auf Widersprüche zu früheren Aussagen              │
│                                                                  │
│  🔧 get_agreement_detail(title)                                 │
│     → Lädt Details zu einer Vereinbarung                        │
│                                                                  │
│  🔧 save_insight(type, content)                                 │
│     → Speichert wichtige Erkenntnisse sofort                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SESSION ENDE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Viability Check (/api/check-analysis)                       │
│     - Min 200 Zeichen Transkript                                │
│     - Min 2 User-Nachrichten                                    │
│     - Min 50 Zeichen User-Content                               │
│     → Wenn zu kurz: Session löschen, Modal zeigen               │
│                                                                  │
│  2. Analyse generieren (/api/analyze)                           │
│                                                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ analysis (für User sichtbar)                         │     │
│     │ ─────────────────────────────                        │     │
│     │ Solo: Warm, empathisch, du-Form                     │     │
│     │       Partner nicht abwerten                         │     │
│     │       Max 400 Wörter                                │     │
│     │                                                      │     │
│     │ Couple: Neutral, beide Perspektiven                 │     │
│     │         "On the side of the relationship"           │     │
│     │         Gottman-Struktur                            │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ summary_for_coach (für Amiya intern)                │     │
│     │ ─────────────────────────────────                    │     │
│     │ Faktisch, neutral, strukturiert                     │     │
│     │ - Was wurde besprochen                              │     │
│     │ - Welche Emotionen                                  │     │
│     │ - Wichtige Aussagen                                 │     │
│     │ - Was ist offen geblieben                           │     │
│     │ - Erkannte Muster                                   │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
│  3. Transkript löschen (Privacy)                                │
│                                                                  │
│  4. Memory Update (/api/memory/update)                          │
│     - Shared Facts extrahieren                                  │
│     - Vereinbarungen erkennen                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Datenbank-Schema

### sessions

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES profiles(id)
couple_id           UUID REFERENCES couples(id)
type                TEXT ('solo' | 'couple')
status              TEXT ('active' | 'completed')

-- Inhalte
summary             TEXT  -- Transkript (wird nach Analyse gelöscht!)
analysis            TEXT  -- User-facing Analyse
summary_for_coach   TEXT  -- Coach-facing Summary (NEU)
key_points          JSONB -- Strukturierte Extraktion (NEU)
themes              TEXT[]

-- Timestamps
created_at          TIMESTAMP
ended_at            TIMESTAMP
analysis_created_at TIMESTAMP
```

### profiles

```sql
id                  UUID PRIMARY KEY
name                TEXT
partner_name        TEXT
email               TEXT

-- Memory & Consent
memory_consent      BOOLEAN
memory_consent_at   TIMESTAMP
auto_analyze        BOOLEAN DEFAULT true

-- Context (Legacy - wird vereinfacht)
personal_context    JSONB

-- Couple Link
couple_id           UUID REFERENCES couples(id)
partner_id          UUID REFERENCES profiles(id)
```

### couples

```sql
id                  UUID PRIMARY KEY
user_a_id           UUID REFERENCES profiles(id)
user_b_id           UUID REFERENCES profiles(id)
status              TEXT ('active' | 'disconnected')
shared_context      JSONB  -- Fakten, Stärken, etc.
created_at          TIMESTAMP
```

### agreements

```sql
id                      UUID PRIMARY KEY
couple_id               UUID REFERENCES couples(id)
title                   TEXT
description             TEXT
underlying_need         TEXT
type                    TEXT ('behavior' | 'commitment' | 'experiment')
status                  TEXT ('pending_approval' | 'active' | 'achieved' | 'dissolved')
responsible_user_id     UUID
check_in_frequency_days INT DEFAULT 14
next_check_in_at        TIMESTAMP
success_streak          INT DEFAULT 0
themes                  TEXT[]
created_at              TIMESTAMP
```

---

## Privacy-Matrix

| Datenquelle | Solo Session | Couple Session |
|-------------|--------------|----------------|
| Eigene Solo-Sessions | ✅ Ja | ❌ Nein |
| Partner's Solo-Sessions | ❌ Nein | ❌ Nein |
| Couple-Sessions | ✅ Ja | ✅ Ja |
| Shared Facts | ✅ Ja | ✅ Ja |
| Agreements | ✅ Ja | ✅ Ja |
| Personal Context | ✅ Eigene | ❌ Nein |

**Wichtig:** Privacy wird auf DATEN-Ebene geschützt, nicht nur durch Prompts!

---

## ElevenLabs Tools

### 1. get_topic_history

**Zweck:** Vergangene Gespräche zu einem Thema laden

**Wann:** User erwähnt bekanntes Thema

**Request:**
```json
{
  "tool": "get_topic_history",
  "theme": "haushalt",
  "user_id": "...",
  "couple_id": "...",
  "session_type": "solo"
}
```

**Response:**
```json
{
  "sessions": [
    {
      "date": "2025-01-03",
      "type": "solo",
      "summary": "User sprach über Frustration mit Haushaltsverteilung..."
    }
  ]
}
```

### 2. check_statements

**Zweck:** Widersprüche zu früheren Aussagen erkennen

**Wann:** User macht absolute Aussage ("Er hilft nie")

**Request:**
```json
{
  "tool": "check_statements",
  "claim": "Partner hilft nie im Haushalt",
  "user_id": "...",
  "session_type": "solo"
}
```

**Response:**
```json
{
  "found_related": true,
  "statements": [
    {
      "date": "2024-12-15",
      "said": "Partner kocht immer das Abendessen",
      "context": "Positives erwähnt"
    }
  ],
  "potential_contradiction": true
}
```

### 3. get_agreement_detail

**Zweck:** Details zu einer Vereinbarung laden

**Wann:** Check-in oder Erwähnung einer Vereinbarung

**Request:**
```json
{
  "tool": "get_agreement_detail",
  "title": "Handyfreie Abende",
  "couple_id": "..."
}
```

**Response:**
```json
{
  "agreement": {
    "title": "Handyfreie Abende",
    "created_at": "2024-12-20",
    "status": "active",
    "success_streak": 3,
    "last_checkin": "2024-12-28",
    "next_checkin_due": true
  }
}
```

### 4. save_insight

**Zweck:** Wichtige Erkenntnisse sofort speichern

**Wann:** Durchbruch-Moment in der Session

**Request:**
```json
{
  "tool": "save_insight",
  "type": "breakthrough",
  "content": "User erkennt Angst vor Ablehnung als Muster",
  "session_id": "...",
  "user_id": "..."
}
```

**Response:**
```json
{
  "saved": true
}
```

---

## Prompts

### User-Analyse (Solo)

```
Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine SOLO SESSION - nur ein Partner war dabei.

STIL:
- Warm und unterstützend, nicht klinisch
- Verwende den Namen der Person
- Fokussiere auf Muster und Stärken, nicht nur Probleme
- Max 400 Wörter
- Deutsch, du-Form
- Partner NICHT abwerten

STRUKTUR:

**Zusammenfassung**
(2-3 Sätze: Worum ging es?)

**Was mir aufgefallen ist**
(2-3 Beobachtungen/Muster)

**Mögliche nächste Schritte**
(1-2 konkrete Vorschläge)
```

### User-Analyse (Couple)

```
Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine COUPLE SESSION - beide Partner waren dabei.

STIL:
- Neutral und ausgewogen
- "On the side of the relationship"
- Beide Perspektiven gleichwertig darstellen
- Keine Parteinahme
- Deutsch, ihr-Form

STRUKTUR:

**Zusammenfassung**
(2-3 Sätze)

**Situation**
(Kontext)

**Beobachtungen**

### [Name Partner 1]
- Beobachtung 1
- Beobachtung 2

### [Name Partner 2]
- Beobachtung 1
- Beobachtung 2

### Dynamik zwischen euch
- Muster

**Empfehlungen**

### Für [Name Partner 1]
1. Empfehlung

### Für [Name Partner 2]
1. Empfehlung

### Gemeinsam
1. Empfehlung

**Nächste Schritte**

**Vereinbarung**
(Falls erkannt)
```

### Coach-Summary (Intern)

```
Du erstellst Notizen für einen Beziehungscoach.
Diese Notizen sind NICHT für den User sichtbar.

TRANSKRIPT:
{transcript}

FORMAT:

SESSION: [Typ] mit [Name], [Datum], [Dauer ca.]

THEMA: (Hauptthema in 3-5 Wörtern)

WAS BESPROCHEN WURDE:
- Punkt 1
- Punkt 2
- Punkt 3

EMOTIONEN:
- Was war spürbar (Frustration, Trauer, Hoffnung, etc.)

WICHTIGE AUSSAGEN:
- "[Aussage 1]" - Kontext
- "[Aussage 2]" - Kontext

MUSTER ERKANNT:
- (Falls vorhanden: Pursuer-Distancer, etc.)

OFFEN GEBLIEBEN:
- Was nicht geklärt wurde
- Fragen die aufkamen

NÄCHSTES MAL NACHFRAGEN:
- Konkrete Follow-up Fragen

REGELN:
- Faktisch, nicht wertend
- Keine Kindernamen (GDPR)
- Max 500 Wörter
```

---

## API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/memory/get` | POST | Lädt Kontext für Session-Start |
| `/api/memory/update` | POST | Aktualisiert Kontext nach Session |
| `/api/memory/delete` | POST | Löscht Memory-Daten |
| `/api/analyze` | POST | Generiert User-Analyse + Coach-Summary |
| `/api/check-analysis` | POST | Prüft ob Session lang genug für Analyse |
| `/api/agent-tools` | POST | ElevenLabs Tool-Calls |

---

## Changelog

### Version 2.0 (geplant)
- [ ] `summary_for_coach` Spalte hinzugefügt
- [ ] ElevenLabs Tools implementiert
- [ ] Privacy-Filter auf Daten-Ebene
- [ ] Vereinfachtes Context-Loading
- [ ] Gottman-basierte Analyse-Stile (Solo warm, Couple neutral)

### Version 1.0 (aktuell)
- [x] Basic Memory System
- [x] Solo/Couple Session Support
- [x] Agreement Detection
- [x] Context Extraction (komplex)
