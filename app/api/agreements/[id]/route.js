/**
 * AGREEMENT DETAIL API - /api/agreements/[id]/route.js
 * GET: Einzelnes Agreement mit History
 * PATCH: Agreement aktualisieren (Status, Approval, etc.)
 * DELETE: Agreement archivieren
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/agreements/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Simple query without complex joins
    const { data: agreement, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !agreement) {
      console.error("Agreement fetch error:", error);
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }

    // Get checkins separately
    const { data: checkins } = await supabase
      .from("agreement_checkins")
      .select("id, status, created_at, what_worked, what_was_hard")
      .eq("agreement_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get couple info for names
    const { data: couple } = await supabase
      .from("couples")
      .select("user_a_id, user_b_id")
      .eq("id", agreement.couple_id)
      .single();

    // Get user names
    let userA = null;
    let userB = null;
    
    if (couple) {
      const { data: profileA } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", couple.user_a_id)
        .single();
      
      const { data: profileB } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", couple.user_b_id)
        .single();
      
      userA = profileA;
      userB = profileB;
    }

    return Response.json({ 
      agreement: {
        ...agreement,
        checkins: checkins || []
      },
      couple: {
        userA,
        userB
      }
    });

  } catch (error) {
    console.error("Agreement get error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/agreements/[id]
 * Aktionen: approve, pause, resume, archive, achieve, update
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, userId, ...updateData } = body;

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // Get current agreement
    const { data: agreement, error: fetchError } = await supabase
      .from("agreements")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !agreement) {
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }

    // Get couple info
    const { data: couple } = await supabase
      .from("couples")
      .select("user_a_id, user_b_id")
      .eq("id", agreement.couple_id)
      .single();

    if (!couple) {
      return Response.json({ error: "Couple not found" }, { status: 404 });
    }

    // Verify user belongs to couple
    const isInCouple = couple.user_a_id === userId || couple.user_b_id === userId;

    if (!isInCouple) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    let updates = {};
    let message = "";

    switch (action) {
      case "approve":
        // Add user to approved_by if not already
        const currentApproved = agreement.approved_by || [];
        if (!currentApproved.includes(userId)) {
          const newApproved = [...currentApproved, userId];
          updates.approved_by = newApproved;

          // Check if all required approvals are in
          const partnerId = couple.user_a_id === userId 
            ? couple.user_b_id 
            : couple.user_a_id;

          const allApproved = agreement.requires_mutual_approval
            ? newApproved.includes(userId) && newApproved.includes(partnerId)
            : true;

          if (allApproved || !agreement.requires_mutual_approval) {
            updates.status = "active";
            message = "Agreement aktiviert";
          } else {
            message = "Deine Zustimmung wurde gespeichert. Warte auf Partner.";
          }
        }
        break;

      case "pause":
        updates.status = "paused";
        updates.paused_reason = updateData.reason || null;
        message = "Agreement pausiert";
        break;

      case "resume":
        updates.status = "active";
        updates.paused_reason = null;
        const resumeCheckIn = new Date();
        resumeCheckIn.setDate(resumeCheckIn.getDate() + (agreement.check_in_frequency_days || 14));
        updates.next_check_in_at = resumeCheckIn.toISOString();
        message = "Agreement wieder aktiviert";
        break;

      case "achieve":
        updates.status = "achieved";
        message = "🎉 Agreement als erreicht markiert!";
        break;

      case "archive":
        updates.status = "archived";
        message = "Agreement archiviert";
        break;

      case "update":
        const allowedFields = [
          "title", "description", "underlying_need", "type",
          "frequency", "check_in_frequency_days", "themes"
        ];
        
        for (const field of allowedFields) {
          if (updateData[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
            updates[snakeField] = updateData[field];
          }
        }
        message = "Agreement aktualisiert";
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    // Apply updates
    const { data: updated, error: updateError } = await supabase
      .from("agreements")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      agreement: updated,
      message 
    });

  } catch (error) {
    console.error("Agreement patch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/agreements/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // Verify ownership
    const { data: agreement } = await supabase
      .from("agreements")
      .select("couple_id")
      .eq("id", id)
      .single();

    if (!agreement) {
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", userId)
      .single();

    if (profile.couple_id !== agreement.couple_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabase
      .from("agreements")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error("Agreement delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
