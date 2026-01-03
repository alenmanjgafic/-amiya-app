/**
 * COACHING PROFILE UPDATE API - /api/coaching-profile/update
 *
 * Aktualisiert das adaptive Coaching-Profil basierend auf Session-Metriken.
 * Lernt den Kommunikationsstil des Users und passt den Coaching-Ansatz an.
 *
 * GDPR: Nur aggregierte Verhaltens-Daten, keine Inhalte.
 *       Wird nur gespeichert wenn memory_consent = true.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Schwellwerte für Klassifizierung
const THRESHOLDS = {
  RATIO_LOW: 0.20,      // Unter 20% = passiv
  RATIO_MEDIUM: 0.35,   // 20-35% = normal
  RATIO_HIGH: 0.45,     // Über 45% = sehr aktiv
  SESSIONS_ESTABLISHED: 5,
  SESSIONS_DEEP: 10,
  SIGNIFICANT_CHANGE: 2.0,  // 2x Durchschnitt = Durchbruch
  TREND_WEIGHT_RECENT: 0.6,
  TREND_WEIGHT_OLD: 0.4,
};

export async function POST(request) {
  try {
    const { userId, sessionId, engagementMetrics } = await request.json();

    if (!userId || !engagementMetrics) {
      return Response.json(
        { error: "userId and engagementMetrics required" },
        { status: 400 }
      );
    }

    // 1. Prüfe memory_consent
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("memory_consent, coaching_profile")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    // GDPR: Nur speichern wenn Consent gegeben
    if (!profile.memory_consent) {
      return Response.json({
        success: false,
        reason: "no_consent",
        message: "Coaching profile not updated - no memory consent"
      });
    }

    // 2. Lade historische Session-Metriken (letzte 10)
    const { data: recentSessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, engagement_metrics, created_at")
      .eq("user_id", userId)
      .not("engagement_metrics", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error("Sessions fetch error:", sessionsError);
    }

    const historicalMetrics = (recentSessions || [])
      .filter(s => s.id !== sessionId) // Aktuelle Session ausschließen
      .map(s => s.engagement_metrics);

    // 3. Berechne neues Coaching-Profil
    const existingProfile = profile.coaching_profile || {
      communication_style: "unknown",
      avg_engagement_ratio: null,
      sessions_analyzed: 0,
      trust_level: "building",
      trend: "stable",
      best_approach: "balanced",
      notes: []
    };

    const updatedProfile = calculateUpdatedProfile(
      existingProfile,
      engagementMetrics,
      historicalMetrics
    );

    // 4. Speichere aktualisiertes Profil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ coaching_profile: updatedProfile })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return Response.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return Response.json({
      success: true,
      profile: updatedProfile,
      debug: {
        historicalCount: historicalMetrics.length,
        currentMetrics: engagementMetrics
      }
    });

  } catch (error) {
    console.error("Coaching profile update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Berechnet das aktualisierte Coaching-Profil
 *
 * Logik:
 * - Gewichteter Durchschnitt (60% neuere, 40% ältere Sessions)
 * - Trend-Erkennung (öffnet sich / stabil / zieht sich zurück)
 * - Kommunikationsstil nur bei konsistenten Mustern ändern
 */
function calculateUpdatedProfile(existing, current, historical) {
  const allMetrics = [current, ...historical];
  const totalSessions = allMetrics.length;

  // 1. GEWICHTETE RATIO BERECHNEN
  let weightedRatio;

  if (historical.length === 0) {
    // Erste Session
    weightedRatio = current.ratio;
  } else {
    const recentMetrics = allMetrics.slice(0, 3);
    const olderMetrics = allMetrics.slice(3);

    const recentAvg = average(recentMetrics.map(m => m.ratio));
    const olderAvg = olderMetrics.length > 0
      ? average(olderMetrics.map(m => m.ratio))
      : recentAvg;

    weightedRatio = (recentAvg * THRESHOLDS.TREND_WEIGHT_RECENT) +
                    (olderAvg * THRESHOLDS.TREND_WEIGHT_OLD);
  }

  // 2. TREND ERKENNEN
  let trend = "stable";
  let significantChange = false;

  if (historical.length >= 2) {
    const previousAvg = average(historical.slice(0, 3).map(m => m.ratio));

    if (current.ratio > previousAvg * 1.5) {
      trend = "opening_up";
      significantChange = current.ratio > previousAvg * THRESHOLDS.SIGNIFICANT_CHANGE;
    } else if (current.ratio < previousAvg * 0.6) {
      trend = "withdrawing";
    }
  }

  // Session-eigenen Trend berücksichtigen
  if (current.trend === "opening_up" && trend === "stable") {
    trend = "opening_up";
  }
  if (current.trend === "closing_down" && trend === "stable") {
    trend = "withdrawing";
  }

  // 3. KOMMUNIKATIONSSTIL BESTIMMEN
  let style = existing.communication_style;

  // Stil nur ändern wenn konsistent über mehrere Sessions
  if (totalSessions >= 3) {
    const recentRatios = allMetrics.slice(0, 3).map(m => m.ratio);

    const consistentlyReserved = recentRatios.every(r => r < THRESHOLDS.RATIO_LOW);
    const consistentlyOpen = recentRatios.every(r => r > THRESHOLDS.RATIO_HIGH);
    const consistentlyMedium = recentRatios.every(
      r => r >= THRESHOLDS.RATIO_LOW && r <= THRESHOLDS.RATIO_HIGH
    );

    if (consistentlyReserved) {
      style = "avoider";
    } else if (consistentlyOpen) {
      style = "validator";
    } else if (consistentlyMedium) {
      style = "balanced";
    }
    // Bei gemischten Mustern: Stil beibehalten
  } else if (totalSessions === 1) {
    // Erste Session: vorläufige Einschätzung
    if (current.ratio < THRESHOLDS.RATIO_LOW) {
      style = "avoider";
    } else if (current.ratio > THRESHOLDS.RATIO_HIGH) {
      style = "validator";
    } else {
      style = "balanced";
    }
  }

  // 4. TRUST-LEVEL BESTIMMEN
  let trustLevel = "building";

  if (totalSessions >= THRESHOLDS.SESSIONS_DEEP && weightedRatio > THRESHOLDS.RATIO_MEDIUM) {
    trustLevel = "deep";
  } else if (totalSessions >= THRESHOLDS.SESSIONS_ESTABLISHED && weightedRatio > THRESHOLDS.RATIO_LOW) {
    trustLevel = "established";
  }

  // 5. BEST APPROACH BESTIMMEN
  const bestApproach = determineBestApproach(style, trustLevel, trend);

  // 6. KONTEXT-NOTIZEN GENERIEREN
  const notes = generateNotes(style, trustLevel, trend, significantChange, current, existing);

  return {
    communication_style: style,
    avg_engagement_ratio: Math.round(weightedRatio * 100) / 100,
    sessions_analyzed: totalSessions,
    trust_level: trustLevel,
    trend: trend,
    best_approach: bestApproach,
    last_significant_change: significantChange
      ? new Date().toISOString()
      : existing.last_significant_change,
    last_updated: new Date().toISOString(),
    notes: notes.slice(0, 3) // Max 3 Notizen
  };
}

/**
 * Bestimmt den besten Coaching-Ansatz
 */
function determineBestApproach(style, trustLevel, trend) {
  // Trend hat Priorität
  if (trend === "opening_up") {
    return "encourage_gently";
  }
  if (trend === "withdrawing") {
    return "create_safety";
  }

  // Nach Stil
  if (style === "avoider") {
    return trustLevel === "deep" ? "gentle_questions" : "patient_space";
  }
  if (style === "validator") {
    return trustLevel === "deep" ? "direct_reflection" : "active_listening";
  }
  if (style === "volatile") {
    return "structured";
  }

  return "balanced";
}

/**
 * Generiert kontextbezogene Notizen für den Coach
 */
function generateNotes(style, trustLevel, trend, significantChange, current, existing) {
  const notes = [];

  // Durchbruch-Notiz
  if (significantChange && trend === "opening_up") {
    notes.push("Hat sich in letzter Session deutlich mehr geöffnet - behutsam vertiefen");
  }

  // Rückzugs-Notiz
  if (trend === "withdrawing") {
    notes.push("Zieht sich aktuell etwas zurück - Sicherheit geben, nicht drängen");
  }

  // Session-spezifische Trends
  if (current.trend === "opening_up" && !significantChange) {
    notes.push("Wurde im Verlauf der Session offener");
  }
  if (current.trend === "closing_down") {
    notes.push("Wurde im Verlauf der Session zurückhaltender");
  }

  // Stil-spezifische Notizen
  if (style === "avoider" && trustLevel === "building") {
    notes.push("Braucht noch Zeit um Vertrauen aufzubauen");
  }
  if (style === "avoider" && trustLevel === "established") {
    notes.push("Öffnet sich bei vertrauten Themen");
  }

  // Kurze Nachrichten
  if (current.avg_msg_length < 30) {
    notes.push("Antwortet meist in kurzen Sätzen");
  }

  // Lange Session, wenig Content
  if (current.duration_sec > 300 && current.ratio < 0.15) {
    notes.push("Hört lieber zu als selbst zu sprechen");
  }

  return notes;
}

/**
 * Hilfsfunktion: Durchschnitt berechnen
 */
function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + (val || 0), 0) / arr.length;
}
