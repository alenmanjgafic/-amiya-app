/**
 * SESSION BY ID API - app/api/sessions/[id]/route.js
 * Get a specific session by ID
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Session fetch error:", error);
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    console.error("Session API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
