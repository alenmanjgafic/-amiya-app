/**
 * CHAT PRACTICE API - /api/learning/chat-practice/route.js
 * Mini-chat endpoint for learning exercises
 * Focused, short responses for skill practice
 */
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Exercise-specific system prompts
const EXERCISE_PROMPTS = {
  "soft-startup": {
    systemPrompt: `Du bist Amiya, ein warmherziger Beziehungscoach. Du hilfst dem User, einen sanften Gesprächseinstieg zu üben.

DEINE AUFGABE:
1. Der User gibt dir einen Satz, mit dem er ein schwieriges Gespräch beginnen würde
2. Gib kurzes, ermutigendes Feedback (2-3 Sätze)
3. Wenn der Satz "Du immer..." oder Vorwürfe enthält, schlage sanft eine Alternative vor
4. Wenn der Satz gut ist, bestätige das und gib einen kleinen Verbesserungstipp

WICHTIG:
- Bleib warm und ermutigend
- Halte Antworten unter 80 Wörtern
- Verwende Ich-Botschaften als Beispiel
- Nach 3-4 Runden, fasse zusammen was der User gelernt hat`,
    initialMessage: "Stell dir vor, du möchtest ein schwieriges Thema ansprechen. Wie würdest du das Gespräch beginnen?",
  },

  "validation": {
    systemPrompt: `Du bist Amiya, ein warmherziger Beziehungscoach. Du spielst den Partner und der User übt, validierend zu antworten.

DEINE AUFGABE:
1. Teile eine Aussage wie ein Partner, der sich über etwas beschwert oder Gefühle äussert
2. Der User soll validierend antworten
3. Gib Feedback: War die Antwort validierend? (Validation = Gefühle anerkennen, nicht Lösung anbieten)
4. Erkläre kurz, was gut war oder was fehlt

BEISPIEL-AUSSAGEN die du teilen kannst:
- "Ich fühle mich so gestresst mit der Arbeit gerade."
- "Mich nervt es, dass wir nie Zeit für uns haben."
- "Ich hab das Gefühl, du hörst mir nicht richtig zu."

WICHTIG:
- Nach der User-Antwort, bewerte ob sie validierend war
- Validation ≠ Zustimmung, Validation = "Ich verstehe, dass du..."
- Halte Antworten unter 80 Wörtern
- Nach 3-4 Runden, fasse zusammen`,
    initialMessage: "Lass mich mal so tun, als wäre ich dein Partner. Ich sage dir etwas, und du versuchst, validierend zu antworten.",
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      chapterId,
      exerciseType,
      scenario,
      messages = [],
      turnCount = 0,
      maxTurns = 4,
      userId,
    } = body;

    // Get exercise config
    const exerciseConfig = EXERCISE_PROMPTS[exerciseType] || EXERCISE_PROMPTS["soft-startup"];

    // Build conversation for Claude
    const systemPrompt = `${exerciseConfig.systemPrompt}

KONTEXT DER ÜBUNG:
${scenario || "Der User übt Kommunikationstechniken."}

AKTUELLE RUNDE: ${turnCount} von ${maxTurns}
${turnCount >= maxTurns - 1 ? "Dies ist die letzte Runde. Gib ein abschliessendes Feedback." : ""}`;

    // Convert messages to Claude format
    const claudeMessages = messages.map((msg) => ({
      role: msg.role === "amiya" ? "assistant" : "user",
      content: msg.content,
    }));

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0]?.text || "Entschuldige, ich konnte keine Antwort generieren.";

    // Check if this completes the exercise
    const isComplete = turnCount >= maxTurns - 1;

    // Generate final feedback if complete
    let finalFeedback = null;
    if (isComplete) {
      try {
        const feedbackResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: `Du bist Amiya. Fasse in 2-3 Sätzen zusammen, was der User in dieser Übung gut gemacht hat und was er/sie mitnehmen kann. Sei ermutigend und konkret.`,
          messages: [
            {
              role: "user",
              content: `Der User hat diese Übung (${exerciseType}) gemacht. Hier ist der Verlauf:\n\n${messages.map((m) => `${m.role === "user" ? "User" : "Amiya"}: ${m.content}`).join("\n")}\n\nGib ein abschliessendes Feedback.`,
            },
          ],
        });
        finalFeedback = feedbackResponse.content[0]?.text;
      } catch (e) {
        console.error("Feedback generation error:", e);
        finalFeedback = assistantMessage;
      }
    }

    // Save practice to database (optional, for tracking)
    // Could save to user_chat_practice table here

    return Response.json({
      response: assistantMessage,
      isComplete,
      finalFeedback,
      turnCount: turnCount,
    });

  } catch (error) {
    console.error("Chat practice error:", error);
    return Response.json(
      { error: error.message || "Fehler bei der Übung" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning/chat-practice?exerciseType=soft-startup
 * Returns initial message and config for an exercise
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseType = searchParams.get("exerciseType") || "soft-startup";

    const config = EXERCISE_PROMPTS[exerciseType];

    if (!config) {
      return Response.json(
        { error: "Unknown exercise type" },
        { status: 400 }
      );
    }

    return Response.json({
      exerciseType,
      initialMessage: config.initialMessage,
      maxTurns: 4,
    });

  } catch (error) {
    console.error("Chat practice config error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
