/**
 * REFORMULATE API - /api/coach/reformulate
 *
 * Generates alternative phrasings for a text segment
 * Based on user feedback (e.g., "zu formal", "nicht ich")
 * Used by the tap-to-edit feature in EditableText
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const REFORMULATE_TOOL = {
  name: "reformulation_result",
  description: "Strukturierte Antwort mit alternativen Formulierungen",
  input_schema: {
    type: "object",
    required: ["explanation", "alternatives"],
    properties: {
      explanation: {
        type: "string",
        description:
          "Kurze empathische Erklärung (1-2 Sätze), die zeigt dass du das Feedback verstehst. Deutsch, persönlich, warm.",
      },
      alternatives: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 3,
        description:
          "2-3 alternative Formulierungen für den ausgewählten Text. Natürlich, authentisch, nicht therapeutisch.",
      },
    },
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { originalText, feedback, fullMessage, partnerName } = body;

    if (!originalText || !feedback) {
      return Response.json(
        { error: "originalText and feedback required" },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist Amiya, ein einfühlsamer Beziehungscoach. Der User arbeitet an einer Nachricht an ${partnerName || "den Partner"} und möchte einen bestimmten Teil anders formulieren.

DEINE AUFGABE:
1. Verstehe das Feedback des Users
2. Erstelle 2-3 alternative Formulierungen

STIL DER ALTERNATIVEN:
- Authentisch und natürlich (so wie der User wirklich spricht)
- Keine Therapeuten-Sprache
- Kurz und prägnant
- Emotional ehrlich
- Passend zum Kontext der Gesamtnachricht

FEEDBACK-TYPEN verstehen:
- "Zu formal" → lockerer, natürlicher
- "Zu defensiv" → weniger rechtfertigend, mehr Verantwortung
- "Nicht ich" → persönlicher Stil des Users
- "Zu weich" → direkter, klarer
- "Zu direkt" → sanfter, mit mehr Empathie

Antworte NUR mit dem Tool, keine zusätzlichen Nachrichten.`;

    const userMessage = `GESAMTE NACHRICHT:
"${fullMessage}"

AUSGEWÄHLTER TEIL:
"${originalText}"

USER-FEEDBACK:
${feedback}

Generiere 2-3 Alternativen für den ausgewählten Teil.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      tools: [REFORMULATE_TOOL],
      tool_choice: { type: "tool", name: "reformulation_result" },
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract tool result
    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.name !== "reformulation_result") {
      throw new Error("No valid tool response");
    }

    const result = toolUseBlock.input;

    return Response.json({
      explanation: result.explanation,
      alternatives: result.alternatives,
    });
  } catch (error) {
    console.error("Reformulate API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
