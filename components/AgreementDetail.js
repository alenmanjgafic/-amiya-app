/**
 * AGREEMENT DETAIL COMPONENT - components/AgreementDetail.js
 * Zeigt Details einer Vereinbarung mit Check-in Moglichkeit
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import { Clock, UserCheck } from "lucide-react";

export default function AgreementDetail({ agreementId, onClose, onUpdate }) {
  const { user, profile } = useAuth();
  const { tokens } = useTheme();
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
    { value: "difficult", emoji: "🧡", label: "War schwierig", desc: "Braucht mehr Ubung" },
    { value: "needs_change", emoji: "❤️", label: "Braucht Anpassung", desc: "So funktioniert es nicht" },
  ];

  if (loading) {
    return (
      <div style={tokens.modals.overlay}>
        <div style={tokens.modals.container}>
          <div style={{
            padding: "60px",
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={tokens.loaders.spinner(40)} />
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div style={tokens.modals.overlay}>
        <div style={{
          ...tokens.modals.container,
          textAlign: "center",
          padding: "32px",
        }}>
          <p style={tokens.typography.body}>Vereinbarung nicht gefunden</p>
          <button onClick={onClose} style={{
            ...tokens.buttons.secondary,
            marginTop: "16px",
          }}>Schliessen</button>
        </div>
      </div>
    );
  }

  return (
    <div style={tokens.modals.overlay}>
      <div style={{
        ...tokens.modals.container,
        padding: 0,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: `1px solid ${tokens.colors.bg.soft}`,
        }}>
          <button onClick={onClose} style={tokens.buttons.ghost}>
            ← Zuruck
          </button>
          <button onClick={() => setShowActions(!showActions)} style={tokens.buttons.icon}>
            &#8943;
          </button>
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
                  ...tokens.buttons.secondary,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "4px",
                  padding: "12px 16px",
                }}
                disabled={actionLoading}
              >
                &#9208;&#65039; Pausieren
              </button>
            )}
            {agreement.status === "paused" && (
              <button
                onClick={() => handleAction("resume")}
                style={{
                  ...tokens.buttons.secondary,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "4px",
                  padding: "12px 16px",
                }}
                disabled={actionLoading}
              >
                &#9654;&#65039; Fortsetzen
              </button>
            )}
            {agreement.status === "active" && (
              <button
                onClick={() => handleAction("achieve")}
                style={{
                  ...tokens.buttons.secondary,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "4px",
                  padding: "12px 16px",
                }}
                disabled={actionLoading}
              >
                &#127881; Als erreicht markieren
              </button>
            )}
            <button
              onClick={() => handleAction("archive")}
              style={{
                ...tokens.buttons.secondary,
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                color: tokens.colors.error,
              }}
              disabled={actionLoading}
            >
              &#128465;&#65039; Archivieren
            </button>
          </div>
        )}

        {/* Status Banner */}
        {needsMyApproval && (
          <div style={{
            padding: "20px",
            background: tokens.isDarkMode ? "rgba(167, 139, 250, 0.1)" : "rgba(167, 139, 250, 0.08)",
            borderBottom: `1px solid ${tokens.colors.bg.soft}`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: tokens.radii.md,
                background: tokens.colors.aurora.lavender,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <UserCheck size={20} color="white" />
              </div>
              <p style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "500",
                color: tokens.colors.text.primary,
              }}>
                {profile?.partner_name || "Dein Partner"} hat diese Vereinbarung vorgeschlagen
              </p>
            </div>
            <div style={{
              display: "flex",
              gap: "12px",
            }}>
              <button
                onClick={handleApprove}
                style={{
                  ...tokens.buttons.primary,
                  flex: 1,
                }}
                disabled={actionLoading}
              >
                Zustimmen
              </button>
              <button
                onClick={() => handleAction("archive")}
                style={{
                  ...tokens.buttons.secondary,
                  flex: 1,
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
          <h2 style={tokens.typography.h2}>{agreement.title}</h2>

          {agreement.underlying_need && (
            <div style={{
              ...tokens.alerts.info,
              marginBottom: "20px",
            }}>
              <span style={{
                ...tokens.alerts.infoText,
                fontSize: "13px",
                fontWeight: "600",
                display: "block",
                marginBottom: "6px",
              }}>Warum es wichtig ist</span>
              <p style={{
                ...tokens.alerts.infoText,
                margin: 0,
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
              <span style={tokens.typography.small}>Verantwortlich</span>
              <span style={{
                display: "block",
                fontSize: "15px",
                fontWeight: "500",
                color: tokens.colors.text.primary,
                marginTop: "4px",
              }}>{getResponsibleName()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={tokens.typography.small}>Status</span>
              <span style={{
                display: "block",
                fontSize: "15px",
                fontWeight: "500",
                color: agreement.status === "active" ? tokens.colors.success : tokens.colors.text.muted,
                marginTop: "4px",
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
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              background: tokens.isDarkMode ? "rgba(251, 146, 60, 0.15)" : "rgba(251, 146, 60, 0.1)",
              borderRadius: tokens.radii.md,
              marginBottom: "20px",
            }}>
              <span style={{ fontSize: "24px" }}>🔥</span>
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                color: tokens.isDarkMode ? "#fb923c" : "#ea580c",
              }}>
                {agreement.success_streak} erfolgreiche Check-ins in Folge
              </span>
            </div>
          )}

          {/* Check-in Due */}
          {isCheckInDue && agreement.status === "active" && !showCheckIn && (
            <div style={{
              background: tokens.gradients.primary,
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
              }}>Check-in fallig!</p>
              <button
                onClick={() => setShowCheckIn(true)}
                style={{
                  ...tokens.buttons.secondary,
                  background: "white",
                  color: tokens.colors.aurora.lavender,
                }}
              >
                Jetzt einchecken
              </button>
            </div>
          )}

          {/* Check-in Form */}
          {showCheckIn && (
            <div style={{
              ...tokens.cards.surface,
              borderRadius: tokens.radii.lg,
              padding: "20px",
              marginBottom: "20px",
            }}>
              <h3 style={tokens.typography.h3}>Wie lauft es?</h3>

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
                      ...tokens.inputs.selection(checkInStatus === option.value),
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{option.emoji}</span>
                    <span style={{
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                      fontSize: "15px",
                    }}>{option.label}</span>
                    <span style={{
                      ...tokens.typography.small,
                      marginLeft: "auto",
                    }}>{option.desc}</span>
                  </button>
                ))}
              </div>

              {checkInStatus && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={tokens.inputs.label}>Was hat gut funktioniert? (optional)</label>
                    <textarea
                      value={whatWorked}
                      onChange={(e) => setWhatWorked(e.target.value)}
                      style={{
                        ...tokens.inputs.textarea,
                        minHeight: "80px",
                      }}
                      placeholder="z.B. Der Reminder im Auto hat geholfen..."
                    />
                  </div>

                  {(checkInStatus === "difficult" || checkInStatus === "needs_change") && (
                    <div style={{ marginBottom: "16px" }}>
                      <label style={tokens.inputs.label}>Was war schwierig?</label>
                      <textarea
                        value={whatWasHard}
                        onChange={(e) => setWhatWasHard(e.target.value)}
                        style={{
                          ...tokens.inputs.textarea,
                          minHeight: "80px",
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
                      style={tokens.buttons.ghost}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleCheckIn}
                      style={tokens.buttons.primary}
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
                ...tokens.typography.h3,
                fontSize: "16px",
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
                    <span style={tokens.typography.small}>
                      {formatDate(checkin.created_at)}
                    </span>
                    {checkin.what_worked && (
                      <p style={{
                        ...tokens.typography.body,
                        marginTop: "4px",
                        fontSize: "14px",
                      }}>&#10003; {checkin.what_worked}</p>
                    )}
                    {checkin.what_was_hard && (
                      <p style={{
                        ...tokens.typography.body,
                        marginTop: "4px",
                        fontSize: "14px",
                      }}>&#9651; {checkin.what_was_hard}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Check-in */}
          {agreement.next_check_in_at && agreement.status === "active" && (
            <p style={{
              ...tokens.typography.small,
              textAlign: "center",
              marginTop: "20px",
            }}>
              Nachster Check-in: {formatDate(agreement.next_check_in_at)}
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
