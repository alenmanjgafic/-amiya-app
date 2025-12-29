/**
 * MEMORY GET API - /api/memory/get
 * Lädt Kontext für Session-Start
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, coupleId, sessionType } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, partner_name, memory_consent, personal_context")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return Response.json({ context: "", error: "Profile not found" }, { status: 200 });
    }

    // If no consent, return minimal context
    if (!profile.memory_consent) {
      return Response.json({
        context: buildMinimalContext(profile, sessionType),
        hasMemory: false
      });
    }

    // 2. Get shared context from couple (if exists)
    let sharedContext = null;
    let agreements = [];

    if (coupleId) {
      const { data: couple } = await supabase
        .from("couples")
        .select("shared_context")
        .eq("id", coupleId)
        .single();

      if (couple) {
        sharedContext = couple.shared_context;
      }

      // 3. Get active agreements
      const { data: agreementsData } = await supabase
        .from("agreements")
        .select("title, status, next_check_in_at, themes")
        .eq("couple_id", coupleId)
        .eq("status", "active")
        .order("next_check_in_at", { ascending: true });

      if (agreementsData) {
        agreements = agreementsData;
      }
    }

    // 4. Build context based on session type
    let context = "";

    if (sessionType === "solo") {
      context = buildSoloContext(profile, sharedContext, agreements);
    } else if (sessionType === "couple") {
      context = buildCoupleContext(profile, sharedContext, agreements);
    }

    return Response.json({
      context,
      hasMemory: true,
      debug: {
        hasPersonalContext: !!profile.personal_context,
        hasSharedContext: !!sharedContext,
        agreementCount: agreements.length
      }
    });

  } catch (error) {
    console.error("Memory get error:", error);
    return Response.json({ context: "", error: error.message }, { status: 200 });
  }
}

/**
 * Minimal context when no memory consent
 */
function buildMinimalContext(profile, sessionType) {
  return `Name: ${profile.name || "User"}
Partner: ${profile.partner_name || "Partner"}`;
}

/**
 * Solo session context - includes personal + shared
 */
function buildSoloContext(profile, sharedContext, agreements) {
  const parts = [];

  // Personal context (private)
  const personal = profile.personal_context;
  if (personal?.expressed?.length > 0) {
    parts.push(`PERSÖNLICH (nur ${profile.name}):
${personal.expressed.slice(-5).map(e => `- ${e}`).join("\n")}`);
  }

  if (personal?.solo_journey?.recent_topics?.length > 0) {
    const recent = personal.solo_journey.recent_topics.slice(-2);
    parts.push(`LETZTE SOLO SESSIONS:
${recent.map(t => `- ${t.date}: ${t.topic}${t.open ? ` (offen: ${t.open})` : ""}`).join("\n")}`);
  }

  // Shared context
  if (sharedContext) {
    parts.push(buildSharedSection(sharedContext, profile));
  }

  // Agreements
  if (agreements.length > 0) {
    const dueAgreements = agreements.filter(a => 
      a.next_check_in_at && new Date(a.next_check_in_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (dueAgreements.length > 0) {
      parts.push(`OFFENE VEREINBARUNGEN (Check-in fällig):
${dueAgreements.map(a => `- "${a.title}"`).join("\n")}`);
    }
  }

  // Follow-up
  const followups = [];
  if (personal?.next_solo?.followup) {
    followups.push(personal.next_solo.followup);
  }
  if (sharedContext?.next_session?.followup) {
    followups.push(sharedContext.next_session.followup);
  }
  if (followups.length > 0) {
    parts.push(`NACHFRAGEN:
${followups.map(f => `- ${f}`).join("\n")}`);
  }

  return parts.join("\n\n");
}

/**
 * Couple session context - only shared (no personal from either partner)
 */
function buildCoupleContext(profile, sharedContext, agreements) {
  const parts = [];

  if (!sharedContext) {
    return `Erste gemeinsame Session mit ${profile.name} und ${profile.partner_name}.`;
  }

  // Shared context
  parts.push(buildSharedSection(sharedContext, profile));

  // Journey & Progress
  const journey = sharedContext.journey;
  if (journey) {
    if (journey.progress?.length > 0) {
      parts.push(`EURE FORTSCHRITTE:
${journey.progress.slice(-3).map(p => `- ${p.topic}: ${p.status}${p.what_helped ? ` (${p.what_helped})` : ""}`).join("\n")}`);
    }

    if (journey.recurring?.length > 0) {
      parts.push(`WIEDERKEHRENDE THEMEN:
${journey.recurring.map(r => `- ${r.topic}${r.note ? ` (${r.note})` : ""}`).join("\n")}`);
    }

    if (journey.recent_sessions?.length > 0) {
      const recent = journey.recent_sessions[0];
      parts.push(`LETZTE COUPLE SESSION (${recent.date}):
- ${recent.topic}
- Ergebnis: ${recent.outcome || "offen"}`);
    }
  }

  // Agreements
  if (agreements.length > 0) {
    parts.push(`AKTIVE VEREINBARUNGEN:
${agreements.map(a => {
      const isDue = a.next_check_in_at && new Date(a.next_check_in_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return `- "${a.title}"${isDue ? " (Check-in fällig)" : ""}`;
    }).join("\n")}`);
  }

  // Coaching style
  const coaching = sharedContext.coaching;
  if (coaching?.works_well?.length > 0) {
    parts.push(`WAS BEI EUCH FUNKTIONIERT:
${coaching.works_well.slice(-3).map(w => `- ${w}`).join("\n")}`);
  }

  // Follow-up
  if (sharedContext.next_session?.followup) {
    parts.push(`NACHFRAGEN:
- ${sharedContext.next_session.followup}`);
  }

  // Sensitive topics
  if (sharedContext.next_session?.sensitive?.length > 0) {
    parts.push(`SENSIBLE THEMEN:
${sharedContext.next_session.sensitive.map(s => `- ${s}`).join("\n")}`);
  }

  return parts.join("\n\n");
}

/**
 * Shared section used by both solo and couple
 */
function buildSharedSection(sharedContext, profile) {
  const parts = [];
  const facts = sharedContext.facts;

  // Basic facts
  const factLines = [];
  if (facts?.together_since) {
    const years = new Date().getFullYear() - facts.together_since;
    factLines.push(`${years} Jahre zusammen`);
  }
  if (facts?.married_since) {
    factLines.push(`verheiratet seit ${facts.married_since}`);
  }
  if (facts?.children?.length > 0) {
    const childInfo = facts.children.map(c => `${c.name} (${c.age})`).join(", ");
    factLines.push(`Kinder: ${childInfo}`);
  }

  if (factLines.length > 0) {
    parts.push(`FAKTEN:
${factLines.map(f => `- ${f}`).join("\n")}`);
  }

  // Strengths
  if (sharedContext.strengths?.length > 0) {
    parts.push(`STÄRKEN:
${sharedContext.strengths.slice(-3).map(s => `- ${s}`).join("\n")}`);
  }

  return parts.join("\n\n");
}
