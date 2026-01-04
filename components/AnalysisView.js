/**
 * ANALYSIS VIEW - components/AnalysisView.js
 * Session-Analyse Anzeige mit Agreement Suggestion Support
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";

export default function AnalysisView({ sessionId, onClose }) {
  const { user, profile } = useAuth();
  const { tokens } = useTheme();
  const [analysis, setAnalysis] = useState(null);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Agreement suggestion state
  const [suggestion, setSuggestion] = useState(null);
  const [showAgreementEditor, setShowAgreementEditor] = useState(false);
  const [editedAgreement, setEditedAgreement] = useState({
    title: "",
    underlyingNeed: "",
    responsible: "both",
    type: "behavior",
    checkInDays: 14
  });
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [agreementSaved, setAgreementSaved] = useState(false);

  // Couple data for correct user_a/user_b mapping
  const [coupleData, setCoupleData] = useState(null);

  useEffect(() => {
    loadOrGenerateAnalysis();
  }, [sessionId]);

  const loadOrGenerateAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, check if analysis already exists
      const { data: session, error: fetchError } = await supabase
        .from("sessions")
        .select("analysis, themes, type, couple_id")
        .eq("id", sessionId)
        .single();

      if (fetchError) {
        throw new Error("Session nicht gefunden");
      }

      // If analysis exists, show it
      if (session.analysis) {
        setAnalysis(session.analysis);
        if (session.themes) {
          const parsedThemes = typeof session.themes === 'string'
            ? JSON.parse(session.themes)
            : session.themes;
          setThemes(parsedThemes || []);
        }

        // Check for pending suggestions and fetch couple data
        if (session.couple_id) {
          await loadPendingSuggestion(session.couple_id, sessionId);
          await loadCoupleData(session.couple_id);
        }

        setLoading(false);
        return;
      }

      // No analysis yet - generate one
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }

      setAnalysis(data.analysis);
      setThemes(data.themes || []);

      // Check for suggested agreement
      if (data.suggestedAgreement) {
        setSuggestion(data.suggestedAgreement);
        setEditedAgreement({
          title: data.suggestedAgreement.title,
          underlyingNeed: data.suggestedAgreement.underlyingNeed || "",
          responsible: data.suggestedAgreement.responsible || "both",
          type: "behavior",
          checkInDays: 14
        });

        // Load couple data for correct name mapping
        if (profile?.couple_id) {
          await loadCoupleData(profile.couple_id);
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSuggestion = async (coupleId, sessionId) => {
    try {
      const response = await fetch(
        `/api/agreements/suggestions?coupleId=${coupleId}&sessionId=${sessionId}`
      );
      const data = await response.json();

      if (data.suggestions?.length > 0) {
        const pending = data.suggestions.find(s => s.status === "pending");
        if (pending) {
          setSuggestion(pending);
          setEditedAgreement({
            title: pending.title,
            underlyingNeed: pending.underlying_need || "",
            responsible: pending.responsible || "both",
            type: "behavior",
            checkInDays: 14
          });
        }
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    }
  };

  const loadCoupleData = async (coupleId) => {
    try {
      const { data: couple, error } = await supabase
        .from("couples")
        .select("user_a_id, user_b_id")
        .eq("id", coupleId)
        .single();

      if (!error && couple) {
        setCoupleData(couple);
      }
    } catch (err) {
      console.error("Failed to load couple data:", err);
    }
  };

  const handleSaveAgreement = async () => {
    if (!suggestion || !user || !profile?.couple_id) return;

    setSavingAgreement(true);
    try {
      const response = await fetch("/api/agreements/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          action: "accept",
          userId: user.id,
          title: editedAgreement.title,
          underlyingNeed: editedAgreement.underlyingNeed,
          responsible: editedAgreement.responsible,
          type: editedAgreement.type,
          checkInFrequencyDays: editedAgreement.checkInDays
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAgreementSaved(true);
        setSuggestion(null);
        setShowAgreementEditor(false);
      }
    } catch (err) {
      console.error("Failed to save agreement:", err);
    } finally {
      setSavingAgreement(false);
    }
  };

  const handleDismissSuggestion = async () => {
    if (!suggestion) return;

    try {
      await fetch("/api/agreements/suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          action: "dismiss",
          userId: user?.id
        }),
      });
      setSuggestion(null);
    } catch (err) {
      console.error("Failed to dismiss suggestion:", err);
    }
  };

  const themeLabels = {
    kommunikation: "Kommunikation",
    kinder: "Kinder & Familie",
    finanzen: "Finanzen",
    arbeit: "Arbeit",
    intimitat: "Intimitat",
    alltag: "Alltag",
    zeit: "Zeit",
    vertrauen: "Vertrauen",
    zukunft: "Zukunft",
    anerkennung: "Anerkennung",
  };

  // Dynamically map user_a/user_b to correct names based on couple data
  const getResponsibleLabels = () => {
    // If we have couple data, map correctly
    if (coupleData && user) {
      const isUserA = coupleData.user_a_id === user.id;
      return {
        both: "Beide",
        user_a: isUserA ? (profile?.name || "Du") : (profile?.partner_name || "Partner"),
        user_b: isUserA ? (profile?.partner_name || "Partner") : (profile?.name || "Du")
      };
    }
    // Fallback if no couple data
    return {
      both: "Beide",
      user_a: profile?.name || "Du",
      user_b: profile?.partner_name || "Partner"
    };
  };
  const responsibleLabels = getResponsibleLabels();

  // Determine if current user can accept the agreement
  const canUserAccept = () => {
    if (!suggestion || !user || !coupleData) return false;

    const responsible = suggestion.responsible || editedAgreement.responsible;
    const isUserA = coupleData.user_a_id === user.id;

    // "both" - everyone can accept (needs mutual approval)
    if (responsible === "both") return true;

    // user_a responsible - only user_a can accept
    if (responsible === "user_a" && isUserA) return true;

    // user_b responsible - only user_b can accept
    if (responsible === "user_b" && !isUserA) return true;

    return false;
  };

  // Get the name of the person who needs to accept
  const getResponsiblePersonName = () => {
    if (!suggestion || !coupleData || !user) return "Partner";

    const responsible = suggestion.responsible || editedAgreement.responsible;
    const isUserA = coupleData.user_a_id === user.id;

    if (responsible === "both") return null; // Both can accept
    if (responsible === "user_a") {
      return isUserA ? null : (profile?.partner_name || "Partner");
    }
    if (responsible === "user_b") {
      return isUserA ? (profile?.partner_name || "Partner") : null;
    }
    return null;
  };

  // Simple markdown-like rendering
  const renderAnalysis = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: tokens.colors.aurora.lavender,
            marginTop: "0",
            marginBottom: "16px",
            fontFamily: tokens.fonts.display,
          }}>{line.replace("## ", "")}</h2>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h3 key={i} style={{
            ...tokens.typography.h3,
            fontSize: "16px",
            marginTop: "20px",
          }}>{line.replace(/\*\*/g, "")}</h3>
        );
      }
      if (line.startsWith("**")) {
        const parts = line.split("**");
        return (
          <p key={i} style={{
            ...tokens.typography.body,
            marginBottom: "12px",
          }}>
            <strong style={{ color: tokens.colors.text.primary }}>{parts[1]}</strong>{parts[2]}
          </p>
        );
      }
      if (line.trim()) {
        return (
          <p key={i} style={{
            ...tokens.typography.body,
            marginBottom: "12px",
          }}>{line}</p>
        );
      }
      return null;
    });
  };

  if (loading) {
    return (
      <div style={tokens.modals.overlay}>
        <div style={tokens.modals.container}>
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <div style={{
              ...tokens.loaders.spinner(50),
              margin: "0 auto 20px",
            }} />
            <p style={{
              ...tokens.typography.h3,
              marginBottom: "8px",
            }}>Analyse wird erstellt...</p>
            <p style={tokens.typography.small}>Einen Moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={tokens.modals.overlay}>
        <div style={tokens.modals.container}>
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <span style={{
              fontSize: "48px",
              display: "block",
              marginBottom: "16px",
            }}>&#9888;&#65039;</span>
            <p style={{
              ...tokens.alerts.error,
              marginBottom: "20px",
            }}>{error}</p>
            <button onClick={onClose} style={tokens.buttons.secondary}>
              Schliessen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={tokens.modals.overlay}>
      <div style={tokens.modals.container}>
        <div style={tokens.modals.header}>
          <h2 style={tokens.modals.title}>Session-Analyse</h2>
          <button onClick={onClose} style={tokens.buttons.icon}>
            <span style={{ fontSize: "24px" }}>x</span>
          </button>
        </div>

        {themes.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "20px",
          }}>
            {themes.map((theme) => (
              <span key={theme} style={tokens.badges.theme}>
                {themeLabels[theme] || theme}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          {renderAnalysis(analysis)}
        </div>

        {/* Agreement Suggestion */}
        {suggestion && !agreementSaved && (
          <div style={{
            ...tokens.alerts.warning,
            marginBottom: "20px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}>
              <span style={{ fontSize: "24px" }}>&#128161;</span>
              <h4 style={{
                ...tokens.alerts.warningText,
                fontSize: "16px",
                fontWeight: "600",
                margin: 0,
              }}>Mogliche Vereinbarung erkannt</h4>
            </div>

            {!showAgreementEditor ? (
              <>
                <p style={{
                  ...tokens.alerts.warningText,
                  fontSize: "15px",
                  fontWeight: "500",
                  margin: "0 0 8px 0",
                }}>"{suggestion.title}"</p>
                {suggestion.underlying_need && (
                  <p style={{
                    ...tokens.alerts.warningText,
                    fontSize: "14px",
                    margin: "0 0 16px 0",
                    fontStyle: "italic",
                    opacity: 0.8,
                  }}>
                    Dahinter: {suggestion.underlying_need}
                  </p>
                )}

                {/* Show who is responsible */}
                {suggestion.responsible && suggestion.responsible !== "both" && (
                  <p style={{
                    ...tokens.alerts.warningText,
                    fontSize: "13px",
                    margin: "0 0 12px 0",
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: tokens.radii.sm,
                    display: "inline-block",
                  }}>
                    Verantwortlich: <strong>{responsibleLabels[suggestion.responsible]}</strong>
                  </p>
                )}

                {canUserAccept() ? (
                  // User can accept - show action buttons
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}>
                    <button
                      onClick={() => setShowAgreementEditor(true)}
                      style={{
                        ...tokens.buttons.secondaryOutline,
                        ...tokens.alerts.warningText,
                        padding: "10px 16px",
                        fontSize: "14px",
                      }}
                    >
                      Anpassen & Speichern
                    </button>
                    <button
                      onClick={handleSaveAgreement}
                      style={{
                        ...tokens.buttons.primarySmall,
                        background: tokens.colors.warning,
                      }}
                      disabled={savingAgreement}
                    >
                      {savingAgreement ? "..." : "So ubernehmen"}
                    </button>
                    <button
                      onClick={handleDismissSuggestion}
                      style={{
                        ...tokens.buttons.ghost,
                        ...tokens.alerts.warningText,
                        opacity: 0.8,
                      }}
                    >
                      Nicht relevant
                    </button>
                  </div>
                ) : (
                  // User cannot accept - show waiting message
                  <div style={{
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: tokens.radii.md,
                    padding: "16px",
                    textAlign: "center",
                  }}>
                    <p style={{
                      ...tokens.alerts.warningText,
                      fontSize: "15px",
                      margin: "0 0 12px 0",
                      fontWeight: "500",
                    }}>
                      &#9203; Warte auf {getResponsiblePersonName()}s Bestatigung
                    </p>
                    <button
                      onClick={handleDismissSuggestion}
                      style={{
                        ...tokens.buttons.ghost,
                        ...tokens.alerts.warningText,
                        border: `1px solid currentColor`,
                        borderRadius: tokens.radii.sm,
                        fontSize: "13px",
                      }}
                    >
                      Das stimmt nicht - ablehnen
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ marginTop: "16px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    ...tokens.inputs.label,
                    ...tokens.alerts.warningText,
                  }}>Vereinbarung</label>
                  <input
                    type="text"
                    value={editedAgreement.title}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement,
                      title: e.target.value
                    })}
                    style={tokens.inputs.text}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    ...tokens.inputs.label,
                    ...tokens.alerts.warningText,
                  }}>Warum wichtig? (optional)</label>
                  <input
                    type="text"
                    value={editedAgreement.underlyingNeed}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement,
                      underlyingNeed: e.target.value
                    })}
                    style={tokens.inputs.text}
                    placeholder="Das Bedurfnis dahinter..."
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    ...tokens.inputs.label,
                    ...tokens.alerts.warningText,
                  }}>Wer ist verantwortlich?</label>
                  <div style={{
                    display: "flex",
                    gap: "16px",
                  }}>
                    {["both", "user_a", "user_b"].map(value => (
                      <label key={value} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                        ...tokens.alerts.warningText,
                        cursor: "pointer",
                      }}>
                        <input
                          type="radio"
                          name="responsible"
                          value={value}
                          checked={editedAgreement.responsible === value}
                          onChange={(e) => setEditedAgreement({
                            ...editedAgreement,
                            responsible: e.target.value
                          })}
                          style={{ accentColor: tokens.colors.warning }}
                        />
                        {responsibleLabels[value]}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    ...tokens.inputs.label,
                    ...tokens.alerts.warningText,
                  }}>Check-in in</label>
                  <select
                    value={editedAgreement.checkInDays}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement,
                      checkInDays: parseInt(e.target.value)
                    })}
                    style={tokens.inputs.text}
                  >
                    <option value={7}>1 Woche</option>
                    <option value={14}>2 Wochen</option>
                    <option value={21}>3 Wochen</option>
                    <option value={30}>1 Monat</option>
                  </select>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}>
                  <button
                    onClick={() => setShowAgreementEditor(false)}
                    style={{
                      ...tokens.buttons.ghost,
                      ...tokens.alerts.warningText,
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveAgreement}
                    style={{
                      ...tokens.buttons.primary,
                      background: tokens.colors.warning,
                      opacity: savingAgreement || !editedAgreement.title.trim() ? 0.6 : 1,
                    }}
                    disabled={savingAgreement || !editedAgreement.title.trim()}
                  >
                    {savingAgreement ? "Speichern..." : "Vereinbarung speichern"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success message */}
        {agreementSaved && (
          <div style={{
            ...tokens.alerts.success,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}>
            <span style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: tokens.colors.success,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold",
              flexShrink: 0,
            }}>&#10003;</span>
            <p style={{
              color: tokens.colors.success,
              fontSize: "14px",
              margin: 0,
            }}>
              Vereinbarung gespeichert!
              {editedAgreement.responsible === "both"
                ? " Dein Partner muss noch zustimmen."
                : ""}
            </p>
          </div>
        )}

        <button onClick={onClose} style={{
          ...tokens.buttons.primary,
          width: "100%",
        }}>
          {agreementSaved ? "Fertig" : "Verstanden"}
        </button>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
