/**
 * AGREEMENTS LIST API - /api/agreements/route.js
 * GET: Liste aller Agreements für ein Couple
 * POST: Neues Agreement erstellen
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/agreements?coupleId=xxx
 * Listet alle Agreements für ein Couple
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get("coupleId");
    const status = searchParams.get("status"); // Optional filter

    if (!coupleId) {
      return Response.json({ error: "coupleId required" }, { status: 400 });
    }

    let query = supabase
      .from("agreements")
      .select(`
        *,
        checkins:agreement_checkins(
          id, status, created_at, success_count, total_count
        )
      `)
      .eq("couple_id", coupleId)
      .neq("status", "dissolved_with_couple")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching agreements:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Enrich with check-in stats
    const enriched = data.map(agreement => {
      const checkins = agreement.checkins || [];
      const recentCheckins = checkins.slice(0, 5);
      
      // Calculate success rate
      const successCount = recentCheckins.filter(c => 
        c.status === "good" || c.status === "partial"
      ).length;
      
      return {
        ...agreement,
        checkin_count: checkins.length,
        recent_success_rate: checkins.length > 0 
          ? Math.round((successCount / recentCheckins.length) * 100) 
          : null,
        is_check_in_due: agreement.next_check_in_at 
          ? new Date(agreement.next_check_in_at) <= new Date()
          : false,
        checkins: recentCheckins // Only return recent 5
      };
    });

    return Response.json({ agreements: enriched });

  } catch (error) {
    console.error("Agreements list error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agreements
 * Erstellt ein neues Agreement
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      coupleId,
      userId,
      title,
      description,
      underlyingNeed,
      type = "behavior",
      responsibleUserId,
      frequency,
      experimentEndDate,
      checkInFrequencyDays = 14,
      themes = [],
      sessionId,
      fromSuggestionId
    } = body;

    if (!coupleId || !userId || !title) {
      return Response.json(
        { error: "coupleId, userId, and title required" }, 
        { status: 400 }
      );
    }

    // Verify user belongs to couple
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id, partner_id")
      .eq("id", userId)
      .single();

    if (!profile || profile.couple_id !== coupleId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine if mutual approval needed
    const requiresMutualApproval = !responsibleUserId; // Both responsible = both approve

    // Determine initial approved_by
    let approvedBy = [userId];
    let initialStatus = "pending_approval";

    // If only one person responsible and they're creating it, auto-approve
    if (responsibleUserId === userId) {
      initialStatus = "active";
    }

    // If created during couple session, consider it discussed and approved
    if (sessionId) {
      // Check if it was a couple session
      const { data: session } = await supabase
        .from("sessions")
        .select("type")
        .eq("id", sessionId)
        .single();

      if (session?.type === "couple") {
        // Both were present, auto-approve for both
        approvedBy = [userId, profile.partner_id].filter(Boolean);
        initialStatus = "active";
      }
    }

    // Calculate next check-in date
    const nextCheckInAt = new Date();
    nextCheckInAt.setDate(nextCheckInAt.getDate() + checkInFrequencyDays);

    // Create agreement
    const { data: agreement, error: createError } = await supabase
      .from("agreements")
      .insert({
        couple_id: coupleId,
        created_by_user_id: userId,
        created_in_session_id: sessionId || null,
        title,
        description,
        underlying_need: underlyingNeed,
        type,
        responsible_user_id: responsibleUserId || null,
        frequency,
        experiment_end_date: experimentEndDate,
        status: initialStatus,
        requires_mutual_approval: requiresMutualApproval,
        approved_by: approvedBy,
        check_in_frequency_days: checkInFrequencyDays,
        next_check_in_at: nextCheckInAt.toISOString(),
        themes
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating agreement:", createError);
      return Response.json({ error: createError.message }, { status: 500 });
    }

    // If from suggestion, update it
    if (fromSuggestionId) {
      await supabase
        .from("agreement_suggestions")
        .update({
          status: "accepted",
          created_agreement_id: agreement.id
        })
        .eq("id", fromSuggestionId);
    }

    return Response.json({ 
      success: true, 
      agreement,
      needsPartnerApproval: initialStatus === "pending_approval" && requiresMutualApproval
    });

  } catch (error) {
    console.error("Agreement create error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
