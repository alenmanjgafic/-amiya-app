/**
 * AGREEMENTS LIST COMPONENT - components/AgreementsList.js
 * Zeigt alle Agreements eines Couples an
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

export default function AgreementsList({ onSelectAgreement, onCreateNew }) {
  const { user, profile } = useAuth();
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
        return { text: "Deine Zustimmung nötig", color: "#f59e0b", bg: "#fef3c7" };
      }
      return { text: "Warte auf Partner", color: "#6b7280", bg: "#f3f4f6" };
    }
    if (agreement.status === "paused") {
      return { text: "Pausiert", color: "#6b7280", bg: "#f3f4f6" };
    }
    if (agreement.status === "achieved") {
      return { text: "Erreicht 🎉", color: "#10b981", bg: "#d1fae5" };
    }
    if (agreement.is_check_in_due) {
      return { text: "Check-in fällig", color: "#8b5cf6", bg: "#f3e8ff" };
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>💜 Eure Vereinbarungen</h3>
        <button onClick={onCreateNew} style={styles.addButton}>
          + Neue
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        {[
          { key: "active", label: "Aktiv" },
          { key: "achieved", label: "Erreicht" },
          { key: "all", label: "Alle" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              ...styles.filterTab,
              ...(filter === tab.key ? styles.filterTabActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Needs Approval Section */}
      {needsApproval.length > 0 && (
        <div style={styles.approvalSection}>
          <p style={styles.approvalTitle}>⚠️ Deine Zustimmung nötig</p>
          {needsApproval.map(agreement => (
            <div 
              key={agreement.id}
              style={styles.approvalCard}
              onClick={() => onSelectAgreement(agreement.id)}
            >
              <p style={styles.approvalText}>"{agreement.title}"</p>
              <span style={styles.approvalAction}>Ansehen →</span>
            </div>
          ))}
        </div>
      )}

      {/* Agreements List */}
      {otherAgreements.length === 0 && needsApproval.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📝</span>
          <p style={styles.emptyText}>
            {filter === "achieved" 
              ? "Noch keine erreichten Vereinbarungen"
              : "Noch keine Vereinbarungen"}
          </p>
          <p style={styles.emptyHint}>
            Vereinbarungen entstehen am besten in einer gemeinsamen Session
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {otherAgreements.map(agreement => {
            const badge = getStatusBadge(agreement);
            
            return (
              <div 
                key={agreement.id}
                style={styles.agreementCard}
                onClick={() => onSelectAgreement(agreement.id)}
              >
                <div style={styles.cardTop}>
                  <span style={styles.typeIcon}>{getTypeIcon(agreement.type)}</span>
                  <div style={styles.cardContent}>
                    <p style={styles.agreementTitle}>{agreement.title}</p>
                    {agreement.underlying_need && (
                      <p style={styles.underlyingNeed}>
                        {agreement.underlying_need}
                      </p>
                    )}
                  </div>
                  <span style={styles.arrow}>→</span>
                </div>
                
                <div style={styles.cardBottom}>
                  {badge && (
                    <span style={{
                      ...styles.badge,
                      color: badge.color,
                      background: badge.bg
                    }}>
                      {badge.text}
                    </span>
                  )}
                  
                  {agreement.success_streak >= 3 && (
                    <span style={styles.streak}>
                      🔥 {agreement.success_streak}x
                    </span>
                  )}
                  
                  {agreement.next_check_in_at && agreement.status === "active" && (
                    <span style={styles.checkInDate}>
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

const styles = {
  container: {
    marginBottom: "24px",
  },
  loadingContainer: {
    padding: "40px",
    display: "flex",
    justifyContent: "center",
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  addButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  filterTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  filterTab: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#6b7280",
    border: "none",
    borderRadius: "20px",
    fontSize: "13px",
    cursor: "pointer",
  },
  filterTabActive: {
    background: "#1f2937",
    color: "white",
  },
  approvalSection: {
    background: "#fef3c7",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
  },
  approvalTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#92400e",
    margin: "0 0 12px 0",
  },
  approvalCard: {
    background: "white",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "8px",
  },
  approvalText: {
    margin: 0,
    color: "#78350f",
    fontSize: "14px",
  },
  approvalAction: {
    color: "#f59e0b",
    fontSize: "14px",
    fontWeight: "500",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  agreementCard: {
    background: "white",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  typeIcon: {
    fontSize: "24px",
    lineHeight: "1",
  },
  cardContent: {
    flex: 1,
  },
  agreementTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 4px 0",
  },
  underlyingNeed: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
    fontStyle: "italic",
  },
  arrow: {
    color: "#9ca3af",
    fontSize: "18px",
  },
  cardBottom: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "12px",
    fontWeight: "500",
  },
  streak: {
    fontSize: "12px",
    color: "#f59e0b",
    fontWeight: "500",
  },
  checkInDate: {
    fontSize: "12px",
    color: "#9ca3af",
    marginLeft: "auto",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyIcon: {
    fontSize: "40px",
    display: "block",
    marginBottom: "12px",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: "15px",
    margin: "0 0 8px 0",
  },
  emptyHint: {
    color: "#9ca3af",
    fontSize: "13px",
    margin: 0,
  },
};
