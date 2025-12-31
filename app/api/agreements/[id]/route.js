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
    const { id } = params;

    const { data: agreement, error } = await supabase
      .from("agreements")
      .select(`
        *,
        checkins:agreement_checkins(
          id, status, created_at, success_count, total_count,
          what_worked, what_was_hard, adjustment_suggested
        ),
        created_by:profiles!agreements_created_by_user_id_fkey(name),
        responsible:profiles!agreements_responsible_user_id_fkey(name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return Response.json({ error: "Agreement not found" }, { status: 404 });
    }

    // Get couple info for names
    const { data: couple } = await supabase
      .from("couples")
      .select(`
        user_a:profiles!couples_user_a_id_fkey(id, name),
        user_b:profiles!couples_user_b_id_fkey(id, name)
      `)
      .eq("id", agreement.couple_id)
      .single();

    return Response.json({ 
      agreement,
      couple: {
        userA: couple?.user_a,
        userB: couple?.user_b
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
    const { id } = params;
    const body = await request.json();
    const { action, userId, ...updateData } = body;

    if (!userId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    // Get current agreement
    const { data: agreement, error: fetchError } = await supabase
      .from("agreements")
      .select("*, couple:couples(user_a_id, user_b_id)")
      .eq("id", id)
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

    let updates = {};
    let message = "";

    switch (action) {
      case "approve":
        // Check if user can approve
        if (agreement.responsible_user_id && agreement.responsible_user_id !== userId) {
          return Response.json(
            { error: "Only responsible person can approve" }, 
            { status: 403 }
          );
        }

        // Add user to approved_by if not already
        const currentApproved = agreement.approved_by || [];
        if (!currentApproved.includes(userId)) {
          const newApproved = [...currentApproved, userId];
          updates.approved_by = newApproved;

          // Check if all required approvals are in
          const partnerId = agreement.couple.user_a_id === userId 
            ? agreement.couple.user_b_id 
            : agreement.couple.user_a_id;

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
        // Reset next check-in to 2 weeks from now
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
        // General update (title, description, etc.)
        const allowedFields = [
          "title", "description", "underlying_need", "type",
          "frequency", "check_in_frequency_days", "themes"
        ];
        
        for (const field of allowedFields) {
          if (updateData[field] !== undefined) {
            // Convert camelCase to snake_case
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
 * Soft delete - sets status to archived
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
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
