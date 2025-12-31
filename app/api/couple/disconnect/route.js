/**
 * COUPLE DISCONNECT API - /api/couple/disconnect/route.js
 * POST: Couple-Verbindung auflösen
 * GET: Status der Auflösung prüfen (für Partner-Benachrichtigung)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/couple/disconnect?userId=xxx
 * Prüft ob Couple aufgelöst wurde und Partner noch entscheiden muss
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", userId)
      .single();

    // If user has no couple_id, check if there's a dissolved couple they were part of
    // that they haven't acknowledged yet
    const { data: dissolvedCouples } = await supabase
      .from("couples")
      .select(`
        id, status, dissolved_at, dissolved_by,
        user_a:profiles!couples_user_a_id_fkey(id, name),
        user_b:profiles!couples_user_b_id_fkey(id, name),
        agreements(id, title, underlying_need, status)
      `)
      .eq("status", "pending_dissolution")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .single();

    if (dissolvedCouples) {
      // There's a pending dissolution for this user
      const initiator = dissolvedCouples.dissolved_by === dissolvedCouples.user_a?.id
        ? dissolvedCouples.user_a
        : dissolvedCouples.user_b;

      const activeAgreements = dissolvedCouples.agreements?.filter(
        a => a.status === "active" || a.status === "achieved"
      ) || [];

      return Response.json({
        pendingDissolution: true,
        coupleId: dissolvedCouples.id,
        initiatedBy: initiator?.name || "Partner",
        dissolvedAt: dissolvedCouples.dissolved_at,
        agreementCount: activeAgreements.length,
        agreements: activeAgreements.map(a => ({
          title: a.title,
          underlyingNeed: a.underlying_need
        }))
      });
    }

    return Response.json({ pendingDissolution: false });

  } catch (error) {
    console.error("Disconnect check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/couple/disconnect
 * Initiiert oder bestätigt Couple-Auflösung
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      action, // "initiate", "confirm", "cancel"
      keepLearnings = false 
    } = body;

    if (!userId || !action) {
      return Response.json(
        { error: "userId and action required" }, 
        { status: 400 }
      );
    }

    // Get user's profile and couple info
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id, partner_id, personal_context")
      .eq("id", userId)
      .single();

    if (action === "initiate") {
      // User wants to disconnect
      if (!profile.couple_id) {
        return Response.json({ error: "Not connected to a couple" }, { status: 400 });
      }

      const coupleId = profile.couple_id;
      const partnerId = profile.partner_id;

      // Set couple to pending_dissolution
      // This allows partner to also choose about learnings
      await supabase
        .from("couples")
        .update({
          status: "pending_dissolution",
          dissolved_at: new Date().toISOString(),
          dissolved_by: userId
        })
        .eq("id", coupleId);

      // Handle learnings for initiating user
      if (keepLearnings) {
        await extractAndSaveLearnings(userId, coupleId, profile.personal_context);
      }

      // Clear initiating user's couple reference
      await supabase
        .from("profiles")
        .update({ couple_id: null, partner_id: null })
        .eq("id", userId);

      // Invalidate invite codes
      await supabase
        .from("invite_codes")
        .update({ expires_at: new Date().toISOString() })
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`);

      return Response.json({ 
        success: true, 
        message: "Verbindung aufgelöst. Dein Partner wird benachrichtigt.",
        partnerNeedsConfirmation: true
      });
    }

    if (action === "confirm") {
      // Partner confirms and chooses about learnings
      
      // Find the pending dissolution
      const { data: couple } = await supabase
        .from("couples")
        .select("id")
        .eq("status", "pending_dissolution")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .single();

      if (!couple) {
        return Response.json({ error: "No pending dissolution" }, { status: 400 });
      }

      // Handle learnings for confirming user
      if (keepLearnings) {
        await extractAndSaveLearnings(userId, couple.id, profile.personal_context);
      }

      // Clear confirming user's couple reference
      await supabase
        .from("profiles")
        .update({ couple_id: null, partner_id: null })
        .eq("id", userId);

      // Finalize dissolution
      await supabase
        .from("couples")
        .update({ status: "dissolved" })
        .eq("id", couple.id);

      // Set all agreements to dissolved_with_couple
      await supabase
        .from("agreements")
        .update({ status: "dissolved_with_couple" })
        .eq("couple_id", couple.id);

      return Response.json({ 
        success: true, 
        message: "Auflösung bestätigt.",
        fullyDissolved: true
      });
    }

    if (action === "cancel") {
      // Cancel a pending dissolution (only by the partner, not initiator)
      const { data: couple } = await supabase
        .from("couples")
        .select("id, dissolved_by, user_a_id, user_b_id")
        .eq("status", "pending_dissolution")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .single();

      if (!couple || couple.dissolved_by === userId) {
        return Response.json(
          { error: "Cannot cancel - either no pending dissolution or you initiated it" }, 
          { status: 400 }
        );
      }

      // Revert to active
      await supabase
        .from("couples")
        .update({
          status: "active",
          dissolved_at: null,
          dissolved_by: null
        })
        .eq("id", couple.id);

      // Restore initiator's couple reference
      const initiatorId = couple.dissolved_by;
      const partnerId = couple.user_a_id === initiatorId ? couple.user_b_id : couple.user_a_id;

      await supabase
        .from("profiles")
        .update({ 
          couple_id: couple.id, 
          partner_id: partnerId 
        })
        .eq("id", initiatorId);

      return Response.json({ 
        success: true, 
        message: "Auflösung abgebrochen. Ihr seid wieder verbunden." 
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Disconnect error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Extrahiert anonymisierte Learnings aus Agreements und speichert sie im personal_context
 */
async function extractAndSaveLearnings(userId, coupleId, currentPersonalContext) {
  try {
    // Get agreements that were successful or achieved
    const { data: agreements } = await supabase
      .from("agreements")
      .select("title, underlying_need, status, type")
      .eq("couple_id", coupleId)
      .in("status", ["active", "achieved"]);

    if (!agreements || agreements.length === 0) return;

    // Create anonymized learnings
    const learnings = agreements.map(a => ({
      insight: a.underlying_need || a.title,
      type: a.type,
      achieved: a.status === "achieved",
      extractedAt: new Date().toISOString().split("T")[0]
    }));

    // Merge with existing personal_context
    const updatedContext = {
      ...currentPersonalContext,
      past_learnings: [
        ...(currentPersonalContext?.past_learnings || []),
        ...learnings
      ].slice(-10) // Keep max 10 learnings
    };

    await supabase
      .from("profiles")
      .update({ personal_context: updatedContext })
      .eq("id", userId);

  } catch (error) {
    console.error("Error extracting learnings:", error);
    // Don't throw - learnings are optional
  }
}
