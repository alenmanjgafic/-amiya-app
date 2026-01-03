/**
 * MCP SERVER - /api/mcp
 * Model Context Protocol Server für ElevenLabs Agent Tools
 *
 * Unterstützt SSE (Server-Sent Events) für Real-time Kommunikation
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tool Definitionen
const TOOLS = [
  {
    name: "get_topic_history",
    description: "Lädt vergangene Sessions zu einem bestimmten Thema. Nutze wenn User ein bekanntes Thema erwähnt wie Haushalt, Kommunikation, Kinder, etc.",
    inputSchema: {
      type: "object",
      properties: {
        theme: {
          type: "string",
          description: "Das Thema das gesucht werden soll, z.B. haushalt, kommunikation, kinder"
        }
      },
      required: ["theme"]
    }
  },
  {
    name: "check_statements",
    description: "Prüft auf Widersprüche zu früheren Aussagen. Nutze wenn User absolute Aussagen macht wie nie, immer, nichts, alles.",
    inputSchema: {
      type: "object",
      properties: {
        claim: {
          type: "string",
          description: "Die Aussage die geprüft werden soll"
        }
      },
      required: ["claim"]
    }
  },
  {
    name: "get_agreement_detail",
    description: "Lädt Details zu einer Vereinbarung. Nutze wenn User eine Vereinbarung erwähnt oder für Check-ins.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Der Name der Vereinbarung"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "save_insight",
    description: "Speichert wichtige Erkenntnisse sofort. Nutze bei Durchbruch-Momenten oder wenn User ein Muster erkennt.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Art der Erkenntnis: breakthrough, pattern, trigger, strength, need",
          enum: ["breakthrough", "pattern", "trigger", "strength", "need"]
        },
        content: {
          type: "string",
          description: "Die Erkenntnis als Text"
        }
      },
      required: ["content"]
    }
  }
];

/**
 * GET - SSE Endpoint für MCP
 */
export async function GET(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initMessage = {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "amiya-memory-tools",
            version: "1.0.0"
          },
          capabilities: {
            tools: {}
          }
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initMessage)}\n\n`));

      // Send tools list
      const toolsMessage = {
        jsonrpc: "2.0",
        method: "tools/list",
        result: {
          tools: TOOLS
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolsMessage)}\n\n`));
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/**
 * POST - Handle tool calls
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Log incoming request
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 MCP REQUEST:", JSON.stringify(body, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // MCP JSON-RPC format
    const { method, params, id } = body;

    // Handle different MCP methods
    if (method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "amiya-memory-tools",
            version: "1.0.0"
          },
          capabilities: {
            tools: {}
          }
        }
      });
    }

    if (method === "tools/list") {
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS
        }
      });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params;

      // Get context from request headers or params
      const userId = request.headers.get("x-user-id") || params.user_id || "";
      const coupleId = request.headers.get("x-couple-id") || params.couple_id || "";
      const sessionType = request.headers.get("x-session-type") || params.session_type || "solo";
      const sessionId = request.headers.get("x-session-id") || params.session_id || "";

      let result;

      console.log(`🔨 TOOL CALL: ${name}`);
      console.log(`   Args: ${JSON.stringify(args)}`);
      console.log(`   User: ${userId}, Couple: ${coupleId}, Type: ${sessionType}`);

      switch (name) {
        case "get_topic_history":
          result = await handleGetTopicHistory(args.theme, userId, coupleId, sessionType);
          break;
        case "check_statements":
          result = await handleCheckStatements(args.claim, userId, coupleId, sessionType);
          break;
        case "get_agreement_detail":
          result = await handleGetAgreementDetail(args.title, coupleId);
          break;
        case "save_insight":
          result = await handleSaveInsight(args.type, args.content, sessionId, userId);
          break;
        default:
          console.log(`❌ UNKNOWN TOOL: ${name}`);
          return Response.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`
            }
          });
      }

      const duration = Date.now() - startTime;
      console.log(`✅ TOOL RESULT (${duration}ms):`, JSON.stringify(result, null, 2));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return Response.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
    }

    // Unknown method
    return Response.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Unknown method: ${method}`
      }
    });

  } catch (error) {
    console.error("MCP error:", error);
    return Response.json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleGetTopicHistory(theme, userId, coupleId, sessionType) {
  if (!theme) {
    return { error: "theme required", sessions: [] };
  }

  let query = supabase
    .from("sessions")
    .select("id, type, themes, summary_for_coach, key_points, created_at")
    .eq("status", "completed")
    .not("summary_for_coach", "is", null)
    .contains("themes", [theme.toLowerCase()])
    .order("created_at", { ascending: false })
    .limit(5);

  // Privacy filter
  if (sessionType === "couple" && coupleId) {
    query = query.eq("couple_id", coupleId).eq("type", "couple");
  }

  const { data: sessions, error } = await query;

  if (error) {
    return { error: error.message, sessions: [] };
  }

  // Format for response
  const formattedSessions = (sessions || []).map(s => ({
    date: new Date(s.created_at).toLocaleDateString("de-DE"),
    type: s.type,
    summary: s.summary_for_coach,
    topic: s.key_points?.topic || null,
  }));

  return {
    theme,
    sessions: formattedSessions,
    count: formattedSessions.length,
  };
}

async function handleCheckStatements(claim, userId, coupleId, sessionType) {
  if (!claim) {
    return { error: "claim required", found_related: false };
  }

  const keywords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, type, key_points, created_at, user_id, couple_id")
    .eq("status", "completed")
    .not("key_points", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { error: error.message, found_related: false };
  }

  // Privacy filter
  let filteredSessions = sessions || [];
  if (sessionType === "couple" && coupleId) {
    filteredSessions = sessions.filter(s => s.type === "couple" && s.couple_id === coupleId);
  } else if (sessionType === "solo" && userId) {
    filteredSessions = sessions.filter(s =>
      (s.type === "solo" && s.user_id === userId) ||
      (s.type === "couple" && s.couple_id === coupleId)
    );
  }

  // Search for related statements
  const relatedStatements = [];
  for (const session of filteredSessions) {
    const statements = session.key_points?.statements || [];
    for (const statement of statements) {
      const hasKeyword = keywords.some(kw => statement.toLowerCase().includes(kw));
      if (hasKeyword) {
        relatedStatements.push({
          date: new Date(session.created_at).toLocaleDateString("de-DE"),
          said: statement,
        });
      }
    }
  }

  // Check for contradictions
  const opposites = { "nie": "immer", "immer": "nie", "nichts": "alles", "alles": "nichts" };
  let potentialContradiction = false;
  const claimLower = claim.toLowerCase();

  for (const [word, opposite] of Object.entries(opposites)) {
    if (claimLower.includes(word)) {
      potentialContradiction = relatedStatements.some(s => s.said.toLowerCase().includes(opposite));
      if (potentialContradiction) break;
    }
  }

  return {
    found_related: relatedStatements.length > 0,
    statements: relatedStatements.slice(0, 3),
    potential_contradiction: potentialContradiction,
  };
}

async function handleGetAgreementDetail(title, coupleId) {
  if (!coupleId) {
    return { error: "couple_id required", agreement: null };
  }

  const { data: agreements, error } = await supabase
    .from("agreements")
    .select("*")
    .eq("couple_id", coupleId)
    .in("status", ["active", "pending_approval", "achieved"]);

  if (error) {
    return { error: error.message, agreement: null };
  }

  // Find best match
  const searchLower = (title || "").toLowerCase();
  let bestMatch = (agreements || []).find(a =>
    a.title.toLowerCase().includes(searchLower) ||
    searchLower.includes(a.title.toLowerCase())
  );

  if (!bestMatch) {
    return {
      agreement: null,
      available: (agreements || []).map(a => a.title),
      message: `Keine Vereinbarung "${title}" gefunden`,
    };
  }

  return {
    agreement: {
      title: bestMatch.title,
      description: bestMatch.description,
      underlying_need: bestMatch.underlying_need,
      status: bestMatch.status,
      success_streak: bestMatch.success_streak,
      next_checkin_due: bestMatch.next_check_in_at ? new Date(bestMatch.next_check_in_at) <= new Date() : false,
    },
  };
}

async function handleSaveInsight(type, content, sessionId, userId) {
  if (!content || !sessionId) {
    return { saved: false, error: "content and session_id required" };
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("key_points")
    .eq("id", sessionId)
    .single();

  if (sessionError) {
    return { saved: false, error: "Session not found" };
  }

  const currentKeyPoints = session.key_points || {};
  const insights = currentKeyPoints.insights || [];

  insights.push({
    type: type || "general",
    content,
    saved_at: new Date().toISOString(),
  });

  const { error: updateError } = await supabase
    .from("sessions")
    .update({ key_points: { ...currentKeyPoints, insights } })
    .eq("id", sessionId);

  if (updateError) {
    return { saved: false, error: updateError.message };
  }

  return { saved: true, insight: { type: type || "general", content } };
}
