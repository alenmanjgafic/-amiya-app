/**
 * AGENT TOOLS API - /api/agent-tools
 * ElevenLabs Server Tools für dynamische Abfragen während Sessions
 *
 * Diese Endpoints werden vom ElevenLabs Agent während einer laufenden
 * Session aufgerufen um kontextbewusste Coaching-Fragen zu stellen.
 *
 * PRIVACY:
 * - Solo Session: Zugriff auf eigene Solo + Couple Sessions
 * - Couple Session: NUR Couple Sessions (keine Solo Sessions!)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { tool, ...params } = body;

    // Validate required params
    if (!tool) {
      return Response.json({ error: "tool parameter required" }, { status: 400 });
    }

    // Route to appropriate tool handler
    switch (tool) {
      case "get_topic_history":
        return await handleGetTopicHistory(params);

      case "check_statements":
        return await handleCheckStatements(params);

      case "get_agreement_detail":
        return await handleGetAgreementDetail(params);

      case "save_insight":
        return await handleSaveInsight(params);

      default:
        return Response.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Agent tools error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════
// TOOL 1: get_topic_history
// Lädt vergangene Sessions zu einem bestimmten Thema
// ═══════════════════════════════════════════════════════════

async function handleGetTopicHistory(params) {
  const { theme, user_id, couple_id, session_type } = params;

  if (!theme) {
    return Response.json({ error: "theme required" }, { status: 400 });
  }

  // Build privacy-safe query
  let query = supabase
    .from("sessions")
    .select("id, type, themes, summary_for_coach, key_points, created_at")
    .eq("status", "completed")
    .not("summary_for_coach", "is", null)
    .contains("themes", [theme.toLowerCase()])
    .order("created_at", { ascending: false })
    .limit(5);

  // Apply privacy filter based on session type
  if (session_type === "couple") {
    // COUPLE: Only couple sessions
    if (!couple_id) {
      return Response.json({ sessions: [], message: "No couple_id for couple session" });
    }
    query = query.eq("couple_id", couple_id).eq("type", "couple");
  } else {
    // SOLO: Own solo + couple sessions
    if (!user_id) {
      return Response.json({ sessions: [], message: "No user_id for solo session" });
    }
    // Fetch and filter manually for OR condition
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Topic history error:", error);
    return Response.json({ sessions: [], error: error.message });
  }

  // For solo: manually filter
  let filteredSessions = sessions || [];
  if (session_type === "solo" && user_id) {
    filteredSessions = sessions?.filter(s => {
      if (s.type === "solo" && s.user_id === user_id) return true;
      if (s.type === "couple" && s.couple_id === couple_id) return true;
      return false;
    }) || [];
  }

  // Format response for ElevenLabs
  const formattedSessions = filteredSessions.map(s => ({
    date: new Date(s.created_at).toLocaleDateString("de-DE"),
    type: s.type,
    summary: s.summary_for_coach,
    topic: s.key_points?.topic || null,
    emotions: s.key_points?.emotions || [],
  }));

  return Response.json({
    theme,
    sessions: formattedSessions,
    count: formattedSessions.length,
  });
}

// ═══════════════════════════════════════════════════════════
// TOOL 2: check_statements
// Prüft auf Widersprüche zu früheren Aussagen
// ═══════════════════════════════════════════════════════════

async function handleCheckStatements(params) {
  const { claim, user_id, couple_id, session_type } = params;

  if (!claim) {
    return Response.json({ error: "claim required" }, { status: 400 });
  }

  // Extract keywords from claim
  const keywords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Search in past sessions' key_points.statements
  let query = supabase
    .from("sessions")
    .select("id, type, key_points, created_at, user_id, couple_id")
    .eq("status", "completed")
    .not("key_points", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Check statements error:", error);
    return Response.json({ found_related: false, error: error.message });
  }

  // Apply privacy filter
  let filteredSessions = sessions || [];
  if (session_type === "couple") {
    filteredSessions = sessions?.filter(s =>
      s.type === "couple" && s.couple_id === couple_id
    ) || [];
  } else if (session_type === "solo" && user_id) {
    filteredSessions = sessions?.filter(s => {
      if (s.type === "solo" && s.user_id === user_id) return true;
      if (s.type === "couple" && s.couple_id === couple_id) return true;
      return false;
    }) || [];
  }

  // Search for related statements
  const relatedStatements = [];

  for (const session of filteredSessions) {
    const statements = session.key_points?.statements || [];
    const discussed = session.key_points?.discussed || [];

    // Check if any statement contains our keywords
    for (const statement of [...statements, ...discussed]) {
      const statementLower = statement.toLowerCase();
      const hasKeyword = keywords.some(kw => statementLower.includes(kw));

      if (hasKeyword) {
        relatedStatements.push({
          date: new Date(session.created_at).toLocaleDateString("de-DE"),
          said: statement,
          session_type: session.type,
        });
      }
    }
  }

  // Check for potential contradictions
  // Simple heuristic: look for opposite words
  const opposites = {
    "nie": "immer",
    "immer": "nie",
    "nichts": "alles",
    "alles": "nichts",
    "keiner": "jeder",
    "niemand": "alle",
  };

  let potentialContradiction = false;
  const claimLower = claim.toLowerCase();

  for (const [word, opposite] of Object.entries(opposites)) {
    if (claimLower.includes(word)) {
      potentialContradiction = relatedStatements.some(s =>
        s.said.toLowerCase().includes(opposite)
      );
      if (potentialContradiction) break;
    }
  }

  return Response.json({
    found_related: relatedStatements.length > 0,
    statements: relatedStatements.slice(0, 3),
    potential_contradiction: potentialContradiction,
    searched_claim: claim,
  });
}

// ═══════════════════════════════════════════════════════════
// TOOL 3: get_agreement_detail
// Lädt Details zu einer bestimmten Vereinbarung
// ═══════════════════════════════════════════════════════════

async function handleGetAgreementDetail(params) {
  const { title, couple_id } = params;

  if (!couple_id) {
    return Response.json({ error: "couple_id required" }, { status: 400 });
  }

  // Search by title (fuzzy match)
  const { data: agreements, error } = await supabase
    .from("agreements")
    .select(`
      id, title, description, underlying_need, type, status,
      responsible_user_id, created_at, next_check_in_at,
      success_streak, check_in_frequency_days
    `)
    .eq("couple_id", couple_id)
    .in("status", ["active", "pending_approval", "achieved"]);

  if (error) {
    console.error("Agreement detail error:", error);
    return Response.json({ agreement: null, error: error.message });
  }

  // Find best match by title
  let bestMatch = null;
  const searchLower = (title || "").toLowerCase();

  for (const agreement of agreements || []) {
    const titleLower = agreement.title.toLowerCase();
    if (titleLower.includes(searchLower) || searchLower.includes(titleLower)) {
      bestMatch = agreement;
      break;
    }
  }

  if (!bestMatch && agreements?.length > 0) {
    // Fallback: partial word match
    bestMatch = agreements.find(a =>
      searchLower.split(" ").some(word =>
        a.title.toLowerCase().includes(word) && word.length > 3
      )
    );
  }

  if (!bestMatch) {
    return Response.json({
      agreement: null,
      available: agreements?.map(a => a.title) || [],
      message: `Keine Vereinbarung "${title}" gefunden`,
    });
  }

  // Get last check-in
  const { data: lastCheckin } = await supabase
    .from("agreement_checkins")
    .select("status, created_at, notes")
    .eq("agreement_id", bestMatch.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return Response.json({
    agreement: {
      title: bestMatch.title,
      description: bestMatch.description,
      underlying_need: bestMatch.underlying_need,
      type: bestMatch.type,
      status: bestMatch.status,
      created_at: new Date(bestMatch.created_at).toLocaleDateString("de-DE"),
      success_streak: bestMatch.success_streak,
      next_checkin_due: bestMatch.next_check_in_at
        ? new Date(bestMatch.next_check_in_at) <= new Date()
        : false,
      last_checkin: lastCheckin ? {
        date: new Date(lastCheckin.created_at).toLocaleDateString("de-DE"),
        status: lastCheckin.status,
        notes: lastCheckin.notes,
      } : null,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// TOOL 4: save_insight
// Speichert wichtige Erkenntnisse sofort während der Session
// ═══════════════════════════════════════════════════════════

async function handleSaveInsight(params) {
  const { type, content, session_id, user_id } = params;

  if (!content || !session_id) {
    return Response.json({ error: "content and session_id required" }, { status: 400 });
  }

  const validTypes = ["breakthrough", "pattern", "trigger", "strength", "need"];
  if (type && !validTypes.includes(type)) {
    return Response.json({
      error: `Invalid type. Valid types: ${validTypes.join(", ")}`,
    }, { status: 400 });
  }

  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("key_points")
    .eq("id", session_id)
    .single();

  if (sessionError) {
    console.error("Session fetch error:", sessionError);
    return Response.json({ saved: false, error: "Session not found" });
  }

  // Add insight to key_points
  const currentKeyPoints = session.key_points || {};
  const insights = currentKeyPoints.insights || [];

  insights.push({
    type: type || "general",
    content,
    saved_at: new Date().toISOString(),
  });

  // Update session
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      key_points: {
        ...currentKeyPoints,
        insights,
      },
    })
    .eq("id", session_id);

  if (updateError) {
    console.error("Insight save error:", updateError);
    return Response.json({ saved: false, error: updateError.message });
  }

  return Response.json({
    saved: true,
    insight: {
      type: type || "general",
      content,
    },
  });
}
