/**
 * ANALYSIS VIEW - components/AnalysisView.js
 * Session-Analyse Anzeige mit Agreement Suggestion Support
 */
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

export default function AnalysisView({ sessionId, onClose }) {
  const { user, profile } = useAuth();
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
    kommunikation: "💬 Kommunikation",
    kinder: "👶 Kinder & Familie",
    finanzen: "💰 Finanzen",
    arbeit: "💼 Arbeit",
    intimität: "❤️ Intimität",
    alltag: "🏠 Alltag",
    zeit: "⏰ Zeit",
    vertrauen: "🤝 Vertrauen",
    zukunft: "🔮 Zukunft",
    anerkennung: "⭐ Anerkennung",
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

  // Simple markdown-like rendering
  const renderAnalysis = (text) => {
    if (!text) return null;
    
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} style={styles.mainTitle}>{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <h3 key={i} style={styles.sectionTitle}>{line.replace(/\*\*/g, "")}</h3>;
      }
      if (line.startsWith("**")) {
        const parts = line.split("**");
        return (
          <p key={i} style={styles.paragraph}>
            <strong>{parts[1]}</strong>{parts[2]}
          </p>
        );
      }
      if (line.trim()) {
        return <p key={i} style={styles.paragraph}>{line}</p>;
      }
      return null;
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Analyse wird erstellt...</p>
            <p style={styles.loadingSubtext}>Einen Moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <p style={styles.errorText}>{error}</p>
            <button onClick={onClose} style={styles.button}>Schliessen</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Session-Analyse</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {themes.length > 0 && (
          <div style={styles.themesContainer}>
            {themes.map((theme) => (
              <span key={theme} style={styles.themeTag}>
                {themeLabels[theme] || theme}
              </span>
            ))}
          </div>
        )}

        <div style={styles.analysisContent}>
          {renderAnalysis(analysis)}
        </div>

        {/* Agreement Suggestion */}
        {suggestion && !agreementSaved && (
          <div style={styles.suggestionBox}>
            <div style={styles.suggestionHeader}>
              <span style={styles.suggestionIcon}>💡</span>
              <h4 style={styles.suggestionTitle}>Mögliche Vereinbarung erkannt</h4>
            </div>
            
            {!showAgreementEditor ? (
              <>
                <p style={styles.suggestionText}>"{suggestion.title}"</p>
                {suggestion.underlying_need && (
                  <p style={styles.suggestionNeed}>
                    Dahinter: {suggestion.underlying_need}
                  </p>
                )}
                
                <div style={styles.suggestionActions}>
                  <button 
                    onClick={() => setShowAgreementEditor(true)}
                    style={styles.editButton}
                  >
                    Anpassen & Speichern
                  </button>
                  <button 
                    onClick={handleSaveAgreement}
                    style={styles.saveButton}
                    disabled={savingAgreement}
                  >
                    {savingAgreement ? "..." : "So übernehmen"}
                  </button>
                  <button 
                    onClick={handleDismissSuggestion}
                    style={styles.dismissButton}
                  >
                    Nicht relevant
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.editorForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Vereinbarung</label>
                  <input
                    type="text"
                    value={editedAgreement.title}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement, 
                      title: e.target.value
                    })}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Warum wichtig? (optional)</label>
                  <input
                    type="text"
                    value={editedAgreement.underlyingNeed}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement, 
                      underlyingNeed: e.target.value
                    })}
                    style={styles.formInput}
                    placeholder="Das Bedürfnis dahinter..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Wer ist verantwortlich?</label>
                  <div style={styles.radioGroup}>
                    {["both", "user_a", "user_b"].map(value => (
                      <label key={value} style={styles.radioLabel}>
                        <input
                          type="radio"
                          name="responsible"
                          value={value}
                          checked={editedAgreement.responsible === value}
                          onChange={(e) => setEditedAgreement({
                            ...editedAgreement,
                            responsible: e.target.value
                          })}
                          style={styles.radioInput}
                        />
                        {responsibleLabels[value]}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Check-in in</label>
                  <select
                    value={editedAgreement.checkInDays}
                    onChange={(e) => setEditedAgreement({
                      ...editedAgreement,
                      checkInDays: parseInt(e.target.value)
                    })}
                    style={styles.formSelect}
                  >
                    <option value={7}>1 Woche</option>
                    <option value={14}>2 Wochen</option>
                    <option value={21}>3 Wochen</option>
                    <option value={30}>1 Monat</option>
                  </select>
                </div>

                <div style={styles.editorActions}>
                  <button 
                    onClick={() => setShowAgreementEditor(false)}
                    style={styles.cancelButton}
                  >
                    Abbrechen
                  </button>
                  <button 
                    onClick={handleSaveAgreement}
                    style={styles.confirmButton}
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
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✓</span>
            <p style={styles.successText}>
              Vereinbarung gespeichert! 
              {editedAgreement.responsible === "both" 
                ? " Dein Partner muss noch zustimmen."
                : ""}
            </p>
          </div>
        )}

        <button onClick={onClose} style={styles.doneButton}>
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

const styles = {
  container: {
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
    padding: "24px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px",
  },
  themesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  themeTag: {
    background: "linear-gradient(135deg, #f3e8ff, #fae8ff)",
    color: "#7c3aed",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  analysisContent: {
    marginBottom: "24px",
  },
  mainTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#8b5cf6",
    marginTop: "0",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginTop: "20px",
    marginBottom: "8px",
  },
  paragraph: {
    color: "#4b5563",
    lineHeight: "1.7",
    marginBottom: "12px",
    fontSize: "15px",
  },
  
  // Agreement Suggestion styles
  suggestionBox: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid #fcd34d",
  },
  suggestionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  suggestionIcon: {
    fontSize: "24px",
  },
  suggestionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#92400e",
    margin: 0,
  },
  suggestionText: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#78350f",
    margin: "0 0 8px 0",
  },
  suggestionNeed: {
    fontSize: "14px",
    color: "#a16207",
    margin: "0 0 16px 0",
    fontStyle: "italic",
  },
  suggestionActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  editButton: {
    padding: "10px 16px",
    background: "white",
    color: "#92400e",
    border: "2px solid #fbbf24",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  saveButton: {
    padding: "10px 16px",
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  dismissButton: {
    padding: "10px 16px",
    background: "transparent",
    color: "#a16207",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  
  // Editor form styles
  editorForm: {
    marginTop: "16px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#78350f",
    marginBottom: "6px",
  },
  formInput: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #fcd34d",
    fontSize: "15px",
    background: "white",
    outline: "none",
  },
  formSelect: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "2px solid #fcd34d",
    fontSize: "15px",
    background: "white",
    outline: "none",
  },
  radioGroup: {
    display: "flex",
    gap: "16px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#78350f",
    cursor: "pointer",
  },
  radioInput: {
    accentColor: "#f59e0b",
  },
  editorActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  cancelButton: {
    padding: "10px 20px",
    background: "transparent",
    color: "#a16207",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
  confirmButton: {
    padding: "12px 24px",
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  
  // Success box
  successBox: {
    background: "#d1fae5",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  successIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#10b981",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
  },
  successText: {
    color: "#065f46",
    fontSize: "14px",
    margin: 0,
  },
  
  doneButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  loadingText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  loadingSubtext: {
    color: "#6b7280",
    fontSize: "14px",
  },
  errorContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  errorIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  errorText: {
    color: "#dc2626",
    marginBottom: "20px",
  },
  button: {
    padding: "12px 24px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    cursor: "pointer",
  },
};
