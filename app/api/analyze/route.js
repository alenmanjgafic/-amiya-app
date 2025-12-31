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

const ANALYSIS_PROMPT = `Du bist ein erfahrener Paartherapeut, der eine Session analysiert. 

Analysiere das folgende Gespräch und erstelle eine hilfreiche, einfühlsame Analyse.

WICHTIG:
- Sei warm und unterstützend, nicht klinisch
- Verwende die Namen der Personen wenn sie im Kontext angegeben sind
- Fokussiere auf Muster und Erkenntnisse, nicht auf Probleme
- Gib konkrete, umsetzbare Vorschläge
- Halte die Analyse kurz und verständlich (max 300 Wörter)
- Schreibe auf Deutsch
- Sprich den User direkt an (du-Form)

Struktur deiner Analyse:
1. **Zusammenfassung** (2-3 Sätze: Worum ging es?)
2. **Was mir aufgefallen ist** (2-3 Beobachtungen/Muster)
3. **Mögliche nächste Schritte** (1-2 konkrete Vorschläge)

AGREEMENT DETECTION:
Prüfe ob im Gespräch konkrete Commitments gemacht wurden:
- Aussagen wie "Ich verspreche...", "Ab jetzt werde ich...", "Wir haben vereinbart..."
- Konkrete Verhaltensänderungen die einer dem anderen zusagt
- Vereinbarungen die beide treffen

Wenn du ein klares Commitment findest (nicht vage wie "ich versuche es"), füge am Ende hinzu:

---
**Mögliche Vereinbarung erkannt**
- Was: [konkrete, kurze Vereinbarung]
- Dahinter: [das Bedürfnis das dadurch erfüllt wird]
- Wer: [Name der Person die sich verpflichtet, oder "Beide"]
---

Nur hinzufügen wenn wirklich ein klares Commitment erkannt wurde.
Maximal EINE Vereinbarung vorschlagen (die wichtigste).

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
      .select("*, couple:couples(id, user_a_id, user_b_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.summary) {
      return Response.json({ error: "No conversation to analyze" }, { status: 400 });
    }

    // Generate analysis with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: ANALYSIS_PROMPT + session.summary,
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
      const { data: suggestion } = await supabase
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

      savedSuggestion = suggestion;
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
  // Check if agreement section exists
  const agreementMarker = "**Mögliche Vereinbarung erkannt**";
  const markerIndex = fullText.indexOf(agreementMarker);
  
  if (markerIndex === -1) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Split analysis and agreement section
  const analysis = fullText.substring(0, markerIndex).trim();
  const agreementSection = fullText.substring(markerIndex);

  // Parse agreement details
  const whatMatch = agreementSection.match(/- Was: (.+)/);
  const behindMatch = agreementSection.match(/- Dahinter: (.+)/);
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
      underlyingNeed: behindMatch ? behindMatch[1].trim() : null,
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
    kinder: ["kind", "kinder", "sohn", "tochter", "eltern", "erziehung", "schule"],
    finanzen: ["geld", "finanzen", "ausgaben", "sparen", "verdienen", "kosten", "budget"],
    arbeit: ["arbeit", "job", "beruf", "chef", "kollegen", "stress", "karriere", "büro"],
    intimität: ["nähe", "sex", "intim", "berührung", "zärtlich", "liebe", "romantik"],
    alltag: ["haushalt", "aufgaben", "putzen", "kochen", "einkaufen", "organisieren"],
    zeit: ["zeit", "gemeinsam", "allein", "hobbies", "freunde", "ausgehen"],
    vertrauen: ["vertrauen", "ehrlich", "lüge", "geheimnis", "treue", "sicher"],
    zukunft: ["zukunft", "pläne", "ziele", "träume", "heirat", "zusammen"],
    anerkennung: ["wertschätzung", "danke", "anerkennung", "respekt", "ignoriert"],
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
