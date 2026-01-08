/**
 * AGREEMENTS LIST COMPONENT - components/AgreementsList.js
 * Zeigt alle Agreements eines Couples an
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import { Clock, ChevronRight, Plus } from "lucide-react";

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

  // Empty state - stacked card style
  if (agreements.length === 0) {
    return (
      <div style={{ marginBottom: "24px" }}>
        {/* Stacked Image */}
        <div style={{
          position: "relative",
          height: "140px",
          marginBottom: "16px",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <Image
            src="/images/agreements-01.jpg"
            alt="Vereinbarungen"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Title + Subtitle */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: tokens.colors.text.primary,
            margin: 0,
            marginBottom: "4px",
          }}>Eure Vereinbarungen</h3>
          <p style={{
            fontSize: "14px",
            color: tokens.colors.text.muted,
            margin: 0,
          }}>Gemeinsame Abmachungen</p>
        </div>

        {/* Empty message with button */}
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.text.muted,
          textAlign: "center",
          margin: "0 0 16px 0",
        }}>
          Noch keine Vereinbarungen
        </p>
        <button onClick={onCreateNew} style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          width: "100%",
          padding: "14px 16px",
          background: tokens.colors.aurora.lavender,
          color: "white",
          border: "none",
          borderRadius: tokens.radii.md,
          fontSize: "15px",
          fontWeight: "500",
          cursor: "pointer",
        }}>
          Vereinbarung erstellen
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Stacked Image */}
      <div style={{
        position: "relative",
        height: "140px",
        marginBottom: "16px",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <Image
          src="/images/agreements-01.jpg"
          alt="Vereinbarungen"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Title + Subtitle + Button */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <div>
          <h3 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: tokens.colors.text.primary,
            margin: 0,
            marginBottom: "4px",
          }}>Eure Vereinbarungen</h3>
          <p style={{
            fontSize: "14px",
            color: tokens.colors.text.muted,
            margin: 0,
          }}>{agreements.length} Abmachung{agreements.length !== 1 ? "en" : ""}</p>
        </div>
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
          padding: "16px",
          marginBottom: "16px",
          background: tokens.isDarkMode ? "rgba(167, 139, 250, 0.1)" : "rgba(167, 139, 250, 0.08)",
          borderRadius: tokens.radii.lg,
          borderLeft: `4px solid ${tokens.colors.aurora.lavender}`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: tokens.radii.md,
              background: tokens.colors.aurora.lavender,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Clock size={16} color="white" />
            </div>
            <p style={{
              fontSize: "14px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
              margin: 0,
            }}>Deine Zustimmung notig</p>
          </div>
          {needsApproval.map((agreement, index) => (
            <div
              key={agreement.id}
              style={{
                ...tokens.cards.surface,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                marginBottom: index < needsApproval.length - 1 ? "8px" : 0,
              }}
              onClick={() => onSelectAgreement(agreement.id)}
            >
              <p style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "500",
                color: tokens.colors.text.primary,
              }}>"{agreement.title}"</p>
              <ChevronRight size={18} color={tokens.colors.aurora.lavender} />
            </div>
          ))}
        </div>
      )}

      {/* Agreements List */}
      {otherAgreements.length > 0 && (
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
