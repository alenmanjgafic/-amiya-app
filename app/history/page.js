/**
 * HISTORY PAGE - app/history/page.js
 * Session-Verlauf mit Filter für Solo und Couple Sessions
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import AnalysisView from "../../components/AnalysisView";

export default function HistoryPage() {
  const { user, profile, loading: authLoading } = useAuth();
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Verlauf</h1>
      </div>

      {/* Filters */}
      <div style={styles.filterContainer}>
        <button
          onClick={() => setFilter("all")}
          style={{
            ...styles.filterButton,
            ...(filter === "all" ? styles.filterButtonActive : {})
          }}
        >
          <span style={styles.filterIcon}>📋</span>
          Alle
        </button>
        <button
          onClick={() => setFilter("solo")}
          style={{
            ...styles.filterButton,
            ...(filter === "solo" ? styles.filterButtonActive : {})
          }}
        >
          <span style={styles.filterIcon}>👤</span>
          Solo
        </button>
        <button
          onClick={() => setFilter("couple")}
          style={{
            ...styles.filterButton,
            ...(filter === "couple" ? styles.filterButtonActive : {})
          }}
        >
          <span style={styles.filterIcon}>💑</span>
          Couple
        </button>
      </div>

      {/* Sessions List */}
      <div style={styles.content}>
        {filteredSessions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {filter === "all" 
                ? "Noch keine Sessions" 
                : filter === "solo"
                  ? "Noch keine Solo Sessions"
                  : "Noch keine Couple Sessions"
              }
            </p>
            <button
              onClick={() => router.push(filter === "couple" ? "/wir" : "/")}
              style={styles.emptyButton}
            >
              {filter === "couple" ? "Couple Session starten" : "Session starten"}
            </button>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              style={styles.sessionCard}
              onClick={() => setSelectedSession(session.id)}
            >
              <div style={styles.sessionBadge}>
                <span style={{
                  ...styles.badgeText,
                  background: session.type === "couple" ? "#fce7f3" : "#f3f4f6",
                  color: session.type === "couple" ? "#be185d" : "#374151"
                }}>
                  {session.type === "couple" ? "COUPLE SESSION" : "SOLO SESSION"}
                </span>
                <span style={styles.sessionDate}>{formatDate(session.created_at)}</span>
              </div>
              <h3 style={styles.sessionTitle}>{getSessionTitle(session)}</h3>
              <p style={styles.sessionPreview}>{getSessionPreview(session)}</p>
              
              {session.themes && session.themes.length > 0 && (
                <div style={styles.themesContainer}>
                  {session.themes.slice(0, 3).map((theme, i) => (
                    <span key={i} style={styles.themeTag}>{theme}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <button onClick={() => router.push("/")} style={styles.navItem}>
          <span style={styles.navIcon}>🏠</span>
          <span style={styles.navLabel}>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={styles.navItem}>
          <span style={styles.navIcon}>💑</span>
          <span style={styles.navLabel}>Wir</span>
        </button>
        <button style={{...styles.navItem, ...styles.navItemActive}}>
          <span style={styles.navIcon}>📋</span>
          <span style={{...styles.navLabel, ...styles.navLabelActive}}>Verlauf</span>
        </button>
        <button onClick={() => router.push("/profile")} style={styles.navItem}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>Profil</span>
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

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
    paddingBottom: "100px",
  },
  header: {
    padding: "24px 20px 16px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  filterContainer: {
    display: "flex",
    gap: "8px",
    padding: "0 20px 16px",
    overflowX: "auto",
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterButtonActive: {
    background: "#1f2937",
    borderColor: "#1f2937",
    color: "white",
  },
  filterIcon: {
    fontSize: "16px",
  },
  content: {
    padding: "0 20px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: "16px",
    marginBottom: "20px",
  },
  emptyButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sessionCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  sessionBadge: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  badgeText: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  sessionDate: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  sessionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#be185d",
    margin: "0 0 8px 0",
    lineHeight: "1.4",
  },
  sessionPreview: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
    lineHeight: "1.5",
  },
  themesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "12px",
  },
  themeTag: {
    fontSize: "12px",
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    padding: "12px 0 24px 0",
  },
  navItem: {
    background: "none",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    padding: "8px 16px",
  },
  navItemActive: {},
  navIcon: {
    fontSize: "24px",
  },
  navLabel: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  navLabelActive: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
};
