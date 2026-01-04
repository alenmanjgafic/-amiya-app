/**
 * MESSAGE ANALYZE API - app/api/message-analyze/route.js
 * Analyzes chat messages (screenshots or text) using Gottman Method + NVC
 *
 * Features:
 * - Claude Vision for screenshot OCR
 * - Claude Tool Use for STRUCTURED JSON output (99% reliable)
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
// TOOL DEFINITION for Structured Output
// ═══════════════════════════════════════════════════════════

const MESSAGE_ANALYSIS_TOOL = {
  name: "message_analysis_result",
  description: "Strukturierte Analyse einer Chat-Konversation nach Gottman-Methode und NVC",
  input_schema: {
    type: "object",
    required: ["summary", "emotional_landscape", "patterns", "user_needs", "partner_needs", "recommendations", "rewrites"],
    properties: {
      summary: {
        type: "string",
        description: "2-3 Sätze: Was passiert in dieser Konversation?"
      },
      emotional_landscape: {
        type: "object",
        required: ["user", "partner"],
        properties: {
          user: {
            type: "string",
            description: "Ton/Stimmung des Users und was dahinter stecken könnte"
          },
          partner: {
            type: "string",
            description: "Ton/Stimmung des Partners und was dahinter stecken könnte"
          }
        }
      },
      patterns: {
        type: "object",
        required: ["challenges", "strengths"],
        properties: {
          challenges: {
            type: "array",
            items: {
              type: "object",
              required: ["pattern", "description"],
              properties: {
                pattern: {
                  type: "string",
                  enum: ["criticism", "contempt", "defensiveness", "stonewalling", "harsh_startup", "escalation", "other"],
                  description: "Gottman-Muster Typ"
                },
                description: {
                  type: "string",
                  description: "Konkrete Beschreibung wie sich das Muster zeigt"
                }
              }
            },
            description: "Erkannte Herausforderungen/negative Muster"
          },
          strengths: {
            type: "array",
            items: {
              type: "object",
              required: ["pattern", "description"],
              properties: {
                pattern: {
                  type: "string",
                  enum: ["humor", "affection", "responsibility", "we_language", "soft_startup", "understanding", "other"],
                  description: "Positives Muster Typ"
                },
                description: {
                  type: "string",
                  description: "Konkrete Beschreibung wie sich das Muster zeigt"
                }
              }
            },
            description: "Erkannte Stärken/Reparaturversuche"
          }
        }
      },
      user_needs: {
        type: "array",
        items: { type: "string" },
        description: "Was der User möglicherweise braucht (2-3 Bedürfnisse)"
      },
      partner_needs: {
        type: "array",
        items: { type: "string" },
        description: "Was der Partner möglicherweise braucht (2-3 Bedürfnisse)"
      },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          required: ["title", "description"],
          properties: {
            title: {
              type: "string",
              description: "Kurzer Titel der Empfehlung"
            },
            description: {
              type: "string",
              description: "Ausführlichere Erklärung"
            }
          }
        },
        description: "2-3 konkrete Empfehlungen"
      },
      rewrites: {
        type: "array",
        items: {
          type: "object",
          required: ["original", "sender", "issue", "rewrite", "rationale"],
          properties: {
            original: {
              type: "string",
              description: "Originaltext der Nachricht"
            },
            sender: {
              type: "string",
              enum: ["user", "partner"],
              description: "Wer hat die Nachricht geschrieben"
            },
            issue: {
              type: "string",
              description: "Was ist problematisch (kurz)"
            },
            rewrite: {
              type: "string",
              description: "Verbesserter, natürlich klingender Text"
            },
            nvc_format: {
              type: "string",
              description: "NVC-Format: Ich fühle [Gefühl] wenn [Beobachtung], weil ich [Bedürfnis] brauche. Könntest du [Bitte]?"
            },
            rationale: {
              type: "string",
              description: "Warum diese Version besser ist"
            }
          }
        },
        description: "1-3 Vorschläge für bessere Formulierungen der problematischsten Nachrichten"
      },
      detected_themes: {
        type: "array",
        items: {
          type: "string",
          enum: ["kommunikation", "kinder", "finanzen", "arbeit", "intimität", "alltag", "zeit", "vertrauen", "zukunft", "anerkennung"]
        },
        description: "Erkannte Themen (max 3)"
      }
    }
  }
};

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
- Kritik (criticism): Angriff auf den Charakter statt Verhalten
- Verachtung (contempt): Sarkasmus, Augenrollen, Beleidigungen
- Defensivität (defensiveness): Rechtfertigungen, Gegenangriffe
- Mauern (stonewalling): Rückzug, Schweigen, Abschalten

2. REPARATURVERSUCHE (Positiv!)
Erkenne positive Signale:
- Humor (humor): zur Entspannung
- Zuneigung (affection): zeigen
- Verantwortung (responsibility): übernehmen
- Wir-Sprache (we_language): "Wir gegen das Problem"
- Verständnis (understanding): signalisieren

3. SOFT STARTUP vs HARSH STARTUP
Wie beginnt das Gespräch? Sanft (soft_startup) oder vorwurfsvoll (harsh_startup)?

═══════════════════════════════════════════════════════════════
NVC-ANALYSE (Gewaltfreie Kommunikation):

Prüfe ob Nachrichten folgendes enthalten:
- Beobachtung (konkret, statt Bewertung)
- Gefühl (eigenes Gefühl, statt "Du machst mich...")
- Bedürfnis (was dahinter steckt)
- Bitte (konkret, machbar, positiv formuliert)

═══════════════════════════════════════════════════════════════
WICHTIGE REGELN:

1. REWRITES SIND PFLICHT: Du MUSST mindestens 1-3 Rewrite-Vorschläge machen
   - Fokus auf die problematischsten Nachrichten
   - Rewrite soll natürlich klingen, nicht belehrend
   - NVC-Format als zusätzliche Hilfe

2. Bleibe warm und unterstützend, nicht belehrend
3. Keine Schuldzuweisungen
4. Erkenne an dass beide Perspektiven valide sind
5. Antworte auf Deutsch

Nutze das Tool "message_analysis_result" um deine Analyse strukturiert zurückzugeben.

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
    // 3. Generate analysis with Tool Use for STRUCTURED output
    // ═══════════════════════════════════════════════════════════
    const analysisPrompt = getMessageAnalysisPrompt(userName, partnerName, additionalContext);

    const analysisMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [MESSAGE_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "message_analysis_result" },
      messages: [
        {
          role: "user",
          content: analysisPrompt + extractedText
        }
      ]
    });

    // Extract structured data from tool use response
    const toolUseBlock = analysisMessage.content.find(block => block.type === "tool_use");

    if (!toolUseBlock || toolUseBlock.name !== "message_analysis_result") {
      console.error("Tool use response not found:", analysisMessage.content);
      return Response.json({ error: "Analyse-Format fehlgeschlagen" }, { status: 500 });
    }

    const structuredAnalysis = toolUseBlock.input;
    console.log("Structured analysis received:", Object.keys(structuredAnalysis));

    // ═══════════════════════════════════════════════════════════
    // 4. Extract data from structured response
    // ═══════════════════════════════════════════════════════════
    const rewrites = structuredAnalysis.rewrites || [];
    const themes = structuredAnalysis.detected_themes || [];

    // Convert structured patterns to legacy format for compatibility
    const patterns = {
      horsemen: structuredAnalysis.patterns?.challenges
        ?.filter(c => ["criticism", "contempt", "defensiveness", "stonewalling"].includes(c.pattern))
        ?.map(c => c.pattern) || [],
      repairs: structuredAnalysis.patterns?.strengths
        ?.filter(s => ["humor", "affection", "responsibility", "we_language", "understanding"].includes(s.pattern))
        ?.map(s => s.pattern) || [],
      dynamics: [
        ...(structuredAnalysis.patterns?.challenges?.filter(c => ["harsh_startup", "escalation"].includes(c.pattern))?.map(c => c.pattern) || []),
        ...(structuredAnalysis.patterns?.strengths?.filter(s => s.pattern === "soft_startup")?.map(s => s.pattern) || [])
      ]
    };

    // ═══════════════════════════════════════════════════════════
    // 5. Build analysis text from structured data (for display & storage)
    // ═══════════════════════════════════════════════════════════
    const analysisText = buildAnalysisText(structuredAnalysis, userName, partnerName);

    // ═══════════════════════════════════════════════════════════
    // 6. Save analysis and DELETE source_text (privacy)
    // ═══════════════════════════════════════════════════════════
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        analysis: analysisText,
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
    // 7. Update memory if consent given
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
            analysis: analysisText
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
        text: analysisText,
        patterns: patterns,
        themes: themes,
        // Include structured data for rich UI
        structured: structuredAnalysis
      },
      rewrites: rewrites
    });

  } catch (error) {
    console.error("Message analysis error:", error);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}

/**
 * Build readable analysis text from structured data
 * This creates the markdown-like text for display in the UI
 */
function buildAnalysisText(structured, userName, partnerName) {
  const lines = [];

  // Summary
  lines.push("**Zusammenfassung**");
  lines.push(structured.summary);
  lines.push("");

  // Emotional Landscape
  lines.push("**Emotionale Landschaft**");
  lines.push(`- ${userName}: ${structured.emotional_landscape.user}`);
  lines.push(`- ${partnerName}: ${structured.emotional_landscape.partner}`);
  lines.push("");

  // Patterns
  lines.push("**Erkannte Muster**");
  lines.push("");

  if (structured.patterns.challenges?.length > 0) {
    lines.push("### Herausforderungen");
    for (const challenge of structured.patterns.challenges) {
      lines.push(`- **${getPatternLabel(challenge.pattern)}** - ${challenge.description}`);
    }
    lines.push("");
  }

  if (structured.patterns.strengths?.length > 0) {
    lines.push("### Stärken");
    for (const strength of structured.patterns.strengths) {
      lines.push(`- **${getPatternLabel(strength.pattern)}** - ${strength.description}`);
    }
    lines.push("");
  }

  // User Needs
  lines.push(`**Was ${userName} möglicherweise braucht**`);
  for (const need of structured.user_needs) {
    lines.push(`- ${need}`);
  }
  lines.push("");

  // Partner Needs
  lines.push(`**Was ${partnerName} möglicherweise braucht**`);
  for (const need of structured.partner_needs) {
    lines.push(`- ${need}`);
  }
  lines.push("");

  // Recommendations
  lines.push("**Konkrete Empfehlungen**");
  structured.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. **${rec.title}**: ${rec.description}`);
  });

  return lines.join("\n");
}

/**
 * Get human-readable label for pattern type
 */
function getPatternLabel(pattern) {
  const labels = {
    // Challenges
    criticism: "Kritik",
    contempt: "Verachtung",
    defensiveness: "Defensivität",
    stonewalling: "Mauern",
    harsh_startup: "Harsh Startup",
    escalation: "Eskalation",
    // Strengths
    humor: "Humor",
    affection: "Zuneigung",
    responsibility: "Verantwortung übernehmen",
    we_language: "Wir-Sprache",
    soft_startup: "Soft Startup",
    understanding: "Verständnis zeigen",
    other: "Anderes Muster"
  };
  return labels[pattern] || pattern;
}
