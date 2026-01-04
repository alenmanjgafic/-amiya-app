/**
 * AGREEMENT SUGGESTIONS API - /api/agreements/suggestions/route.js
 * GET: Offene Vorschläge für ein Couple
 * POST: Neuen Vorschlag erstellen (von Analyse)
 * PATCH: Vorschlag akzeptieren/ablehnen
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/agreements/suggestions?coupleId=xxx&userId=xxx
 * Returns both:
 * - agreement_suggestions with status "pending"
 * - agreements with status "pending_approval" where user hasn't approved yet
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get("coupleId");
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    if (!coupleId) {
      return Response.json({ error: "coupleId required" }, { status: 400 });
    }

    // 1. Get pending suggestions
    let suggestionsQuery = supabase
      .from("agreement_suggestions")
      .select("*")
      .eq("couple_id", coupleId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (sessionId) {
      suggestionsQuery = suggestionsQuery.eq("session_id", sessionId);
    }

    const { data: suggestions, error: suggestionsError } = await suggestionsQuery;

    if (suggestionsError) {
      console.error("Suggestions fetch error:", suggestionsError);
      return Response.json({ error: suggestionsError.message }, { status: 500 });
    }

    // 2. Get agreements needing approval (if userId provided)
    let pendingAgreements = [];
    if (userId) {
      const { data: agreements, error: agreementsError } = await supabase
        .from("agreements")
        .select("*")
        .eq("couple_id", coupleId)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      if (agreementsError) {
        console.error("Pending agreements fetch error:", agreementsError);
      } else {
        // Filter to only those where current user hasn't approved yet
        pendingAgreements = (agreements || []).filter(a =>
          !a.approved_by?.includes(userId)
        );
      }
    }

    // Calculate total pending count
    const totalPending = (suggestions?.length || 0) + pendingAgreements.length;

    return Response.json({
      suggestions: suggestions || [],
      pendingAgreements,
      totalPending
    });

  } catch (error) {
    console.error("Suggestions get error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agreements/suggestions
 * Erstellt einen neuen Vorschlag (wird von /api/analyze aufgerufen)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { coupleId, sessionId, title, underlyingNeed, responsible } = body;

    if (!coupleId || !title) {
      return Response.json(
        { error: "coupleId and title required" }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("agreement_suggestions")
      .insert({
        couple_id: coupleId,
        session_id: sessionId || null,
        title,
        underlying_need: underlyingNeed || null,
        responsible: responsible || "both"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating suggestion:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, suggestion: data });

  } catch (error) {
    console.error("Suggestion create error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/agreements/suggestions
 * Akzeptieren oder Ablehnen eines Vorschlags
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { 
      suggestionId, 
      action, // "accept" or "dismiss"
      userId,
      // Für accept: angepasste Daten
      title,
      underlyingNeed,
      responsible,
      type,
      checkInFrequencyDays
    } = body;

    if (!suggestionId || !action || !userId) {
      return Response.json(
        { error: "suggestionId, action, and userId required" }, 
        { status: 400 }
      );
    }

    // Get suggestion with session info
    const { data: suggestion, error: fetchError } = await supabase
      .from("agreement_suggestions")
      .select("*, sessions(themes)")
      .eq("id", suggestionId)
      .single();

    if (fetchError || !suggestion) {
      return Response.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify user belongs to couple
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id, partner_id, name")
      .eq("id", userId)
      .single();

    if (!profile || profile.couple_id !== suggestion.couple_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "dismiss") {
      // Mark as dismissed
      await supabase
        .from("agreement_suggestions")
        .update({ status: "dismissed" })
        .eq("id", suggestionId);

      return Response.json({ success: true, dismissed: true });
    }

    if (action === "accept") {
      // Get couple info to determine user_a and user_b
      const { data: couple } = await supabase
        .from("couples")
        .select("user_a_id, user_b_id")
        .eq("id", suggestion.couple_id)
        .single();

      // Determine responsible_user_id from "responsible" string
      let responsibleUserId = null;
      const respValue = responsible || suggestion.responsible;
      
      if (respValue === "user_a" && couple) {
        responsibleUserId = couple.user_a_id;
      } else if (respValue === "user_b" && couple) {
        responsibleUserId = couple.user_b_id;
      }
      // If "both" or undefined, responsibleUserId stays null

      // Auto-detect type and frequency from title if not provided
      const finalTitle = title || suggestion.title;
      const { detectedType, detectedFrequency } = analyzeAgreementContent(finalTitle);
      const agreementType = type || detectedType;
      
      // Calculate next check-in
      const days = checkInFrequencyDays || (agreementType === "experiment" ? 7 : 14);
      const nextCheckInAt = new Date();
      nextCheckInAt.setDate(nextCheckInAt.getDate() + days);

      // Determine approval status
      const requiresMutualApproval = responsibleUserId === null;
      const approvedBy = [userId];
      
      let status = "pending_approval";
      if (!requiresMutualApproval && responsibleUserId === userId) {
        status = "active";
      }

      // Get themes from session
      const sessionThemes = suggestion.sessions?.themes || [];

      // Create agreement
      const { data: agreement, error: createError } = await supabase
        .from("agreements")
        .insert({
          couple_id: suggestion.couple_id,
          created_by_user_id: userId,
          created_in_session_id: suggestion.session_id,
          title: finalTitle,
          underlying_need: underlyingNeed || suggestion.underlying_need,
          type: agreementType,
          frequency: detectedFrequency,
          responsible_user_id: responsibleUserId,
          status,
          requires_mutual_approval: requiresMutualApproval,
          approved_by: approvedBy,
          check_in_frequency_days: days,
          next_check_in_at: nextCheckInAt.toISOString(),
          themes: sessionThemes,
          experiment_end_date: agreementType === "experiment" ? getExperimentEndDate() : null
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating agreement:", createError);
        return Response.json({ error: createError.message }, { status: 500 });
      }

      // Update suggestion status with link to created agreement
      await supabase
        .from("agreement_suggestions")
        .update({
          status: "accepted",
          accepted_as_agreement_id: agreement.id
        })
        .eq("id", suggestionId);

      // Get partner name for response
      let partnerName = "Partner";
      if (profile.partner_id) {
        const { data: partner } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", profile.partner_id)
          .single();
        if (partner) {
          partnerName = partner.name;
        }
      }

      return Response.json({ 
        success: true, 
        agreement,
        needsPartnerApproval: status === "pending_approval" && requiresMutualApproval,
        message: status === "pending_approval" 
          ? `Vereinbarung erstellt! ${partnerName} muss noch zustimmen.`
          : "Vereinbarung ist aktiv!"
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Suggestion patch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Analysiert den Titel um Typ und Frequenz zu erkennen
 */
function analyzeAgreementContent(title) {
  const titleLower = title.toLowerCase();
  
  // Type Detection
  let detectedType = "behavior"; // Default
  
  if (titleLower.includes("reden") || titleLower.includes("sagen") || 
      titleLower.includes("fragen") || titleLower.includes("zuhören") ||
      titleLower.includes("aussprechen") || titleLower.includes("kommunik")) {
    detectedType = "communication";
  } else if (titleLower.includes("ritual") || titleLower.includes("jeden abend") ||
             titleLower.includes("date night") || titleLower.includes("gemeinsam")) {
    detectedType = "ritual";
  } else if (titleLower.includes("versuch") || titleLower.includes("experiment") ||
             titleLower.includes("ausprobieren") || titleLower.includes("testen")) {
    detectedType = "experiment";
  }

  // Frequency Detection
  let detectedFrequency = "situational"; // Default
  
  if (titleLower.includes("täglich") || titleLower.includes("jeden tag") ||
      titleLower.includes("jeden abend") || titleLower.includes("jeden morgen")) {
    detectedFrequency = "daily";
  } else if (titleLower.includes("wöchentlich") || titleLower.includes("jede woche") ||
             titleLower.includes("montag") || titleLower.includes("dienstag") ||
             titleLower.includes("mittwoch") || titleLower.includes("donnerstag") ||
             titleLower.includes("freitag") || titleLower.includes("samstag") ||
             titleLower.includes("sonntag") || titleLower.includes("wochenende")) {
    detectedFrequency = "weekly";
  } else if (titleLower.includes("einmal") || titleLower.includes("einmalig")) {
    detectedFrequency = "once";
  }

  return { detectedType, detectedFrequency };
}

/**
 * Berechnet End-Datum für Experimente (4 Wochen)
 */
function getExperimentEndDate() {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 28);
  return endDate.toISOString().split('T')[0];
}
