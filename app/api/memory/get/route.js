/**
 * MEMORY GET API - /api/memory/get
 * Lädt Kontext für Session-Start mit erweitertem Agreement-Support
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Increased from 800 to 4000 for better context
const MAX_CONTEXT_LENGTH = 4000;

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
    let couple = null;

    if (coupleId) {
      const { data: coupleData } = await supabase
        .from("couples")
        .select("shared_context, user_a_id, user_b_id")
        .eq("id", coupleId)
        .eq("status", "active")
        .single();

      if (coupleData) {
        sharedContext = coupleData.shared_context;
        couple = coupleData;
      }

      // 3. Get active agreements with recent check-in info
      const { data: agreementsData } = await supabase
        .from("agreements")
        .select(`
          id, title, underlying_need, type, status,
          responsible_user_id, next_check_in_at, success_streak,
          check_in_frequency_days,
          checkins:agreement_checkins(status, created_at)
        `)
        .eq("couple_id", coupleId)
        .in("status", ["active", "pending_approval"])
        .order("next_check_in_at", { ascending: true });

      if (agreementsData) {
        agreements = agreementsData.map(a => ({
          ...a,
          lastCheckInStatus: a.checkins?.[0]?.status || null,
          checkins: undefined // Don't pass full checkins array
        }));
      }
    }

    // 4. Build context based on session type
    let context = "";

    if (sessionType === "solo") {
      context = buildSoloContext(profile, sharedContext, agreements, couple, userId);
    } else if (sessionType === "couple") {
      context = buildCoupleContext(profile, sharedContext, agreements, couple);
    }

    // Ensure we don't exceed limit
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = context.substring(0, MAX_CONTEXT_LENGTH - 3) + "...";
    }

    return Response.json({
      context,
      hasMemory: true,
      debug: {
        hasPersonalContext: !!profile.personal_context,
        hasSharedContext: !!sharedContext,
        agreementCount: agreements.length,
        contextLength: context.length
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
 * Solo session context - includes personal + shared + enriched agreements
 */
function buildSoloContext(profile, sharedContext, agreements, couple, userId) {
  const parts = [];

  // Basic info
  parts.push(`NAME: ${profile.name || "User"}
PARTNER: ${profile.partner_name || "Partner"}`);

  // Personal context (private)
  const personal = profile.personal_context;
  if (personal?.expressed?.length > 0) {
    parts.push(`PERSÖNLICH (nur ${profile.name}):
${personal.expressed.slice(-5).map(e => `- ${e}`).join("\n")}`);
  }

  if (personal?.solo_journey?.recent_topics?.length > 0) {
    const recent = personal.solo_journey.recent_topics
      .filter(t => t && t.date && t.topic)
      .slice(-2);
    if (recent.length > 0) {
      parts.push(`LETZTE SOLO SESSIONS:
${recent.map(t => `- ${t.date}: ${t.topic}${t.open ? ` (offen: ${t.open})` : ""}`).join("\n")}`);
    }
  }

  // Past learnings (from previous relationships, anonymized)
  if (personal?.past_learnings?.length > 0) {
    const achieved = personal.past_learnings.filter(l => l.achieved).slice(-2);
    if (achieved.length > 0) {
      parts.push(`FRÜHERE ERKENNTNISSE:
${achieved.map(l => `- ${l.insight}`).join("\n")}`);
    }
  }

  // Shared context
  if (sharedContext) {
    parts.push(buildSharedSection(sharedContext, profile));
  }

  // Agreements with enriched context for Solo
  // Solo = reflective, not check-in focused
  if (agreements.length > 0) {
    const agreementLines = agreements.map(a => {
      const isMyResponsibility = a.responsible_user_id === userId;
      const isShared = !a.responsible_user_id;
      const isDue = a.next_check_in_at && new Date(a.next_check_in_at) <= new Date();
      
      let line = `- "${a.title}"`;
      if (a.underlying_need) {
        line += `\n  Dahinter: ${a.underlying_need}`;
      }
      if (isMyResponsibility) {
        line += `\n  (Deine Verantwortung)`;
      } else if (isShared) {
        line += `\n  (Gemeinsam)`;
      }
      if (a.success_streak >= 3) {
        line += ` ✓ ${a.success_streak}x erfolgreich`;
      }
      return line;
    });

    parts.push(`EURE VEREINBARUNGEN (nur erwähnen wenn thematisch relevant):
${agreementLines.join("\n")}`);
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
 * Couple session context - shared + proactive agreement check-ins
 */
function buildCoupleContext(profile, sharedContext, agreements, couple) {
  const parts = [];

  // Basic info
  parts.push(`COUPLE SESSION: ${profile.name} & ${profile.partner_name}`);

  if (!sharedContext && agreements.length === 0) {
    parts.push("Erste gemeinsame Session.");
    return parts.join("\n\n");
  }

  // Shared context
  if (sharedContext) {
    parts.push(buildSharedSection(sharedContext, profile));
  }

  // Journey & Progress
  if (sharedContext?.journey) {
    const journey = sharedContext.journey;
    
    if (journey.progress?.length > 0) {
      parts.push(`EURE FORTSCHRITTE:
${journey.progress.slice(-3).map(p => `- ${p.topic}: ${p.status}${p.what_helped ? ` (${p.what_helped})` : ""}`).join("\n")}`);
    }

    if (journey.recurring?.length > 0) {
      parts.push(`WIEDERKEHRENDE THEMEN:
${journey.recurring.map(r => `- ${r.topic}${r.note ? ` (${r.note})` : ""}`).join("\n")}`);
    }
  }

  // Agreements with CHECK-IN logic for Couple sessions
  if (agreements.length > 0) {
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    // Split into due and not due
    const dueAgreements = agreements.filter(a => 
      a.next_check_in_at && new Date(a.next_check_in_at) <= now
    );
    const upcomingAgreements = agreements.filter(a => 
      !a.next_check_in_at || new Date(a.next_check_in_at) > now
    );

    // Due agreements - proactively ask (max 2)
    if (dueAgreements.length > 0) {
      const toAsk = dueAgreements.slice(0, 2);
      parts.push(`CHECK-IN FÄLLIG (bitte ansprechen):
${toAsk.map(a => {
        let line = `- "${a.title}"`;
        if (a.underlying_need) {
          line += ` (Dahinter: ${a.underlying_need})`;
        }
        line += `\n  → Frag: "Wie läuft es mit...?"`;
        return line;
      }).join("\n")}`);
    }

    // Other active agreements
    if (upcomingAgreements.length > 0) {
      parts.push(`WEITERE VEREINBARUNGEN (bei Bedarf erwähnen):
${upcomingAgreements.map(a => `- "${a.title}"${a.success_streak >= 3 ? ` ✓${a.success_streak}x` : ""}`).join("\n")}`);
    }

    // Pending approvals
    const pending = agreements.filter(a => a.status === "pending_approval");
    if (pending.length > 0) {
      parts.push(`WARTEN AUF ZUSTIMMUNG:
${pending.map(a => `- "${a.title}" - Beide müssen zustimmen`).join("\n")}`);
    }
  }

  // Coaching style
  if (sharedContext?.coaching?.works_well?.length > 0) {
    parts.push(`WAS BEI EUCH FUNKTIONIERT:
${sharedContext.coaching.works_well.slice(-3).map(w => `- ${w}`).join("\n")}`);
  }

  // Follow-up
  if (sharedContext?.next_session?.followup) {
    parts.push(`NACHFRAGEN:
- ${sharedContext.next_session.followup}`);
  }

  // Sensitive topics
  if (sharedContext?.next_session?.sensitive?.length > 0) {
    parts.push(`SENSIBLE THEMEN (vorsichtig ansprechen):
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
  if (facts?.together_since && !isNaN(facts.together_since)) {
    const years = new Date().getFullYear() - facts.together_since;
    if (years > 0) {
      factLines.push(`${years} Jahre zusammen`);
    }
  }
  if (facts?.married_since && !isNaN(facts.married_since)) {
    factLines.push(`verheiratet seit ${facts.married_since}`);
  }
  if (facts?.children?.length > 0) {
    const validChildren = facts.children.filter(c => c && c.name);
    if (validChildren.length > 0) {
      const childInfo = validChildren.map(c => c.age ? `${c.name} (${c.age})` : c.name).join(", ");
      factLines.push(`Kinder: ${childInfo}`);
    }
  }

  if (factLines.length > 0) {
    parts.push(`FAKTEN:
${factLines.map(f => `- ${f}`).join("\n")}`);
  }

  // Strengths
  if (sharedContext.strengths?.length > 0) {
    const validStrengths = sharedContext.strengths.filter(s => s && typeof s === 'string');
    if (validStrengths.length > 0) {
      parts.push(`STÄRKEN:
${validStrengths.slice(-3).map(s => `- ${s}`).join("\n")}`);
    }
  }

  return parts.join("\n\n");
}
