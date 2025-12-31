/**
 * DISCONNECT DIALOG - components/DisconnectDialog.js
 * Dialog für Couple-Trennung mit Learnings-Option für BEIDE Partner
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function DisconnectDialog({ pendingDissolution, onClose, onComplete }) {
  const { user, profile } = useAuth();
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
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Close Button */}
        <button onClick={onClose} style={styles.closeButton}>✕</button>

        {/* STEP: Info (Initiator viewing options) */}
        {step === "info" && (
          <>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>⚙️</span>
            </div>
            
            <h2 style={styles.title}>Verbindung verwalten</h2>
            
            <p style={styles.text}>
              Du bist mit {partnerName} verbunden. Gemeinsame Sessions 
              und Vereinbarungen sind aktiv.
            </p>

            <div style={styles.infoBox}>
              <h4 style={styles.infoTitle}>Bei Trennung:</h4>
              <ul style={styles.infoList}>
                <li>Gemeinsame Sessions bleiben im Verlauf</li>
                <li>Vereinbarungen werden archiviert</li>
                <li>Du kannst anonymisierte Learnings behalten</li>
                <li>{partnerName} erhält die gleiche Option</li>
              </ul>
            </div>

            <button
              onClick={() => setStep("learnings")}
              style={styles.dangerButton}
            >
              Verbindung auflösen
            </button>

            <button onClick={onClose} style={styles.secondaryButton}>
              Abbrechen
            </button>
          </>
        )}

        {/* STEP: Learnings choice (Initiator) */}
        {step === "learnings" && !pendingDissolution && (
          <>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>📝</span>
            </div>
            
            <h2 style={styles.title}>Learnings behalten?</h2>
            
            <p style={styles.text}>
              Möchtest du anonymisierte Erkenntnisse aus euren 
              Vereinbarungen für die Zukunft behalten?
            </p>

            <div style={styles.optionsList}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={{
                  ...styles.optionCard,
                  ...(keepLearnings ? styles.optionCardSelected : {})
                }}
              >
                <span style={styles.optionEmoji}>✅</span>
                <div style={styles.optionContent}>
                  <span style={styles.optionTitle}>Learnings behalten</span>
                  <span style={styles.optionDesc}>
                    Anonymisiert, ohne Namen oder Details.
                    Kann in zukünftigen Beziehungen helfen.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={{
                  ...styles.optionCard,
                  ...(!keepLearnings ? styles.optionCardSelected : {})
                }}
              >
                <span style={styles.optionEmoji}>🗑️</span>
                <div style={styles.optionContent}>
                  <span style={styles.optionTitle}>Alles löschen</span>
                  <span style={styles.optionDesc}>
                    Keine Daten aus dieser Verbindung behalten.
                  </span>
                </div>
              </button>
            </div>

            <div style={styles.noteBox}>
              <p style={styles.noteText}>
                <strong>Hinweis:</strong> {partnerName} wird ebenfalls gefragt 
                und kann unabhängig von dir entscheiden.
              </p>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={handleInitiateDisconnect}
              style={styles.dangerButton}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : "Verbindung auflösen"}
            </button>

            <button 
              onClick={() => setStep("info")} 
              style={styles.secondaryButton}
              disabled={loading}
            >
              Zurück
            </button>
          </>
        )}

        {/* STEP: Confirm (Partner responding to dissolution) */}
        {step === "confirm" && pendingDissolution && (
          <>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>💔</span>
            </div>
            
            <h2 style={styles.title}>Verbindung aufgelöst</h2>
            
            <p style={styles.text}>
              {pendingDissolution.initiatedBy} hat die Verbindung beendet.
            </p>

            {pendingDissolution.agreementCount > 0 && (
              <div style={styles.agreementPreview}>
                <p style={styles.previewTitle}>
                  {pendingDissolution.agreementCount} gemeinsame Vereinbarungen:
                </p>
                {pendingDissolution.agreements?.slice(0, 3).map((a, i) => (
                  <p key={i} style={styles.previewItem}>• {a.title}</p>
                ))}
                {pendingDissolution.agreementCount > 3 && (
                  <p style={styles.previewMore}>
                    + {pendingDissolution.agreementCount - 3} weitere
                  </p>
                )}
              </div>
            )}

            <h3 style={styles.subtitle}>Möchtest du Learnings behalten?</h3>

            <div style={styles.optionsList}>
              <button
                onClick={() => setKeepLearnings(true)}
                style={{
                  ...styles.optionCard,
                  ...(keepLearnings ? styles.optionCardSelected : {})
                }}
              >
                <span style={styles.optionEmoji}>✅</span>
                <div style={styles.optionContent}>
                  <span style={styles.optionTitle}>Learnings behalten</span>
                  <span style={styles.optionDesc}>
                    Anonymisiert, ohne Namen oder Details
                  </span>
                </div>
              </button>

              <button
                onClick={() => setKeepLearnings(false)}
                style={{
                  ...styles.optionCard,
                  ...(!keepLearnings ? styles.optionCardSelected : {})
                }}
              >
                <span style={styles.optionEmoji}>🗑️</span>
                <div style={styles.optionContent}>
                  <span style={styles.optionTitle}>Alles löschen</span>
                  <span style={styles.optionDesc}>
                    Keine Daten behalten
                  </span>
                </div>
              </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={handleConfirmDisconnect}
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading ? "Wird verarbeitet..." : "Bestätigen"}
            </button>

            <button
              onClick={handleCancelDisconnect}
              style={styles.linkButton}
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

const styles = {
  overlay: {
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
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "32px 24px",
    maxWidth: "440px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#9ca3af",
    cursor: "pointer",
  },
  iconContainer: {
    textAlign: "center",
    marginBottom: "16px",
  },
  icon: {
    fontSize: "48px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    margin: "0 0 12px 0",
  },
  subtitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    margin: "20px 0 12px 0",
  },
  text: {
    fontSize: "15px",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
  },
  infoBox: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0",
  },
  infoList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.8",
  },
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  optionCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  optionCardSelected: {
    borderColor: "#8b5cf6",
    background: "#f5f3ff",
  },
  optionEmoji: {
    fontSize: "24px",
    marginTop: "2px",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    display: "block",
    fontWeight: "600",
    color: "#1f2937",
    fontSize: "15px",
    marginBottom: "4px",
  },
  optionDesc: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.4",
  },
  noteBox: {
    background: "#fef3c7",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "20px",
  },
  noteText: {
    margin: 0,
    fontSize: "13px",
    color: "#92400e",
    lineHeight: "1.5",
  },
  agreementPreview: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
  },
  previewTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0",
  },
  previewItem: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  previewMore: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "8px 0 0 0",
    fontStyle: "italic",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "12px",
  },
  dangerButton: {
    width: "100%",
    padding: "16px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "12px",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    cursor: "pointer",
  },
  linkButton: {
    width: "100%",
    padding: "12px",
    background: "none",
    color: "#8b5cf6",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
