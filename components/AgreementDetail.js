/**
 * AGREEMENT DETAIL COMPONENT - components/AgreementDetail.js
 * Zeigt Details einer Vereinbarung mit Check-in Möglichkeit
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

export default function AgreementDetail({ agreementId, onClose, onUpdate }) {
  const { user, profile } = useAuth();
  const [agreement, setAgreement] = useState(null);
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Check-in form state
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatWasHard, setWhatWasHard] = useState("");
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  useEffect(() => {
    loadAgreement();
  }, [agreementId]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agreements/${agreementId}`);
      const data = await response.json();
      
      if (data.agreement) {
        setAgreement(data.agreement);
        setCouple(data.couple);
      }
    } catch (error) {
      console.error("Failed to load agreement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", userId: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        setAgreement(data.agreement);
        onUpdate?.();
      }
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action, extraData = {}) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id, ...extraData }),
      });
      const data = await response.json();
      if (data.success) {
        setAgreement(data.agreement);
        setShowActions(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInStatus) return;
    
    setSavingCheckIn(true);
    try {
      const response = await fetch(`/api/agreements/${agreementId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          status: checkInStatus,
          whatWorked: whatWorked || null,
          whatWasHard: whatWasHard || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Reload agreement to get updated data
        await loadAgreement();
        setShowCheckIn(false);
        setCheckInStatus(null);
        setWhatWorked("");
        setWhatWasHard("");
        onUpdate?.();
      }
    } catch (error) {
      console.error("Check-in failed:", error);
    } finally {
      setSavingCheckIn(false);
    }
  };

  const getResponsibleName = () => {
    if (!agreement?.responsible_user_id) return "Beide";
    if (agreement.responsible_user_id === couple?.userA?.id) return couple.userA.name;
    if (agreement.responsible_user_id === couple?.userB?.id) return couple.userB.name;
    return "Unbekannt";
  };

  const needsMyApproval = agreement?.status === "pending_approval" && 
    !agreement?.approved_by?.includes(user?.id);

  const isCheckInDue = agreement?.next_check_in_at && 
    new Date(agreement.next_check_in_at) <= new Date();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const checkInOptions = [
    { value: "good", emoji: "💚", label: "Gut gelaufen", desc: "Hat funktioniert wie geplant" },
    { value: "partial", emoji: "💛", label: "Teils geklappt", desc: "Manchmal ja, manchmal nein" },
    { value: "difficult", emoji: "🧡", label: "War schwierig", desc: "Braucht mehr Übung" },
    { value: "needs_change", emoji: "❤️", label: "Braucht Anpassung", desc: "So funktioniert es nicht" },
  ];

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <p>Vereinbarung nicht gefunden</p>
          <button onClick={onClose} style={styles.closeBtn}>Schliessen</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onClose} style={styles.backButton}>← Zurück</button>
          <button onClick={() => setShowActions(!showActions)} style={styles.moreButton}>⋯</button>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div style={styles.actionsMenu}>
            {agreement.status === "active" && (
              <button 
                onClick={() => handleAction("pause")}
                style={styles.actionItem}
                disabled={actionLoading}
              >
                ⏸️ Pausieren
              </button>
            )}
            {agreement.status === "paused" && (
              <button 
                onClick={() => handleAction("resume")}
                style={styles.actionItem}
                disabled={actionLoading}
              >
                ▶️ Fortsetzen
              </button>
            )}
            {agreement.status === "active" && (
              <button 
                onClick={() => handleAction("achieve")}
                style={styles.actionItem}
                disabled={actionLoading}
              >
                🎉 Als erreicht markieren
              </button>
            )}
            <button 
              onClick={() => handleAction("archive")}
              style={{...styles.actionItem, color: "#dc2626"}}
              disabled={actionLoading}
            >
              🗑️ Archivieren
            </button>
          </div>
        )}

        {/* Status Banner */}
        {needsMyApproval && (
          <div style={styles.approvalBanner}>
            <p style={styles.bannerText}>
              {profile?.partner_name || "Dein Partner"} hat diese Vereinbarung vorgeschlagen
            </p>
            <div style={styles.bannerActions}>
              <button 
                onClick={handleApprove}
                style={styles.approveButton}
                disabled={actionLoading}
              >
                ✓ Zustimmen
              </button>
              <button 
                onClick={() => handleAction("archive")}
                style={styles.declineButton}
                disabled={actionLoading}
              >
                Ablehnen
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={styles.content}>
          <h2 style={styles.title}>{agreement.title}</h2>
          
          {agreement.underlying_need && (
            <div style={styles.needBox}>
              <span style={styles.needLabel}>💜 Warum es wichtig ist</span>
              <p style={styles.needText}>{agreement.underlying_need}</p>
            </div>
          )}

          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Verantwortlich</span>
              <span style={styles.metaValue}>{getResponsibleName()}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Status</span>
              <span style={{
                ...styles.metaValue,
                color: agreement.status === "active" ? "#10b981" : "#6b7280"
              }}>
                {agreement.status === "active" ? "Aktiv" : 
                 agreement.status === "paused" ? "Pausiert" :
                 agreement.status === "achieved" ? "Erreicht 🎉" :
                 agreement.status === "pending_approval" ? "Warte auf Zustimmung" :
                 agreement.status}
              </span>
            </div>
          </div>

          {/* Success Streak */}
          {agreement.success_streak > 0 && (
            <div style={styles.streakBox}>
              <span style={styles.streakEmoji}>🔥</span>
              <span style={styles.streakText}>
                {agreement.success_streak} erfolgreiche Check-ins in Folge
              </span>
            </div>
          )}

          {/* Check-in Due */}
          {isCheckInDue && agreement.status === "active" && !showCheckIn && (
            <div style={styles.checkInDueBanner}>
              <p style={styles.dueBannerText}>Check-in fällig!</p>
              <button 
                onClick={() => setShowCheckIn(true)}
                style={styles.checkInButton}
              >
                Jetzt einchecken
              </button>
            </div>
          )}

          {/* Check-in Form */}
          {showCheckIn && (
            <div style={styles.checkInForm}>
              <h3 style={styles.checkInTitle}>Wie läuft es?</h3>
              
              <div style={styles.statusOptions}>
                {checkInOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setCheckInStatus(option.value)}
                    style={{
                      ...styles.statusOption,
                      ...(checkInStatus === option.value ? styles.statusOptionSelected : {})
                    }}
                  >
                    <span style={styles.statusEmoji}>{option.emoji}</span>
                    <span style={styles.statusLabel}>{option.label}</span>
                    <span style={styles.statusDesc}>{option.desc}</span>
                  </button>
                ))}
              </div>

              {checkInStatus && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Was hat gut funktioniert? (optional)</label>
                    <textarea
                      value={whatWorked}
                      onChange={(e) => setWhatWorked(e.target.value)}
                      style={styles.textarea}
                      placeholder="z.B. Der Reminder im Auto hat geholfen..."
                    />
                  </div>

                  {(checkInStatus === "difficult" || checkInStatus === "needs_change") && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Was war schwierig?</label>
                      <textarea
                        value={whatWasHard}
                        onChange={(e) => setWhatWasHard(e.target.value)}
                        style={styles.textarea}
                        placeholder="z.B. Im Stress vergesse ich es..."
                      />
                    </div>
                  )}

                  <div style={styles.checkInActions}>
                    <button 
                      onClick={() => setShowCheckIn(false)}
                      style={styles.cancelBtn}
                    >
                      Abbrechen
                    </button>
                    <button 
                      onClick={handleCheckIn}
                      style={styles.submitCheckIn}
                      disabled={savingCheckIn}
                    >
                      {savingCheckIn ? "Speichern..." : "Check-in speichern"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Check-in History */}
          {agreement.checkins?.length > 0 && (
            <div style={styles.historySection}>
              <h3 style={styles.historyTitle}>📊 Verlauf</h3>
              {agreement.checkins.slice(0, 5).map((checkin, i) => (
                <div key={checkin.id || i} style={styles.historyItem}>
                  <span style={styles.historyEmoji}>
                    {checkin.status === "good" ? "💚" :
                     checkin.status === "partial" ? "💛" :
                     checkin.status === "difficult" ? "🧡" : "❤️"}
                  </span>
                  <div style={styles.historyContent}>
                    <span style={styles.historyDate}>
                      {formatDate(checkin.created_at)}
                    </span>
                    {checkin.what_worked && (
                      <p style={styles.historyNote}>✓ {checkin.what_worked}</p>
                    )}
                    {checkin.what_was_hard && (
                      <p style={styles.historyNote}>△ {checkin.what_was_hard}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Check-in */}
          {agreement.next_check_in_at && agreement.status === "active" && (
            <p style={styles.nextCheckIn}>
              Nächster Check-in: {formatDate(agreement.next_check_in_at)}
            </p>
          )}
        </div>

        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    overflowY: "auto",
  },
  card: {
    background: "white",
    borderRadius: "24px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  loadingContainer: {
    padding: "60px",
    display: "flex",
    justifyContent: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#6b7280",
    cursor: "pointer",
  },
  moreButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#6b7280",
    cursor: "pointer",
  },
  actionsMenu: {
    background: "#f9fafb",
    padding: "8px",
    borderBottom: "1px solid #e5e7eb",
  },
  actionItem: {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    background: "white",
    border: "none",
    borderRadius: "8px",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "4px",
  },
  approvalBanner: {
    background: "#fef3c7",
    padding: "16px 20px",
  },
  bannerText: {
    margin: "0 0 12px 0",
    color: "#92400e",
    fontSize: "14px",
  },
  bannerActions: {
    display: "flex",
    gap: "10px",
  },
  approveButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  declineButton: {
    padding: "10px 20px",
    background: "transparent",
    color: "#92400e",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  content: {
    padding: "24px 20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 16px 0",
  },
  needBox: {
    background: "#f5f3ff",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
  },
  needLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#7c3aed",
    display: "block",
    marginBottom: "6px",
  },
  needText: {
    margin: 0,
    color: "#4c1d95",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  metaRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    display: "block",
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "4px",
  },
  metaValue: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#1f2937",
  },
  streakBox: {
    background: "#fef3c7",
    borderRadius: "10px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  streakEmoji: {
    fontSize: "24px",
  },
  streakText: {
    color: "#92400e",
    fontSize: "14px",
    fontWeight: "500",
  },
  checkInDueBanner: {
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
  },
  dueBannerText: {
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 12px 0",
  },
  checkInButton: {
    padding: "12px 24px",
    background: "white",
    color: "#8b5cf6",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  checkInForm: {
    background: "#f9fafb",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
  },
  checkInTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 16px 0",
  },
  statusOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  statusOption: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  statusOptionSelected: {
    borderColor: "#8b5cf6",
    background: "#f5f3ff",
  },
  statusEmoji: {
    fontSize: "24px",
  },
  statusLabel: {
    fontWeight: "600",
    color: "#1f2937",
    fontSize: "15px",
  },
  statusDesc: {
    fontSize: "13px",
    color: "#6b7280",
    marginLeft: "auto",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    fontSize: "15px",
    minHeight: "80px",
    resize: "vertical",
    outline: "none",
  },
  checkInActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "transparent",
    color: "#6b7280",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  submitCheckIn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  historySection: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  historyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 16px 0",
  },
  historyItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  historyEmoji: {
    fontSize: "20px",
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: "13px",
    color: "#6b7280",
  },
  historyNote: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#4b5563",
  },
  nextCheckIn: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "13px",
    marginTop: "20px",
  },
  closeBtn: {
    padding: "12px 24px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};
