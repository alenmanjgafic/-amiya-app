/**
 * HISTORY PAGE - app/history/page.js
 * Session-Verlauf mit Filter für Solo und Couple Sessions
 * Migrated to use Design System tokens from ThemeContext
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { supabase } from "../../lib/supabase";
import AnalysisView from "../../components/AnalysisView";
import {
  Home as HomeIcon,
  Heart,
  ClipboardList,
  User,
  Users,
  LayoutList,
} from "lucide-react";

export default function HistoryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
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
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      ...tokens.layout.page,
      paddingBottom: "100px",
      padding: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 20px 16px",
        textAlign: "center",
      }}>
        <h1 style={{
          ...tokens.typography.h1,
          margin: 0,
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
              ...tokens.buttons.tab(filter === key),
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              whiteSpace: "nowrap",
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
              ...tokens.typography.body,
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
              style={tokens.buttons.primary}
            >
              {filter === "couple" ? "Couple Session starten" : "Session starten"}
            </button>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              style={{
                ...tokens.cards.interactive,
                padding: "20px",
                marginBottom: "12px",
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
                  ...tokens.typography.label,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: session.type === "couple"
                    ? (tokens.isDarkMode ? "rgba(249, 168, 212, 0.2)" : "#fce7f3")
                    : tokens.colors.bg.surface,
                  color: session.type === "couple"
                    ? tokens.colors.aurora.rose
                    : tokens.colors.text.secondary,
                }}>
                  {session.type === "couple" ? "COUPLE SESSION" : "SOLO SESSION"}
                </span>
                <span style={tokens.typography.small}>{formatDate(session.created_at)}</span>
              </div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: tokens.colors.aurora.rose,
                margin: "0 0 8px 0",
                lineHeight: "1.4",
              }}>{getSessionTitle(session)}</h3>
              <p style={tokens.typography.body}>{getSessionPreview(session)}</p>

              {session.themes && session.themes.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "12px",
                }}>
                  {session.themes.slice(0, 3).map((theme, i) => (
                    <span key={i} style={tokens.badges.muted}>{theme}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={tokens.layout.navBar}>
        <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
          <HomeIcon size={24} />
          <span>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
          <Heart size={24} />
          <span>Wir</span>
        </button>
        <button style={tokens.buttons.nav(true)}>
          <ClipboardList size={24} />
          <span>Verlauf</span>
        </button>
        <button onClick={() => router.push("/profile")} style={tokens.buttons.nav(false)}>
          <User size={24} />
          <span>Profil</span>
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
