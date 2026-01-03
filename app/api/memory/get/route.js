/**
 * MEMORY GET API - /api/memory/get
 * Lädt Kontext für Session-Start (Memory System v2)
 *
 * PRIVACY auf DATEN-Ebene:
 * - Solo Session: Eigene Solo-Sessions + alle Couple-Sessions
 * - Couple Session: NUR Couple-Sessions (keine Solo-Sessions!)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_CONTEXT_LENGTH = 4000;
const MAX_SESSIONS = 10;

export async function POST(request) {
  try {
    const { userId, coupleId, sessionType } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, partner_name, memory_consent")
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

    // 2. Load past sessions with PRIVACY FILTER
    const sessions = await loadSessionsWithPrivacy(userId, coupleId, sessionType);

    // 3. Load agreements (if couple exists)
    let agreements = [];
    if (coupleId) {
      agreements = await loadAgreements(coupleId, userId);
    }

    // 4. Load shared facts from couple
    let sharedFacts = null;
    if (coupleId) {
      const { data: couple } = await supabase
        .from("couples")
        .select("shared_context")
        .eq("id", coupleId)
        .eq("status", "active")
        .single();

      if (couple?.shared_context) {
        sharedFacts = couple.shared_context;
      }
    }

    // 5. Build context based on session type
    let context = "";
    if (sessionType === "solo") {
      context = buildSoloContext(profile, sessions, agreements, sharedFacts, userId);
    } else if (sessionType === "couple") {
      context = buildCoupleContext(profile, sessions, agreements, sharedFacts);
    }

    // Ensure we don't exceed limit
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = context.substring(0, MAX_CONTEXT_LENGTH - 3) + "...";
    }

    return Response.json({
      context,
      hasMemory: true,
      debug: {
        sessionCount: sessions.length,
        agreementCount: agreements.length,
        hasSharedFacts: !!sharedFacts,
        contextLength: context.length
      }
    });

  } catch (error) {
    console.error("Memory get error:", error);
    return Response.json({ context: "", error: error.message }, { status: 200 });
  }
}

/**
 * Load sessions with privacy filter
 * CRITICAL: Privacy is enforced at DATA level, not just prompts!
 */
async function loadSessionsWithPrivacy(userId, coupleId, sessionType) {
  let query;

  if (sessionType === "couple") {
    // COUPLE SESSION: Only load couple sessions (NO solo sessions!)
    if (!coupleId) return [];

    query = supabase
      .from("sessions")
      .select("id, type, themes, summary_for_coach, key_points, created_at")
      .eq("couple_id", coupleId)
      .eq("type", "couple")
      .eq("status", "completed")
      .not("summary_for_coach", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_SESSIONS);
  } else {
    // SOLO SESSION: Load own solo sessions + all couple sessions
    // Build OR condition for privacy-safe query
    let conditions = [`user_id.eq.${userId},type.eq.solo`];

    if (coupleId) {
      conditions.push(`couple_id.eq.${coupleId},type.eq.couple`);
    }

    query = supabase
      .from("sessions")
      .select("id, type, themes, summary_for_coach, key_points, created_at, user_id, couple_id")
      .eq("status", "completed")
      .not("summary_for_coach", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_SESSIONS * 2); // Fetch more, then filter
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Sessions fetch error:", error);
    return [];
  }

  // For solo: manually filter to ensure privacy
  if (sessionType === "solo") {
    const filtered = sessions?.filter(s => {
      // Own solo sessions
      if (s.type === "solo" && s.user_id === userId) return true;
      // Couple sessions from their couple
      if (s.type === "couple" && s.couple_id === coupleId) return true;
      return false;
    }).slice(0, MAX_SESSIONS) || [];
    return filtered;
  }

  return sessions || [];
}

/**
 * Load active agreements with check-in info
 */
async function loadAgreements(coupleId, userId) {
  const { data: agreements, error } = await supabase
    .from("agreements")
    .select(`
      id, title, underlying_need, type, status,
      responsible_user_id, next_check_in_at, success_streak
    `)
    .eq("couple_id", coupleId)
    .in("status", ["active", "pending_approval"])
    .order("next_check_in_at", { ascending: true });

  if (error) {
    console.error("Agreements fetch error:", error);
    return [];
  }

  return agreements?.map(a => ({
    ...a,
    isMyResponsibility: a.responsible_user_id === userId,
    isShared: !a.responsible_user_id,
    isDue: a.next_check_in_at && new Date(a.next_check_in_at) <= new Date()
  })) || [];
}

/**
 * Minimal context when no memory consent
 */
function buildMinimalContext(profile, sessionType) {
  return `NAME: ${profile.name || "User"}
PARTNER: ${profile.partner_name || "Partner"}
SESSION: ${sessionType === "couple" ? "Couple" : "Solo"}`;
}

/**
 * Solo session context
 * Includes: Own solo sessions + couple sessions + agreements + shared facts
 */
function buildSoloContext(profile, sessions, agreements, sharedFacts, userId) {
  const parts = [];

  // Basic info
  parts.push(`NAME: ${profile.name || "User"}
PARTNER: ${profile.partner_name || "Partner"}
SESSION: Solo`);

  // Shared facts (from couple)
  if (sharedFacts) {
    parts.push(buildSharedFactsSection(sharedFacts));
  }

  // Past sessions - prioritize recent and relevant
  if (sessions.length > 0) {
    const soloSessions = sessions.filter(s => s.type === "solo").slice(0, 5);
    const coupleSessions = sessions.filter(s => s.type === "couple").slice(0, 5);

    // Solo sessions (private - nur für diesen User)
    if (soloSessions.length > 0) {
      parts.push(`DEINE LETZTEN SOLO SESSIONS:
${soloSessions.map(s => formatSessionForContext(s)).join("\n")}`);
    }

    // Couple sessions (both can see)
    if (coupleSessions.length > 0) {
      parts.push(`EURE LETZTEN COUPLE SESSIONS:
${coupleSessions.map(s => formatSessionForContext(s)).join("\n")}`);
    }

    // Extract follow-up questions from most recent session
    const mostRecent = sessions[0];
    if (mostRecent?.key_points?.follow_up?.length > 0) {
      parts.push(`NACHFRAGEN (aus letzter Session):
${mostRecent.key_points.follow_up.map(f => `- ${f}`).join("\n")}`);
    }
  }

  // Agreements (reflective, not check-in focused for solo)
  if (agreements.length > 0) {
    const agreementLines = agreements.map(a => {
      let line = `- "${a.title}"`;
      if (a.underlying_need) {
        line += ` (Dahinter: ${a.underlying_need})`;
      }
      if (a.isMyResponsibility) {
        line += ` [Deine Verantwortung]`;
      } else if (a.isShared) {
        line += ` [Gemeinsam]`;
      }
      if (a.success_streak >= 3) {
        line += ` ✓${a.success_streak}x`;
      }
      return line;
    });

    parts.push(`EURE VEREINBARUNGEN (nur erwähnen wenn thematisch relevant):
${agreementLines.join("\n")}`);
  }

  return parts.join("\n\n");
}

/**
 * Couple session context
 * PRIVACY: Only couple sessions - NO solo sessions!
 */
function buildCoupleContext(profile, sessions, agreements, sharedFacts) {
  const parts = [];

  // Basic info
  parts.push(`COUPLE SESSION: ${profile.name || "User"} & ${profile.partner_name || "Partner"}`);

  // Check for first session
  if (sessions.length === 0 && agreements.length === 0 && !sharedFacts) {
    parts.push("Dies ist eure erste gemeinsame Session.");
    return parts.join("\n\n");
  }

  // Shared facts
  if (sharedFacts) {
    parts.push(buildSharedFactsSection(sharedFacts));
  }

  // Past couple sessions (NO solo sessions here - privacy!)
  if (sessions.length > 0) {
    parts.push(`EURE LETZTEN SESSIONS:
${sessions.slice(0, 5).map(s => formatSessionForContext(s)).join("\n")}`);

    // Extract follow-up questions
    const mostRecent = sessions[0];
    if (mostRecent?.key_points?.follow_up?.length > 0) {
      parts.push(`NACHFRAGEN (aus letzter Session):
${mostRecent.key_points.follow_up.map(f => `- ${f}`).join("\n")}`);
    }

    // Detect recurring themes
    const allThemes = sessions.flatMap(s => s.themes || []);
    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {});
    const recurringThemes = Object.entries(themeCounts)
      .filter(([_, count]) => count >= 2)
      .map(([theme]) => theme);

    if (recurringThemes.length > 0) {
      parts.push(`WIEDERKEHRENDE THEMEN:
${recurringThemes.map(t => `- ${t}`).join("\n")}`);
    }
  }

  // Agreements with CHECK-IN logic for couple sessions
  if (agreements.length > 0) {
    // Due agreements - proactively ask
    const dueAgreements = agreements.filter(a => a.isDue);
    const upcomingAgreements = agreements.filter(a => !a.isDue && a.status === "active");
    const pendingApproval = agreements.filter(a => a.status === "pending_approval");

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

    if (upcomingAgreements.length > 0) {
      parts.push(`WEITERE VEREINBARUNGEN (bei Bedarf erwähnen):
${upcomingAgreements.map(a => `- "${a.title}"${a.success_streak >= 3 ? ` ✓${a.success_streak}x` : ""}`).join("\n")}`);
    }

    if (pendingApproval.length > 0) {
      parts.push(`WARTEN AUF ZUSTIMMUNG:
${pendingApproval.map(a => `- "${a.title}" - Beide müssen zustimmen`).join("\n")}`);
    }
  }

  return parts.join("\n\n");
}

/**
 * Format a session for context display
 */
function formatSessionForContext(session) {
  const date = new Date(session.created_at).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit"
  });

  // Use key_points topic if available, otherwise themes
  let topic = "Allgemein";
  if (session.key_points?.topic) {
    topic = session.key_points.topic;
  } else if (session.themes?.length > 0) {
    topic = session.themes.slice(0, 2).join(", ");
  }

  // Add brief summary if available
  let summary = "";
  if (session.key_points?.discussed?.length > 0) {
    summary = `: ${session.key_points.discussed[0]}`;
  }

  return `- ${date}: ${topic}${summary}`;
}

/**
 * Build shared facts section from couple context
 */
function buildSharedFactsSection(sharedFacts) {
  const parts = [];
  const facts = sharedFacts.facts;

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
    // GDPR: No children names in context - just age/count
    const validChildren = facts.children.filter(c => c);
    if (validChildren.length > 0) {
      const childInfo = validChildren.map(c => c.age ? `Kind (${c.age})` : "Kind").join(", ");
      factLines.push(`Kinder: ${childInfo}`);
    }
  }

  if (factLines.length > 0) {
    parts.push(`FAKTEN:
${factLines.map(f => `- ${f}`).join("\n")}`);
  }

  // Strengths
  if (sharedFacts.strengths?.length > 0) {
    const validStrengths = sharedFacts.strengths.filter(s => s && typeof s === "string");
    if (validStrengths.length > 0) {
      parts.push(`STÄRKEN:
${validStrengths.slice(-3).map(s => `- ${s}`).join("\n")}`);
    }
  }

  return parts.join("\n\n");
}
