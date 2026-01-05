/**
 * QUIZ SHARE API - app/api/quiz/share/route.js
 * Marks user's quiz result as shared with partner
 * Uses user's auth token for RLS-compliant updates
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

    // First check if user has completed the quiz
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("quiz_completed_at, quiz_shared_at")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      console.error("Profile fetch error:", fetchError);
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.quiz_completed_at) {
      return Response.json({ error: "Quiz not completed" }, { status: 400 });
    }

    if (profile.quiz_shared_at) {
      return Response.json({ error: "Already shared", alreadyShared: true }, { status: 400 });
    }

    // Update quiz_shared_at
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ quiz_shared_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to share quiz:", updateError);
      return Response.json({ error: "Failed to share", details: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, sharedAt: new Date().toISOString() });

  } catch (err) {
    console.error("Quiz share error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
