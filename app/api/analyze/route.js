/**
 * ANALYZE API - app/api/analyze/route.js
 * Claude-powered session analysis with Agreement Detection
 *
 * Generates TWO outputs:
 * 1. analysis - User-facing, warm/neutral depending on session type
 * 2. summary_for_coach - Internal factual summary for Amiya's memory
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { validateBody, analyzeSchema } from "../../../lib/validation";
import { applyRateLimit } from "../../../lib/rateLimit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════
// USER-FACING ANALYSIS PROMPTS
// ═══════════════════════════════════════════════════════════

const getAnalysisPrompt = (sessionType) => {
  const isCoupleSession = sessionType === "couple";

  if (isCoupleSession) {
    // Couple: Neutral, balanced, "on the side of the relationship" (Gottman)
    return `Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine COUPLE SESSION - beide Partner waren dabei.

STIL:
- Neutral und ausgewogen - du bist "auf der Seite der Beziehung"
- KEINE Parteinahme - beide Perspektiven sind gleichwertig
- Verwende die Namen der Personen
- Fokussiere auf Muster und Stärken, nicht nur Probleme
- Deutsch
- Sprich beide Partner an (ihr-Form)

WICHTIG:
- Validiere BEIDE Perspektiven gleichermassen
- Keine Schuldzuweisungen
- Beobachte Dynamiken, nicht "wer recht hat"

STRUKTUR (EXAKT EINHALTEN - ALLE ABSCHNITTE SIND PFLICHT):

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

**Vereinbarung**
Prüfe ob im Gespräch konkrete Zusagen gemacht wurden ("Ich werde...", "Ich mache ab jetzt...", "Das übernehme ich", "Ich hole die Kinder ab").

Falls JA, schreibe EXAKT in diesem Format:
- Was: [Die konkreteste Zusage als Satz, z.B. "Alen holt montags die Kinder ab"]
- Wer: [Name der Person die es zugesagt hat]
- Bedürfnis: [Das Bedürfnis dahinter, z.B. Entlastung, Fairness, Zeit]

Falls NEIN (keine konkreten Zusagen):
- Keine konkrete Vereinbarung in dieser Session

Gespräch:
`;
  }

  // Solo: Warm, empathetic, but NOT bashing the partner
  return `Du bist Amiya, eine erfahrene Beziehungscoach.
Du analysierst eine SOLO SESSION - nur ein Partner war dabei.

STIL:
- Warm und unterstützend, nicht klinisch
- Verwende den Namen der Person
- Fokussiere auf Muster und Stärken, nicht nur Probleme
- Max 400 Wörter
- Deutsch
- Sprich den User direkt an (du-Form)

WICHTIG - Partner nicht abwerten:
- Validiere die GEFÜHLE des Users (z.B. "Du fühlst dich übersehen")
- Aber werte den Partner NICHT ab (nicht: "Dein Partner ignoriert dich")
- Bleibe bei der Perspektive des Users ohne Schuldzuweisungen
- Erkenne an dass beide Seiten berechtigte Bedürfnisse haben können

STRUKTUR:

**Zusammenfassung**
(2-3 Sätze: Worum ging es?)

**Was mir aufgefallen ist**
(2-3 Beobachtungen/Muster - neutral über Partner formuliert)

**Mögliche nächste Schritte**
(1-2 konkrete Vorschläge)

Gespräch:
`;
};

// ═══════════════════════════════════════════════════════════
// COACH SUMMARY PROMPT (Internal use for Amiya's memory)
// ═══════════════════════════════════════════════════════════

const getCoachSummaryPrompt = (sessionType, userName, partnerName) => {
  const isCoupleSession = sessionType === "couple";
  const sessionLabel = isCoupleSession
    ? `Couple Session mit ${userName} & ${partnerName}`
    : `Solo Session mit ${userName}`;

  return `Du erstellst interne Notizen für einen Beziehungscoach.
Diese Notizen sind NICHT für den User sichtbar - sie dienen dem Coach als Gedächtnis.

SESSION: ${sessionLabel}
DATUM: ${new Date().toISOString().split('T')[0]}

Erstelle eine FAKTISCHE Zusammenfassung. Sei neutral, nicht wertend.

FORMAT (halte dich exakt daran):

THEMA: (Hauptthema in 3-5 Wörtern)

BESPROCHEN:
- (Bullet Point 1)
- (Bullet Point 2)
- (Bullet Point 3)

EMOTIONEN:
- (Was war spürbar: Frustration, Trauer, Hoffnung, Wut, Angst, etc.)

WICHTIGE AUSSAGEN:
- "[Wörtliche oder sinngemässe Aussage 1]"
- "[Wörtliche oder sinngemässe Aussage 2]"

${isCoupleSession ? `DYNAMIK:
- (Beobachtete Muster zwischen den Partnern)
- (z.B. Pursuer-Distancer, Kritik-Verteidigung, etc.)
` : `PERSPEKTIVE AUF PARTNER:
- (Wie sieht User den Partner - subjektiv!)
`}

OFFEN GEBLIEBEN:
- (Was wurde nicht geklärt)
- (Welche Fragen kamen auf)

NÄCHSTES MAL FRAGEN:
- (Konkrete Follow-up Frage 1)
- (Konkrete Follow-up Frage 2)

REGELN:
- Faktisch, nicht wertend
- Keine Kindernamen (GDPR) - nur "Tochter (10)" oder "Sohn (8)"
- Max 400 Wörter
- Keine therapeutischen Bewertungen

Gespräch:
`;
};

// Fallback für alte Aufrufe
const ANALYSIS_PROMPT = getAnalysisPrompt("solo");

export async function POST(request) {
  try {
    const { sessionId } = await validateBody(request, analyzeSchema);

    // Rate Limit prüfen (20/Stunde)
    await applyRateLimit(request, "analyze");

    // Get session from database
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

    // Get user info for personalization
    let userName = "User";
    let partnerName = "Partner";
    let coupleNames = null;

    // For solo sessions, get the user's profile
    if (session.user_id) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name, partner_name")
        .eq("id", session.user_id)
        .single();

      if (userProfile) {
        userName = userProfile.name || "User";
        partnerName = userProfile.partner_name || "Partner";
      }
    }

    // For couple sessions, fetch both names
    if (session.type === "couple" && session.couple_id) {
      const { data: couple } = await supabase
        .from("couples")
        .select("user_a_id, user_b_id")
        .eq("id", session.couple_id)
        .single();

      if (couple) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", [couple.user_a_id, couple.user_b_id]);

        if (profiles && profiles.length === 2) {
          const userA = profiles.find(p => p.id === couple.user_a_id);
          const userB = profiles.find(p => p.id === couple.user_b_id);
          coupleNames = {
            user_a_name: userA?.name || "",
            user_b_name: userB?.name || ""
          };
          userName = coupleNames.user_a_name;
          partnerName = coupleNames.user_b_name;
        }
      }
    }

    const isCoupleSession = session.type === "couple";

    // ═══════════════════════════════════════════════════════════
    // 1. Generate USER-FACING analysis
    // ═══════════════════════════════════════════════════════════
    const analysisPrompt = getAnalysisPrompt(session.type || "solo");

    const userAnalysisMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: isCoupleSession ? 2500 : 1500,
      messages: [
        {
          role: "user",
          content: analysisPrompt + session.summary,
        },
      ],
    });

    const fullAnalysis = userAnalysisMessage.content[0].text;

    // Parse for agreement suggestion
    const { analysis, suggestedAgreement } = parseAnalysisForAgreement(fullAnalysis, session, coupleNames);

    // ═══════════════════════════════════════════════════════════
    // 2. Generate COACH SUMMARY (internal)
    // ═══════════════════════════════════════════════════════════
    const coachPrompt = getCoachSummaryPrompt(session.type || "solo", userName, partnerName);

    const coachSummaryMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: coachPrompt + session.summary,
        },
      ],
    });

    const summaryForCoach = coachSummaryMessage.content[0].text;

    // ═══════════════════════════════════════════════════════════
    // 3. Extract key points for structured storage
    // ═══════════════════════════════════════════════════════════
    const keyPoints = extractKeyPoints(summaryForCoach, session.type);

    // Detect themes from conversation
    const themes = detectThemes(session.summary);

    // ═══════════════════════════════════════════════════════════
    // 4. Save everything to database
    // ═══════════════════════════════════════════════════════════
    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        analysis: analysis,
        summary_for_coach: summaryForCoach,
        key_points: keyPoints,
        analysis_created_at: new Date().toISOString(),
        themes: themes,
        summary: null, // Delete transcript for privacy
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
 * Extract key points from coach summary for structured storage
 */
function extractKeyPoints(summaryForCoach, sessionType) {
  const keyPoints = {
    topic: null,
    discussed: [],
    emotions: [],
    statements: [],
    open_questions: [],
    follow_up: []
  };

  try {
    // Extract topic
    const topicMatch = summaryForCoach.match(/THEMA:\s*(.+)/);
    if (topicMatch) {
      keyPoints.topic = topicMatch[1].trim();
    }

    // Extract discussed points
    const discussedMatch = summaryForCoach.match(/BESPROCHEN:\n([\s\S]*?)(?=\n\n|\nEMOTIONEN:)/);
    if (discussedMatch) {
      keyPoints.discussed = discussedMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }

    // Extract emotions
    const emotionsMatch = summaryForCoach.match(/EMOTIONEN:\n([\s\S]*?)(?=\n\n|\nWICHTIGE)/);
    if (emotionsMatch) {
      keyPoints.emotions = emotionsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }

    // Extract statements
    const statementsMatch = summaryForCoach.match(/WICHTIGE AUSSAGEN:\n([\s\S]*?)(?=\n\n|\nDYNAMIK:|\nPERSPEKTIVE|\nOFFEN)/);
    if (statementsMatch) {
      keyPoints.statements = statementsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').replace(/[""]/g, '').trim())
        .filter(Boolean);
    }

    // Extract open questions
    const openMatch = summaryForCoach.match(/OFFEN GEBLIEBEN:\n([\s\S]*?)(?=\n\n|\nNÄCHSTES)/);
    if (openMatch) {
      keyPoints.open_questions = openMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }

    // Extract follow-up questions
    const followUpMatch = summaryForCoach.match(/NÄCHSTES MAL FRAGEN:\n([\s\S]*?)(?=\n\n|$)/);
    if (followUpMatch) {
      keyPoints.follow_up = followUpMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
  } catch (error) {
    console.error("Failed to extract key points:", error);
  }

  return keyPoints;
}

/**
 * Parse analysis text to extract agreement suggestion
 * @param {string} fullText - The full analysis text from Claude
 * @param {object} session - The session object
 * @param {object|null} coupleNames - Object with user_a_name and user_b_name
 */
function parseAnalysisForAgreement(fullText, session, coupleNames = null) {
  // Check for agreement section - try multiple markers
  const markers = [
    "**Vereinbarung**",           // New format (part of structure)
    "**Vereinbarung erkannt**",   // Old format
    "**Mögliche Vereinbarung erkannt**"  // Legacy format
  ];

  let agreementMarker = null;
  let markerIndex = -1;

  for (const marker of markers) {
    const idx = fullText.indexOf(marker);
    if (idx !== -1) {
      agreementMarker = marker;
      markerIndex = idx;
      break;
    }
  }

  if (markerIndex === -1) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Get the agreement section (from marker to end or next section)
  const agreementSection = fullText.substring(markerIndex);

  // Check if it says "keine Vereinbarung"
  if (agreementSection.toLowerCase().includes("keine konkrete vereinbarung") ||
      agreementSection.toLowerCase().includes("keine vereinbarung")) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Parse agreement details
  const whatMatch = agreementSection.match(/- Was: (.+)/);
  const needMatch = agreementSection.match(/- (?:Bedürfnis|Dahinter): (.+)/);
  const whoMatch = agreementSection.match(/- Wer: (.+)/);

  if (!whatMatch) {
    return { analysis: fullText, suggestedAgreement: null };
  }

  // Determine responsible person using the actual names from database
  let responsible = "both";
  if (whoMatch && coupleNames) {
    const who = whoMatch[1].toLowerCase().trim();
    const userAName = (coupleNames.user_a_name || "").toLowerCase();
    const userBName = (coupleNames.user_b_name || "").toLowerCase();

    // Check if the "Wer" field contains one name but not the other
    const hasUserA = userAName && who.includes(userAName);
    const hasUserB = userBName && who.includes(userBName);

    if (hasUserA && !hasUserB) {
      responsible = "user_a";
    } else if (hasUserB && !hasUserA) {
      responsible = "user_b";
    } else if (who.includes("beide") || who.includes("wir") || who.includes("gemeinsam")) {
      responsible = "both";
    }
    // If both names are present or neither is found, default to "both"
  }

  console.log("Agreement parsed:", {
    what: whatMatch[1].trim(),
    who: whoMatch ? whoMatch[1].trim() : "both",
    need: needMatch ? needMatch[1].trim() : null,
    responsible,
    coupleNames
  });

  return {
    analysis: fullText, // Keep full analysis (agreement section is part of it now)
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
