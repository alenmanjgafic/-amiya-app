/**
 * CHECK-ANALYSIS API - app/api/check-analysis/route.js
 * Prüft via Claude ob genug Kontext für eine sinnvolle Analyse vorhanden ist
 */
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CHECK_PROMPT = `Du bist ein STRENGER Qualitätsprüfer für Therapie-Session-Transkripte.

Analysiere das folgende Gespräch und entscheide, ob WIRKLICH genügend substanzieller Inhalt vorhanden ist.

SEI STRENG! Eine Analyse ist NUR sinnvoll wenn:
- Der User mindestens 2-3 konkrete Sätze über ein Thema gesprochen hat
- Ein echtes Problem, Gefühl oder Anliegen genannt wurde
- Genug Details für konkrete Empfehlungen vorhanden sind

NICHT VIABLE (viable: false) wenn:
- Nur Begrüssungen, "Hallo", "Hi", "Ja", "Nein" etc.
- Nur 1-2 kurze Sätze vom User
- Kein konkretes Thema erkennbar
- User hat fast nichts gesagt oder nur kurze Antworten
- Gespräch war offensichtlich nur ein Test oder Ausprobieren
- Amiya hat mehr geredet als der User (User war passiv)

WICHTIG: Im Zweifel sage viable: false!
Es ist besser KEINE Analyse zu machen als eine über nichts.

Antworte NUR mit JSON:
{"viable": true/false, "reason": "empty|too_short|no_context|unclear|null"}

Gespräch:
`;

export async function POST(request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ viable: false, reason: "empty" });
    }

    // Sehr kurze Transkripte direkt ablehnen (unter 200 Zeichen = ca. 2-3 kurze Sätze)
    if (transcript.length < 200) {
      return Response.json({ viable: false, reason: "too_short" });
    }

    // Prüfe ob User überhaupt etwas Substanzielles gesagt hat
    const userMessages = transcript.split('\n').filter(line => line.startsWith('User:'));

    // Mindestens 2 User-Nachrichten (mehr als nur "Hallo")
    if (userMessages.length < 2) {
      return Response.json({ viable: false, reason: "too_short" });
    }

    const userContent = userMessages.map(m => m.replace('User:', '').trim()).join(' ');
    // User muss mindestens 50 Zeichen gesagt haben
    if (userContent.length < 50) {
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
