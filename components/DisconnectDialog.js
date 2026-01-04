/**
 * DISCONNECT DIALOG - components/DisconnectDialog.js
 * Dialog für Couple-Trennung mit Learnings-Option für BEIDE Partner
 * Migrated to Design System tokens
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function DisconnectDialog({ pendingDissolution, onClose, onComplete }) {
  const { user, profile } = useAuth();
  const { tokens } = useTheme();
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
    <div style={tokens.modals.overlay}>
      <div style={{
        ...tokens.modals.container,
        padding: "32px 24px",
        maxWidth: "440px",
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          ...tokens.buttons.icon,
          position: "absolute",
          top: "16px",
          right: "16px",
        }}>
          <span style={{ fontSize: "24px" }}>x</span>
        </button>

        {/* STEP: Info (Initiator viewing options) */}
        {step === "info" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>&#9881;&#65039;</span>
            </div>

            <h2 style={{
              ...tokens.typography.h2,
              textAlign: "center",
            }}>Verbindung verwalten</h2>

            <p style={{
              ...tokens.typography.body,
              textAlign: "center",
              color: tokens.colors.text.muted,
              marginBottom: "20px",
            }}>
              Du bist mit {partnerName} verbunden. Gemeinsame Sessions
              und Vereinbarungen sind aktiv.
            </p>

            <div style={tokens.cards.surface}>
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
                <li>{partnerName} erhalt die gleiche Option</li>
              </ul>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                onClick={() => setStep("learnings")}
                style={{
                  ...tokens.buttons.danger,
                  width: "100%",
                  marginBottom: "12px",
                }}
              >
                Verbindung auflosen
              </button>

              <button onClick={onClose} style={{
                ...tokens.buttons.secondary,
                width: "100%",
              }}>
                Abbrechen
              </button>
            </div>
          </>
        )}

        {/* STEP: Learnings choice (Initiator) */}
        {step === "learnings" && !pendingDissolution && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>&#128221;</span>
            </div>

            <h2 style={{
              ...tokens.typography.h2,
              textAlign: "center",
            }}>Learnings behalten?</h2>

            <p style={{
              ...tokens.typography.body,
              textAlign: "center",
              color: tokens.colors.text.muted,
              marginBottom: "20px",
            }}>
              Mochtest du anonymisierte Erkenntnisse aus euren
              Vereinbarungen fur die Zukunft behalten?
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={tokens.inputs.selection(keepLearnings)}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>&#9989;</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Learnings behalten</span>
                  <span style={{
                    ...tokens.typography.small,
                    lineHeight: "1.4",
                  }}>
                    Anonymisiert, ohne Namen oder Details.
                    Kann in zukunftigen Beziehungen helfen.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={tokens.inputs.selection(!keepLearnings)}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>&#128465;&#65039;</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Alles loschen</span>
                  <span style={{
                    ...tokens.typography.small,
                    lineHeight: "1.4",
                  }}>
                    Keine Daten aus dieser Verbindung behalten.
                  </span>
                </div>
              </button>
            </div>

            <div style={tokens.alerts.warning}>
              <p style={{
                ...tokens.alerts.warningText,
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.5",
              }}>
                <strong>Hinweis:</strong> {partnerName} wird ebenfalls gefragt
                und kann unabhangig von dir entscheiden.
              </p>
            </div>

            {error && (
              <p style={{
                ...tokens.alerts.error,
                marginTop: "16px",
                marginBottom: "16px",
                textAlign: "center",
              }}>{error}</p>
            )}

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleInitiateDisconnect}
                style={{
                  ...tokens.buttons.danger,
                  width: "100%",
                  marginBottom: "12px",
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
              >
                {loading ? "Wird verarbeitet..." : "Verbindung auflosen"}
              </button>

              <button
                onClick={() => setStep("info")}
                style={{
                  ...tokens.buttons.secondary,
                  width: "100%",
                }}
                disabled={loading}
              >
                Zuruck
              </button>
            </div>
          </>
        )}

        {/* STEP: Confirm (Partner responding to dissolution) */}
        {step === "confirm" && pendingDissolution && (
          <>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "48px" }}>&#128148;</span>
            </div>

            <h2 style={{
              ...tokens.typography.h2,
              textAlign: "center",
            }}>Verbindung aufgelost</h2>

            <p style={{
              ...tokens.typography.body,
              textAlign: "center",
              color: tokens.colors.text.muted,
              marginBottom: "20px",
            }}>
              {pendingDissolution.initiatedBy} hat die Verbindung beendet.
            </p>

            {pendingDissolution.agreementCount > 0 && (
              <div style={{
                ...tokens.cards.surface,
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
                  }}>&#8226; {a.title}</p>
                ))}
                {pendingDissolution.agreementCount > 3 && (
                  <p style={{
                    ...tokens.typography.small,
                    marginTop: "8px",
                    fontStyle: "italic",
                  }}>
                    + {pendingDissolution.agreementCount - 3} weitere
                  </p>
                )}
              </div>
            )}

            <h3 style={tokens.typography.h3}>Mochtest du Learnings behalten?</h3>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={tokens.inputs.selection(keepLearnings)}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>&#9989;</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Learnings behalten</span>
                  <span style={{
                    ...tokens.typography.small,
                    lineHeight: "1.4",
                  }}>
                    Anonymisiert, ohne Namen oder Details
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={tokens.inputs.selection(!keepLearnings)}
              >
                <span style={{ fontSize: "24px", marginTop: "2px" }}>&#128465;&#65039;</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}>Alles loschen</span>
                  <span style={{
                    ...tokens.typography.small,
                    lineHeight: "1.4",
                  }}>
                    Keine Daten behalten
                  </span>
                </div>
              </button>
            </div>

            {error && (
              <p style={{
                ...tokens.alerts.error,
                marginBottom: "16px",
                textAlign: "center",
              }}>{error}</p>
            )}

            <button
              onClick={handleConfirmDisconnect}
              style={{
                ...tokens.buttons.primary,
                width: "100%",
                marginBottom: "12px",
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : "Bestatigen"}
            </button>

            <button
              onClick={handleCancelDisconnect}
              style={{
                ...tokens.buttons.ghostAccent,
                width: "100%",
                textDecoration: "underline",
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
