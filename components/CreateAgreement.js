/**
 * CREATE AGREEMENT COMPONENT - components/CreateAgreement.js
 * Formular für manuelle Agreement-Erstellung
 */
"use client";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function CreateAgreement({ onClose, onCreated }) {
  const { user, profile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
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
        }}>
          <button onClick={onClose} style={{
            background: "none",
            border: "none",
            fontSize: "16px",
            color: tokens.colors.text.muted,
            cursor: "pointer",
            fontFamily: tokens.fonts.body,
          }}>← Zurück</button>
          <span style={{
            fontSize: "13px",
            color: tokens.colors.text.muted,
          }}>Schritt {step} von 3</span>
        </div>

        {/* Progress */}
        <div style={{
          height: "4px",
          background: tokens.colors.bg.soft,
        }}>
          <div style={{
            height: "100%",
            background: `linear-gradient(90deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
            width: `${(step / 3) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>

        <div style={{ padding: "24px 20px 32px" }}>
          {/* Step 1: What */}
          {step === 1 && (
            <>
              <h2 style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: tokens.colors.text.primary,
                margin: "0 0 8px 0",
                fontFamily: tokens.fonts.display,
              }}>Was vereinbart ihr?</h2>
              <p style={{
                color: tokens.colors.text.muted,
                fontSize: "15px",
                margin: "0 0 24px 0",
              }}>
                Beschreibe die Vereinbarung konkret und positiv.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: tokens.colors.text.primary,
                  marginBottom: "8px",
                }}>Vereinbarung</label>
                <textarea
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: tokens.radii.md,
                    border: `2px solid ${tokens.colors.bg.soft}`,
                    fontSize: "16px",
                    minHeight: "100px",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: tokens.colors.bg.surface,
                    color: tokens.colors.text.primary,
                    fontFamily: tokens.fonts.body,
                    boxSizing: "border-box",
                  }}
                  placeholder="z.B. Ich rufe an wenn ich mehr als 30 Minuten später komme"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: tokens.colors.text.primary,
                  marginBottom: "8px",
                }}>Warum ist das wichtig? (optional)</label>
                <textarea
                  value={formData.underlyingNeed}
                  onChange={(e) => setFormData({ ...formData, underlyingNeed: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: tokens.radii.md,
                    border: `2px solid ${tokens.colors.bg.soft}`,
                    fontSize: "16px",
                    minHeight: "80px",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: tokens.colors.bg.surface,
                    color: tokens.colors.text.primary,
                    fontFamily: tokens.fonts.body,
                    boxSizing: "border-box",
                  }}
                  placeholder="z.B. Damit du dich sicher fühlst und dir keine Sorgen machst"
                />
                <p style={{
                  fontSize: "13px",
                  color: tokens.colors.text.muted,
                  marginTop: "8px",
                }}>
                  Das Bedürfnis dahinter hilft, die Vereinbarung bedeutsam zu machen
                </p>
              </div>

              <button
                onClick={() => formData.title.trim() && setStep(2)}
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
                  fontFamily: tokens.fonts.body,
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
              <h2 style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: tokens.colors.text.primary,
                margin: "0 0 16px 0",
                fontFamily: tokens.fonts.display,
              }}>Um was geht es?</h2>

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
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "16px",
                      background: formData.type === option.value
                        ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                        : tokens.colors.bg.surface,
                      border: `2px solid ${formData.type === option.value ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                      borderRadius: tokens.radii.md,
                      cursor: "pointer",
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
                      fontSize: "12px",
                      color: tokens.colors.text.muted,
                      marginTop: "4px",
                    }}>{option.desc}</span>
                  </button>
                ))}
              </div>

              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "24px 0 12px 0",
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
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px",
                      background: formData.responsible === option.value
                        ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                        : tokens.colors.bg.surface,
                      border: `2px solid ${formData.responsible === option.value ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                      borderRadius: tokens.radii.md,
                      cursor: "pointer",
                      textAlign: "left",
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
                      <span style={{
                        fontSize: "12px",
                        color: tokens.colors.text.muted,
                      }}>{option.desc}</span>
                    </div>
                    {formData.responsible === option.value && (
                      <span style={{
                        color: tokens.colors.aurora.lavender,
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}>
                <button onClick={() => setStep(1)} style={{
                  flex: 1,
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  color: tokens.colors.text.primary,
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "16px",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}>
                  Zurück
                </button>
                <button onClick={() => setStep(3)} style={{
                  flex: 2,
                  padding: "16px",
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                  color: "white",
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}>
                  Weiter
                </button>
              </div>
            </>
          )}

          {/* Step 3: Check-in */}
          {step === 3 && (
            <>
              <h2 style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: tokens.colors.text.primary,
                margin: "0 0 8px 0",
                fontFamily: tokens.fonts.display,
              }}>Wann wollt ihr darüber sprechen?</h2>
              <p style={{
                color: tokens.colors.text.muted,
                fontSize: "15px",
                margin: "0 0 24px 0",
              }}>
                Regelmässige Check-ins helfen, dranzubleiben.
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
                      padding: "16px",
                      background: formData.checkInDays === option.value
                        ? (isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff")
                        : tokens.colors.bg.surface,
                      border: `2px solid ${formData.checkInDays === option.value ? tokens.colors.aurora.lavender : tokens.colors.bg.soft}`,
                      borderRadius: tokens.radii.md,
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "500",
                      color: formData.checkInDays === option.value ? tokens.colors.aurora.lavender : tokens.colors.text.primary,
                      fontFamily: tokens.fonts.body,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div style={{
                background: tokens.colors.bg.surface,
                borderRadius: tokens.radii.md,
                padding: "16px",
                marginBottom: "24px",
              }}>
                <h4 style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: tokens.colors.text.muted,
                  margin: "0 0 12px 0",
                }}>Zusammenfassung</h4>
                <p style={{
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  margin: "0 0 8px 0",
                  lineHeight: "1.5",
                }}>
                  <strong>Vereinbarung:</strong> {formData.title}
                </p>
                {formData.underlyingNeed && (
                  <p style={{
                    fontSize: "14px",
                    color: tokens.colors.text.primary,
                    margin: "0 0 8px 0",
                    lineHeight: "1.5",
                  }}>
                    <strong>Dahinter:</strong> {formData.underlyingNeed}
                  </p>
                )}
                <p style={{
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  margin: "0 0 8px 0",
                  lineHeight: "1.5",
                }}>
                  <strong>Verantwortlich:</strong>{" "}
                  {formData.responsible === "both" ? "Beide" :
                    formData.responsible === "me" ? profile?.name :
                      profile?.partner_name}
                </p>
                <p style={{
                  fontSize: "14px",
                  color: tokens.colors.text.primary,
                  margin: 0,
                  lineHeight: "1.5",
                }}>
                  <strong>Check-in:</strong> In {formData.checkInDays} Tagen
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
                }}>{error}</p>
              )}

              <div style={{
                display: "flex",
                gap: "12px",
              }}>
                <button onClick={() => setStep(2)} style={{
                  flex: 1,
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  color: tokens.colors.text.primary,
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "16px",
                  cursor: "pointer",
                  fontFamily: tokens.fonts.body,
                }}>
                  Zurück
                </button>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 2,
                    padding: "16px",
                    background: `linear-gradient(135deg, ${tokens.colors.success}, #059669)`,
                    color: "white",
                    border: "none",
                    borderRadius: tokens.radii.md,
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: tokens.fonts.body,
                    opacity: saving ? 0.7 : 1,
                  }}
                  disabled={saving}
                >
                  {saving ? "Speichern..." : "Vereinbarung erstellen"}
                </button>
              </div>

              {formData.responsible !== "me" && (
                <p style={{
                  fontSize: "13px",
                  color: tokens.colors.text.muted,
                  textAlign: "center",
                  marginTop: "16px",
                }}>
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
