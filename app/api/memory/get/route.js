/**
 * ANALYZE API - app/api/analyze/route.js
 * Claude-powered session analysis
 * 
 * v2.0: Separate Prompts für Solo vs. Couple Sessions
 * - Professioneller Ton (nicht zu warm, nicht zu klinisch)
 * - Strukturiert wie ein offizieller Bericht
 * - Next Steps pro Person bei Couple Sessions
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════
// SOLO SESSION ANALYSE
// ═══════════════════════════════════════════════════════════
const SOLO_ANALYSIS_PROMPT = `Du bist ein erfahrener Beziehungscoach, der eine Solo-Session analysiert.

Erstelle eine professionelle, strukturierte Analyse. Der Ton sollte sachlich-empathisch sein - 
nicht zu warm/freundschaftlich, aber auch nicht klinisch-distanziert. Wie ein kompetenter Coach, 
der respektvoll und auf Augenhöhe kommuniziert.

WICHTIG:
- Sprich den User direkt an (du-Form)
- Verwende die Namen wenn im Kontext angegeben
- Fokussiere auf Muster, Erkenntnisse und konkrete nächste Schritte
- Schreibe auf Deutsch (Schweizer Kontext)
- Max 400 Wörter

STRUKTUR (halte dich exakt daran):

## Zusammenfassung
[2-3 Sätze: Worum ging es in dieser Session? Was war das Kernthema?]

## Beobachtungen
[3-4 Bullet Points mit konkreten Beobachtungen aus dem Gespräch]
- Was hast du über dich selbst geäussert?
- Welche Muster oder Dynamiken wurden sichtbar?
- Welche Emotionen waren präsent?

## Deine Perspektive auf [Partner-Name]
[Nur wenn der User über den Partner gesprochen hat. 1-2 Sätze, neutral formuliert]

## Empfehlungen
[2-3 konkrete, umsetzbare Schritte]
1. [Konkreter erster Schritt]
2. [Konkreter zweiter Schritt]

## Offene Fragen
[1-2 Fragen die in der nächsten Session aufgegriffen werden könnten]

---
Gespräch:
`;

// ═══════════════════════════════════════════════════════════
// COUPLE SESSION ANALYSE
// ═══════════════════════════════════════════════════════════
const COUPLE_ANALYSIS_PROMPT = `Du bist ein erfahrener Paartherapeut, der eine gemeinsame Session analysiert.

Erstelle eine professionelle, strukturierte Analyse. Der Ton sollte sachlich-empathisch sein - 
nicht zu warm/freundschaftlich, aber auch nicht klinisch-distanziert. Wie ein kompetenter Therapeut, 
der beide Partner respektvoll und neutral behandelt.

WICHTIG:
- Sprich beide Partner an (ihr-Form, oder beide Namen)
- Sei strikt neutral - keine Seite bevorzugen
- Beide Perspektiven gleichwertig darstellen
- Schreibe auf Deutsch (Schweizer Kontext)
- Max 500 Wörter

STRUKTUR (halte dich exakt daran):

## Zusammenfassung
[2-3 Sätze: Was war das zentrale Thema dieser Session? Was habt ihr besprochen?]

## Situation
[Kurze neutrale Beschreibung der aktuellen Situation basierend auf dem Gespräch]

## Beobachtungen

### [Name Partner A]
- [Was hat diese Person geäussert?]
- [Welche Bedürfnisse wurden sichtbar?]

### [Name Partner B]
- [Was hat diese Person geäussert?]
- [Welche Bedürfnisse wurden sichtbar?]

### Dynamik zwischen euch
- [Welche Muster oder Dynamiken wurden sichtbar?]
- [Wo gibt es Übereinstimmung? Wo Spannung?]

## Vereinbarungen
[Nur wenn konkrete Vereinbarungen getroffen wurden]
- [Vereinbarung 1]
- [Vereinbarung 2]

## Empfehlungen

### Für [Name Partner A]
1. [Konkreter Schritt]

### Für [Name Partner B]
1. [Konkreter Schritt]

### Gemeinsam
1. [Was ihr zusammen tun könnt]

## Nächste Schritte
[Was sollte in der nächsten Session aufgegriffen werden?]

---
Gespräch:
`;

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.summary) {
      return Response.json({ error: "No conversation to analyze" }, { status: 400 });
    }

    // Determine session type and select appropriate prompt
    const isCoupleSession = session.type === "couple";
    const prompt = isCoupleSession ? COUPLE_ANALYSIS_PROMPT : SOLO_ANALYSIS_PROMPT;

    // Generate analysis with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt + session.summary,
        },
      ],
    });

    const analysis = message.content[0].text;

    // Detect themes from conversation (before deleting)
    const themes = detectThemes(session.summary);

    // Extract agreements from couple sessions
    let agreements = [];
    if (isCoupleSession) {
      agreements = extractAgreements(session.summary, analysis);
    }

    // Save analysis AND delete transcript (privacy)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        analysis: analysis,
        analysis_created_at: new Date().toISOString(),
        themes: themes,
        // Delete the transcript for privacy
        summary: null,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to save analysis:", updateError);
      return Response.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // If couple session with agreements, save to agreements table
    if (agreements.length > 0 && session.couple_id) {
      for (const agreement of agreements) {
        await supabase
          .from("agreements")
          .insert({
            couple_id: session.couple_id,
            session_id: sessionId,
            title: agreement,
            status: "active",
            next_check_in_at: getNextCheckInDate(),
          });
      }
    }

    return Response.json({ 
      success: true, 
      analysis: analysis,
      themes: themes,
      sessionType: session.type || "solo",
      agreementsExtracted: agreements.length
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Simple theme detection based on keywords
 */
function detectThemes(text) {
  const themeKeywords = {
    kommunikation: ["gespräch", "reden", "sagen", "hören", "zuhören", "verstehen", "kommunikation", "streiten", "diskussion", "aussprache"],
    kinder: ["kind", "kinder", "sohn", "tochter", "eltern", "erziehung", "schule", "betreuung", "familie"],
    finanzen: ["geld", "finanzen", "ausgaben", "sparen", "verdienen", "kosten", "budget", "schulden"],
    arbeit: ["arbeit", "job", "beruf", "chef", "kollegen", "stress", "karriere", "büro", "pensum", "workload"],
    intimität: ["nähe", "sex", "intim", "berührung", "zärtlich", "liebe", "romantik", "körperlich", "leidenschaft"],
    haushalt: ["haushalt", "aufgaben", "putzen", "kochen", "einkaufen", "organisieren", "wäsche", "mental load"],
    zeit: ["zeit", "gemeinsam", "allein", "hobbies", "freunde", "ausgehen", "quality time", "date"],
    vertrauen: ["vertrauen", "ehrlich", "lüge", "geheimnis", "treue", "sicher", "eifersucht"],
    zukunft: ["zukunft", "pläne", "ziele", "träume", "heirat", "zusammen", "vision"],
    anerkennung: ["wertschätzung", "danke", "anerkennung", "respekt", "ignoriert", "gesehen"],
  };

  const textLower = text.toLowerCase();
  const detectedThemes = [];

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        if (!detectedThemes.includes(theme)) {
          detectedThemes.push(theme);
        }
        break;
      }
    }
  }

  return detectedThemes.slice(0, 3);
}

/**
 * Extract agreements from conversation and analysis
 */
function extractAgreements(transcript, analysis) {
  const agreements = [];
  
  // Look for agreement patterns in text
  const patterns = [
    /vereinbar(?:t|ung)[:\s]+["']?([^"'\n.]+)/gi,
    /(?:ich|wir)\s+(?:übernehme|mache|werde)[:\s]+([^.\n]+)/gi,
    /abgemacht[:\s]+([^.\n]+)/gi,
  ];
  
  const textToSearch = `${transcript}\n${analysis}`.toLowerCase();
  
  for (const pattern of patterns) {
    const matches = textToSearch.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 10 && match[1].length < 100) {
        const cleaned = match[1].trim();
        if (!agreements.includes(cleaned)) {
          agreements.push(cleaned);
        }
      }
    }
  }
  
  return agreements.slice(0, 3); // Max 3 agreements per session
}

/**
 * Get next check-in date (1 week from now)
 */
function getNextCheckInDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
