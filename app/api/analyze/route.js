/**
 * ANALYZE API - app/api/analyze/route.js
 * Claude-powered session analysis with Agreement Detection
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

// Dynamischer Prompt basierend auf Session-Type
const getAnalysisPrompt = (sessionType) => {
  const isCoupleSession = sessionType === "couple";
  
  if (isCoupleSession) {
    return `Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine COUPLE SESSION - beide Partner waren dabei.

STIL:
- Warm und unterstützend, nicht klinisch
- Verwende die Namen der Personen
- Fokussiere auf Muster und Stärken, nicht nur Probleme
- Deutsch
- Sprich beide Partner an (ihr-Form)

STRUKTUR (EXAKT EINHALTEN):

**Zusammenfassung**
(2-3 Sätze: Worum ging es in dieser Session?)

**Situation**
(Kontext: Was war der Ausgangspunkt? Was ist passiert?)

**Beobachtungen**

### [Name Partner 1]
- Beobachtung 1
- Beobachtung 2
- Beobachtung 3

### [Name Partner 2]
- Beobachtung 1
- Beobachtung 2
- Beobachtung 3

### Dynamik zwischen euch
- Beobachtung zur gemeinsamen Dynamik
- Muster die aufgefallen sind

**Empfehlungen**

### Für [Name Partner 1]
1. Konkrete Empfehlung

### Für [Name Partner 2]
1. Konkrete Empfehlung

### Gemeinsam
1. Konkrete gemeinsame Empfehlung

**Nächste Schritte**
(Was sollte als nächstes passieren? Worauf achten?)

=== AGREEMENT DETECTION (WICHTIG!) ===

SUCHE im Gespräch nach konkreten Zusagen/Versprechen:
- "Ich werde...", "Ich mache ab jetzt...", "Das übernehme ich"
- "Ich hole die Kinder ab", "Ich koche..."
- "Okay, das mache ich so", "Einverstanden, ich übernehme das"
- Wenn jemand "Ja" sagt auf die Frage ob etwas festgehalten werden soll

WENN mindestens eine konkrete Zusage gefunden wird (was hier sehr wahrscheinlich ist):
Du MUSST den folgenden Block am Ende hinzufügen:

---
**Vereinbarung erkannt**
- Was: [Die konkreteste Zusage als Satz, z.B. "Alen holt montags die Kinder ab"]
- Wer: [Name der Person die es zugesagt hat]
- Bedürfnis: [Das Bedürfnis dahinter, z.B. Entlastung, Fairness, Zeit]
---

REGELN:
- NUR EINE Vereinbarung (die konkreteste/wichtigste)
- Der Block ist PFLICHT wenn es Zusagen gab
- NUR weglassen wenn wirklich KEINE konkreten Zusagen gemacht wurden

Gespräch:
`;
  }
  
  // Solo Session Prompt
  return `Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine SOLO SESSION - nur ein Partner war dabei.

STIL:
- Warm und unterstützend, nicht klinisch
- Verwende die Namen der Personen
- Fokussiere auf Muster und Stärken, nicht nur Probleme
- Max 400 Wörter
- Deutsch
- Sprich den User direkt an (du-Form)

STRUKTUR:

**Zusammenfassung**
(2-3 Sätze: Worum ging es?)

**Was mir aufgefallen ist**
(2-3 Beobachtungen/Muster)

**Mögliche nächste Schritte**
(1-2 konkrete Vorschläge)

Gespräch:
`;
};

// Fallback für alte Aufrufe
const ANALYSIS_PROMPT = getAnalysisPrompt("solo");

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    // Get session from database (simple query)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session fetch error:", sessionError);
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.summary) {
      return Response.json({ error: "No conversation to analyze" }, { status: 400 });
    }

    // Generate analysis with Claude - use session type for correct prompt
    const analysisPrompt = getAnalysisPrompt(session.type || "solo");
    const isCoupleSession = session.type === "couple";
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: isCoupleSession ? 2500 : 1500, // Couple needs more for detailed structure
      messages: [
        {
          role: "user",
          content: analysisPrompt + session.summary,
        },
      ],
    });

    const fullAnalysis = message.content[0].text;

    // Parse analysis for agreement suggestion
    const { analysis, suggestedAgreement } = parseAnalysisForAgreement(fullAnalysis, session);

    // Detect themes from conversation
    const themes = detectThemes(session.summary);

    // Save analysis (and delete transcript for privacy)
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        analysis: analysis,
        analysis_created_at: new Date().toISOString(),
        themes: themes,
        summary: null, // Delete for privacy
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to save analysis:", updateError);
      return Response.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // If agreement suggested and this is a couple session, save suggestion
    let savedSuggestion = null;
    if (suggestedAgreement && session.type === "couple" && session.couple_id) {
      try {
        const { data: suggestion, error: suggestionError } = await supabase
          .from("agreement_suggestions")
          .insert({
            couple_id: session.couple_id,
            session_id: sessionId,
            title: suggestedAgreement.title,
            underlying_need: suggestedAgreement.underlyingNeed,
            responsible: suggestedAgreement.responsible
          })
          .select()
          .single();

        if (suggestionError) {
          console.error("Failed to save suggestion:", suggestionError);
        } else {
          savedSuggestion = suggestion;
        }
      } catch (suggestionErr) {
        console.error("Suggestion insert error:", suggestionErr);
      }
    }

    return Response.json({ 
      success: true, 
      analysis: analysis,
      themes: themes,
      suggestedAgreement: savedSuggestion ? {
        id: savedSuggestion.id,
        title: savedSuggestion.title,
        underlyingNeed: savedSuggestion.underlying_need,
        responsible: savedSuggestion.responsible
      } : null
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

/**
 * Parse analysis text to extract agreement suggestion
 */
function parseAnalysisForAgreement(fullText, session) {
  // Check for agreement section (try both markers for compatibility)
  let agreementMarker = "**Vereinbarung erkannt**";
  let markerIndex = fullText.indexOf(agreementMarker);
  
  // Fallback to old marker
  if (markerIndex === -1) {
    agreementMarker = "**Mögliche Vereinbarung erkannt**";
    markerIndex = fullText.indexOf(agreementMarker);
  }
  
  if (markerIndex === -1) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Split analysis and agreement section
  const analysis = fullText.substring(0, markerIndex).trim();
  const agreementSection = fullText.substring(markerIndex);

  // Parse agreement details (support both old and new format)
  const whatMatch = agreementSection.match(/- Was: (.+)/);
  const needMatch = agreementSection.match(/- (?:Bedürfnis|Dahinter): (.+)/);
  const whoMatch = agreementSection.match(/- Wer: (.+)/);

  if (!whatMatch) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Determine responsible person
  let responsible = "both";
  if (whoMatch) {
    const who = whoMatch[1].toLowerCase().trim();
    
    // Try to match with names from session context
    if (session.summary) {
      // Extract names from context header if present
      const contextMatch = session.summary.match(/\[Kontext: User=([^,]+), Partner=([^\]]+)\]/);
      const coupleMatch = session.summary.match(/\[Couple Session: ([^&]+) & ([^\]]+)\]/);
      
      let userName = "";
      let partnerName = "";
      
      if (contextMatch) {
        userName = contextMatch[1].toLowerCase();
        partnerName = contextMatch[2].toLowerCase();
      } else if (coupleMatch) {
        userName = coupleMatch[1].toLowerCase();
        partnerName = coupleMatch[2].toLowerCase();
      }

      if (who.includes(userName) && !who.includes(partnerName)) {
        responsible = "user_a";
      } else if (who.includes(partnerName) && !who.includes(userName)) {
        responsible = "user_b";
      } else if (who.includes("beide") || who.includes("wir") || who.includes("gemeinsam")) {
        responsible = "both";
      }
    }
  }

  return {
    analysis,
    suggestedAgreement: {
      title: whatMatch[1].trim(),
      underlyingNeed: needMatch ? needMatch[1].trim() : null,
      responsible
    }
  };
}

/**
 * Simple theme detection based on keywords
 */
function detectThemes(text) {
  const themeKeywords = {
    kommunikation: ["gespräch", "reden", "sagen", "hören", "zuhören", "verstehen", "kommunikation", "streiten", "diskussion"],
    kinder: ["kind", "kinder", "sohn", "tochter", "eltern", "erziehung", "schule", "fussball", "abholen"],
    finanzen: ["geld", "finanzen", "ausgaben", "sparen", "verdienen", "kosten", "budget"],
    arbeit: ["arbeit", "job", "beruf", "chef", "kollegen", "stress", "karriere", "büro"],
    intimität: ["nähe", "sex", "intim", "berührung", "zärtlich", "liebe", "romantik"],
    alltag: ["haushalt", "aufgaben", "putzen", "kochen", "einkaufen", "organisieren", "montag"],
    zeit: ["zeit", "gemeinsam", "allein", "hobbies", "freunde", "ausgehen"],
    vertrauen: ["vertrauen", "ehrlich", "lüge", "geheimnis", "treue", "sicher", "versprechen"],
    zukunft: ["zukunft", "pläne", "ziele", "träume", "heirat", "zusammen"],
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
