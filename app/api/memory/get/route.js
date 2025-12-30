/**
 * MEMORY GET API - /api/memory/get
 * Lädt Kontext für Session-Start
 * 
 * EVIDENCE-BASED SCHEMA v2.0
 * Basiert auf: SOAP/DAP Notes, Gottman Method, Professional Therapy Documentation
 * 
 * Wichtige Regeln:
 * - Solo Session: Nur personal_context wird geladen
 * - Couple Session: shared_context wird geladen (personal bleibt privat)
 * - Widerspruchs-Erkennung durch statements mit Datum
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
        .select("title, status, next_check_in_at, themes, created_at")
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
 * Solo session context - includes personal + limited shared facts
 * Personal statements stay private, shared only shows neutral facts
 */
function buildSoloContext(profile, sharedContext, agreements) {
  const parts = [];
  const personal = profile.personal_context;

  // ═══════════════════════════════════════════════════════════
  // PERSONAL CONTEXT (nur für diese Person sichtbar)
  // ═══════════════════════════════════════════════════════════

  // Core Needs (Gottman-based)
  if (personal?.core_needs?.length > 0) {
    const validNeeds = personal.core_needs.filter(n => n && n.need);
    if (validNeeds.length > 0) {
      parts.push(`DEINE KERNBEDÜRFNISSE:
${validNeeds.map(n => `- ${n.need}${n.identified ? ` (erkannt: ${n.identified})` : ""}`).join("\n")}`);
    }
  }

  // Statements with dates (für Widerspruchs-Erkennung)
  if (personal?.statements?.length > 0) {
    const validStatements = personal.statements
      .filter(s => s && s.said && s.date)
      .slice(-5);  // Letzte 5
    if (validStatements.length > 0) {
      parts.push(`DEINE FRÜHEREN AUSSAGEN:
${validStatements.map(s => `- ${s.date}: "${s.said}"${s.theme ? ` [${s.theme}]` : ""}`).join("\n")}`);
    }
  }

  // Legacy: expressed (für Rückwärtskompatibilität)
  if (personal?.expressed?.length > 0 && !personal?.statements?.length) {
    const validExpressed = personal.expressed.filter(e => e && typeof e === 'string');
    if (validExpressed.length > 0) {
      parts.push(`WAS DU FRÜHER ERZÄHLT HAST:
${validExpressed.slice(-5).map(e => `- ${e}`).join("\n")}`);
    }
  }

  // Partner perspective (subjektiv - nur aus Solo Sessions)
  if (personal?.partner_perspective?.length > 0) {
    const validPerspectives = personal.partner_perspective
      .filter(p => p && p.observation)
      .slice(-3);
    if (validPerspectives.length > 0) {
      parts.push(`DEINE BEOBACHTUNGEN ÜBER ${profile.partner_name?.toUpperCase() || "PARTNER"}:
${validPerspectives.map(p => `- ${p.observation}${p.date ? ` (${p.date})` : ""}`).join("\n")}`);
    }
  }

  // Own patterns recognized
  if (personal?.own_patterns?.length > 0) {
    const validPatterns = personal.own_patterns.filter(p => p && p.pattern);
    if (validPatterns.length > 0) {
      parts.push(`ERKANNTE EIGENE MUSTER:
${validPatterns.map(p => `- ${p.pattern}${p.insight ? `: ${p.insight}` : ""}`).join("\n")}`);
    }
  }

  // Solo journey / recent topics
  if (personal?.solo_journey?.recent_topics?.length > 0) {
    const recent = personal.solo_journey.recent_topics
      .filter(t => t && t.date && t.topic)
      .slice(-3);
    if (recent.length > 0) {
      parts.push(`LETZTE SOLO SESSIONS:
${recent.map(t => `- ${t.date}: ${t.topic}${t.open ? ` (offen: ${t.open})` : ""}`).join("\n")}`);
    }
  }

  // Tasks for this person
  if (personal?.tasks?.length > 0) {
    const openTasks = personal.tasks.filter(t => t && t.task && t.status === "open");
    if (openTasks.length > 0) {
      parts.push(`DEINE OFFENEN AUFGABEN:
${openTasks.map(t => `- ${t.task}${t.assigned ? ` (seit ${t.assigned})` : ""}`).join("\n")}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED CONTEXT (nur neutrale Fakten in Solo Session)
  // ═══════════════════════════════════════════════════════════

  if (sharedContext) {
    // Only neutral facts, no dynamics or statements
    const factsSection = buildFactsSection(sharedContext, profile);
    if (factsSection) {
      parts.push(factsSection);
    }

    // Strengths
    if (sharedContext.strengths?.length > 0) {
      const validStrengths = sharedContext.strengths.filter(s => s && typeof s === 'string');
      if (validStrengths.length > 0) {
        parts.push(`EURE STÄRKEN ALS PAAR:
${validStrengths.slice(-3).map(s => `- ${s}`).join("\n")}`);
      }
    }
  }

  // Agreements due soon
  if (agreements.length > 0) {
    const dueAgreements = agreements.filter(a => 
      a.next_check_in_at && new Date(a.next_check_in_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (dueAgreements.length > 0) {
      parts.push(`VEREINBARUNGEN (Check-in fällig):
${dueAgreements.map(a => `- "${a.title}"`).join("\n")}`);
    }
  }

  // Follow-ups
  const followups = [];
  if (personal?.next_solo?.followup) {
    followups.push(personal.next_solo.followup);
  }
  if (followups.length > 0) {
    parts.push(`NACHFRAGEN FÜR DIESE SESSION:
${followups.map(f => `- ${f}`).join("\n")}`);
  }

  // Coaching style
  if (personal?.coaching_style?.responds_well?.length > 0) {
    parts.push(`WAS BEI DIR FUNKTIONIERT:
${personal.coaching_style.responds_well.slice(-3).map(w => `- ${w}`).join("\n")}`);
  }

  return parts.join("\n\n");
}

/**
 * Couple session context - shared context only (personal stays private!)
 * Both partners see the same information
 */
function buildCoupleContext(profile, sharedContext, agreements) {
  const parts = [];

  if (!sharedContext) {
    return `Erste gemeinsame Session mit ${profile.name} und ${profile.partner_name}.`;
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED CONTEXT (für beide sichtbar)
  // ═══════════════════════════════════════════════════════════

  // Facts
  const factsSection = buildFactsSection(sharedContext, profile);
  if (factsSection) {
    parts.push(factsSection);
  }

  // Dynamics (Gottman-based)
  const dynamics = sharedContext.dynamics;
  if (dynamics) {
    // Expressed needs from both
    if (dynamics.expressed_needs) {
      const needsLines = [];
      if (dynamics.expressed_needs.partner_a) {
        needsLines.push(`- ${profile.name || "Partner A"}: ${dynamics.expressed_needs.partner_a}`);
      }
      if (dynamics.expressed_needs.partner_b) {
        needsLines.push(`- ${profile.partner_name || "Partner B"}: ${dynamics.expressed_needs.partner_b}`);
      }
      if (needsLines.length > 0) {
        parts.push(`AUSGESPROCHENE BEDÜRFNISSE:
${needsLines.join("\n")}`);
      }
    }

    // Core tension
    if (dynamics.core_tension) {
      parts.push(`KERN-SPANNUNG:
- ${dynamics.core_tension}`);
    }

    // Shared concerns
    if (dynamics.shared_concerns?.length > 0) {
      parts.push(`GEMEINSAME SORGEN:
${dynamics.shared_concerns.slice(-3).map(c => `- ${c}`).join("\n")}`);
    }

    // Recognized patterns (Gottman: Four Horsemen, Pursuer-Distancer, etc.)
    if (dynamics.patterns?.length > 0) {
      const validPatterns = dynamics.patterns.filter(p => p && p.pattern);
      if (validPatterns.length > 0) {
        parts.push(`ERKANNTE BEZIEHUNGSMUSTER:
${validPatterns.map(p => `- ${p.pattern}${p.context ? ` (bei ${p.context})` : ""}${p.date ? ` - erkannt ${p.date}` : ""}`).join("\n")}`);
      }
    }
  }

  // Strengths
  if (sharedContext.strengths?.length > 0) {
    const validStrengths = sharedContext.strengths.filter(s => s && typeof s === 'string');
    if (validStrengths.length > 0) {
      parts.push(`EURE STÄRKEN:
${validStrengths.slice(-4).map(s => `- ${s}`).join("\n")}`);
    }
  }

  // Journey & Progress
  const journey = sharedContext.journey;
  if (journey) {
    // Milestones
    if (journey.milestones?.length > 0) {
      const recentMilestones = journey.milestones.slice(-3);
      parts.push(`EURE FORTSCHRITTE:
${recentMilestones.map(m => `- ${m.date}: ${m.achievement}`).join("\n")}`);
    }

    // Legacy: progress (Rückwärtskompatibilität)
    if (journey.progress?.length > 0 && !journey.milestones?.length) {
      parts.push(`FORTSCHRITTE:
${journey.progress.slice(-3).map(p => `- ${p.topic}: ${p.status}${p.what_helped ? ` (${p.what_helped})` : ""}`).join("\n")}`);
    }

    // Perpetual issues (Gottman: 69% rule)
    if (journey.perpetual_issues?.length > 0) {
      parts.push(`WIEDERKEHRENDE THEMEN (normal bei Paaren):
${journey.perpetual_issues.map(i => `- ${i}`).join("\n")}`);
    }

    // Legacy: recurring
    if (journey.recurring?.length > 0 && !journey.perpetual_issues?.length) {
      const validRecurring = journey.recurring.filter(r => r && r.topic);
      if (validRecurring.length > 0) {
        parts.push(`WIEDERKEHRENDE THEMEN:
${validRecurring.map(r => `- ${r.topic}${r.note ? ` (${r.note})` : ""}`).join("\n")}`);
      }
    }

    // Recent sessions
    if (journey.recent_sessions?.length > 0) {
      const lastSession = journey.recent_sessions[0];
      if (lastSession && lastSession.date && lastSession.topic) {
        parts.push(`LETZTE COUPLE SESSION (${lastSession.date}):
- Thema: ${lastSession.topic}
- Ergebnis: ${lastSession.outcome || "offen"}`);
      }
    }
  }

  // Active agreements (both agreed)
  if (agreements.length > 0) {
    parts.push(`AKTIVE VEREINBARUNGEN:
${agreements.map(a => {
      const isDue = a.next_check_in_at && new Date(a.next_check_in_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return `- "${a.title}"${isDue ? " ⚠️ Check-in fällig" : ""}`;
    }).join("\n")}`);
  }

  // Shared agreements from context (legacy)
  if (sharedContext.agreements?.length > 0 && agreements.length === 0) {
    const activeAgreements = sharedContext.agreements.filter(a => a && a.title && a.status === "active");
    if (activeAgreements.length > 0) {
      parts.push(`VEREINBARUNGEN:
${activeAgreements.map(a => `- "${a.title}"${a.check_in ? ` (Check-in: ${a.check_in})` : ""}`).join("\n")}`);
    }
  }

  // Coaching style for couple
  const coaching = sharedContext.coaching;
  if (coaching?.works_well?.length > 0) {
    const validWorks = coaching.works_well.filter(w => w && typeof w === 'string');
    if (validWorks.length > 0) {
      parts.push(`WAS BEI EUCH FUNKTIONIERT:
${validWorks.slice(-3).map(w => `- ${w}`).join("\n")}`);
    }
  }

  // Next session preparation
  if (sharedContext.next_session) {
    const followups = [];
    
    if (sharedContext.next_session.followup) {
      followups.push(sharedContext.next_session.followup);
    }
    if (sharedContext.next_session.followup_questions?.length > 0) {
      followups.push(...sharedContext.next_session.followup_questions);
    }
    
    if (followups.length > 0) {
      parts.push(`NACHFRAGEN FÜR DIESE SESSION:
${followups.slice(0, 3).map(f => `- ${f}`).join("\n")}`);
    }

    // Sensitive topics
    if (sharedContext.next_session.sensitive?.length > 0) {
      parts.push(`SENSIBLE THEMEN (vorsichtig ansprechen):
${sharedContext.next_session.sensitive.map(s => `- ${s}`).join("\n")}`);
    }
  }

  return parts.join("\n\n");
}

/**
 * Build facts section (used by both solo and couple)
 */
function buildFactsSection(sharedContext, profile) {
  const facts = sharedContext.facts;
  if (!facts) return null;

  const factLines = [];

  // Years together
  if (facts.together_since && !isNaN(facts.together_since)) {
    const years = new Date().getFullYear() - facts.together_since;
    if (years > 0) {
      factLines.push(`${years} Jahre zusammen`);
    }
  }
  // New format: together_years
  if (facts.together_years && !isNaN(facts.together_years)) {
    factLines.push(`${facts.together_years} Jahre zusammen`);
  }

  // Married
  if (facts.married_since && !isNaN(facts.married_since)) {
    factLines.push(`verheiratet seit ${facts.married_since}`);
  }

  // Children (GDPR: no names, just count and ages)
  if (facts.children_count && facts.children_count > 0) {
    let childInfo = `${facts.children_count} Kind${facts.children_count > 1 ? "er" : ""}`;
    if (facts.children_ages?.length > 0) {
      childInfo += ` (${facts.children_ages.join(", ")} Jahre)`;
    }
    factLines.push(childInfo);
  }
  // Legacy format with names (still supported but not recommended)
  if (facts.children?.length > 0 && !facts.children_count) {
    const validChildren = facts.children.filter(c => c && (c.name || c.age));
    if (validChildren.length > 0) {
      const count = validChildren.length;
      const ages = validChildren.map(c => c.age).filter(a => a);
      let childInfo = `${count} Kind${count > 1 ? "er" : ""}`;
      if (ages.length > 0) {
        childInfo += ` (${ages.join(", ")} Jahre)`;
      }
      factLines.push(childInfo);
    }
  }

  // Work dynamic
  if (facts.work_dynamic) {
    if (typeof facts.work_dynamic === 'string') {
      factLines.push(`Arbeit: ${facts.work_dynamic}`);
    } else if (facts.work_dynamic.partner_a || facts.work_dynamic.partner_b) {
      if (facts.work_dynamic.partner_a) {
        factLines.push(`${profile.name || "Partner A"}: ${facts.work_dynamic.partner_a}`);
      }
      if (facts.work_dynamic.partner_b) {
        factLines.push(`${profile.partner_name || "Partner B"}: ${facts.work_dynamic.partner_b}`);
      }
    }
  }
  // Legacy: work object
  if (facts.work && Object.keys(facts.work).length > 0 && !facts.work_dynamic) {
    const workEntries = Object.entries(facts.work).filter(([k, v]) => v);
    if (workEntries.length > 0) {
      factLines.push(...workEntries.map(([k, v]) => `${k}: ${v}`));
    }
  }

  // Date frequency
  if (facts.date_frequency) {
    factLines.push(`Quality Time: ${facts.date_frequency}`);
  }

  if (factLines.length === 0) return null;

  return `FAKTEN:
${factLines.map(f => `- ${f}`).join("\n")}`;
}
