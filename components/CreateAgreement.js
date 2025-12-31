/**
 * CREATE AGREEMENT COMPONENT - components/CreateAgreement.js
 * Formular für manuelle Agreement-Erstellung
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function CreateAgreement({ onClose, onCreated }) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    underlyingNeed: "",
    type: "behavior",
    responsible: "both",
    checkInDays: 14,
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Bitte gib eine Vereinbarung ein");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Determine responsible_user_id
      let responsibleUserId = null;
      if (formData.responsible === "me") {
        responsibleUserId = user.id;
      } else if (formData.responsible === "partner") {
        responsibleUserId = profile.partner_id;
      }

      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleId: profile.couple_id,
          userId: user.id,
          title: formData.title,
          underlyingNeed: formData.underlyingNeed || null,
          type: formData.type,
          responsibleUserId,
          checkInFrequencyDays: formData.checkInDays,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onCreated?.(data.agreement);
        onClose();
      } else {
        setError(data.error || "Fehler beim Speichern");
      }
    } catch (err) {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { value: "behavior", emoji: "🎯", label: "Verhalten", desc: "Eine konkrete Handlung" },
    { value: "communication", emoji: "💬", label: "Kommunikation", desc: "Wie ihr miteinander sprecht" },
    { value: "ritual", emoji: "🔄", label: "Ritual", desc: "Regelmässiger Moment" },
    { value: "experiment", emoji: "🧪", label: "Experiment", desc: "Zeitlich begrenzt ausprobieren" },
  ];

  const responsibleOptions = [
    { value: "both", emoji: "👫", label: "Beide", desc: "Wir machen das gemeinsam" },
    { value: "me", emoji: "🙋", label: profile?.name || "Ich", desc: "Ich verpflichte mich" },
    { value: "partner", emoji: "🙋‍♂️", label: profile?.partner_name || "Partner", desc: `${profile?.partner_name || "Partner"} verpflichtet sich` },
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeButton}>← Zurück</button>
          <span style={styles.stepIndicator}>Schritt {step} von 3</span>
        </div>

        {/* Progress */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${(step / 3) * 100}%`}} />
        </div>

        <div style={styles.content}>
          {/* Step 1: What */}
          {step === 1 && (
            <>
              <h2 style={styles.title}>Was vereinbart ihr?</h2>
              <p style={styles.subtitle}>
                Beschreibe die Vereinbarung konkret und positiv.
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Vereinbarung</label>
                <textarea
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={styles.textarea}
                  placeholder="z.B. Ich rufe an wenn ich mehr als 30 Minuten später komme"
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Warum ist das wichtig? (optional)</label>
                <textarea
                  value={formData.underlyingNeed}
                  onChange={(e) => setFormData({...formData, underlyingNeed: e.target.value})}
                  style={{...styles.textarea, minHeight: "80px"}}
                  placeholder="z.B. Damit du dich sicher fühlst und dir keine Sorgen machst"
                />
                <p style={styles.hint}>
                  💡 Das Bedürfnis dahinter hilft, die Vereinbarung bedeutsam zu machen
                </p>
              </div>

              <button
                onClick={() => formData.title.trim() && setStep(2)}
                style={{
                  ...styles.nextButton,
                  opacity: formData.title.trim() ? 1 : 0.5
                }}
                disabled={!formData.title.trim()}
              >
                Weiter
              </button>
            </>
          )}

          {/* Step 2: Type & Who */}
          {step === 2 && (
            <>
              <h2 style={styles.title}>Um was geht es?</h2>
              
              <div style={styles.optionsGrid}>
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({...formData, type: option.value})}
                    style={{
                      ...styles.optionCard,
                      ...(formData.type === option.value ? styles.optionCardSelected : {})
                    }}
                  >
                    <span style={styles.optionEmoji}>{option.emoji}</span>
                    <span style={styles.optionLabel}>{option.label}</span>
                    <span style={styles.optionDesc}>{option.desc}</span>
                  </button>
                ))}
              </div>

              <h3 style={styles.sectionTitle}>Wer ist verantwortlich?</h3>
              
              <div style={styles.optionsList}>
                {responsibleOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({...formData, responsible: option.value})}
                    style={{
                      ...styles.optionRow,
                      ...(formData.responsible === option.value ? styles.optionRowSelected : {})
                    }}
                  >
                    <span style={styles.optionEmoji}>{option.emoji}</span>
                    <div style={styles.optionContent}>
                      <span style={styles.optionLabel}>{option.label}</span>
                      <span style={styles.optionDesc}>{option.desc}</span>
                    </div>
                    {formData.responsible === option.value && (
                      <span style={styles.checkMark}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={styles.navButtons}>
                <button onClick={() => setStep(1)} style={styles.backBtn}>
                  Zurück
                </button>
                <button onClick={() => setStep(3)} style={styles.nextButton}>
                  Weiter
                </button>
              </div>
            </>
          )}

          {/* Step 3: Check-in */}
          {step === 3 && (
            <>
              <h2 style={styles.title}>Wann wollt ihr darüber sprechen?</h2>
              <p style={styles.subtitle}>
                Regelmässige Check-ins helfen, dranzubleiben.
              </p>

              <div style={styles.checkInOptions}>
                {[
                  { value: 7, label: "1 Woche" },
                  { value: 14, label: "2 Wochen" },
                  { value: 21, label: "3 Wochen" },
                  { value: 30, label: "1 Monat" },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({...formData, checkInDays: option.value})}
                    style={{
                      ...styles.checkInOption,
                      ...(formData.checkInDays === option.value ? styles.checkInOptionSelected : {})
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div style={styles.summary}>
                <h4 style={styles.summaryTitle}>Zusammenfassung</h4>
                <p style={styles.summaryItem}>
                  <strong>Vereinbarung:</strong> {formData.title}
                </p>
                {formData.underlyingNeed && (
                  <p style={styles.summaryItem}>
                    <strong>Dahinter:</strong> {formData.underlyingNeed}
                  </p>
                )}
                <p style={styles.summaryItem}>
                  <strong>Verantwortlich:</strong>{" "}
                  {formData.responsible === "both" ? "Beide" :
                   formData.responsible === "me" ? profile?.name :
                   profile?.partner_name}
                </p>
                <p style={styles.summaryItem}>
                  <strong>Check-in:</strong> In {formData.checkInDays} Tagen
                </p>
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={styles.navButtons}>
                <button onClick={() => setStep(2)} style={styles.backBtn}>
                  Zurück
                </button>
                <button 
                  onClick={handleSubmit} 
                  style={styles.submitButton}
                  disabled={saving}
                >
                  {saving ? "Speichern..." : "Vereinbarung erstellen"}
                </button>
              </div>

              {formData.responsible !== "me" && (
                <p style={styles.approvalNote}>
                  ℹ️ {formData.responsible === "both" ? "Ihr müsst beide" : profile?.partner_name + " muss"} zustimmen,
                  damit die Vereinbarung aktiv wird.
                </p>
              )}
            </>
          )}
        </div>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#6b7280",
    cursor: "pointer",
  },
  stepIndicator: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  progressBar: {
    height: "4px",
    background: "#e5e7eb",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8b5cf6, #a855f7)",
    transition: "width 0.3s ease",
  },
  content: {
    padding: "24px 20px 32px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "15px",
    margin: "0 0 24px 0",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "24px 0 12px 0",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    minHeight: "100px",
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "13px",
    color: "#9ca3af",
    marginTop: "8px",
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  optionCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "center",
  },
  optionCardSelected: {
    borderColor: "#8b5cf6",
    background: "#f5f3ff",
  },
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  optionRowSelected: {
    borderColor: "#8b5cf6",
    background: "#f5f3ff",
  },
  optionContent: {
    flex: 1,
  },
  optionEmoji: {
    fontSize: "24px",
  },
  optionLabel: {
    display: "block",
    fontWeight: "600",
    color: "#1f2937",
    fontSize: "15px",
  },
  optionDesc: {
    fontSize: "12px",
    color: "#6b7280",
  },
  checkMark: {
    color: "#8b5cf6",
    fontWeight: "bold",
    fontSize: "18px",
  },
  checkInOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
  },
  checkInOption: {
    padding: "16px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    color: "#374151",
  },
  checkInOptionSelected: {
    borderColor: "#8b5cf6",
    background: "#f5f3ff",
    color: "#7c3aed",
  },
  summary: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
  },
  summaryTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280",
    margin: "0 0 12px 0",
  },
  summaryItem: {
    fontSize: "14px",
    color: "#374151",
    margin: "0 0 8px 0",
    lineHeight: "1.5",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  navButtons: {
    display: "flex",
    gap: "12px",
  },
  backBtn: {
    flex: 1,
    padding: "16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },
  nextButton: {
    flex: 2,
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitButton: {
    flex: 2,
    padding: "16px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  approvalNote: {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    marginTop: "16px",
  },
};
