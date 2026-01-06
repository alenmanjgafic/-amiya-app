/**
 * LEARNING RESPONSES API - /api/learning/responses
 * Stores and retrieves user responses to exercises
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET - Fetch user's responses for a bite or all bites
 * Query params: userId (required), biteId (optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const biteId = searchParams.get("biteId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let query = supabase
      .from("user_bite_responses")
      .select("*")
      .eq("user_id", userId);

    if (biteId) {
      query = query.eq("bite_id", biteId);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("Responses fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to key-value format for easy access
    const responseMap = {};
    data.forEach((response) => {
      if (!responseMap[response.bite_id]) {
        responseMap[response.bite_id] = {};
      }
      responseMap[response.bite_id][response.response_key] = response.response_data;
    });

    return NextResponse.json({
      responses: data,
      responseMap
    });
  } catch (error) {
    console.error("Responses API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST - Save a user's response to an exercise
 * Body: { userId, biteId, exerciseId, responseKey, responseData }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, biteId, exerciseId, responseKey, responseData } = body;

    if (!userId || !biteId || !exerciseId || !responseKey) {
      return NextResponse.json(
        { error: "userId, biteId, exerciseId, and responseKey required" },
        { status: 400 }
      );
    }

    // Upsert response
    const { data, error } = await supabase
      .from("user_bite_responses")
      .upsert(
        {
          user_id: userId,
          bite_id: biteId,
          exercise_id: exerciseId,
          response_key: responseKey,
          response_data: responseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,bite_id,exercise_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Response upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ response: data });
  } catch (error) {
    console.error("Responses POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE - Clear responses for a bite (for retry functionality)
 * Query params: userId, biteId
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const biteId = searchParams.get("biteId");

    if (!userId || !biteId) {
      return NextResponse.json(
        { error: "userId and biteId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_bite_responses")
      .delete()
      .eq("user_id", userId)
      .eq("bite_id", biteId);

    if (error) {
      console.error("Response delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Responses DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
