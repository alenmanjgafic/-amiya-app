/**
 * AGREEMENT DETAIL COMPONENT - components/AgreementDetail.js
 * Zeigt Details einer Vereinbarung mit Check-in Möglichkeit
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function AgreementDetail({ agreementId, onClose, onUpdate }) {
  const { user, profile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
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
      <div style={{
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
      }}>
        <div style={{
          background: tokens.colors.bg.elevated,
          borderRadius: tokens.radii.xl,
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: tokens.shadows.large,
        }}>
          <div style={{
            padding: "60px",
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: `4px solid ${tokens.colors.bg.soft}`,
              borderTopColor: tokens.colors.aurora.lavender,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div style={{
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
      }}>
        <div style={{
          background: tokens.colors.bg.elevated,
          borderRadius: tokens.radii.xl,
          maxWidth: "500px",
          width: "100%",
          padding: "32px",
          textAlign: "center",
          boxShadow: tokens.shadows.large,
        }}>
          <p style={{ color: tokens.colors.text.secondary }}>Vereinbarung nicht gefunden</p>
          <button onClick={onClose} style={{
            padding: "12px 24px",
            background: tokens.colors.bg.surface,
            color: tokens.colors.text.primary,
            border: "none",
            borderRadius: tokens.radii.md,
            cursor: "pointer",
            marginTop: "16px",
            fontFamily: tokens.fonts.body,
          }}>Schliessen</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
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
    }}>
      <div style={{
        background: tokens.colors.bg.elevated,
        borderRadius: tokens.radii.xl,
        maxWidth: "500px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: tokens.shadows.large,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: `1px solid ${tokens.colors.bg.soft}`,
        }}>
          <button onClick={onClose} style={{
            background: "none",
            border: "none",
            fontSize: "16px",
            color: tokens.colors.text.muted,
            cursor: "pointer",
            fontFamily: tokens.fonts.body,
          }}>← Zurück</button>
          <button onClick={() => setShowActions(!showActions)} style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            color: tokens.colors.text.muted,
            cursor: "pointer",
          }}>⋯</button>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div style={{
            background: tokens.colors.bg.surface,
            padding: "8px",
            borderBottom: `1px solid ${tokens.colors.bg.soft}`,
          }}>
            {agreement.status === "active" && (
              <button
                onClick={() => handleAction("pause")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  background: tokens.colors.bg.elevated,
                  border: "none",
                  borderRadius: tokens.radii.sm,
                  textAlign: "left",
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  cursor: "pointer",
                  marginBottom: "4px",
                  fontFamily: tokens.fonts.body,
                }}
                disabled={actionLoading}
              >
                ⏸️ Pausieren
              </button>
            )}
            {agreement.status === "paused" && (
              <button
                onClick={() => handleAction("resume")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  background: tokens.colors.bg.elevated,
                  border: "none",
                  borderRadius: tokens.radii.sm,
                  textAlign: "left",
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  cursor: "pointer",
                  marginBottom: "4px",
                  fontFamily: tokens.fonts.body,
                }}
                disabled={actionLoading}
              >
                ▶️ Fortsetzen
              </button>
            )}
            {agreement.status === "active" && (
              <button
                onClick={() => handleAction("achieve")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  background: tokens.colors.bg.elevated,
                  border: "none",
                  borderRadius: tokens.radii.sm,
                  textAlign: "left",
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  cursor: "pointer",
                  marginBottom: "4px",
                  fontFamily: tokens.fonts.body,
                }}
                disabled={actionLoading}
              >
                🎉 Als erreicht markieren
              </button>
            )}
            <button
              onClick={() => handleAction("archive")}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                background: tokens.colors.bg.elevated,
                border: "none",
                borderRadius: tokens.radii.sm,
                textAlign: "left",
                fontSize: "14px",
                color: tokens.colors.error,
                cursor: "pointer",
                fontFamily: tokens.fonts.body,
              }}
              disabled={actionLoading}
            >
              🗑️ Archivieren
            </button>
          </div>
        )}

        {/* Status Banner */}
        {needsMyApproval && (
          <div style={{
            background: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
            padding: "16px 20px",
          }}>
            <p style={{
              margin: "0 0 12px 0",
              color: isDarkMode ? "#fbbf24" : "#92400e",
              fontSize: "14px",
            }}>
              {profile?.partner_name || "Dein Partner"} hat diese Vereinbarung vorgeschlagen
            </p>
            <div style={{
              display: "flex",
              gap: "10px",
            }}>
              <button
                onClick={handleApprove}
                style={{
                  padding: "10px 20px",
                  background: tokens.colors.success,
                  color: "white",
                  border: "none",
                  borderRadius: tokens.radii.sm,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}
                disabled={actionLoading}
              >
                ✓ Zustimmen
              </button>
              <button
                onClick={() => handleAction("archive")}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: isDarkMode ? "#fbbf24" : "#92400e",
                  border: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}
                disabled={actionLoading}
              >
                Ablehnen
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ padding: "24px 20px" }}>
          <h2 style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: tokens.colors.text.primary,
            margin: "0 0 16px 0",
            fontFamily: tokens.fonts.display,
          }}>{agreement.title}</h2>

          {agreement.underlying_need && (
            <div style={{
              background: isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff",
              borderRadius: tokens.radii.md,
              padding: "16px",
              marginBottom: "20px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "600",
                color: tokens.colors.aurora.lavender,
                display: "block",
                marginBottom: "6px",
              }}>Warum es wichtig ist</span>
              <p style={{
                margin: 0,
                color: isDarkMode ? tokens.colors.aurora.lavender : "#4c1d95",
                fontSize: "15px",
                lineHeight: "1.5",
              }}>{agreement.underlying_need}</p>
            </div>
          )}

          <div style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
          }}>
            <div style={{ flex: 1 }}>
              <span style={{
                display: "block",
                fontSize: "12px",
                color: tokens.colors.text.muted,
                marginBottom: "4px",
              }}>Verantwortlich</span>
              <span style={{
                fontSize: "15px",
                fontWeight: "500",
                color: tokens.colors.text.primary,
              }}>{getResponsibleName()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                display: "block",
                fontSize: "12px",
                color: tokens.colors.text.muted,
                marginBottom: "4px",
              }}>Status</span>
              <span style={{
                fontSize: "15px",
                fontWeight: "500",
                color: agreement.status === "active" ? tokens.colors.success : tokens.colors.text.muted,
              }}>
                {agreement.status === "active" ? "Aktiv" :
                  agreement.status === "paused" ? "Pausiert" :
                    agreement.status === "achieved" ? "Erreicht" :
                      agreement.status === "pending_approval" ? "Warte auf Zustimmung" :
                        agreement.status}
              </span>
            </div>
          </div>

          {/* Success Streak */}
          {agreement.success_streak > 0 && (
            <div style={{
              background: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
              borderRadius: tokens.radii.md,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}>
              <span style={{ fontSize: "24px" }}>🔥</span>
              <span style={{
                color: isDarkMode ? "#fbbf24" : "#92400e",
                fontSize: "14px",
                fontWeight: "500",
              }}>
                {agreement.success_streak} erfolgreiche Check-ins in Folge
              </span>
            </div>
          )}

          {/* Check-in Due */}
          {isCheckInDue && agreement.status === "active" && !showCheckIn && (
            <div style={{
              background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}, ${tokens.colors.aurora.lavender})`,
              borderRadius: tokens.radii.md,
              padding: "20px",
              textAlign: "center",
              marginBottom: "20px",
            }}>
              <p style={{
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 12px 0",
              }}>Check-in fällig!</p>
              <button
                onClick={() => setShowCheckIn(true)}
                style={{
                  padding: "12px 24px",
                  background: "white",
                  color: tokens.colors.aurora.lavender,
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}
              >
                Jetzt einchecken
              </button>
            </div>
          )}

          {/* Check-in Form */}
          {showCheckIn && (
            <div style={{
              background: tokens.colors.bg.surface,
              borderRadius: tokens.radii.lg,
              padding: "20px",
              marginBottom: "20px",
            }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 16px 0",
                fontFamily: tokens.fonts.display,
              }}>Wie läuft es?</h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "20px",
              }}>
                {checkInOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setCheckInStatus(option.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px",
                      background: checkInStatus === option.value
                        ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                        : tokens.colors.bg.elevated,
                      border: `2px solid ${checkInStatus === option.value ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                      borderRadius: tokens.radii.md,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{option.emoji}</span>
                    <span style={{
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                      fontSize: "15px",
                    }}>{option.label}</span>
                    <span style={{
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                      marginLeft: "auto",
                    }}>{option.desc}</span>
                  </button>
                ))}
              </div>

              {checkInStatus && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: tokens.colors.text.primary,
                      marginBottom: "6px",
                    }}>Was hat gut funktioniert? (optional)</label>
                    <textarea
                      value={whatWorked}
                      onChange={(e) => setWhatWorked(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: tokens.radii.md,
                        border: `2px solid ${tokens.colors.bg.soft}`,
                        fontSize: "15px",
                        minHeight: "80px",
                        resize: "vertical",
                        outline: "none",
                        background: tokens.colors.bg.elevated,
                        color: tokens.colors.text.primary,
                        fontFamily: tokens.fonts.body,
                        boxSizing: "border-box",
                      }}
                      placeholder="z.B. Der Reminder im Auto hat geholfen..."
                    />
                  </div>

                  {(checkInStatus === "difficult" || checkInStatus === "needs_change") && (
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: tokens.colors.text.primary,
                        marginBottom: "6px",
                      }}>Was war schwierig?</label>
                      <textarea
                        value={whatWasHard}
                        onChange={(e) => setWhatWasHard(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: tokens.radii.md,
                          border: `2px solid ${tokens.colors.bg.soft}`,
                          fontSize: "15px",
                          minHeight: "80px",
                          resize: "vertical",
                          outline: "none",
                          background: tokens.colors.bg.elevated,
                          color: tokens.colors.text.primary,
                          fontFamily: tokens.fonts.body,
                          boxSizing: "border-box",
                        }}
                        placeholder="z.B. Im Stress vergesse ich es..."
                      />
                    </div>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}>
                    <button
                      onClick={() => setShowCheckIn(false)}
                      style={{
                        padding: "10px 20px",
                        background: "transparent",
                        color: tokens.colors.text.muted,
                        border: "none",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontFamily: tokens.fonts.body,
                      }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleCheckIn}
                      style={{
                        padding: "12px 24px",
                        background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}, ${tokens.colors.aurora.lavender})`,
                        color: "white",
                        border: "none",
                        borderRadius: tokens.radii.md,
                        fontSize: "15px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: tokens.fonts.body,
                      }}
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
            <div style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: `1px solid ${tokens.colors.bg.soft}`,
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 16px 0",
                fontFamily: tokens.fonts.display,
              }}>Verlauf</h3>
              {agreement.checkins.slice(0, 5).map((checkin, i) => (
                <div key={checkin.id || i} style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontSize: "20px" }}>
                    {checkin.status === "good" ? "💚" :
                      checkin.status === "partial" ? "💛" :
                        checkin.status === "difficult" ? "🧡" : "❤️"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                    }}>
                      {formatDate(checkin.created_at)}
                    </span>
                    {checkin.what_worked && (
                      <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: tokens.colors.text.secondary,
                      }}>✓ {checkin.what_worked}</p>
                    )}
                    {checkin.what_was_hard && (
                      <p style={{
                        margin: "4px 0 0 0",
                        fontSize: "14px",
                        color: tokens.colors.text.secondary,
                      }}>△ {checkin.what_was_hard}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Check-in */}
          {agreement.next_check_in_at && agreement.status === "active" && (
            <p style={{
              textAlign: "center",
              color: tokens.colors.text.muted,
              fontSize: "13px",
              marginTop: "20px",
            }}>
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
