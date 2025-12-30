/**
 * MEMORY UPDATE API - /api/memory/update
 * Aktualisiert Kontext nach Session-Ende
 * 
 * EVIDENCE-BASED SCHEMA v2.0
 * Extrahiert: Core Needs, Statements, Patterns, Dynamics (Gottman-based)
 * 
 * Wichtige Regeln:
 * - Solo Session: Updates personal_context + shared facts (wenn neu)
 * - Couple Session: Updates shared_context only (personal bleibt getrennt)
 * - Statements werden mit Datum gespeichert für Widerspruchs-Erkennung
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════
// EXTRACTION PROMPTS (Evidence-based)
// ═══════════════════════════════════════════════════════════

const SOLO_UPDATE_PROMPT = `Du bist ein Assistent der Gesprächsnotizen für einen Beziehungscoach pflegt.
Diese Notizen sind PRIVAT für den User und werden nicht mit dem Partner geteilt.

AKTUELLE NOTIZEN:
{current_context}

NEUE SOLO SESSION ({date}):
{analysis}

AUFGABE:
Extrahiere relevante Informationen und aktualisiere die Notizen. Gib NUR valides JSON zurück.

WICHTIG - Was zu extrahieren ist:

1. CORE_NEEDS: Tiefe Bedürfnisse die der User ausdrückt
   - "Ich brauche mehr Nähe" → {need: "Körperliche Nähe und Zuneigung", identified: "{date}", source: "solo"}
   - Max 3 behalten, älteste ersetzen wenn nötig

2. STATEMENTS: Konkrete Aussagen mit Datum (KRITISCH für Widerspruchs-Erkennung!)
   - Aussagen über sich selbst
   - Aussagen über den Partner (subjektiv!)
   - Format: {date: "{date}", said: "...", source: "solo", theme: "intimacy|communication|workload|trust|parenting|finances|time|..."}
   - Max 7 behalten, älteste entfernen

3. PARTNER_PERSPECTIVE: Wie der User den Partner sieht (nur aus Solo!)
   - {date: "{date}", observation: "...", context: "..."}
   - Max 3 behalten

4. OWN_PATTERNS: Muster die der User bei sich selbst erkennt
   - {pattern: "Verfolger bei Intimität", recognized: "{date}", insight: "..."}
   - Max 3 behalten

5. TASKS: Konkrete Aufgaben die sich der User vornimmt
   - {task: "...", from_session: "solo", assigned: "{date}", status: "open"}
   - Alte erledigte entfernen, max 5 offene

6. COACHING_STYLE: Was bei diesem User funktioniert
   - responds_well: ["Validierung", "konkrete Beispiele"]
   - avoid: ["direkte Kritik"]

7. SOLO_JOURNEY: Session-Historie aktualisieren
   - recent_topics: [{date, topic, open}] - max 5
   - next_solo.followup: Was nächstes Mal nachfragen

8. SHARED FACTS (nur wenn NEU erwähnt und objektiv):
   Extrahiere in "shared_facts_update":
   
   BEZIEHUNG:
   - together_years: Anzahl Jahre zusammen
   - married_since: Jahr der Heirat
   - living_together_since: Jahr des Zusammenziehens
   
   FAMILIE:
   - children_count: Anzahl Kinder
   - children_ages: [Alter als Array, z.B. [10, 8, 6, 2]]
   - family_situation: z.B. "Patchwork", "Beide Eltern aktiv", etc.
   
   WOHNEN & FINANZEN:
   - living_situation: "Eigentum" | "Miete" | "Bei Eltern" | "Fernbeziehung"
   - financial_situation: "stabil" | "angespannt" | "kritisch" (nur wenn explizit erwähnt)
   
   ARBEIT:
   - work_dynamic: {partner_a: "...", partner_b: "..."}
   
   KONTEXT:
   - previous_therapy: true/false (hatten sie schon Therapie?)
   - significant_events: ["Burnout 2022", "Affäre", "Fehlgeburt", etc.] - nur wenn erwähnt!
   
   SONSTIGES:
   - other: ["Eigenes Haus", "Hund", "3 Autos", etc.] - alles andere Relevante

REGELN:
- Keine Diagnosen oder klinischen Bewertungen
- Neutral formulieren, auch bei negativen Aussagen über Partner
- Bei Widersprüchen zu früheren Aussagen: BEIDE behalten (für Erkennung!)
- Datum immer im Format YYYY-MM-DD
- Kinder-Namen NIEMALS speichern (GDPR)
- significant_events nur bei wirklich wichtigen Ereignissen

Antworte NUR mit JSON in diesem Format:
{
  "personal_context": { ... aktualisierter personal_context ... },
  "shared_facts_update": { ... nur neue Fakten, oder null wenn keine neuen ... }
}`;

const COUPLE_UPDATE_PROMPT = `Du bist ein Assistent der Gesprächsnotizen für einen Beziehungscoach pflegt.
Diese Notizen sind GEMEINSAM für beide Partner sichtbar.

AKTUELLE NOTIZEN:
{current_context}

NEUE COUPLE SESSION ({date}):
{analysis}

AUFGABE:
Extrahiere relevante Informationen und aktualisiere die gemeinsamen Notizen. Gib NUR valides JSON zurück.

WICHTIG - Was zu extrahieren ist (Gottman-basiert):

1. FACTS: Objektive Fakten die BEIDE bestätigt haben

   BEZIEHUNG:
   - together_years: Anzahl Jahre zusammen
   - married_since: Jahr der Heirat (z.B. 2012)
   - living_together_since: Jahr des Zusammenziehens
   
   FAMILIE:
   - children_count: Anzahl Kinder
   - children_ages: [10, 8, 6, 2] (KEINE Namen - GDPR!)
   - family_situation: "Patchwork" | "Beide Eltern aktiv" | etc.
   
   WOHNEN & FINANZEN:
   - living_situation: "Eigentum" | "Miete" | "Bei Eltern" | "Fernbeziehung"
   - financial_situation: "stabil" | "angespannt" | "kritisch" (nur wenn erwähnt)
   
   ARBEIT:
   - work_dynamic: {partner_a: "...", partner_b: "..."}
   
   KONTEXT:
   - previous_therapy: true/false
   - significant_events: ["Burnout 2022", "Umzug 2020", "Affäre", etc.]
   
   SONSTIGES:
   - other: ["Eigenes Haus", "Hund", "Fernbeziehung am Wochenende", etc.]
   
   QUALITY TIME:
   - date_frequency: "wöchentlich" | "alle 2 Wochen" | "monatlich" | "selten"

2. DYNAMICS: Beziehungsdynamik (Gottman-Konzepte)
   - expressed_needs: {partner_a: "...", partner_b: "..."} - was jeder braucht
   - core_tension: Die zentrale Spannung zwischen den Bedürfnissen
   - shared_concerns: ["...", "..."] - Sorgen die BEIDE teilen
   - patterns: [{pattern: "pursuer-distancer", context: "intimacy", recognized_by: "both", date: "{date}"}]
     Mögliche Muster: "pursuer-distancer", "criticism-defensiveness", "stonewalling", "contempt", "demand-withdraw"

3. STRENGTHS: Was das Paar stark macht
   - Nur hinzufügen wenn klar positiv
   - Max 5 behalten

4. JOURNEY: Gemeinsamer Fortschritt
   - milestones: [{date, achievement}] - wichtige Durchbrüche
   - perpetual_issues: ["..."] - Themen die immer wiederkommen (Gottman: 69% sind normal!)
   - recent_sessions: [{date, topic, outcome}] - max 3

5. AGREEMENTS: Vereinbarungen die BEIDE gemacht haben
   - {title: "...", created: "{date}", agreed_by: "both", check_in: "YYYY-MM-DD", status: "active"}
   - Alte abgeschlossene auf "completed" setzen
   - check_in Datum: typischerweise 1-2 Wochen nach Vereinbarung

6. COACHING: Was bei diesem Paar funktioniert
   - works_well: ["...", "..."]
   - avoid: ["...", "..."]

7. NEXT_SESSION: Vorbereitung für nächste Session
   - followup_questions: ["..."] - Was nachfragen
   - topics_to_explore: ["..."] - Themen vertiefen
   - sensitive: ["..."] - Vorsichtig ansprechen

REGELN:
- NUR was BEIDE gesagt/bestätigt haben in shared_context
- Keine Aussagen von einem Partner über den anderen (das ist subjektiv!)
- Neutral und wertfrei formulieren
- Keine Kinder-Namen speichern (GDPR)
- Bei Vereinbarungen: nur wenn BEIDE zugestimmt haben
- significant_events nur bei wirklich wichtigen Lebensereignissen

Antworte NUR mit JSON:
{
  "shared_context": { ... aktualisierter shared_context ... }
}`;

export async function POST(request) {
  try {
    const { userId, coupleId, sessionId, sessionType, analysis } = await request.json();

    if (!userId || !sessionId || !analysis) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, partner_name, memory_consent, personal_context")
      .eq("id", userId)
      .single();

    if (profileError || !profile.memory_consent) {
      return Response.json({ 
        success: false, 
        reason: "No memory consent" 
      });
    }

    // 2. Get current shared context (if couple exists)
    let sharedContext = null;
    if (coupleId) {
      const { data: couple } = await supabase
        .from("couples")
        .select("shared_context")
        .eq("id", coupleId)
        .single();

      if (couple) {
        sharedContext = couple.shared_context;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // 3. Update based on session type
    if (sessionType === "solo") {
      // Update personal context
      const result = await updateSoloContext(
        profile.personal_context || getDefaultPersonalContext(),
        analysis,
        today
      );

      if (result?.personal_context) {
        await supabase
          .from("profiles")
          .update({ personal_context: result.personal_context })
          .eq("id", userId);
      }

      // Also update shared facts if new facts were mentioned
      if (coupleId && result?.shared_facts_update) {
        const currentShared = sharedContext || getDefaultSharedContext();
        const mergedFacts = mergeFacts(currentShared.facts, result.shared_facts_update);
        
        await supabase
          .from("couples")
          .update({ 
            shared_context: {
              ...currentShared,
              facts: mergedFacts
            }
          })
          .eq("id", coupleId);
      }

      return Response.json({ 
        success: true, 
        updated: "personal_context",
        sharedFactsUpdated: !!result?.shared_facts_update
      });

    } else if (sessionType === "couple") {
      // Update shared context only
      if (coupleId) {
        const currentShared = sharedContext || getDefaultSharedContext();
        
        const result = await updateCoupleContext(
          currentShared,
          analysis,
          today
        );

        if (result?.shared_context) {
          await supabase
            .from("couples")
            .update({ shared_context: result.shared_context })
            .eq("id", coupleId);
        }

        return Response.json({ 
          success: true, 
          updated: "shared_context"
        });
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error("Memory update error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Update personal context from solo session
 */
async function updateSoloContext(currentContext, analysis, date) {
  try {
    const prompt = SOLO_UPDATE_PROMPT
      .replace("{current_context}", JSON.stringify(currentContext, null, 2))
      .replace(/{date}/g, date)
      .replace("{analysis}", analysis);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text.trim();
    return parseJsonResponse(responseText);

  } catch (error) {
    console.error("Solo context update failed:", error);
    return null;
  }
}

/**
 * Update shared context from couple session
 */
async function updateCoupleContext(currentContext, analysis, date) {
  try {
    const prompt = COUPLE_UPDATE_PROMPT
      .replace("{current_context}", JSON.stringify(currentContext, null, 2))
      .replace(/{date}/g, date)
      .replace("{analysis}", analysis);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text.trim();
    return parseJsonResponse(responseText);

  } catch (error) {
    console.error("Couple context update failed:", error);
    return null;
  }
}

/**
 * Parse JSON from Claude response (handles markdown code blocks)
 */
function parseJsonResponse(responseText) {
  let jsonStr = responseText;
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse JSON:", jsonStr.substring(0, 500));
    return null;
  }
}

/**
 * Merge new facts with existing facts (don't overwrite with null)
 */
function mergeFacts(existingFacts, newFacts) {
  if (!newFacts) return existingFacts;
  
  const merged = { ...existingFacts };
  
  for (const [key, value] of Object.entries(newFacts)) {
    if (value !== null && value !== undefined) {
      // For arrays, merge intelligently
      if (Array.isArray(value) && Array.isArray(merged[key])) {
        // For children_ages, replace entirely if provided
        if (key === 'children_ages') {
          merged[key] = value;
        } else {
          // For other arrays, merge unique values
          merged[key] = [...new Set([...merged[key], ...value])];
        }
      } else if (typeof value === 'object' && typeof merged[key] === 'object') {
        // For nested objects, merge recursively
        merged[key] = { ...merged[key], ...value };
      } else {
        // For primitives, overwrite
        merged[key] = value;
      }
    }
  }
  
  return merged;
}

/**
 * Default personal context structure
 */
function getDefaultPersonalContext() {
  return {
    // Gottman: Core emotional needs
    core_needs: [],
    
    // Statements with dates for contradiction detection
    statements: [],
    
    // Subjective view of partner (solo only)
    partner_perspective: [],
    
    // Self-recognized patterns
    own_patterns: [],
    
    // Tasks/commitments
    tasks: [],
    
    // Coaching preferences
    coaching_style: {
      responds_well: [],
      avoid: []
    },
    
    // Legacy fields (backwards compatibility)
    expressed: [],
    solo_journey: {
      started: new Date().toISOString().split("T")[0],
      recent_topics: []
    },
    next_solo: {
      followup: null
    }
  };
}

/**
 * Default shared context structure
 */
function getDefaultSharedContext() {
  return {
    // Objective facts (GDPR-compliant, expanded)
    facts: {
      // Beziehung
      together_years: null,
      together_since: null,  // Legacy
      married_since: null,
      living_together_since: null,
      
      // Familie
      children_count: null,
      children_ages: [],
      children: [],  // Legacy (with names) - deprecated
      family_situation: null,
      
      // Wohnen & Finanzen
      living_situation: null,
      financial_situation: null,
      
      // Arbeit
      work_dynamic: null,
      work: {},  // Legacy
      
      // Kontext
      previous_therapy: null,
      significant_events: [],
      
      // Quality Time
      date_frequency: null,
      
      // Sonstiges
      other: []
    },
    
    // Gottman: Relationship dynamics
    dynamics: {
      expressed_needs: {
        partner_a: null,
        partner_b: null
      },
      core_tension: null,
      shared_concerns: [],
      patterns: []
    },
    
    // Strengths
    strengths: [],
    
    // Journey together
    journey: {
      started_with_amiya: new Date().toISOString().split("T")[0],
      milestones: [],
      perpetual_issues: [],
      initial_topics: [],  // Legacy
      progress: [],  // Legacy
      recurring: [],  // Legacy
      recent_sessions: []
    },
    
    // Agreements between partners
    agreements: [],
    
    // Coaching style for couple
    coaching: {
      works_well: [],
      avoid: []
    },
    
    // Next session preparation
    next_session: {
      followup: null,  // Legacy
      followup_questions: [],
      topics_to_explore: [],
      open_agreements: [],  // Legacy
      sensitive: []
    }
  };
}
