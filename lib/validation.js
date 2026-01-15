/**
 * VALIDATION SCHEMAS - /lib/validation.js
 * Zentrale Zod-Schemas für alle API-Routen
 *
 * Schützt vor:
 * - Injection-Attacken
 * - Zu langen Inputs (Kostenkontrolle für Claude/ElevenLabs)
 * - Ungültigen Datentypen
 * - Fehlenden Pflichtfeldern
 */
import { z } from "zod";

// ═══════════════════════════════════════════════════════════
// COMMON SCHEMAS (wiederverwendbar)
// ═══════════════════════════════════════════════════════════

// UUID Schema - validiert Supabase UUIDs
export const uuidSchema = z.string().uuid("Ungültige ID");

// Optionale UUID
export const optionalUuidSchema = z.string().uuid().nullable().optional();

// Session Type
export const sessionTypeSchema = z.enum(["solo", "couple", "message_analysis"]);

// Chat Message Schema
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(50000, "Nachricht zu lang (max 50.000 Zeichen)"),
});

// ═══════════════════════════════════════════════════════════
// API ROUTE SCHEMAS
// ═══════════════════════════════════════════════════════════

/**
 * /api/chat
 */
export const chatSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "Mindestens eine Nachricht erforderlich")
    .max(100, "Zu viele Nachrichten (max 100)"),
  system: z.string().max(10000, "System-Prompt zu lang").optional(),
});

/**
 * /api/speak (ElevenLabs TTS)
 * WICHTIG: Längenbeschränkung für Kostenkontrolle!
 */
export const speakSchema = z.object({
  text: z
    .string()
    .min(1, "Text erforderlich")
    .max(5000, "Text zu lang (max 5.000 Zeichen)"),
});

/**
 * /api/analyze
 */
export const analyzeSchema = z.object({
  sessionId: uuidSchema,
});

/**
 * /api/check-analysis
 */
export const checkAnalysisSchema = z.object({
  sessionId: uuidSchema,
});

/**
 * /api/memory/get
 */
export const memoryGetSchema = z.object({
  userId: uuidSchema,
  coupleId: optionalUuidSchema,
  sessionType: sessionTypeSchema,
});

/**
 * /api/memory/update
 */
export const memoryUpdateSchema = z.object({
  userId: uuidSchema,
  coupleId: optionalUuidSchema,
  sessionId: uuidSchema,
  sessionType: sessionTypeSchema,
  analysis: z.string().min(1, "Analyse erforderlich").max(50000, "Analyse zu lang"),
});

/**
 * /api/memory/delete
 */
export const memoryDeleteSchema = z.object({
  userId: uuidSchema,
  deleteType: z.enum(["personal", "statements", "shared", "all"]),
});

/**
 * /api/check-analysis
 */
export const checkAnalysisTranscriptSchema = z.object({
  transcript: z.string().max(200000, "Transkript zu lang"),
});

/**
 * /api/message-analyze
 */
export const messageAnalyzeSchema = z.object({
  userId: uuidSchema,
  coupleId: optionalUuidSchema,
  inputType: z.enum(["screenshot", "text"]),
  content: z
    .string()
    .min(1, "Inhalt erforderlich")
    .max(500000, "Inhalt zu gross (max 500KB)"), // Base64 images can be large
  additionalContext: z.string().max(2000, "Kontext zu lang").optional(),
});

/**
 * /api/coach/message
 */
export const coachMessageSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "Mindestens eine Nachricht erforderlich")
    .max(50, "Zu viele Nachrichten"),
  analysisContext: z
    .object({
      analysis: z.string().optional(),
      themes: z.array(z.string()).optional(),
    })
    .optional(),
  userName: z.string().max(100).optional(),
  partnerName: z.string().max(100).optional(),
  requestVariation: z.boolean().optional(),
});

/**
 * /api/coach/reformulate
 */
export const coachReformulateSchema = z.object({
  originalMessage: z.string().min(1).max(5000),
  context: z.string().max(5000).optional(),
  style: z.enum(["softer", "clearer", "shorter"]).optional(),
});

/**
 * /api/agreements (POST)
 */
export const createAgreementSchema = z.object({
  coupleId: uuidSchema,
  userId: uuidSchema,
  title: z.string().min(1, "Titel erforderlich").max(500, "Titel zu lang"),
  description: z.string().max(5000, "Beschreibung zu lang").optional(),
  underlyingNeed: z.string().max(500).optional(),
  type: z.enum(["behavior", "commitment", "experiment"]).default("behavior"),
  responsibleUserId: optionalUuidSchema,
  frequency: z.string().max(100).optional(),
  experimentEndDate: z.string().datetime().optional().nullable(),
  checkInFrequencyDays: z.number().int().min(1).max(365).default(14),
  themes: z.array(z.string().max(50)).max(10).default([]),
  sessionId: optionalUuidSchema,
  fromSuggestionId: optionalUuidSchema,
});

/**
 * /api/agreements/[id] (PATCH)
 */
export const updateAgreementSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["pending_approval", "active", "achieved", "dissolved"]).optional(),
  underlyingNeed: z.string().max(500).optional(),
});

/**
 * /api/agreements/[id]/checkin (POST)
 */
export const agreementCheckinSchema = z.object({
  userId: uuidSchema,
  status: z.enum(["good", "partial", "missed"]),
  successCount: z.number().int().min(0).optional(),
  totalCount: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * /api/quiz/share
 */
export const quizShareSchema = z.object({
  userId: uuidSchema,
});

/**
 * /api/sessions/[id] (PATCH)
 */
export const updateSessionSchema = z.object({
  summary: z.string().max(100000).optional(),
  status: z.enum(["active", "completed"]).optional(),
  ended_at: z.string().datetime().optional(),
});

/**
 * /api/learning/progress (POST)
 */
export const learningProgressSchema = z.object({
  userId: uuidSchema,
  lessonId: z.string().min(1).max(100),
  seriesId: z.string().min(1).max(100),
  completed: z.boolean(),
  screenIndex: z.number().int().min(0).optional(),
});

/**
 * /api/learning/responses (POST)
 */
export const learningResponseSchema = z.object({
  userId: uuidSchema,
  lessonId: z.string().min(1).max(100),
  screenId: z.string().min(1).max(100),
  response: z.union([
    z.string().max(5000),
    z.array(z.string().max(500)),
    z.record(z.string().max(500)),
  ]),
});

/**
 * /api/learning/challenges (POST)
 */
export const learningChallengeSchema = z.object({
  userId: uuidSchema,
  challengeId: z.string().min(1).max(100),
  lessonId: z.string().min(1).max(100),
  status: z.enum(["accepted", "completed", "dismissed"]),
});

/**
 * /api/learning/chat-practice (POST)
 */
export const learningChatPracticeSchema = z.object({
  userId: uuidSchema,
  lessonId: z.string().min(1).max(100),
  messages: z.array(chatMessageSchema).min(1).max(20),
  scenario: z.string().max(2000).optional(),
});

/**
 * /api/coaching-profile/update (POST)
 */
export const coachingProfileUpdateSchema = z.object({
  userId: uuidSchema,
  sessionId: uuidSchema,
  metrics: z.object({
    user_messages: z.number().int().min(0),
    user_chars: z.number().int().min(0),
    ai_chars: z.number().int().min(0),
    duration_sec: z.number().int().min(0),
  }),
});

// ═══════════════════════════════════════════════════════════
// VALIDATION HELPER
// ═══════════════════════════════════════════════════════════

/**
 * Validiert Request-Body und gibt formatierte Fehlermeldung zurück
 * @param {z.ZodSchema} schema - Das Zod-Schema
 * @param {object} data - Die zu validierenden Daten
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function validateRequest(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Formatiere Fehlermeldungen für User
    const errors = result.error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return {
      success: false,
      error: errors.join(", "),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Middleware-Style Validation für API Routes
 * Wirft Response.json() wenn Validierung fehlschlägt
 */
export async function validateBody(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    throw Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateRequest(schema, body);

  if (!result.success) {
    throw Response.json({ error: result.error }, { status: 400 });
  }

  return result.data;
}
