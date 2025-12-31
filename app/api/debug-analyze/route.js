/**
 * DEBUG ANALYZE API - Zeigt was Claude wirklich zurückgibt
 * NUR FÜR DEBUGGING - später löschen!
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

const COUPLE_PROMPT = `Du bist Amiya, eine erfahrene Beziehungscoach.
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

// Test transcript for debugging
const TEST_TRANSCRIPT = `[Couple Session: Alen & Romina]

Amiya: Hallo Alen, wie geht es dir?
Alen: Hallo, mir geht's gut.
Amiya: Das freut mich zu hören, Alen. Schön, dass du wieder da bist. Was bringst du heute mit?
Alen: Ich bin mit Romina hier und wir wollen, ja ich habe ja gesagt, dass ich jetzt die Kinder montags abhole.
Amiya: Hey ihr zwei, schön euch wiederzusehen. Alen, das ist klasse, dass du das mit dem Abholen der Kinder am Montag direkt ansprichst. Romina, wie ist das für dich?
Romina: Super, ich freue mich, dass er mir entgegenkommt. Ich würde mir auch Unterstützung wünschen beim Abendessen am Wochenende.
Amiya: Das ist ein schöner Schritt, Romina. Alen, du hast gehört, dass Romina sich am Wochenende Unterstützung beim Abendessen wünscht. Wie klingt das für dich?
Alen: Das passt für mich, das kann ich gerne machen. Ich koche auch gerne, daher machen wir das.
Amiya: Das klingt nach einem richtig guten Plan. Soll ich das als eure Vereinbarung festhalten?
Alen: Ja.
Romina: Ja, gerne.
Amiya: Schön. Ich halte fest: Alen holt montags die Kinder ab und übernimmt am Wochenende das Kochen.`;

export async function POST(request) {
  try {
    const { sessionId, useTestData } = await request.json();

    let transcript = TEST_TRANSCRIPT;
    let debugInfo = { mode: "TEST_DATA" };

    // If sessionId provided, try to use real data
    if (sessionId && !useTestData) {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (session && session.summary) {
        transcript = session.summary;
        debugInfo = {
          mode: "REAL_SESSION",
          sessionId: session.id,
          sessionType: session.type,
          summaryLength: session.summary.length
        };
      } else {
        debugInfo = {
          mode: "TEST_DATA (session has no summary)",
          sessionId: sessionId,
          reason: session ? "summary is null" : "session not found"
        };
      }
    }

    // Generate analysis with Claude using the CURRENT prompt
    const fullPrompt = COUPLE_PROMPT + transcript;
    
    console.log("=== DEBUG: Sending to Claude ===");
    console.log("Mode:", debugInfo.mode);
    console.log("Prompt length:", fullPrompt.length);
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const fullAnalysis = message.content[0].text;
    
    console.log("=== DEBUG: Claude Response ===");
    console.log("Response length:", fullAnalysis.length);

    // Check for agreement block
    const hasAgreementBlock = fullAnalysis.includes("**Vereinbarung erkannt**");
    const hasOldAgreementBlock = fullAnalysis.includes("**Mögliche Vereinbarung erkannt**");
    
    // Find where Nächste Schritte ends
    const nextStepsIndex = fullAnalysis.indexOf("**Nächste Schritte**");
    const afterNextSteps = nextStepsIndex > -1 ? fullAnalysis.substring(nextStepsIndex) : "NOT FOUND";

    return Response.json({
      success: true,
      debug: {
        ...debugInfo,
        promptLength: fullPrompt.length,
        responseLength: fullAnalysis.length,
        hasAgreementBlock,
        hasOldAgreementBlock,
        agreementBlockFound: hasAgreementBlock ? "✅ YES" : "❌ NO",
        afterNextSteps: afterNextSteps,
        last500Chars: fullAnalysis.slice(-500)
      },
      fullAnalysis: fullAnalysis
    });

  } catch (error) {
    console.error("Debug analyze error:", error);
    return Response.json({ 
      error: "Analysis failed",
      details: error.message 
    }, { status: 500 });
  }
}
