# Agreement System - Vollständige Dokumentation

Version 1.0 - Januar 2026

## Übersicht

Das Agreement System ermöglicht Paaren, in Couple Sessions getroffene Vereinbarungen zu erfassen, zu tracken und regelmässig zu überprüfen.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGREEMENT FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. COUPLE SESSION (ElevenLabs Voice)                           │
│     └── Partner macht Zusage: "Ich werde ab jetzt..."           │
│                         ▼                                        │
│  2. SESSION BEENDEN                                              │
│     └── Transkript wird in sessions.summary gespeichert         │
│                         ▼                                        │
│  3. ANALYSE GENERIEREN (/api/analyze)                           │
│     └── Claude analysiert und erkennt Vereinbarung              │
│     └── Parser extrahiert: Was, Wer, Bedürfnis                  │
│                         ▼                                        │
│  4. SUGGESTION ERSTELLEN                                         │
│     └── Eintrag in agreement_suggestions (status: pending)      │
│                         ▼                                        │
│  5. NOTIFICATION                                                 │
│     └── Badge auf "Wir"-Tab zeigt offene Vorschläge             │
│     └── Gelbe Sektion auf Wir-Seite                             │
│                         ▼                                        │
│  6. BESTÄTIGUNG                                                  │
│     └── Nur verantwortliche Person kann annehmen                │
│     └── Andere Person sieht "Warte auf [Name]s Bestätigung"     │
│                         ▼                                        │
│  7. AGREEMENT AKTIV                                              │
│     └── Eintrag in agreements (status: active)                  │
│     └── Check-in Reminder nach X Tagen                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Datenbank-Schema

### agreement_suggestions

Temporäre Vorschläge aus der Analyse, warten auf Bestätigung.

```sql
CREATE TABLE agreement_suggestions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id               UUID REFERENCES couples(id),
  session_id              UUID REFERENCES sessions(id),
  title                   TEXT NOT NULL,
  underlying_need         TEXT,
  responsible             TEXT CHECK (responsible IN ('both', 'user_a', 'user_b')),
  status                  TEXT CHECK (status IN ('pending', 'accepted', 'dismissed')),
  accepted_as_agreement_id UUID REFERENCES agreements(id),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

| Feld | Beschreibung |
|------|--------------|
| `responsible` | `user_a`, `user_b` oder `both` - bezieht sich auf `couples.user_a_id` / `couples.user_b_id` |
| `status` | `pending` = wartet auf Bestätigung, `accepted` = wurde zu Agreement, `dismissed` = abgelehnt |

### agreements

Aktive Vereinbarungen des Paares.

```sql
CREATE TABLE agreements (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id               UUID REFERENCES couples(id),
  created_by_user_id      UUID REFERENCES profiles(id),
  created_in_session_id   UUID REFERENCES sessions(id),
  title                   TEXT NOT NULL,
  description             TEXT,
  underlying_need         TEXT,
  type                    TEXT, -- 'behavior', 'communication', 'ritual', 'experiment'
  status                  TEXT, -- 'pending_approval', 'active', 'achieved', 'dissolved'
  responsible_user_id     UUID REFERENCES profiles(id), -- NULL = beide
  frequency               TEXT, -- 'daily', 'weekly', 'situational', 'once'
  requires_mutual_approval BOOLEAN DEFAULT true,
  approved_by             UUID[],
  check_in_frequency_days INT DEFAULT 14,
  next_check_in_at        TIMESTAMPTZ,
  success_streak          INT DEFAULT 0,
  themes                  TEXT[],
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### agreement_checkins

Check-in Einträge für Vereinbarungen.

```sql
CREATE TABLE agreement_checkins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id    UUID REFERENCES agreements(id),
  user_id         UUID REFERENCES profiles(id),
  status          TEXT, -- 'good', 'partial', 'missed'
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Agreement Detection (Analyse)

### Prompt-Struktur

Die Vereinbarungserkennung ist Teil des Claude-Analyse-Prompts (`app/api/analyze/route.js`):

```
STRUKTUR (EXAKT EINHALTEN - ALLE ABSCHNITTE SIND PFLICHT):

**Zusammenfassung**
**Situation**
**Beobachtungen**
**Empfehlungen**
**Nächste Schritte**
**Vereinbarung**

Prüfe ob im Gespräch konkrete Zusagen gemacht wurden.

Falls JA, schreibe EXAKT in diesem Format:
- Was: [Die konkreteste Zusage als Satz]
- Wer: [Name der Person die es zugesagt hat]
- Bedürfnis: [Das Bedürfnis dahinter]

Falls NEIN:
- Keine konkrete Vereinbarung in dieser Session
```

### Parser-Logik

Der Parser (`parseAnalysisForAgreement`) extrahiert die Vereinbarung:

```javascript
// 1. Suche nach Vereinbarungs-Marker
const markers = ["**Vereinbarung**", "**Vereinbarung erkannt**"];

// 2. Prüfe ob "keine Vereinbarung"
if (text.includes("keine konkrete vereinbarung")) return null;

// 3. Extrahiere Felder mit Regex
const whatMatch = text.match(/- Was: (.+)/);
const whoMatch = text.match(/- Wer: (.+)/);
const needMatch = text.match(/- Bedürfnis: (.+)/);

// 4. Bestimme responsible Person
// Vergleiche "Wer:" mit den Namen aus der Datenbank
if (who.includes(userAName)) responsible = "user_a";
if (who.includes(userBName)) responsible = "user_b";
```

### Namensauflösung

Um `user_a` / `user_b` korrekt zuzuordnen:

```javascript
// Hole Couple-Daten
const { data: couple } = await supabase
  .from("couples")
  .select("user_a_id, user_b_id")
  .eq("id", session.couple_id);

// Hole Namen
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, name")
  .in("id", [couple.user_a_id, couple.user_b_id]);

// coupleNames = { user_a_name: "Romina", user_b_name: "Alen" }
```

---

## 3. API Endpoints

### GET /api/agreements/suggestions

Holt offene Vorschläge für ein Paar.

```javascript
// Request
GET /api/agreements/suggestions?coupleId=xxx

// Response
{
  "suggestions": [
    {
      "id": "uuid",
      "title": "Romina räumt...",
      "underlying_need": "Stressreduktion",
      "responsible": "user_a",
      "status": "pending",
      "session_id": "uuid"
    }
  ]
}
```

### PATCH /api/agreements/suggestions

Akzeptiert oder lehnt einen Vorschlag ab.

```javascript
// Request - Accept
{
  "suggestionId": "uuid",
  "action": "accept",
  "userId": "uuid",
  "title": "Angepasster Titel",
  "responsible": "user_a",
  "type": "behavior",
  "checkInFrequencyDays": 14
}

// Response
{
  "success": true,
  "agreement": { ... },
  "needsPartnerApproval": false,
  "message": "Vereinbarung ist aktiv!"
}
```

**Wichtige Logik:**
- `responsible` wird zu `responsible_user_id` aufgelöst
- Wenn Person A eine Vereinbarung für sich selbst annimmt → `status: active`
- Wenn Person A eine Vereinbarung für "beide" annimmt → `status: pending_approval`

---

## 4. UI Komponenten

### AnalysisView.js

Zeigt die Analyse und den Vorschlag zur Annahme.

**Wichtige Logik - Wer kann annehmen:**

```javascript
const canUserAccept = () => {
  const isUserA = coupleData.user_a_id === user.id;

  if (responsible === "both") return true;
  if (responsible === "user_a" && isUserA) return true;
  if (responsible === "user_b" && !isUserA) return true;

  return false;
};
```

**UI-Varianten:**

| Situation | UI für verantwortliche Person | UI für andere Person |
|-----------|------------------------------|----------------------|
| `responsible = "user_a"` | "So übernehmen" / "Anpassen" | "Warte auf [Name]s Bestätigung" |
| `responsible = "both"` | Beide sehen Buttons | Beide sehen Buttons |

### Wir-Seite (app/wir/page.js)

Zeigt offene Vorschläge prominent an:

```javascript
// Lade Vorschläge
const loadPendingSuggestions = async () => {
  const response = await fetch(`/api/agreements/suggestions?coupleId=${coupleId}`);
  const data = await response.json();
  setPendingSuggestions(data.suggestions);
};

// Badge auf Navigation
{pendingSuggestions.length > 0 && (
  <span style={styles.navBadge}>{pendingSuggestions.length}</span>
)}
```

---

## 5. Label-Mapping (user_a/user_b zu Namen)

Das Mapping von `user_a`/`user_b` zu tatsächlichen Namen ist komplex:

```javascript
// In couples Tabelle:
// user_a_id = "abc" (Romina - hat Paar erstellt)
// user_b_id = "xyz" (Alen - ist beigetreten)

// Wenn Alen eingeloggt ist:
const isUserA = coupleData.user_a_id === user.id; // false

// Labels müssen dynamisch sein:
const responsibleLabels = {
  both: "Beide",
  user_a: isUserA ? profile.name : profile.partner_name,  // "Romina"
  user_b: isUserA ? profile.partner_name : profile.name   // "Alen"
};
```

**Wichtig:** `user_a` ist NICHT immer der eingeloggte User! Es ist immer die Person, die das Paar erstellt hat.

---

## 6. Status-Übergänge

```
                    ┌─────────────┐
                    │   pending   │ (suggestion)
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  accepted   │          │  dismissed  │
       └──────┬──────┘          └─────────────┘
              │
              ▼
       ┌─────────────┐
       │   active    │ (agreement) ◄── oder pending_approval
       └──────┬──────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐       ┌───────────┐
│achieved │       │ dissolved │
└─────────┘       └───────────┘
```

---

## 7. Datei-Referenz

| Datei | Funktion |
|-------|----------|
| `app/api/analyze/route.js` | Agreement-Erkennung im Prompt, Parser |
| `app/api/agreements/suggestions/route.js` | CRUD für Vorschläge |
| `app/api/agreements/route.js` | CRUD für Agreements |
| `components/AnalysisView.js` | UI für Vorschlag-Annahme |
| `components/AgreementsList.js` | Liste aktiver Agreements |
| `components/AgreementDetail.js` | Detail-Ansicht mit Check-ins |
| `components/CreateAgreement.js` | Manuelles Erstellen |
| `app/wir/page.js` | Übersicht mit Badge |

---

## 8. Bekannte Edge Cases

1. **Transkript wird gelöscht**: Nach der Analyse wird `sessions.summary` auf `null` gesetzt (Datenschutz). Die Namen für den Parser werden vorher aus der DB geholt.

2. **Beide Namen im "Wer:" Feld**: Wenn Claude "Alen und Romina" schreibt, wird `responsible = "both"` gesetzt.

3. **Kein Name erkannt**: Wenn der Name nicht matched, default zu `"both"`.

4. **Foreign Key fehlt**: `agreement_suggestions.session_id` braucht FK zu `sessions.id` für Supabase Joins.

---

## 9. Zukünftige Erweiterungen

- [ ] Push Notifications für Check-in Reminder
- [ ] Agreement-Statistiken über Zeit
- [ ] "Experiment" Typ mit automatischem Ablauf
- [ ] Gemeinsame Reflexion bei Check-ins
