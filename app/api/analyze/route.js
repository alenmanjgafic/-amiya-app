/**
 * ANALYZE API - app/api/analyze/route.js
 * Claude-powered session analysis (deletes transcript after)
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

const ANALYSIS_PROMPT = `Du bist ein erfahrener Paartherapeut, der eine Solo-Session analysiert. 

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

    // Generate analysis with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: ANALYSIS_PROMPT + session.summary,
        },
      ],
    });

    const analysis = message.content[0].text;

    // Detect themes from conversation (before deleting)
    const themes = detectThemes(session.summary);

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

    return Response.json({ 
      success: true, 
      analysis: analysis,
      themes: themes 
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

// Simple theme detection based on keywords
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
