/**
 * CREATE AGREEMENT COMPONENT - components/CreateAgreement.js
 * Formular fur manuelle Agreement-Erstellung
 * Migrated to Design System tokens
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function CreateAgreement({ onClose, onCreated }) {
  const { user, profile } = useAuth();
  const { tokens } = useTheme();
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
    { value: "ritual", emoji: "🔄", label: "Ritual", desc: "Regelmassiger Moment" },
    { value: "experiment", emoji: "🧪", label: "Experiment", desc: "Zeitlich begrenzt ausprobieren" },
  ];

  const responsibleOptions = [
    { value: "both", emoji: "👫", label: "Beide", desc: "Wir machen das gemeinsam" },
    { value: "me", emoji: "🙋", label: profile?.name || "Ich", desc: "Ich verpflichte mich" },
    { value: "partner", emoji: "🙋‍♂️", label: profile?.partner_name || "Partner", desc: `${profile?.partner_name || "Partner"} verpflichtet sich` },
  ];

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
        }}>
          <button onClick={onClose} style={tokens.buttons.ghost}>
            ← Zuruck
          </button>
          <span style={tokens.typography.small}>
            Schritt {step} von 3
          </span>
        </div>

        {/* Progress */}
        <div style={tokens.progress.track}>
          <div style={tokens.progress.bar((step / 3) * 100)} />
        </div>

        <div style={{ padding: "24px 20px 32px" }}>
          {/* Step 1: What */}
          {step === 1 && (
            <>
              <h2 style={tokens.typography.h2}>Was vereinbart ihr?</h2>
              <p style={{
                ...tokens.typography.body,
                color: tokens.colors.text.muted,
                marginBottom: "24px",
              }}>
                Beschreibe die Vereinbarung konkret und positiv.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={tokens.inputs.label}>Vereinbarung</label>
                <textarea
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={tokens.inputs.textarea}
                  placeholder="z.B. Ich rufe an wenn ich mehr als 30 Minuten spater komme"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={tokens.inputs.label}>Warum ist das wichtig? (optional)</label>
                <textarea
                  value={formData.underlyingNeed}
                  onChange={(e) => setFormData({ ...formData, underlyingNeed: e.target.value })}
                  style={{
                    ...tokens.inputs.textarea,
                    minHeight: "80px",
                  }}
                  placeholder="z.B. Damit du dich sicher fuhlst und dir keine Sorgen machst"
                />
                <p style={tokens.inputs.hint}>
                  Das Bedurfnis dahinter hilft, die Vereinbarung bedeutsam zu machen
                </p>
              </div>

              <button
                onClick={() => formData.title.trim() && setStep(2)}
                style={{
                  ...tokens.buttons.primary,
                  width: "100%",
                  opacity: formData.title.trim() ? 1 : 0.5,
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
              <h2 style={tokens.typography.h2}>Um was geht es?</h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}>
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, type: option.value })}
                    style={{
                      ...tokens.inputs.selection(formData.type === option.value),
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{option.emoji}</span>
                    <span style={{
                      display: "block",
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                      fontSize: "15px",
                      marginTop: "8px",
                    }}>{option.label}</span>
                    <span style={{
                      ...tokens.typography.small,
                      marginTop: "4px",
                    }}>{option.desc}</span>
                  </button>
                ))}
              </div>

              <h3 style={{
                ...tokens.typography.h3,
                marginTop: "24px",
                marginBottom: "12px",
              }}>Wer ist verantwortlich?</h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                {responsibleOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, responsible: option.value })}
                    style={{
                      ...tokens.inputs.selection(formData.responsible === option.value),
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{option.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        display: "block",
                        fontWeight: "600",
                        color: tokens.colors.text.primary,
                        fontSize: "15px",
                      }}>{option.label}</span>
                      <span style={tokens.typography.small}>{option.desc}</span>
                    </div>
                    {formData.responsible === option.value && (
                      <span style={{
                        color: tokens.colors.aurora.lavender,
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}>&#10003;</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={tokens.modals.buttonGroup}>
                <button onClick={() => setStep(1)} style={{
                  ...tokens.buttons.secondary,
                  flex: 1,
                }}>
                  Zuruck
                </button>
                <button onClick={() => setStep(3)} style={{
                  ...tokens.buttons.primary,
                  flex: 2,
                }}>
                  Weiter
                </button>
              </div>
            </>
          )}

          {/* Step 3: Check-in */}
          {step === 3 && (
            <>
              <h2 style={tokens.typography.h2}>Wann wollt ihr daruber sprechen?</h2>
              <p style={{
                ...tokens.typography.body,
                color: tokens.colors.text.muted,
                marginBottom: "24px",
              }}>
                Regelmassige Check-ins helfen, dranzubleiben.
              </p>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "24px",
              }}>
                {[
                  { value: 7, label: "1 Woche" },
                  { value: 14, label: "2 Wochen" },
                  { value: 21, label: "3 Wochen" },
                  { value: 30, label: "1 Monat" },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, checkInDays: option.value })}
                    style={{
                      ...tokens.inputs.selection(formData.checkInDays === option.value),
                      justifyContent: "center",
                      padding: "16px",
                      color: formData.checkInDays === option.value
                        ? tokens.colors.aurora.lavender
                        : tokens.colors.text.primary,
                      fontWeight: "500",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div style={tokens.cards.surface}>
                <h4 style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: tokens.colors.text.muted,
                  margin: "0 0 12px 0",
                }}>Zusammenfassung</h4>
                <p style={{
                  ...tokens.typography.body,
                  color: tokens.colors.text.primary,
                  marginBottom: "8px",
                }}>
                  <strong>Vereinbarung:</strong> {formData.title}
                </p>
                {formData.underlyingNeed && (
                  <p style={{
                    ...tokens.typography.body,
                    color: tokens.colors.text.primary,
                    marginBottom: "8px",
                  }}>
                    <strong>Dahinter:</strong> {formData.underlyingNeed}
                  </p>
                )}
                <p style={{
                  ...tokens.typography.body,
                  color: tokens.colors.text.primary,
                  marginBottom: "8px",
                }}>
                  <strong>Verantwortlich:</strong>{" "}
                  {formData.responsible === "both" ? "Beide" :
                    formData.responsible === "me" ? profile?.name :
                      profile?.partner_name}
                </p>
                <p style={{
                  ...tokens.typography.body,
                  color: tokens.colors.text.primary,
                  margin: 0,
                }}>
                  <strong>Check-in:</strong> In {formData.checkInDays} Tagen
                </p>
              </div>

              {error && (
                <p style={{
                  ...tokens.alerts.error,
                  marginTop: "16px",
                }}>{error}</p>
              )}

              <div style={tokens.modals.buttonGroup}>
                <button onClick={() => setStep(2)} style={{
                  ...tokens.buttons.secondary,
                  flex: 1,
                }}>
                  Zuruck
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    ...tokens.buttons.primary,
                    flex: 2,
                    background: tokens.gradients.success,
                    opacity: saving ? 0.7 : 1,
                  }}
                  disabled={saving}
                >
                  {saving ? "Speichern..." : "Vereinbarung erstellen"}
                </button>
              </div>

              {formData.responsible !== "me" && (
                <p style={{
                  ...tokens.typography.small,
                  textAlign: "center",
                  marginTop: "16px",
                }}>
                  &#8505;&#65039; {formData.responsible === "both" ? "Ihr musst beide" : profile?.partner_name + " muss"} zustimmen,
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
