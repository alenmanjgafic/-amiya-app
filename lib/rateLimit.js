/**
 * RATE LIMITING - /lib/rateLimit.js
 * Einfaches In-Memory Rate Limiting für Vercel Serverless
 *
 * HINWEIS: Bei Cold Starts werden Counts zurückgesetzt.
 * Für Produktion: Upstash Redis oder Vercel KV empfohlen.
 *
 * Limits (pro User pro Stunde):
 * - analyze: 20
 * - message-analyze: 20
 * - speak: 300
 * - chat: 100
 * - coach-message: 50
 */

// Rate Limit Konfiguration
export const RATE_LIMITS = {
  "analyze": { limit: 20, windowMs: 60 * 60 * 1000 },           // 20/Stunde
  "message-analyze": { limit: 20, windowMs: 60 * 60 * 1000 },   // 20/Stunde
  "speak": { limit: 300, windowMs: 60 * 60 * 1000 },            // 300/Stunde
  "chat": { limit: 100, windowMs: 60 * 60 * 1000 },             // 100/Stunde
  "coach-message": { limit: 50, windowMs: 60 * 60 * 1000 },     // 50/Stunde
};

// In-Memory Store für Rate Limiting
// Key: `${userId}:${endpoint}`, Value: { count, resetAt }
const rateLimitStore = new Map();

// Cleanup alte Einträge alle 5 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Prüft Rate Limit für einen User/Endpoint
 *
 * @param {string} userId - Supabase User ID
 * @param {string} endpoint - Endpoint Key (z.B. "analyze", "speak")
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(userId, endpoint) {
  const config = RATE_LIMITS[endpoint];

  // Wenn kein Limit konfiguriert, erlauben
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: 0 };
  }

  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // Neuer Record oder abgelaufen
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Limit prüfen
  if (record.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Counter erhöhen
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Rate Limit Response für abgelehnte Anfragen
 */
export function rateLimitResponse(resetAt) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  const resetTime = new Date(resetAt).toLocaleTimeString("de-DE");

  return Response.json(
    {
      error: "Rate limit exceeded",
      message: `Zu viele Anfragen. Bitte warte bis ${resetTime}.`,
      retryAfterSeconds: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

/**
 * Hilfsfunktion für API Routes
 * Extrahiert User ID aus Supabase Auth Header oder Request Body
 *
 * @param {Request} request
 * @param {string} endpoint
 * @param {string} [userIdFromBody] - Optional: userId aus Body falls schon geparst
 */
export async function applyRateLimit(request, endpoint, userIdFromBody = null) {
  // User ID aus Body oder Header holen
  let userId = userIdFromBody;

  // Wenn keine userId im Body, versuche aus Authorization Header
  if (!userId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // Für Supabase: Token enthält User ID
      // Vereinfachung: Wir nutzen den Token als Key (ist unique pro User)
      userId = authHeader.substring(7, 50); // Erste 50 Zeichen als Key
    }
  }

  // Fallback: IP-basiert (weniger zuverlässig)
  if (!userId) {
    userId =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "anonymous";
  }

  const result = checkRateLimit(userId, endpoint);

  if (!result.allowed) {
    throw rateLimitResponse(result.resetAt);
  }

  return result;
}
