/**
 * LEARNING PROGRESS API - /api/learning/progress
 * Manages user progress through learning bites
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET - Fetch user's progress for a series or all series
 * Query params: userId (required), seriesId (optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const seriesId = searchParams.get("seriesId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let query = supabase
      .from("user_bite_progress")
      .select("*")
      .eq("user_id", userId);

    if (seriesId) {
      query = query.eq("series_id", seriesId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("Progress fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST - Create or update progress for a bite
 * Body: { userId, biteId, seriesId, status, currentScreen }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, biteId, seriesId, status, currentScreen } = body;

    if (!userId || !biteId || !seriesId) {
      return NextResponse.json(
        { error: "userId, biteId, and seriesId required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData = {
      user_id: userId,
      bite_id: biteId,
      series_id: seriesId,
    };

    if (status) {
      updateData.status = status;

      // Set timestamps based on status
      if (status === "in_progress" && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (currentScreen !== undefined) {
      updateData.current_screen = currentScreen;
    }

    // Upsert - create or update
    const { data, error } = await supabase
      .from("user_bite_progress")
      .upsert(updateData, {
        onConflict: "user_id,bite_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Progress upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If bite completed, unlock next bite
    if (status === "completed") {
      await unlockNextBite(userId, biteId, seriesId);
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Helper: Unlock the next bite in sequence
 */
async function unlockNextBite(userId, completedBiteId, seriesId) {
  try {
    // Get bite order from content
    const { HEALTHY_CONFLICT_SERIES } = await import(
      "../../../../lib/learning-content/healthy-conflict"
    );

    // For now, only handle healthy-conflict series
    if (seriesId !== "healthy-conflict") return;

    const completedBite = HEALTHY_CONFLICT_SERIES.bites.find(
      (b) => b.id === completedBiteId
    );
    if (!completedBite) return;

    const nextBite = HEALTHY_CONFLICT_SERIES.bites.find(
      (b) => b.order === completedBite.order + 1
    );
    if (!nextBite) return;

    // Check if next bite progress exists
    const { data: existing } = await supabase
      .from("user_bite_progress")
      .select("id, status")
      .eq("user_id", userId)
      .eq("bite_id", nextBite.id)
      .single();

    // Only unlock if locked or doesn't exist
    if (!existing || existing.status === "locked") {
      await supabase.from("user_bite_progress").upsert(
        {
          user_id: userId,
          bite_id: nextBite.id,
          series_id: seriesId,
          status: "available",
        },
        { onConflict: "user_id,bite_id" }
      );
    }
  } catch (error) {
    console.error("Error unlocking next bite:", error);
  }
}

/**
 * Initialize progress for a new user starting a series
 */
export async function initializeSeriesProgress(userId, seriesId) {
  try {
    // Only handle healthy-conflict for now
    if (seriesId !== "healthy-conflict") return;

    const { HEALTHY_CONFLICT_SERIES } = await import(
      "../../../../lib/learning-content/healthy-conflict"
    );

    // First bite is available, rest are locked
    const progressEntries = HEALTHY_CONFLICT_SERIES.bites.map((bite, index) => ({
      user_id: userId,
      bite_id: bite.id,
      series_id: seriesId,
      status: index === 0 ? "available" : "locked",
    }));

    const { error } = await supabase
      .from("user_bite_progress")
      .upsert(progressEntries, { onConflict: "user_id,bite_id" });

    if (error) {
      console.error("Init progress error:", error);
    }
  } catch (error) {
    console.error("Initialize progress error:", error);
  }
}
