/**
 * AGREEMENT SUGGESTIONS API - /api/agreements/suggestions/route.js
 * GET: Offene Vorschläge für ein Couple
 * POST: Neuen Vorschlag erstellen (von Analyse)
 * PATCH: Vorschlag akzeptieren/ablehnen
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/agreements/suggestions?coupleId=xxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get("coupleId");
    const sessionId = searchParams.get("sessionId");

    if (!coupleId) {
      return Response.json({ error: "coupleId required" }, { status: 400 });
    }

    // Simple query without joins
    let query = supabase
      .from("agreement_suggestions")
      .select("*")
      .eq("couple_id", coupleId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Suggestions fetch error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ suggestions: data || [] });

  } catch (error) {
    console.error("Suggestions get error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agreements/suggestions
 * Erstellt einen neuen Vorschlag (wird von /api/analyze aufgerufen)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { coupleId, sessionId, title, underlyingNeed, responsible } = body;

    if (!coupleId || !title) {
      return Response.json(
        { error: "coupleId and title required" }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("agreement_suggestions")
      .insert({
        couple_id: coupleId,
        session_id: sessionId || null,
        title,
        underlying_need: underlyingNeed || null,
        responsible: responsible || "both"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating suggestion:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, suggestion: data });

  } catch (error) {
    console.error("Suggestion create error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/agreements/suggestions
 * Akzeptieren oder Ablehnen eines Vorschlags
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { 
      suggestionId, 
      action, // "accept" or "dismiss"
      userId,
      // Für accept: angepasste Daten
      title,
      underlyingNeed,
      responsible,
      type,
      checkInFrequencyDays
    } = body;

    if (!suggestionId || !action || !userId) {
      return Response.json(
        { error: "suggestionId, action, and userId required" }, 
        { status: 400 }
      );
    }

    // Get suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from("agreement_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .single();

    if (fetchError || !suggestion) {
      return Response.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify user belongs to couple
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id, partner_id")
      .eq("id", userId)
      .single();

    if (!profile || profile.couple_id !== suggestion.couple_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "dismiss") {
      // Mark as dismissed
      await supabase
        .from("agreement_suggestions")
        .update({ status: "dismissed" })
        .eq("id", suggestionId);

      return Response.json({ success: true, dismissed: true });
    }

    if (action === "accept") {
      // Get couple info to determine user_a and user_b
      const { data: couple } = await supabase
        .from("couples")
        .select("user_a_id, user_b_id")
        .eq("id", suggestion.couple_id)
        .single();

      // Determine responsible_user_id from "responsible" string
      let responsibleUserId = null;
      const respValue = responsible || suggestion.responsible;
      
      if (respValue === "user_a" && couple) {
        responsibleUserId = couple.user_a_id;
      } else if (respValue === "user_b" && couple) {
        responsibleUserId = couple.user_b_id;
      }
      // If "both" or undefined, responsibleUserId stays null

      // Calculate next check-in
      const days = checkInFrequencyDays || 14;
      const nextCheckInAt = new Date();
      nextCheckInAt.setDate(nextCheckInAt.getDate() + days);

      // Determine approval status
      const requiresMutualApproval = responsibleUserId === null;
      const approvedBy = [userId];
      
      let status = "pending_approval";
      if (!requiresMutualApproval && responsibleUserId === userId) {
        status = "active";
      }

      // Create agreement
      const { data: agreement, error: createError } = await supabase
        .from("agreements")
        .insert({
          couple_id: suggestion.couple_id,
          created_by_user_id: userId,
          created_in_session_id: suggestion.session_id,
          title: title || suggestion.title,
          underlying_need: underlyingNeed || suggestion.underlying_need,
          type: type || "behavior",
          responsible_user_id: responsibleUserId,
          status,
          requires_mutual_approval: requiresMutualApproval,
          approved_by: approvedBy,
          check_in_frequency_days: days,
          next_check_in_at: nextCheckInAt.toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating agreement:", createError);
        return Response.json({ error: createError.message }, { status: 500 });
      }

      // Update suggestion status
      await supabase
        .from("agreement_suggestions")
        .update({ status: "accepted" })
        .eq("id", suggestionId);

      return Response.json({ 
        success: true, 
        agreement,
        needsPartnerApproval: status === "pending_approval" && requiresMutualApproval
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Suggestion patch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
