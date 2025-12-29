/**
 * CHECK-ANALYSIS API - app/api/check-analysis/route.js
 * Prüft via Claude ob genug Kontext für eine sinnvolle Analyse vorhanden ist
 */
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHECK_PROMPT = `Du bist ein Qualitätsprüfer für Therapie-Session-Transkripte. 

Analysiere das folgende Gespräch und entscheide, ob genügend substanzieller Inhalt vorhanden ist, um eine sinnvolle therapeutische Analyse zu erstellen.

KRITERIEN FÜR EINE VIABLE ANALYSE:
- Mindestens ein konkretes Thema, Problem oder Gefühl wurde besprochen
- Der User hat etwas Persönliches oder Relevantes über sich oder die Beziehung geteilt
- Es gibt genug Kontext um Muster, Dynamiken oder Empfehlungen abzuleiten

NICHT VIABLE wenn:
- Nur Begrüssungen oder Small Talk
- Unverständliche oder zusammenhangslose Aussagen
- Nur sehr kurze Ja/Nein Antworten ohne Kontext
- Technische Probleme dominierten das Gespräch
- Kein erkennbares Thema oder Anliegen

Antworte NUR mit einem JSON-Objekt in diesem Format:
{"viable": true/false, "reason": "empty|too_short|no_context|unclear|null"}

- viable: true wenn genug Inhalt für eine gute Analyse da ist
- viable: false wenn nicht genug Inhalt
- reason: nur bei viable=false angeben, sonst null

Gespräch:
`;

export async function POST(request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ viable: false, reason: "empty" });
    }

    // Sehr kurze Transkripte direkt ablehnen (unter 50 Zeichen)
    if (transcript.length < 50) {
      return Response.json({ viable: false, reason: "too_short" });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: CHECK_PROMPT + transcript,
        },
      ],
    });

    const responseText = message.content[0].text.trim();
    
    try {
      // Parse JSON response
      const result = JSON.parse(responseText);
      return Response.json({
        viable: result.viable === true,
        reason: result.reason || null
      });
    } catch (parseError) {
      // Fallback: Wenn JSON-Parsing fehlschlägt, erlaube Analyse
      console.error("Failed to parse Claude response:", responseText);
      return Response.json({ viable: true, reason: null });
    }

  } catch (error) {
    console.error("Check analysis error:", error);
    // Bei Fehler: Erlaube Analyse (fail-safe)
    return Response.json({ viable: true, reason: null });
  }
}
