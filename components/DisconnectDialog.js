/**
 * DISCONNECT DIALOG - components/DisconnectDialog.js
 * Dialog für Couple-Trennung mit Learnings-Option für BEIDE Partner
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function DisconnectDialog({ pendingDissolution, onClose, onComplete }) {
  const { user, profile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const [step, setStep] = useState(pendingDissolution ? "confirm" : "info");
  const [keepLearnings, setKeepLearnings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const partnerName = profile?.partner_name || "Partner";

  // Initiator flow: Start disconnect
  const handleInitiateDisconnect = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/couple/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "initiate",
          keepLearnings
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete?.();
      } else {
        setError(data.error || "Ein Fehler ist aufgetreten");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  // Partner flow: Confirm disconnect
  const handleConfirmDisconnect = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/couple/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "confirm",
          keepLearnings
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete?.();
      } else {
        setError(data.error || "Ein Fehler ist aufgetreten");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  // Partner can cancel
  const handleCancelDisconnect = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/couple/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "cancel"
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete?.();
      } else {
        setError(data.error || "Abbrechen fehlgeschlagen");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 1000,
    }}>
      <div style={{
        background: tokens.colors.bg.elevated,
        borderRadius: tokens.radii.xl,
        padding: "32px 24px",
        maxWidth: "440px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        boxShadow: tokens.shadows.large,
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          fontSize: "24px",
          color: tokens.colors.text.muted,
          cursor: "pointer",
        }}>✕</button>

        {/* STEP: Info (Initiator viewing options) */}
        {step === "info" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>⚙️</span>
            </div>

            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              textAlign: "center",
              margin: "0 0 12px 0",
              fontFamily: tokens.fonts.display,
            }}>Verbindung verwalten</h2>

            <p style={{
              fontSize: "15px",
              color: tokens.colors.text.muted,
              textAlign: "center",
              lineHeight: "1.6",
              margin: "0 0 20px 0",
            }}>
              Du bist mit {partnerName} verbunden. Gemeinsame Sessions
              und Vereinbarungen sind aktiv.
            </p>

            <div style={{
              background: tokens.colors.bg.surface,
              borderRadius: tokens.radii.md,
              padding: "16px",
              marginBottom: "24px",
            }}>
              <h4 style={{
                fontSize: "14px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 8px 0",
              }}>Bei Trennung:</h4>
              <ul style={{
                margin: 0,
                paddingLeft: "20px",
                color: tokens.colors.text.muted,
                fontSize: "14px",
                lineHeight: "1.8",
              }}>
                <li>Gemeinsame Sessions bleiben im Verlauf</li>
                <li>Vereinbarungen werden archiviert</li>
                <li>Du kannst anonymisierte Learnings behalten</li>
                <li>{partnerName} erhält die gleiche Option</li>
              </ul>
            </div>

            <button
              onClick={() => setStep("learnings")}
              style={{
                width: "100%",
                padding: "16px",
                background: isDarkMode ? "rgba(248, 113, 113, 0.15)" : "#fee2e2",
                color: tokens.colors.error,
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "12px",
                fontFamily: tokens.fonts.body,
              }}
            >
              Verbindung auflösen
            </button>

            <button onClick={onClose} style={{
              width: "100%",
              padding: "14px",
              background: tokens.colors.bg.surface,
              color: tokens.colors.text.primary,
              border: "none",
              borderRadius: tokens.radii.md,
              fontSize: "15px",
              cursor: "pointer",
              fontFamily: tokens.fonts.body,
            }}>
              Abbrechen
            </button>
          </>
        )}

        {/* STEP: Learnings choice (Initiator) */}
        {step === "learnings" && !pendingDissolution && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>📝</span>
            </div>

            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              textAlign: "center",
              margin: "0 0 12px 0",
              fontFamily: tokens.fonts.display,
            }}>Learnings behalten?</h2>

            <p style={{
              fontSize: "15px",
              color: tokens.colors.text.muted,
              textAlign: "center",
              lineHeight: "1.6",
              margin: "0 0 20px 0",
            }}>
              Möchtest du anonymisierte Erkenntnisse aus euren
              Vereinbarungen für die Zukunft behalten?
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background: keepLearnings
                    ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                    : tokens.colors.bg.surface,
                  border: `2px solid ${keepLearnings ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                  borderRadius: tokens.radii.md,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>✅</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Learnings behalten</span>
                  <span style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    lineHeight: "1.4",
                  }}>
                    Anonymisiert, ohne Namen oder Details.
                    Kann in zukünftigen Beziehungen helfen.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background: !keepLearnings
                    ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                    : tokens.colors.bg.surface,
                  border: `2px solid ${!keepLearnings ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                  borderRadius: tokens.radii.md,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>🗑️</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Alles löschen</span>
                  <span style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    lineHeight: "1.4",
                  }}>
                    Keine Daten aus dieser Verbindung behalten.
                  </span>
                </div>
              </button>
            </div>

            <div style={{
              background: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#fef3c7",
              borderRadius: tokens.radii.md,
              padding: "12px",
              marginBottom: "20px",
            }}>
              <p style={{
                margin: 0,
                fontSize: "13px",
                color: isDarkMode ? "#fbbf24" : "#92400e",
                lineHeight: "1.5",
              }}>
                <strong>Hinweis:</strong> {partnerName} wird ebenfalls gefragt
                und kann unabhängig von dir entscheiden.
              </p>
            </div>

            {error && (
              <p style={{
                color: tokens.colors.error,
                fontSize: "14px",
                background: isDarkMode ? "rgba(248, 113, 113, 0.15)" : "#fef2f2",
                padding: "12px",
                borderRadius: tokens.radii.sm,
                marginBottom: "16px",
                textAlign: "center",
              }}>{error}</p>
            )}

            <button
              onClick={handleInitiateDisconnect}
              style={{
                width: "100%",
                padding: "16px",
                background: isDarkMode ? "rgba(248, 113, 113, 0.15)" : "#fee2e2",
                color: tokens.colors.error,
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "12px",
                fontFamily: tokens.fonts.body,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : "Verbindung auflösen"}
            </button>

            <button
              onClick={() => setStep("info")}
              style={{
                width: "100%",
                padding: "14px",
                background: tokens.colors.bg.surface,
                color: tokens.colors.text.primary,
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "15px",
                cursor: "pointer",
                fontFamily: tokens.fonts.body,
              }}
              disabled={loading}
            >
              Zurück
            </button>
          </>
        )}

        {/* STEP: Confirm (Partner responding to dissolution) */}
        {step === "confirm" && pendingDissolution && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>💔</span>
            </div>

            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              textAlign: "center",
              margin: "0 0 12px 0",
              fontFamily: tokens.fonts.display,
            }}>Verbindung aufgelöst</h2>

            <p style={{
              fontSize: "15px",
              color: tokens.colors.text.muted,
              textAlign: "center",
              lineHeight: "1.6",
              margin: "0 0 20px 0",
            }}>
              {pendingDissolution.initiatedBy} hat die Verbindung beendet.
            </p>

            {pendingDissolution.agreementCount > 0 && (
              <div style={{
                background: tokens.colors.bg.surface,
                borderRadius: tokens.radii.md,
                padding: "16px",
                marginBottom: "20px",
              }}>
                <p style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: tokens.colors.text.primary,
                  margin: "0 0 8px 0",
                }}>
                  {pendingDissolution.agreementCount} gemeinsame Vereinbarungen:
                </p>
                {pendingDissolution.agreements?.slice(0, 3).map((a, i) => (
                  <p key={i} style={{
                    fontSize: "14px",
                    color: tokens.colors.text.muted,
                    margin: "0 0 4px 0",
                  }}>• {a.title}</p>
                ))}
                {pendingDissolution.agreementCount > 3 && (
                  <p style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    margin: "8px 0 0 0",
                    fontStyle: "italic",
                  }}>
                    + {pendingDissolution.agreementCount - 3} weitere
                  </p>
                )}
              </div>
            )}

            <h3 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
              margin: "20px 0 12px 0",
            }}>Möchtest du Learnings behalten?</h3>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background: keepLearnings
                    ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                    : tokens.colors.bg.surface,
                  border: `2px solid ${keepLearnings ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                  borderRadius: tokens.radii.md,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>✅</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Learnings behalten</span>
                  <span style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    lineHeight: "1.4",
                  }}>
                    Anonymisiert, ohne Namen oder Details
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background: !keepLearnings
                    ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                    : tokens.colors.bg.surface,
                  border: `2px solid ${!keepLearnings ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                  borderRadius: tokens.radii.md,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>🗑️</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Alles löschen</span>
                  <span style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    lineHeight: "1.4",
                  }}>
                    Keine Daten behalten
                  </span>
                </div>
              </button>
            </div>

            {error && (
              <p style={{
                color: tokens.colors.error,
                fontSize: "14px",
                background: isDarkMode ? "rgba(248, 113, 113, 0.15)" : "#fef2f2",
                padding: "12px",
                borderRadius: tokens.radii.sm,
                marginBottom: "16px",
                textAlign: "center",
              }}>{error}</p>
            )}

            <button
              onClick={handleConfirmDisconnect}
              style={{
                width: "100%",
                padding: "16px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "12px",
                fontFamily: tokens.fonts.body,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : "Bestätigen"}
            </button>

            <button
              onClick={handleCancelDisconnect}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                color: tokens.colors.aurora.lavender,
                border: "none",
                fontSize: "14px",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: tokens.fonts.body,
              }}
              disabled={loading}
            >
              Trennung abbrechen & wieder verbinden
            </button>
          </>
        )}
      </div>
    </div>
  );
}
