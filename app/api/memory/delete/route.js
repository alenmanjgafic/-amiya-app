/**
 * MEMORY DELETE API - /api/memory/delete
 * Löscht User Memory (GDPR: Recht auf Löschung)
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
        // Delete only personal context
        await supabase
          .from("profiles")
          .update({
            personal_context: {
              expressed: [],
              solo_journey: { started: null, recent_topics: [] },
              next_solo: { followup: null }
            }
          })
          .eq("id", userId);

        return Response.json({ 
          success: true, 
          deleted: "personal_context" 
        });

      case "shared":
        // Delete shared context (affects partner too!)
        if (coupleId) {
          await supabase
            .from("couples")
            .update({
              shared_context: {
                facts: { together_since: null, married_since: null, children: [], work: {} },
                strengths: [],
                journey: { started_with_amiya: null, initial_topics: [], progress: [], recurring: [], recent_sessions: [] },
                coaching: { works_well: [], avoid: [] },
                next_session: { followup: null, open_agreements: [], sensitive: [] }
              }
            })
            .eq("id", coupleId);
        }

        return Response.json({ 
          success: true, 
          deleted: "shared_context" 
        });

      case "all":
        // Delete everything
        await supabase
          .from("profiles")
          .update({
            memory_consent: false,
            personal_context: {
              expressed: [],
              solo_journey: { started: null, recent_topics: [] },
              next_solo: { followup: null }
            }
          })
          .eq("id", userId);

        if (coupleId) {
          await supabase
            .from("couples")
            .update({
              shared_context: {
                facts: { together_since: null, married_since: null, children: [], work: {} },
                strengths: [],
                journey: { started_with_amiya: null, initial_topics: [], progress: [], recurring: [], recent_sessions: [] },
                coaching: { works_well: [], avoid: [] },
                next_session: { followup: null, open_agreements: [], sensitive: [] }
              }
            })
            .eq("id", coupleId);
        }

        return Response.json({ 
          success: true, 
          deleted: "all",
          consentRevoked: true
        });

      default:
        return Response.json({ error: "Invalid deleteType" }, { status: 400 });
    }

  } catch (error) {
    console.error("Memory delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
