/**
 * LEARNING CHALLENGES API - /api/learning/challenges
 * Manages active challenges from learning bites
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET - Fetch user's active or all challenges
 * Query params: userId (required), status (optional: 'active', 'completed', 'skipped')
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let query = supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", userId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Challenges fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ challenges: data });
  } catch (error) {
    console.error("Challenges API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST - Accept a challenge or update challenge status
 * Body: { userId, biteId, challengeType, action, followUpResponse }
 * action: 'accept', 'complete', 'skip'
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, biteId, challengeType, action, followUpResponse, durationDays } = body;

    if (!userId || !biteId || !challengeType || !action) {
      return NextResponse.json(
        { error: "userId, biteId, challengeType, and action required" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Create new challenge
      const dueAt = durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: userId,
          bite_id: biteId,
          challenge_type: challengeType,
          status: "active",
          due_at: dueAt,
        })
        .select()
        .single();

      if (error) {
        console.error("Challenge insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ challenge: data });
    }

    if (action === "complete" || action === "skip") {
      // Update existing challenge
      const updateData = {
        status: action === "complete" ? "completed" : "skipped",
        completed_at: new Date().toISOString(),
      };

      if (followUpResponse) {
        updateData.follow_up_response = followUpResponse;
      }

      const { data, error } = await supabase
        .from("user_challenges")
        .update(updateData)
        .eq("user_id", userId)
        .eq("bite_id", biteId)
        .eq("challenge_type", challengeType)
        .eq("status", "active")
        .select()
        .single();

      if (error) {
        console.error("Challenge update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ challenge: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Challenges POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Check for due challenges (could be called by a cron or on page load)
 */
export async function checkDueChallenges(userId) {
  try {
    const { data, error } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .lte("due_at", new Date().toISOString());

    if (error) {
      console.error("Due challenges check error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Check due challenges error:", error);
    return [];
  }
}
