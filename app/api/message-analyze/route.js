/**
 * MESSAGE ANALYZE API - app/api/message-analyze/route.js
 * Analyzes chat messages (screenshots or text) using Gottman Method + NVC
 *
 * Features:
 * - Claude Vision for screenshot OCR
 * - Gottman: 4 Horsemen, Repair Attempts, Soft Startup
 * - NVC: Observation → Feeling → Need → Request
 * - Rewrite suggestions for better communication
 * - Privacy: source_text deleted after analysis
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
// MESSAGE ANALYSIS PROMPT (Gottman + NVC based)
// ═══════════════════════════════════════════════════════════

const getMessageAnalysisPrompt = (userName, partnerName, additionalContext) => {
  return `Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine Nachrichtenkonversation zwischen zwei Partnern.

KONTEXT:
- Name des Users: ${userName}
- Name des Partners: ${partnerName}
${additionalContext ? `- Zusatzkontext: ${additionalContext}` : ''}

═══════════════════════════════════════════════════════════════
ANALYSIERE NACH GOTTMAN-METHODE:

1. DIE VIER APOKALYPTISCHEN REITER
Suche nach Anzeichen von:
- Kritik (Angriff auf den Charakter statt Verhalten)
- Verachtung (Sarkasmus, Augenrollen, Beleidigungen)
- Defensivität (Rechtfertigungen, Gegenangriffe)
- Mauern (Rückzug, Schweigen, Abschalten)

2. REPARATURVERSUCHE (Positiv!)
Erkenne positive Signale:
- Humor zur Entspannung
- Zuneigung zeigen
- Verantwortung übernehmen
- "Wir gegen das Problem" Sprache
- Verständnis signalisieren

3. SOFT STARTUP vs HARSH STARTUP
Wie beginnt das Gespräch? Sanft oder vorwurfsvoll?

═══════════════════════════════════════════════════════════════
NVC-ANALYSE (Gewaltfreie Kommunikation):

Prüfe ob Nachrichten folgendes enthalten:
- Beobachtung (konkret, statt Bewertung)
- Gefühl (eigenes Gefühl, statt "Du machst mich...")
- Bedürfnis (was dahinter steckt)
- Bitte (konkret, machbar, positiv formuliert)

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (EXAKT EINHALTEN):

**Zusammenfassung**
(2-3 Sätze: Was passiert in dieser Konversation?)

**Emotionale Landschaft**
- ${userName}: [Ton/Stimmung] - [Was dahinter stecken könnte]
- ${partnerName}: [Ton/Stimmung] - [Was dahinter stecken könnte]

**Erkannte Muster**

### Herausforderungen
- [Muster 1: z.B. "Harsh Startup - Das Gespräch startet mit Vorwurf"]
- [Muster 2]

### Stärken
- [Positives Muster: z.B. "Reparaturversuch mit Humor"]

**Was ${userName} möglicherweise braucht**
- [Bedürfnis 1]
- [Bedürfnis 2]

**Was ${partnerName} möglicherweise braucht**
- [Bedürfnis 1]
- [Bedürfnis 2]

**Konkrete Empfehlungen**
1. [Empfehlung für die nächste Reaktion]
2. [Empfehlung für das zugrunde liegende Thema]

═══════════════════════════════════════════════════════════════
REWRITE SUGGESTIONS (JSON am Ende):

Wenn du Nachrichten findest die verbessert werden könnten, füge am Ende an:

---REWRITES---
[
  {
    "original": "Originaltext der Nachricht",
    "sender": "user" oder "partner",
    "issue": "Was problematisch ist (kurz)",
    "rewrite": "Verbesserter Text",
    "nvc_format": "Ich fühle [Gefühl] wenn [Beobachtung], weil ich [Bedürfnis] brauche. Könntest du [Bitte]?",
    "rationale": "Warum diese Version besser ist"
  }
]
---END REWRITES---

Regeln für Rewrites:
- Max 3 Vorschläge
- Fokus auf die problematischsten Nachrichten
- Rewrite soll natürlich klingen, nicht belehrend
- NVC-Format als zusätzliche Hilfe, nicht als Ersatz

WICHTIG:
- Bleibe warm und unterstützend, nicht belehrend
- Keine Schuldzuweisungen
- Erkenne an dass beide Perspektiven valide sind
- Deutsch

NACHRICHTENKONVERSATION:
`;
};

// ═══════════════════════════════════════════════════════════
// OCR PROMPT for Screenshot Extraction
// ═══════════════════════════════════════════════════════════

const OCR_PROMPT = `Extrahiere den gesamten Text aus diesem Chat-Screenshot.

FORMAT:
[Sender Name]: Nachrichtentext
[Sender Name]: Nachrichtentext
...

REGELN:
- Exakte Reihenfolge der Nachrichten beibehalten
- Zeitstempel inkludieren wenn sichtbar
- Emojis und Reaktionen notieren
- Wenn Sender unklar, nutze [Person A] / [Person B]
- Bei WhatsApp/iMessage: Unterscheide zwischen eigenen (rechts) und Partner-Nachrichten (links)
- Nur den extrahierten Text zurückgeben, keine Kommentare`;

export async function POST(request) {
  try {
    const {
      userId,
      coupleId,
      inputType, // 'screenshot' | 'text'
      content,   // base64 image or raw text
      additionalContext
    } = await request.json();

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    if (!content) {
      return Response.json({ error: "Content required" }, { status: 400 });
    }

    // Get user profile for names
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("name, partner_name, memory_consent")
      .eq("id", userId)
      .single();

    const userName = userProfile?.name || "User";
    const partnerName = userProfile?.partner_name || "Partner";
    const hasMemoryConsent = userProfile?.memory_consent === true;

    // ═══════════════════════════════════════════════════════════
    // 1. Extract text from screenshot if needed
    // ═══════════════════════════════════════════════════════════
    let extractedText = content;

    if (inputType === 'screenshot') {
      try {
        // Validate base64 format
        const base64Data = content.replace(/^data:image\/\w+;base64,/, '');

        // Determine media type
        let mediaType = 'image/png';
        if (content.startsWith('data:image/jpeg')) {
          mediaType = 'image/jpeg';
        } else if (content.startsWith('data:image/webp')) {
          mediaType = 'image/webp';
        }

        const ocrMessage = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data
                  }
                },
                {
                  type: "text",
                  text: OCR_PROMPT
                }
              ]
            }
          ]
        });

        extractedText = ocrMessage.content[0].text;
        console.log("OCR extracted text length:", extractedText.length);

      } catch (ocrError) {
        console.error("OCR failed:", ocrError);
        return Response.json({
          error: "Screenshot konnte nicht gelesen werden. Bitte versuche es mit Text-Eingabe.",
          code: "OCR_FAILED"
        }, { status: 400 });
      }
    }

    // Validate extracted text has enough content
    if (extractedText.length < 20) {
      return Response.json({
        error: "Zu wenig Text gefunden. Bitte lade einen Screenshot mit mehr Nachrichten hoch.",
        code: "INSUFFICIENT_CONTENT"
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════
    // 2. Create session record
    // ═══════════════════════════════════════════════════════════
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        couple_id: coupleId || null,
        type: "message_analysis",
        status: "completed",
        source_text: extractedText, // Will be deleted after analysis
        created_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return Response.json({ error: "Failed to create session" }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════
    // 3. Generate analysis with Gottman + NVC prompt
    // ═══════════════════════════════════════════════════════════
    const analysisPrompt = getMessageAnalysisPrompt(userName, partnerName, additionalContext);

    const analysisMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: analysisPrompt + extractedText
        }
      ]
    });

    const fullAnalysis = analysisMessage.content[0].text;

    // ═══════════════════════════════════════════════════════════
    // 4. Parse rewrites from analysis
    // ═══════════════════════════════════════════════════════════
    const { analysis, rewrites } = parseRewriteSuggestions(fullAnalysis);

    // ═══════════════════════════════════════════════════════════
    // 5. Detect patterns for structured storage
    // ═══════════════════════════════════════════════════════════
    const patterns = detectPatterns(analysis);

    // ═══════════════════════════════════════════════════════════
    // 6. Detect themes
    // ═══════════════════════════════════════════════════════════
    const themes = detectThemes(extractedText);

    // ═══════════════════════════════════════════════════════════
    // 7. Save analysis and DELETE source_text (privacy)
    // ═══════════════════════════════════════════════════════════
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        analysis: analysis,
        detected_patterns: patterns,
        rewrite_suggestions: rewrites,
        themes: themes,
        source_text: null, // DELETE for privacy
        analysis_created_at: new Date().toISOString()
      })
      .eq("id", session.id);

    if (updateError) {
      console.error("Failed to save analysis:", updateError);
      return Response.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════
    // 8. Update memory if consent given
    // ═══════════════════════════════════════════════════════════
    if (hasMemoryConsent) {
      try {
        await fetch(new URL('/api/memory/update', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            coupleId: coupleId || null,
            sessionId: session.id,
            sessionType: 'message_analysis',
            analysis: analysis
          })
        });
        console.log("Memory updated after message analysis");
      } catch (memoryError) {
        console.error("Memory update failed:", memoryError);
        // Don't fail the request if memory update fails
      }
    }

    return Response.json({
      success: true,
      sessionId: session.id,
      analysis: {
        text: analysis,
        patterns: patterns,
        themes: themes
      },
      rewrites: rewrites
    });

  } catch (error) {
    console.error("Message analysis error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

/**
 * Parse rewrite suggestions from analysis text
 */
function parseRewriteSuggestions(fullText) {
  const rewriteStart = fullText.indexOf('---REWRITES---');
  const rewriteEnd = fullText.indexOf('---END REWRITES---');

  if (rewriteStart === -1 || rewriteEnd === -1) {
    return { analysis: fullText, rewrites: [] };
  }

  const analysisText = fullText.substring(0, rewriteStart).trim();
  const rewriteJson = fullText.substring(rewriteStart + 14, rewriteEnd).trim();

  let rewrites = [];
  try {
    rewrites = JSON.parse(rewriteJson);
    // Validate structure
    rewrites = rewrites.filter(r =>
      r.original && r.rewrite && typeof r.original === 'string'
    ).slice(0, 3); // Max 3
  } catch (parseError) {
    console.error("Failed to parse rewrites JSON:", parseError);
    rewrites = [];
  }

  return { analysis: analysisText, rewrites };
}

/**
 * Detect Gottman patterns in analysis text
 */
function detectPatterns(analysisText) {
  const textLower = analysisText.toLowerCase();

  const patterns = {
    horsemen: [],
    repairs: [],
    dynamics: []
  };

  // Four Horsemen
  const horsemenPatterns = {
    criticism: ['kritik', 'angriff auf charakter', 'vorwurf', 'du bist immer', 'du machst nie'],
    contempt: ['verachtung', 'sarkasmus', 'augenrollen', 'beleidigung', 'herabsetzend'],
    defensiveness: ['defensiv', 'rechtfertigung', 'gegenangriff', 'abwehr', 'schuld abweisen'],
    stonewalling: ['mauern', 'rückzug', 'schweigen', 'abschalten', 'ignorieren']
  };

  for (const [horseman, keywords] of Object.entries(horsemenPatterns)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      patterns.horsemen.push(horseman);
    }
  }

  // Repair attempts
  const repairPatterns = {
    humor: ['humor', 'witz', 'lachen', 'scherz'],
    affection: ['zuneigung', 'liebe', 'zärtlich', 'umarmung'],
    responsibility: ['verantwortung', 'entschuldigung', 'tut mir leid', 'mein fehler'],
    we_language: ['wir', 'gemeinsam', 'zusammen', 'unser problem']
  };

  for (const [repair, keywords] of Object.entries(repairPatterns)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      patterns.repairs.push(repair);
    }
  }

  // Dynamics
  const dynamicsPatterns = {
    'harsh_startup': ['harsh startup', 'harter einstieg', 'vorwurfsvoll beginnt'],
    'soft_startup': ['soft startup', 'sanfter einstieg', 'sanft beginnt'],
    'pursuer_distancer': ['pursuer', 'distancer', 'verfolger', 'zurückzieher'],
    'escalation': ['eskalation', 'eskaliert', 'hochschaukeln']
  };

  for (const [dynamic, keywords] of Object.entries(dynamicsPatterns)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      patterns.dynamics.push(dynamic);
    }
  }

  return patterns;
}

/**
 * Simple theme detection based on keywords
 */
function detectThemes(text) {
  const themeKeywords = {
    kommunikation: ["gespräch", "reden", "sagen", "hören", "zuhören", "verstehen", "kommunikation", "streiten", "diskussion", "schreiben", "nachricht"],
    kinder: ["kind", "kinder", "sohn", "tochter", "eltern", "erziehung", "schule", "abholen"],
    finanzen: ["geld", "finanzen", "ausgaben", "sparen", "verdienen", "kosten", "budget", "zahlen"],
    arbeit: ["arbeit", "job", "beruf", "chef", "kollegen", "stress", "karriere", "büro", "meeting"],
    intimität: ["nähe", "sex", "intim", "berührung", "zärtlich", "liebe", "romantik", "date"],
    alltag: ["haushalt", "aufgaben", "putzen", "kochen", "einkaufen", "organisieren", "termin"],
    zeit: ["zeit", "gemeinsam", "allein", "hobbies", "freunde", "ausgehen", "wochenende"],
    vertrauen: ["vertrauen", "ehrlich", "lüge", "geheimnis", "treue", "sicher", "versprechen"],
    zukunft: ["zukunft", "pläne", "ziele", "träume", "heirat", "zusammenziehen", "wohnung"],
    anerkennung: ["wertschätzung", "danke", "anerkennung", "respekt", "ignoriert", "unterstützung"],
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
