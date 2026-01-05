/**
 * QUIZ UNSHARE API - app/api/quiz/unshare/route.js
 * Allows user to withdraw their shared quiz result
 * Only works if partner hasn't shared yet
 */
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const { userId, accessToken } = await request.json();

    if (!userId || !accessToken) {
      return Response.json({ error: "userId and accessToken required" }, { status: 400 });
    }

    // Create client with user's access token for RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Check current state
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("quiz_shared_at, partner_id")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.quiz_shared_at) {
      return Response.json({ error: "Not shared yet" }, { status: 400 });
    }

    // Check if partner has shared - if so, can't unshare
    if (profile.partner_id) {
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("quiz_shared_at")
        .eq("id", profile.partner_id)
        .single();

      if (partnerProfile?.quiz_shared_at) {
        return Response.json({
          error: "Partner has already shared - cannot withdraw"
        }, { status: 400 });
      }
    }

    // Clear quiz_shared_at
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ quiz_shared_at: null })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to unshare quiz:", updateError);
      return Response.json({ error: "Failed to unshare" }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("Quiz unshare error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
