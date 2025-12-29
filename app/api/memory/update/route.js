/**
 * MEMORY UPDATE API - /api/memory/update
 * Aktualisiert Kontext nach Session-Ende
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

const UPDATE_PROMPT = `Du bist ein Assistent der Gesprächsnotizen für einen Beziehungscoach pflegt.

AKTUELLE NOTIZEN:
{current_context}

NEUE SESSION ({session_type}, {date}):
{analysis}

AUFGABE:
Aktualisiere die Notizen basierend auf der neuen Session. Gib NUR valides JSON zurück.

REGELN:
1. FACTS: Neue Fakten hinzufügen, veraltete überschreiben (Kinder-Alter aktualisieren, etc.)
2. EXPRESSED: Wichtige neue Aussagen ergänzen (max 5 behalten, älteste entfernen)
3. STRENGTHS: Aktualisieren wenn sich etwas geändert hat (max 5)
4. JOURNEY.PROGRESS: Wenn ein Thema Fortschritt zeigt, hinzufügen/aktualisieren
5. JOURNEY.RECURRING: Wenn ein Thema wiederholt auftaucht, notieren
6. JOURNEY.RECENT_SESSIONS: Diese Session vorne hinzufügen (max 3 behalten)
7. COACHING.WORKS_WELL: Was in dieser Session gut funktioniert hat
8. NEXT_SESSION.FOLLOWUP: Was nächstes Mal nachgefragt werden sollte
9. NEXT_SESSION.SENSITIVE: Sensible Themen notieren

WICHTIG:
- Keine Diagnosen oder klinischen Bewertungen
- Nur was der User selbst gesagt/erzählt hat
- Neutral formulieren
- Bei Widersprüchen: Neuere Info überschreibt

Antworte NUR mit dem aktualisierten JSON, keine Erklärungen.`;

export async function POST(request) {
  try {
    const { userId, coupleId, sessionId, sessionType, analysis } = await request.json();

    if (!userId || !sessionId || !analysis) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, partner_name, memory_consent, personal_context")
      .eq("id", userId)
      .single();

    if (profileError || !profile.memory_consent) {
      return Response.json({ 
        success: false, 
        reason: "No memory consent" 
      });
    }

    // 2. Get current shared context (if couple exists)
    let sharedContext = null;
    if (coupleId) {
      const { data: couple } = await supabase
        .from("couples")
        .select("shared_context")
        .eq("id", coupleId)
        .single();

      if (couple) {
        sharedContext = couple.shared_context;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // 3. Update based on session type
    if (sessionType === "solo") {
      // Update personal context
      const updatedPersonal = await updateContext(
        profile.personal_context || getDefaultPersonalContext(),
        analysis,
        "solo",
        today,
        "personal"
      );

      if (updatedPersonal) {
        await supabase
          .from("profiles")
          .update({ personal_context: updatedPersonal })
          .eq("id", userId);
      }

      // Also update shared facts if new facts were mentioned
      if (coupleId && sharedContext) {
        const updatedShared = await updateContext(
          sharedContext,
          analysis,
          "solo",
          today,
          "shared_facts_only"
        );

        if (updatedShared) {
          await supabase
            .from("couples")
            .update({ shared_context: updatedShared })
            .eq("id", coupleId);
        }
      }

    } else if (sessionType === "couple") {
      // Update shared context only
      if (coupleId) {
        const currentShared = sharedContext || getDefaultSharedContext();
        
        const updatedShared = await updateContext(
          currentShared,
          analysis,
          "couple",
          today,
          "shared"
        );

        if (updatedShared) {
          await supabase
            .from("couples")
            .update({ shared_context: updatedShared })
            .eq("id", coupleId);
        }
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error("Memory update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Use Claude to intelligently update context
 */
async function updateContext(currentContext, analysis, sessionType, date, updateType) {
  try {
    let prompt = UPDATE_PROMPT
      .replace("{current_context}", JSON.stringify(currentContext, null, 2))
      .replace("{session_type}", sessionType)
      .replace("{date}", date)
      .replace("{analysis}", analysis);

    // Adjust prompt based on update type
    if (updateType === "personal") {
      prompt += "\n\nFOKUS: Aktualisiere personal context (expressed, solo_journey, next_solo).";
    } else if (updateType === "shared_facts_only") {
      prompt += "\n\nFOKUS: Aktualisiere NUR facts (Kinder, Beziehungsdauer, etc.) wenn neue erwähnt wurden. Andere Felder nicht ändern.";
    } else if (updateType === "shared") {
      prompt += "\n\nFOKUS: Aktualisiere shared context vollständig (facts, strengths, journey, coaching, next_session).";
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text.trim();
    
    // Parse JSON - handle potential markdown code blocks
    let jsonStr = responseText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const updated = JSON.parse(jsonStr);
    return updated;

  } catch (error) {
    console.error("Context update failed:", error);
    // Return null to indicate failure - caller will keep existing context
    return null;
  }
}

function getDefaultPersonalContext() {
  return {
    expressed: [],
    solo_journey: {
      started: new Date().toISOString().split("T")[0],
      recent_topics: []
    },
    next_solo: {
      followup: null
    }
  };
}

function getDefaultSharedContext() {
  return {
    facts: {
      together_since: null,
      married_since: null,
      children: [],
      work: {}
    },
    strengths: [],
    journey: {
      started_with_amiya: new Date().toISOString().split("T")[0],
      initial_topics: [],
      progress: [],
      recurring: [],
      recent_sessions: []
    },
    coaching: {
      works_well: [],
      avoid: []
    },
    next_session: {
      followup: null,
      open_agreements: [],
      sensitive: []
    }
  };
}
