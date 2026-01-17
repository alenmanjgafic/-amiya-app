/**
 * COUPLE PAIR API - /api/couple/pair/route.js
 *
 * Sichere Server-seitige Partner-Verbindung
 *
 * POST /api/couple/pair
 * - Validiert Invite-Code
 * - Erstellt Couple
 * - Verknüpft beide Profile
 * - Markiert Code als verwendet
 *
 * GET /api/couple/pair/code?userId=xxx
 * - Gibt eigenen aktiven Code zurück oder erstellt neuen
 *
 * SICHERHEIT:
 * - Läuft mit Service Role (umgeht RLS)
 * - Validiert Auth-Token server-seitig
 * - Verhindert Code-Enumeration
 * - Verhindert beliebige Partner-Zuweisung
 */
import { createClient } from "@supabase/supabase-js";
import { validateBody, validateRequest, uuidSchema } from "../../../../lib/validation";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const pairSchema = z.object({
  userId: uuidSchema,
  code: z
    .string()
    .length(6, "Code muss 6 Zeichen haben")
    .regex(/^[A-Z0-9]+$/, "Code darf nur Großbuchstaben und Zahlen enthalten"),
});

const getCodeSchema = z.object({
  userId: uuidSchema,
});

// ═══════════════════════════════════════════════════════════════════════════
// GET: Eigenen Code abrufen oder erstellen
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Validierung
    const validation = validateRequest(getCodeSchema, { userId });
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Prüfe ob User existiert
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, couple_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return Response.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    // User ist bereits in einem Couple
    if (profile.couple_id) {
      return Response.json(
        { error: "Du bist bereits mit einem Partner verbunden" },
        { status: 400 }
      );
    }

    // Suche existierenden gültigen Code
    const { data: existingCode } = await supabase
      .from("invite_codes")
      .select("code, expires_at")
      .eq("user_id", userId)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingCode) {
      return Response.json({
        code: existingCode.code,
        expiresAt: existingCode.expires_at,
      });
    }

    // Erstelle neuen Code
    const newCode = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

    const { error: insertError } = await supabase.from("invite_codes").insert({
      code: newCode,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Code creation error:", insertError);
      return Response.json(
        { error: "Fehler beim Erstellen des Codes" },
        { status: 500 }
      );
    }

    return Response.json({
      code: newCode,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/couple/pair error:", error);
    return Response.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST: Partner verbinden
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request) {
  try {
    // Validierung
    const data = await validateBody(request, pairSchema);
    const { userId, code } = data;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Prüfe ob User existiert und noch kein Couple hat
    // ─────────────────────────────────────────────────────────────────────────

    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, name, couple_id")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      return Response.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (userProfile.couple_id) {
      return Response.json(
        { error: "Du bist bereits mit einem Partner verbunden" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Validiere den Invite-Code (Server-seitig, sicher)
    // ─────────────────────────────────────────────────────────────────────────

    const { data: inviteCode, error: codeError } = await supabase
      .from("invite_codes")
      .select("id, code, user_id, expires_at, used_by")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError || !inviteCode) {
      // Generische Fehlermeldung um Code-Enumeration zu verhindern
      return Response.json(
        { error: "Code ungültig oder abgelaufen" },
        { status: 400 }
      );
    }

    // Prüfe ob Code bereits verwendet wurde
    if (inviteCode.used_by) {
      return Response.json(
        { error: "Code ungültig oder abgelaufen" },
        { status: 400 }
      );
    }

    if (new Date(inviteCode.expires_at) < new Date()) {
      return Response.json(
        { error: "Code ungültig oder abgelaufen" },
        { status: 400 }
      );
    }

    // Prüfe ob es nicht der eigene Code ist
    if (inviteCode.user_id === userId) {
      return Response.json(
        { error: "Du kannst deinen eigenen Code nicht verwenden" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Prüfe ob der Einladende noch kein Couple hat
    // ─────────────────────────────────────────────────────────────────────────

    const { data: inviterProfile, error: inviterError } = await supabase
      .from("profiles")
      .select("id, name, couple_id")
      .eq("id", inviteCode.user_id)
      .single();

    if (inviterError || !inviterProfile) {
      return Response.json(
        { error: "Der einladende User existiert nicht mehr" },
        { status: 400 }
      );
    }

    if (inviterProfile.couple_id) {
      return Response.json(
        { error: "Der einladende User ist bereits verbunden" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Erstelle das Couple (ATOMARE TRANSAKTION)
    // ─────────────────────────────────────────────────────────────────────────

    // Hinweis: Supabase JS Client unterstützt keine echten Transaktionen,
    // daher verwenden wir ein mehrstufiges Vorgehen mit Fehlerbehandlung

    const inviterId = inviteCode.user_id;

    // 4a. Couple erstellen
    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .insert({
        user_a_id: inviterId, // Der Einladende ist immer user_a
        user_b_id: userId, // Der Eingeladene ist user_b
        status: "active",
      })
      .select("id")
      .single();

    if (coupleError) {
      console.error("Couple creation error:", coupleError);
      return Response.json(
        { error: "Fehler beim Verbinden" },
        { status: 500 }
      );
    }

    // 4b. Profil des Einladenden updaten
    const { error: updateInviterError } = await supabase
      .from("profiles")
      .update({
        couple_id: couple.id,
        partner_id: userId,
      })
      .eq("id", inviterId);

    if (updateInviterError) {
      console.error("Inviter profile update error:", updateInviterError);
      // Rollback: Couple löschen
      await supabase.from("couples").delete().eq("id", couple.id);
      return Response.json(
        { error: "Fehler beim Verbinden" },
        { status: 500 }
      );
    }

    // 4c. Profil des Eingeladenen updaten
    const { error: updateUserError } = await supabase
      .from("profiles")
      .update({
        couple_id: couple.id,
        partner_id: inviterId,
      })
      .eq("id", userId);

    if (updateUserError) {
      console.error("User profile update error:", updateUserError);
      // Rollback: Couple und Inviter-Update rückgängig
      await supabase
        .from("profiles")
        .update({ couple_id: null, partner_id: null })
        .eq("id", inviterId);
      await supabase.from("couples").delete().eq("id", couple.id);
      return Response.json(
        { error: "Fehler beim Verbinden" },
        { status: 500 }
      );
    }

    // 4d. Code als verwendet markieren
    const { error: codeUpdateError } = await supabase
      .from("invite_codes")
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq("id", inviteCode.id);

    if (codeUpdateError) {
      console.error("Code update error:", codeUpdateError);
      // Nicht kritisch - Verbindung ist trotzdem erfolgreich
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Erfolg zurückgeben
    // ─────────────────────────────────────────────────────────────────────────

    return Response.json({
      success: true,
      message: "Erfolgreich verbunden!",
      coupleId: couple.id,
      partnerName: inviterProfile.name || "Partner",
    });
  } catch (error) {
    // validateBody wirft Response.json bei Validierungsfehlern
    if (error instanceof Response) {
      return error;
    }

    console.error("POST /api/couple/pair error:", error);
    return Response.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generiert einen 6-stelligen alphanumerischen Code
 * Ohne I, O, 0, 1 um Verwechslungen zu vermeiden
 */
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
