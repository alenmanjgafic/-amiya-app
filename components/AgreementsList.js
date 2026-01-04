/**
 * AGREEMENTS LIST COMPONENT - components/AgreementsList.js
 * Zeigt alle Agreements eines Couples an
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function AgreementsList({ onSelectAgreement, onCreateNew }) {
  const { user, profile } = useAuth();
  const { tokens } = useTheme();
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
        return { style: tokens.badges.warning, text: "Deine Zustimmung notig" };
      }
      return { style: tokens.badges.muted, text: "Warte auf Partner" };
    }
    if (agreement.status === "paused") {
      return { style: tokens.badges.muted, text: "Pausiert" };
    }
    if (agreement.status === "achieved") {
      return { style: tokens.badges.success, text: "Erreicht" };
    }
    if (agreement.is_check_in_due) {
      return { style: tokens.badges.accent, text: "Check-in fallig" };
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

    if (diffDays < 0) return "Uberfallig";
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
        <div style={tokens.loaders.spinner(30)} />
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
        <h3 style={tokens.typography.h3}>Eure Vereinbarungen</h3>
        <button onClick={onCreateNew} style={tokens.buttons.primarySmall}>
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
            style={tokens.buttons.tab(filter === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Needs Approval Section */}
      {needsApproval.length > 0 && (
        <div style={{
          ...tokens.alerts.warning,
          marginBottom: "16px",
        }}>
          <p style={{
            ...tokens.alerts.warningText,
            fontSize: "14px",
            fontWeight: "600",
            margin: "0 0 12px 0",
          }}>&#9888;&#65039; Deine Zustimmung notig</p>
          {needsApproval.map(agreement => (
            <div
              key={agreement.id}
              style={{
                ...tokens.cards.elevated,
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
                ...tokens.alerts.warningText,
                margin: 0,
                fontSize: "14px",
              }}>"{agreement.title}"</p>
              <span style={{
                color: tokens.colors.warning,
                fontSize: "14px",
                fontWeight: "500",
              }}>Ansehen &#8594;</span>
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
          }}>&#128221;</span>
          <p style={{
            ...tokens.typography.body,
            marginBottom: "8px",
          }}>
            {filter === "achieved"
              ? "Noch keine erreichten Vereinbarungen"
              : "Noch keine Vereinbarungen"}
          </p>
          <p style={tokens.typography.small}>
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
                style={tokens.cards.interactive}
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
                        ...tokens.typography.small,
                        fontStyle: "italic",
                      }}>
                        {agreement.underlying_need}
                      </p>
                    )}
                  </div>
                  <span style={{
                    color: tokens.colors.text.muted,
                    fontSize: "18px",
                  }}>&#8594;</span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}>
                  {badge && (
                    <span style={badge.style}>
                      {badge.text}
                    </span>
                  )}

                  {agreement.success_streak >= 3 && (
                    <span style={{
                      fontSize: "12px",
                      color: tokens.colors.warning,
                      fontWeight: "500",
                    }}>
                      &#128293; {agreement.success_streak}x
                    </span>
                  )}

                  {agreement.next_check_in_at && agreement.status === "active" && (
                    <span style={{
                      ...tokens.typography.small,
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
