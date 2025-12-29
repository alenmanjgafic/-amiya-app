/**
 * GET-CONTEXT API - app/api/get-context/route.js
 * Lädt alle Analysen eines Users chronologisch für Session-Kontext
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, coupleId } = await request.json();

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    // Lade Solo-Sessions des Users
    const { data: soloSessions, error: soloError } = await supabase
      .from("sessions")
      .select("id, type, analysis, created_at, themes")
      .eq("user_id", userId)
      .not("analysis", "is", null)
      .order("created_at", { ascending: false });

    if (soloError) {
      console.error("Error loading solo sessions:", soloError);
    }

    // Lade Couple-Sessions wenn User in einer Beziehung ist
    let coupleSessions = [];
    if (coupleId) {
      const { data: coupleData, error: coupleError } = await supabase
        .from("sessions")
        .select("id, type, analysis, created_at, themes")
        .eq("couple_id", coupleId)
        .eq("type", "couple")
        .not("analysis", "is", null)
        .order("created_at", { ascending: false });

      if (!coupleError && coupleData) {
        coupleSessions = coupleData;
      }
    }

    // Merge und sortiere nach Datum (neueste zuerst)
    const allSessions = [...(soloSessions || []), ...coupleSessions]
      .filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Keine Sessions? Leerer Kontext
    if (allSessions.length === 0) {
      return Response.json({ 
        context: "",
        sessionCount: 0 
      });
    }

    // Formatiere Kontext chronologisch
    const contextParts = allSessions.map(session => {
      const date = new Date(session.created_at);
      const formattedDate = date.toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      
      const sessionType = session.type === "couple" ? "Couple Session" : "Solo Session";
      const themes = session.themes?.length > 0 
        ? `Themen: ${session.themes.join(", ")}`
        : "";
      
      return `[${formattedDate} - ${sessionType}]
${session.analysis}
${themes}`;
    });

    // Limit: Maximal 20 Sessions um Token-Limits nicht zu sprengen
    const limitedParts = contextParts.slice(0, 20);
    
    const fullContext = `=== KONTEXT AUS FRÜHEREN GESPRÄCHEN ===
(Neueste zuerst - bei Widersprüchen gilt die neuere Information)

${limitedParts.join("\n\n---\n\n")}

=== ENDE KONTEXT ===`;

    return Response.json({ 
      context: fullContext,
      sessionCount: allSessions.length,
      loadedCount: limitedParts.length
    });

  } catch (error) {
    console.error("Get context error:", error);
    return Response.json({ error: "Failed to load context" }, { status: 500 });
  }
}
