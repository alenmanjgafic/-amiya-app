/**
 * AGREEMENTS LIST COMPONENT - components/AgreementsList.js
 * Zeigt alle Agreements eines Couples an
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function AgreementsList({ onSelectAgreement, onCreateNew }) {
  const { user, profile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active, achieved, all

  useEffect(() => {
    if (profile?.couple_id) {
      loadAgreements();
    }
  }, [profile?.couple_id, filter]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const statusParam = filter === "all" ? "" : `&status=${filter}`;
      const response = await fetch(
        `/api/agreements?coupleId=${profile.couple_id}${statusParam}`
      );
      const data = await response.json();

      if (data.agreements) {
        setAgreements(data.agreements);
      }
    } catch (error) {
      console.error("Failed to load agreements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (agreement) => {
    if (agreement.status === "pending_approval") {
      const needsMyApproval = !agreement.approved_by?.includes(user?.id);
      if (needsMyApproval) {
        return {
          text: "Deine Zustimmung nötig",
          color: isDarkMode ? "#fbbf24" : "#f59e0b",
          bg: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#fef3c7"
        };
      }
      return {
        text: "Warte auf Partner",
        color: tokens.colors.text.muted,
        bg: tokens.colors.bg.surface
      };
    }
    if (agreement.status === "paused") {
      return {
        text: "Pausiert",
        color: tokens.colors.text.muted,
        bg: tokens.colors.bg.surface
      };
    }
    if (agreement.status === "achieved") {
      return {
        text: "Erreicht",
        color: tokens.colors.success,
        bg: isDarkMode ? "rgba(52, 211, 153, 0.15)" : "#d1fae5"
      };
    }
    if (agreement.is_check_in_due) {
      return {
        text: "Check-in fällig",
        color: tokens.colors.aurora.lavender,
        bg: isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f3e8ff"
      };
    }
    return null;
  };

  const getTypeIcon = (type) => {
    const icons = {
      behavior: "🎯",
      communication: "💬",
      ritual: "🔄",
      experiment: "🧪"
    };
    return icons[type] || "📝";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Überfällig";
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays <= 7) return `In ${diffDays} Tagen`;
    return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        display: "flex",
        justifyContent: "center",
      }}>
        <div style={{
          width: "30px",
          height: "30px",
          border: `3px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  // Separate pending approvals that need user action
  const needsApproval = agreements.filter(a =>
    a.status === "pending_approval" && !a.approved_by?.includes(user?.id)
  );
  const otherAgreements = agreements.filter(a =>
    !(a.status === "pending_approval" && !a.approved_by?.includes(user?.id))
  );

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: tokens.colors.text.primary,
          margin: 0,
          fontFamily: tokens.fonts.display,
        }}>Eure Vereinbarungen</h3>
        <button onClick={onCreateNew} style={{
          padding: "8px 16px",
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
          color: "white",
          border: "none",
          borderRadius: tokens.radii.sm,
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          fontFamily: tokens.fonts.body,
        }}>
          + Neue
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
      }}>
        {[
          { key: "active", label: "Aktiv" },
          { key: "achieved", label: "Erreicht" },
          { key: "all", label: "Alle" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "8px 16px",
              background: filter === tab.key
                ? tokens.colors.text.primary
                : tokens.colors.bg.surface,
              color: filter === tab.key
                ? (isDarkMode ? "#1a1d23" : "white")
                : tokens.colors.text.muted,
              border: "none",
              borderRadius: tokens.radii.pill,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: tokens.fonts.body,
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Needs Approval Section */}
      {needsApproval.length > 0 && (
        <div style={{
          background: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
          borderRadius: tokens.radii.md,
          padding: "16px",
          marginBottom: "16px",
          border: `1px solid ${isDarkMode ? "rgba(251, 191, 36, 0.3)" : "#fcd34d"}`,
        }}>
          <p style={{
            fontSize: "14px",
            fontWeight: "600",
            color: isDarkMode ? "#fbbf24" : "#92400e",
            margin: "0 0 12px 0",
          }}>⚠️ Deine Zustimmung nötig</p>
          {needsApproval.map(agreement => (
            <div
              key={agreement.id}
              style={{
                background: isDarkMode ? tokens.colors.bg.surface : "white",
                borderRadius: tokens.radii.sm,
                padding: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                marginBottom: "8px",
              }}
              onClick={() => onSelectAgreement(agreement.id)}
            >
              <p style={{
                margin: 0,
                color: isDarkMode ? "#fcd34d" : "#78350f",
                fontSize: "14px",
              }}>"{agreement.title}"</p>
              <span style={{
                color: "#f59e0b",
                fontSize: "14px",
                fontWeight: "500",
              }}>Ansehen →</span>
            </div>
          ))}
        </div>
      )}

      {/* Agreements List */}
      {otherAgreements.length === 0 && needsApproval.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
        }}>
          <span style={{
            fontSize: "40px",
            display: "block",
            marginBottom: "12px",
          }}>📝</span>
          <p style={{
            color: tokens.colors.text.secondary,
            fontSize: "15px",
            margin: "0 0 8px 0",
          }}>
            {filter === "achieved"
              ? "Noch keine erreichten Vereinbarungen"
              : "Noch keine Vereinbarungen"}
          </p>
          <p style={{
            color: tokens.colors.text.muted,
            fontSize: "13px",
            margin: 0,
          }}>
            Vereinbarungen entstehen am besten in einer gemeinsamen Session
          </p>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          {otherAgreements.map(agreement => {
            const badge = getStatusBadge(agreement);

            return (
              <div
                key={agreement.id}
                style={{
                  background: tokens.colors.bg.elevated,
                  borderRadius: tokens.radii.lg,
                  padding: "16px",
                  boxShadow: tokens.shadows.soft,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onClick={() => onSelectAgreement(agreement.id)}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}>
                  <span style={{
                    fontSize: "24px",
                    lineHeight: "1",
                  }}>{getTypeIcon(agreement.type)}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                      margin: "0 0 4px 0",
                    }}>{agreement.title}</p>
                    {agreement.underlying_need && (
                      <p style={{
                        fontSize: "13px",
                        color: tokens.colors.text.muted,
                        margin: 0,
                        fontStyle: "italic",
                      }}>
                        {agreement.underlying_need}
                      </p>
                    )}
                  </div>
                  <span style={{
                    color: tokens.colors.text.muted,
                    fontSize: "18px",
                  }}>→</span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}>
                  {badge && (
                    <span style={{
                      fontSize: "12px",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontWeight: "500",
                      color: badge.color,
                      background: badge.bg,
                    }}>
                      {badge.text}
                    </span>
                  )}

                  {agreement.success_streak >= 3 && (
                    <span style={{
                      fontSize: "12px",
                      color: "#f59e0b",
                      fontWeight: "500",
                    }}>
                      🔥 {agreement.success_streak}x
                    </span>
                  )}

                  {agreement.next_check_in_at && agreement.status === "active" && (
                    <span style={{
                      fontSize: "12px",
                      color: tokens.colors.text.muted,
                      marginLeft: "auto",
                    }}>
                      Check-in: {formatDate(agreement.next_check_in_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
