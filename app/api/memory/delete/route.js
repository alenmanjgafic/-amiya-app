/**
 * MEMORY DELETE API - /api/memory/delete
 * Löscht User Memory (GDPR: Recht auf Löschung)
 * 
 * Optionen:
 * - "personal": Nur persönliche Daten löschen
 * - "shared": Geteilte Daten löschen (betrifft Partner!)
 * - "statements": Nur Aussagen löschen (für Widerspruchs-Reset)
 * - "all": Alles löschen + Consent widerrufen
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, deleteType } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // Get user's couple_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", userId)
      .single();

    const coupleId = profile?.couple_id;

    switch (deleteType) {
      case "personal":
        // Delete only personal context + coaching profile
        await supabase
          .from("profiles")
          .update({
            personal_context: getEmptyPersonalContext(),
            coaching_profile: getEmptyCoachingProfile()
          })
          .eq("id", userId);

        return Response.json({
          success: true,
          deleted: ["personal_context", "coaching_profile"]
        });

      case "statements":
        // Delete only statements (reset contradiction detection)
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("personal_context")
          .eq("id", userId)
          .single();

        if (currentProfile?.personal_context) {
          const updatedContext = {
            ...currentProfile.personal_context,
            statements: [],
            partner_perspective: [],
            expressed: []  // Legacy
          };

          await supabase
            .from("profiles")
            .update({ personal_context: updatedContext })
            .eq("id", userId);
        }

        return Response.json({ 
          success: true, 
          deleted: "statements" 
        });

      case "shared":
        // Delete shared context (affects partner too!)
        if (coupleId) {
          await supabase
            .from("couples")
            .update({
              shared_context: getEmptySharedContext()
            })
            .eq("id", coupleId);
        }

        return Response.json({ 
          success: true, 
          deleted: "shared_context",
          warning: "This affects your partner as well"
        });

      case "all":
        // Delete everything + revoke consent (GDPR: Recht auf Löschung)
        await supabase
          .from("profiles")
          .update({
            memory_consent: false,
            memory_consent_at: null,
            personal_context: getEmptyPersonalContext(),
            coaching_profile: getEmptyCoachingProfile()
          })
          .eq("id", userId);

        // Optional: Engagement-Metriken aus Sessions löschen
        await supabase
          .from("sessions")
          .update({ engagement_metrics: null })
          .eq("user_id", userId);

        if (coupleId) {
          await supabase
            .from("couples")
            .update({
              shared_context: getEmptySharedContext()
            })
            .eq("id", coupleId);
        }

        return Response.json({ 
          success: true, 
          deleted: "all",
          consentRevoked: true
        });

      default:
        return Response.json({ error: "Invalid deleteType. Use: personal, statements, shared, all" }, { status: 400 });
    }

  } catch (error) {
    console.error("Memory delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Empty personal context structure
 */
function getEmptyPersonalContext() {
  return {
    core_needs: [],
    statements: [],
    partner_perspective: [],
    own_patterns: [],
    tasks: [],
    coaching_style: {
      responds_well: [],
      avoid: []
    },
    expressed: [],
    solo_journey: {
      started: null,
      recent_topics: []
    },
    next_solo: {
      followup: null
    }
  };
}

/**
 * Empty shared context structure
 */
function getEmptySharedContext() {
  return {
    facts: {
      together_years: null,
      together_since: null,
      married_since: null,
      children_count: null,
      children_ages: [],
      children: [],
      work_dynamic: null,
      work: {},
      date_frequency: null
    },
    dynamics: {
      expressed_needs: {
        partner_a: null,
        partner_b: null
      },
      core_tension: null,
      shared_concerns: [],
      patterns: []
    },
    strengths: [],
    journey: {
      started_with_amiya: null,
      milestones: [],
      perpetual_issues: [],
      initial_topics: [],
      progress: [],
      recurring: [],
      recent_sessions: []
    },
    agreements: [],
    coaching: {
      works_well: [],
      avoid: []
    },
    next_session: {
      followup: null,
      followup_questions: [],
      topics_to_explore: [],
      open_agreements: [],
      sensitive: []
    }
  };
}

/**
 * Empty coaching profile structure (Adaptive Coaching)
 * GDPR: Wird bei Datenlöschung zurückgesetzt
 */
function getEmptyCoachingProfile() {
  return {
    communication_style: "unknown",
    avg_engagement_ratio: null,
    sessions_analyzed: 0,
    trust_level: "building",
    trend: "stable",
    best_approach: "balanced",
    last_significant_change: null,
    last_updated: null,
    notes: []
  };
}
