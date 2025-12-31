/**
 * AGREEMENT CHECK-IN API - /api/agreements/[id]/checkin/route.js
 * POST: Neuen Check-in erstellen
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/agreements/[id]/checkin
 */
export async function POST(request, { params }) {
  try {
    const { id: agreementId } = params;
    const body = await request.json();
    const {
      userId,
      sessionId,
      status, // good, partial, difficult, needs_change
      successCount,
      totalCount,
      whatWorked,
      whatWasHard,
      partnerFeedback,
      adjustmentSuggested,
      nextCheckInDays
    } = body;

    if (!userId || !status) {
      return Response.json(
        { error: "userId and status required" }, 
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["good", "partial", "difficult", "needs_change"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get agreement
    const { data: agreement, error: fetchError } = await supabase
      .from("agreements")
      .select("*, couple:couples(user_a_id, user_b_id)")
      .eq("id", agreementId)
      .single();

    if (fetchError || !agreement) {
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }

    // Verify user belongs to couple
    const isInCouple = 
      agreement.couple.user_a_id === userId || 
      agreement.couple.user_b_id === userId;

    if (!isInCouple) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate next check-in date
    const checkInDays = nextCheckInDays || agreement.check_in_frequency_days || 14;
    const nextCheckInAt = new Date();
    nextCheckInAt.setDate(nextCheckInAt.getDate() + checkInDays);

    // Create check-in
    const { data: checkin, error: createError } = await supabase
      .from("agreement_checkins")
      .insert({
        agreement_id: agreementId,
        session_id: sessionId || null,
        checked_in_by: userId,
        status,
        success_count: successCount,
        total_count: totalCount,
        what_worked: whatWorked,
        what_was_hard: whatWasHard,
        partner_feedback: partnerFeedback,
        adjustment_suggested: adjustmentSuggested,
        next_check_in_at: nextCheckInAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating check-in:", createError);
      return Response.json({ error: createError.message }, { status: 500 });
    }

    // Update agreement
    const agreementUpdates = {
      last_check_in_at: new Date().toISOString(),
      next_check_in_at: nextCheckInAt.toISOString()
    };

    // Update success streak
    if (status === "good") {
      agreementUpdates.success_streak = (agreement.success_streak || 0) + 1;
    } else if (status === "difficult" || status === "needs_change") {
      agreementUpdates.success_streak = 0;
    }

    // If status is needs_change, mark agreement for review
    if (status === "needs_change" && adjustmentSuggested) {
      // Could trigger notification or mark for discussion
    }

    await supabase
      .from("agreements")
      .update(agreementUpdates)
      .eq("id", agreementId);

    // Generate response message based on streak
    let message = "Check-in gespeichert";
    if (agreementUpdates.success_streak >= 4) {
      message = `🎉 ${agreementUpdates.success_streak} erfolgreiche Check-ins in Folge! Toll gemacht!`;
    } else if (status === "good") {
      message = "💚 Super, weiter so!";
    } else if (status === "partial") {
      message = "💛 Gut, dass ihr dranbleibt.";
    } else if (status === "difficult") {
      message = "🧡 Danke für die Ehrlichkeit. Sprecht darüber in eurer nächsten Session.";
    } else if (status === "needs_change") {
      message = "❤️ Vereinbarung braucht Anpassung. Besprecht das gemeinsam.";
    }

    return Response.json({ 
      success: true, 
      checkin,
      message,
      nextCheckInAt: nextCheckInAt.toISOString(),
      successStreak: agreementUpdates.success_streak
    });

  } catch (error) {
    console.error("Check-in error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
