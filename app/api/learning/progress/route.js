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
 * POST - Create or update progress for a bite/chapter
 * Body: { userId, biteId/chapterId, seriesId, status, currentScreen, contentCompleted, activityCompleted }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      biteId,
      chapterId,
      seriesId,
      status,
      currentScreen,
      contentCompleted,
      activityCompleted
    } = body;

    // Support both biteId (legacy) and chapterId (new)
    const itemId = chapterId || biteId;

    if (!userId || !itemId || !seriesId) {
      return NextResponse.json(
        { error: "userId, biteId/chapterId, and seriesId required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData = {
      user_id: userId,
      bite_id: itemId, // Using bite_id column for backwards compatibility
      series_id: seriesId,
    };

    // Legacy status handling
    if (status) {
      updateData.status = status;

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

    // New chapter-based progress fields
    if (contentCompleted !== undefined) {
      updateData.content_completed = contentCompleted;
      if (contentCompleted) {
        updateData.content_completed_at = new Date().toISOString();
      }
    }

    if (activityCompleted !== undefined) {
      updateData.activity_completed = activityCompleted;
      if (activityCompleted) {
        updateData.activity_completed_at = new Date().toISOString();
        // Also set legacy status to completed when activity is done
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      }
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

    // If chapter fully completed (both content and activity), unlock next
    if (activityCompleted || status === "completed") {
      await unlockNextBite(userId, itemId, seriesId);
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Helper: Unlock the next bite/chapter in sequence
 */
async function unlockNextBite(userId, completedItemId, seriesId) {
  try {
    // Get content from healthy-conflict
    const { HEALTHY_CONFLICT_SERIES } = await import(
      "../../../../lib/learning-content/healthy-conflict"
    );

    // For now, only handle healthy-conflict series
    if (seriesId !== "healthy-conflict") return;

    // Try to find as chapter first (new structure)
    let completedItem = HEALTHY_CONFLICT_SERIES.chapters?.find(
      (c) => c.id === completedItemId
    );
    let nextItem = null;

    if (completedItem) {
      // Found as chapter - get next chapter
      nextItem = HEALTHY_CONFLICT_SERIES.chapters?.find(
        (c) => c.number === completedItem.number + 1
      );
    } else {
      // Try legacy bites structure
      completedItem = HEALTHY_CONFLICT_SERIES.bites?.find(
        (b) => b.id === completedItemId
      );
      if (completedItem) {
        nextItem = HEALTHY_CONFLICT_SERIES.bites?.find(
          (b) => b.order === completedItem.order + 1
        );
      }
    }

    if (!nextItem) return;

    // Check if next item progress exists
    const { data: existing } = await supabase
      .from("user_bite_progress")
      .select("id, status")
      .eq("user_id", userId)
      .eq("bite_id", nextItem.id)
      .single();

    // Only unlock if locked or doesn't exist
    if (!existing || existing.status === "locked") {
      await supabase.from("user_bite_progress").upsert(
        {
          user_id: userId,
          bite_id: nextItem.id,
          series_id: seriesId,
          status: "available",
        },
        { onConflict: "user_id,bite_id" }
      );
    }
  } catch (error) {
    console.error("Error unlocking next item:", error);
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

    // Support both chapters (new) and bites (legacy)
    const items = HEALTHY_CONFLICT_SERIES.chapters || HEALTHY_CONFLICT_SERIES.bites || [];

    // First item is available, rest are locked
    const progressEntries = items.map((item, index) => ({
      user_id: userId,
      bite_id: item.id,
      series_id: seriesId,
      status: index === 0 ? "available" : "locked",
      content_completed: false,
      activity_completed: false,
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
