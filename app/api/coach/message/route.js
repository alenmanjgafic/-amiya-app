/**
 * MESSAGE COACH API - /api/coach/message
 *
 * Collaborative message writing with Amiya
 * Uses Claude to help users craft empathetic responses
 * Based on the analysis context from a previous message analysis
 */

import Anthropic from "@anthropic-ai/sdk";
import { validateBody, coachMessageSchema } from "../../../../lib/validation";
import { applyRateLimit } from "../../../../lib/rateLimit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Du bist Amiya, ein einfühlsamer Beziehungscoach. Du hilfst dem User dabei, eine gute Antwort an seinen Partner zu formulieren.

DEINE ROLLE:
- Du bist wie ein guter Freund, der beim Formulieren hilft
- Warm, unterstützend, aber auch ehrlich
- Du kennst die Gottman-Methode und NVC (Gewaltfreie Kommunikation)

GESPRÄCHSABLAUF:
1. Der User erzählt dir, was er sagen möchte (oft unstrukturiert)
2. Du verstehst die Intention und die Gefühle dahinter
3. Du schlägst eine formulierte Nachricht vor
4. Der User kann Feedback geben, du verfeinerst

WENN DU EINEN VORSCHLAG MACHST:
- Schreibe zuerst 1-2 Sätze Erklärung
- Dann den konkreten Textvorschlag in einem separaten Abschnitt
- Der Vorschlag sollte authentisch klingen (wie der User, nicht wie ein Therapeut)
- Nutze "Ich"-Aussagen wo passend
- Vermeide Vorwürfe, Verallgemeinerungen ("immer", "nie")
- Beachte den emotionalen Kontext aus der Analyse

FORMAT für Vorschläge:
[Deine kurze Erklärung hier]

---VORSCHLAG---
[Der konkrete Text für die Nachricht]
---ENDE---

WICHTIG:
- Frage nach, wenn du nicht sicher bist was der User meint
- Biete verschiedene Optionen an wenn sinnvoll
- Der User entscheidet - du machst Vorschläge, keine Vorgaben
- Halte den Ton natürlich, wie in einer Chat-Unterhaltung
- Antworte auf Deutsch`;

export async function POST(request) {
  try {
    const {
      messages,
      analysisContext,
      userName,
      partnerName,
      requestVariation,
    } = await validateBody(request, coachMessageSchema);

    // Rate Limit prüfen (50/Stunde)
    await applyRateLimit(request, "coach-message");

    // Build context from analysis
    let contextInfo = "";
    if (analysisContext) {
      contextInfo = `
KONTEXT AUS DER NACHRICHTENANALYSE:
${analysisContext.analysis?.substring(0, 2000) || "Keine Analyse verfügbar"}

Erkannte Themen: ${analysisContext.themes?.join(", ") || "Keine"}
`;
    }

    if (userName) {
      contextInfo += `\nDer User heißt: ${userName}`;
    }
    if (partnerName) {
      contextInfo += `\nDer Partner heißt: ${partnerName}`;
    }

    if (requestVariation) {
      contextInfo += `\n\nWICHTIG: Der User möchte eine ANDERE Variante des Vorschlags. Formuliere den gleichen Inhalt deutlich anders - vielleicht kürzer, direkter, oder mit anderem Einstieg.`;
    }

    // Convert messages to Claude format
    const claudeMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + "\n\n" + contextInfo,
      messages: claudeMessages,
    });

    const responseText = response.content[0].text;

    // Extract suggestion if present (between markers)
    let suggestion = null;
    const suggestionMatch = responseText.match(
      /---VORSCHLAG---\s*([\s\S]*?)\s*---ENDE---/
    );
    if (suggestionMatch) {
      suggestion = suggestionMatch[1].trim();
    }

    // Clean response text (remove suggestion markers for display)
    let cleanResponse = responseText
      .replace(/---VORSCHLAG---[\s\S]*?---ENDE---/, "")
      .trim();

    return Response.json({
      response: cleanResponse,
      suggestion: suggestion,
    });
  } catch (error) {
    console.error("Message coach API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
