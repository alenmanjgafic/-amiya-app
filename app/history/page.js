/**
 * HISTORY PAGE - app/history/page.js
 * Session-Verlauf mit Filter für Solo und Couple Sessions
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { supabase } from "../../lib/supabase";
import AnalysisView from "../../components/AnalysisView";
import {
  Home,
  Heart,
  ClipboardList,
  User,
  Users,
  LayoutList,
  Plus
} from "lucide-react";

export default function HistoryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "solo", "couple"
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Check for session parameter in URL
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId) {
      setSelectedSession(sessionId);
    }
  }, [searchParams]);

  // Fetch sessions
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      // Fetch user's solo sessions
      const { data: soloSessions, error: soloError } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (soloError) throw soloError;

      // If user has couple_id, also fetch couple sessions
      let coupleSessions = [];
      if (profile?.couple_id) {
        const { data: coupleData, error: coupleError } = await supabase
          .from("sessions")
          .select("*")
          .eq("couple_id", profile.couple_id)
          .eq("type", "couple")
          .order("created_at", { ascending: false });

        if (!coupleError && coupleData) {
          coupleSessions = coupleData;
        }
      }

      // Merge and sort by date
      const allSessions = [...soloSessions, ...coupleSessions]
        .filter((session, index, self) =>
          index === self.findIndex(s => s.id === session.id)
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setSessions(allSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (date.toDateString() === now.toDateString()) {
      return `Heute um ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Gestern um ${timeStr}`;
    } else {
      return date.toLocaleDateString("de-CH", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
      }) + ` um ${timeStr}`;
    }
  };

  const getSessionTitle = (session) => {
    if (session.analysis) {
      // Extract first line or meaningful title from analysis
      const firstLine = session.analysis.split("\n")[0];
      if (firstLine && firstLine.length > 10) {
        return firstLine.substring(0, 50) + (firstLine.length > 50 ? "..." : "");
      }
    }
    return session.type === "couple" ? "Gemeinsame Session" : "Solo Session";
  };

  const getSessionPreview = (session) => {
    if (session.analysis) {
      // Get text after first line
      const lines = session.analysis.split("\n").filter(l => l.trim());
      if (lines.length > 1) {
        return lines[1].substring(0, 100) + (lines[1].length > 100 ? "..." : "");
      }
    }
    return "Keine Analyse verfügbar";
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === "all") return true;
    if (filter === "solo") return session.type === "solo" || !session.type;
    if (filter === "couple") return session.type === "couple";
    return true;
  });

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ color: tokens.colors.text.secondary }}>Laden...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.colors.bg.deep,
      paddingBottom: "100px",
      transition: "background 0.3s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 20px 16px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: tokens.colors.text.primary,
          margin: 0,
          fontFamily: tokens.fonts.display,
        }}>Verlauf</h1>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "0 20px 16px",
        overflowX: "auto",
      }}>
        {[
          { key: "all", Icon: LayoutList, label: "Alle" },
          { key: "solo", Icon: User, label: "Solo" },
          { key: "couple", Icon: Users, label: "Couple" },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: filter === key
                ? tokens.colors.text.primary
                : tokens.colors.bg.elevated,
              border: `2px solid ${filter === key ? tokens.colors.text.primary : tokens.colors.bg.soft}`,
              borderRadius: tokens.radii.pill,
              fontSize: "14px",
              fontWeight: "500",
              color: filter === key ? (isDarkMode ? "#1a1d23" : "white") : tokens.colors.text.secondary,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div style={{ padding: "0 20px" }}>
        {filteredSessions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
          }}>
            <p style={{
              color: tokens.colors.text.muted,
              fontSize: "16px",
              marginBottom: "20px",
            }}>
              {filter === "all"
                ? "Noch keine Sessions"
                : filter === "solo"
                  ? "Noch keine Solo Sessions"
                  : "Noch keine Couple Sessions"
              }
            </p>
            <button
              onClick={() => router.push(filter === "couple" ? "/wir" : "/")}
              style={{
                padding: "14px 28px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {filter === "couple" ? "Couple Session starten" : "Session starten"}
            </button>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              style={{
                background: tokens.colors.bg.elevated,
                borderRadius: tokens.radii.lg,
                padding: "20px",
                marginBottom: "12px",
                boxShadow: tokens.shadows.soft,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onClick={() => setSelectedSession(session.id)}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  letterSpacing: "0.5px",
                  background: session.type === "couple"
                    ? (isDarkMode ? "rgba(249, 168, 212, 0.2)" : "#fce7f3")
                    : tokens.colors.bg.surface,
                  color: session.type === "couple"
                    ? tokens.colors.aurora.rose
                    : tokens.colors.text.secondary,
                }}>
                  {session.type === "couple" ? "COUPLE SESSION" : "SOLO SESSION"}
                </span>
                <span style={{
                  fontSize: "12px",
                  color: tokens.colors.text.muted,
                }}>{formatDate(session.created_at)}</span>
              </div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: tokens.colors.aurora.rose,
                margin: "0 0 8px 0",
                lineHeight: "1.4",
              }}>{getSessionTitle(session)}</h3>
              <p style={{
                fontSize: "14px",
                color: tokens.colors.text.secondary,
                margin: 0,
                lineHeight: "1.5",
              }}>{getSessionPreview(session)}</p>

              {session.themes && session.themes.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "12px",
                }}>
                  {session.themes.slice(0, 3).map((theme, i) => (
                    <span key={i} style={{
                      fontSize: "12px",
                      background: tokens.colors.bg.surface,
                      color: tokens.colors.text.secondary,
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}>{theme}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: tokens.colors.bg.elevated,
        borderTop: `1px solid ${tokens.colors.bg.soft}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0 24px 0",
      }}>
        <button onClick={() => router.push("/")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <Home size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <Heart size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Wir</span>
        </button>
        <button style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <ClipboardList size={24} color={tokens.colors.aurora.lavender} />
          <span style={{
            fontSize: "12px",
            color: tokens.colors.aurora.lavender,
            fontWeight: "600",
          }}>Verlauf</span>
        </button>
        <button onClick={() => router.push("/profile")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <User size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Profil</span>
        </button>
      </div>

      {/* Analysis Modal */}
      {selectedSession && (
        <AnalysisView
          sessionId={selectedSession}
          onClose={() => {
            setSelectedSession(null);
            // Remove session param from URL
            router.replace("/history");
          }}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// All styles now use theme tokens inline
