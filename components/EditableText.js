"use client";

/**
 * EDITABLE TEXT COMPONENT - Collaborative Editing
 * Uses Amiya Theme System for consistent styling
 *
 * Flow:
 * 1. User taps on a segment they want to change
 * 2. Modal opens with quick feedback options
 * 3. User selects feedback type or writes custom
 * 4. Amiya suggests alternatives
 * 5. User picks one or writes own version
 * 6. Text updates with visual indicator
 */

import { useState, useEffect } from "react";
import { X, Sparkles, Check, Pencil, ChevronRight } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

// Quick feedback options
const FEEDBACK_OPTIONS = [
  { id: "formal", label: "Zu formal" },
  { id: "defensive", label: "Zu defensiv" },
  { id: "not_me", label: "Nicht ich" },
  { id: "too_soft", label: "Zu weich" },
  { id: "too_direct", label: "Zu direkt" },
];

export default function EditableText({
  text,
  onChange,
  onRequestAlternatives,
  partnerName = "Partner",
  readOnly = false,
}) {
  const { tokens } = useTheme();
  const [segments, setSegments] = useState([]);
  const [editedSegments, setEditedSegments] = useState(new Set());
  const [pressedIndex, setPressedIndex] = useState(null);

  // Modal state
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalStep, setModalStep] = useState("feedback");
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [customFeedback, setCustomFeedback] = useState("");
  const [alternatives, setAlternatives] = useState([]);
  const [amiyaResponse, setAmiyaResponse] = useState("");
  const [customAlternative, setCustomAlternative] = useState("");

  // Build dynamic styles based on theme
  const styles = buildStyles(tokens);

  // Split text into segments
  useEffect(() => {
    if (!text) return;

    const splitPattern = /([^,;.!?]+[,;.!?]?\s*)/g;
    const parts = text.match(splitPattern) || [text];

    const merged = [];
    let current = "";

    for (const part of parts) {
      current += part;
      if (current.length > 15 || /[.!?]$/.test(current.trim())) {
        merged.push(current.trim());
        current = "";
      }
    }
    if (current.trim()) {
      if (merged.length > 0) {
        merged[merged.length - 1] += " " + current.trim();
      } else {
        merged.push(current.trim());
      }
    }

    setSegments(merged.map((s) => ({ text: s, original: s })));
  }, [text]);

  const openModal = (segment, index) => {
    if (readOnly) return;
    setSelectedSegment(segment);
    setSelectedIndex(index);
    setModalStep("feedback");
    setSelectedFeedback([]);
    setCustomFeedback("");
    setAlternatives([]);
    setAmiyaResponse("");
    setCustomAlternative("");
  };

  const closeModal = () => {
    setSelectedSegment(null);
    setSelectedIndex(null);
  };

  const toggleFeedback = (id) => {
    setSelectedFeedback((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const requestAlternatives = async () => {
    if (!selectedSegment) return;

    setModalStep("loading");

    const feedbackLabels = selectedFeedback.map(
      (id) => FEEDBACK_OPTIONS.find((o) => o.id === id)?.label
    );
    const feedbackText = [
      ...feedbackLabels,
      customFeedback ? `"${customFeedback}"` : "",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      if (onRequestAlternatives) {
        const result = await onRequestAlternatives(
          selectedSegment.text,
          feedbackText
        );
        setAmiyaResponse(result.explanation || "Hier sind ein paar Alternativen:");
        setAlternatives(result.alternatives || []);
      } else {
        const response = await fetch("/api/coach/reformulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalText: selectedSegment.text,
            feedback: feedbackText,
            fullMessage: text,
            partnerName,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAmiyaResponse(data.explanation);
          setAlternatives(data.alternatives);
        }
      }
    } catch (error) {
      console.error("Failed to get alternatives:", error);
      setAmiyaResponse("Entschuldige, da ist etwas schief gelaufen.");
      setAlternatives([]);
    }

    setModalStep("alternatives");
  };

  const selectAlternative = (newText) => {
    if (selectedIndex === null) return;

    const newSegments = [...segments];
    newSegments[selectedIndex] = {
      ...newSegments[selectedIndex],
      text: newText,
    };
    setSegments(newSegments);

    const newEdited = new Set(editedSegments);
    newEdited.add(selectedIndex);
    setEditedSegments(newEdited);

    const fullText = newSegments.map((s) => s.text).join(" ");
    onChange?.(fullText);

    closeModal();
  };

  const handleCustomAlternative = () => {
    if (customAlternative.trim()) {
      selectAlternative(customAlternative.trim());
    }
  };

  if (!text) return null;

  return (
    <div style={styles.container}>
      {/* Hint */}
      {!readOnly && (
        <div style={styles.hint}>
          <Pencil size={12} />
          <span>Tippe auf einen Teil zum Anpassen</span>
        </div>
      )}

      {/* Text with tappable segments */}
      <div style={styles.textContainer}>
        {segments.map((segment, index) => (
          <span
            key={index}
            onClick={() => openModal(segment, index)}
            onTouchStart={() => setPressedIndex(index)}
            onTouchEnd={() => setPressedIndex(null)}
            onMouseDown={() => setPressedIndex(index)}
            onMouseUp={() => setPressedIndex(null)}
            onMouseLeave={() => setPressedIndex(null)}
            style={{
              ...styles.segment,
              ...(editedSegments.has(index) ? styles.editedSegment : {}),
              ...(pressedIndex === index ? styles.pressedSegment : {}),
              ...(readOnly ? styles.readOnlySegment : {}),
            }}
          >
            {segment.text}{" "}
          </span>
        ))}
      </div>

      {/* Modal */}
      {selectedSegment && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={closeModal} style={styles.closeButton}>
              <X size={20} />
            </button>

            {/* Step 1: Feedback */}
            {modalStep === "feedback" && (
              <>
                <div style={styles.selectedTextBox}>
                  <span style={styles.selectedText}>
                    "{selectedSegment.text}"
                  </span>
                  <span style={styles.selectedLabel}>ausgewahlt</span>
                </div>

                <p style={styles.modalQuestion}>Was stört dich daran?</p>

                <div style={styles.chipsContainer}>
                  {FEEDBACK_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleFeedback(option.id)}
                      style={{
                        ...styles.chip,
                        ...(selectedFeedback.includes(option.id)
                          ? styles.chipSelected
                          : {}),
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <p style={styles.orLabel}>Oder beschreib es:</p>

                <input
                  type="text"
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  placeholder="klingt als würde ich mich rechtfertigen..."
                  style={styles.customInput}
                />

                <button
                  onClick={requestAlternatives}
                  disabled={
                    selectedFeedback.length === 0 && !customFeedback.trim()
                  }
                  style={{
                    ...styles.primaryButton,
                    opacity:
                      selectedFeedback.length === 0 && !customFeedback.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  Neu formulieren
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Loading */}
            {modalStep === "loading" && (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingIcon}>
                  <Sparkles size={32} />
                </div>
                <p style={styles.loadingText}>Amiya denkt nach...</p>
              </div>
            )}

            {/* Step 2: Alternatives */}
            {modalStep === "alternatives" && (
              <>
                <div style={styles.amiyaHeader}>
                  <Sparkles size={16} />
                  <span>AMIYA</span>
                </div>

                <p style={styles.amiyaResponse}>{amiyaResponse}</p>

                <div style={styles.alternativesContainer}>
                  {alternatives.map((alt, index) => (
                    <button
                      key={index}
                      onClick={() => selectAlternative(alt)}
                      style={styles.alternativeOption}
                    >
                      <span style={styles.radioCircle} />
                      <span>"{alt}"</span>
                    </button>
                  ))}
                </div>

                <p style={styles.orLabel}>
                  Oder sag mir wie DU es sagen würdest:
                </p>

                <div style={styles.customAlternativeRow}>
                  <input
                    type="text"
                    value={customAlternative}
                    onChange={(e) => setCustomAlternative(e.target.value)}
                    placeholder="Meine eigene Version..."
                    style={{ ...styles.customInput, marginBottom: 0, flex: 1 }}
                  />
                  <button
                    onClick={handleCustomAlternative}
                    disabled={!customAlternative.trim()}
                    style={{
                      ...styles.checkButton,
                      opacity: !customAlternative.trim() ? 0.5 : 1,
                    }}
                  >
                    <Check size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Build styles dynamically from theme tokens
function buildStyles(tokens) {
  const { colors, radii, shadows } = tokens;

  return {
    container: {
      position: "relative",
    },
    hint: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: colors.text.muted,
      marginBottom: 12,
    },
    textContainer: {
      lineHeight: 1.9,
      fontSize: 15,
      color: colors.text.primary,
    },
    segment: {
      cursor: "pointer",
      padding: "4px 8px",
      margin: "2px 0",
      borderRadius: radii.sm,
      transition: "all 0.15s ease",
      display: "inline",
      backgroundColor: `${colors.aurora.lavender}10`,
      borderBottom: `1px dashed ${colors.aurora.lavender}40`,
    },
    editedSegment: {
      backgroundColor: `${colors.success}20`,
      color: colors.success,
      borderBottom: "none",
      borderLeft: `2px solid ${colors.success}`,
      paddingLeft: 10,
    },
    pressedSegment: {
      backgroundColor: `${colors.aurora.lavender}25`,
      transform: "scale(0.98)",
    },
    readOnlySegment: {
      cursor: "default",
      backgroundColor: "transparent",
      borderBottom: "none",
    },

    // Modal
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.bg.elevated,
      borderRadius: radii.xl,
      padding: 24,
      paddingBottom: 32,
      position: "relative",
      maxHeight: "85vh",
      overflowY: "auto",
      boxShadow: shadows.large,
    },
    closeButton: {
      position: "absolute",
      top: 16,
      right: 16,
      background: "none",
      border: "none",
      color: colors.text.muted,
      cursor: "pointer",
      padding: 4,
    },

    // Selected text box
    selectedTextBox: {
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      borderRadius: radii.md,
      padding: 16,
      marginBottom: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    selectedText: {
      fontSize: 15,
      lineHeight: 1.5,
      color: colors.aurora.lavender,
      fontStyle: "italic",
    },
    selectedLabel: {
      fontSize: 11,
      color: colors.text.muted,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      alignSelf: "flex-end",
    },

    // Question & labels
    modalQuestion: {
      fontSize: 16,
      fontWeight: 500,
      color: colors.text.primary,
      marginBottom: 16,
    },
    orLabel: {
      fontSize: 13,
      color: colors.text.muted,
      marginBottom: 12,
    },

    // Chips
    chipsContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    chip: {
      padding: "10px 16px",
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      borderRadius: radii.pill,
      color: colors.text.secondary,
      fontSize: 14,
      cursor: "pointer",
      transition: "all 0.15s ease",
    },
    chipSelected: {
      backgroundColor: colors.aurora.lavender,
      borderColor: colors.aurora.lavender,
      color: "#ffffff",
    },

    // Inputs
    customInput: {
      width: "100%",
      padding: "14px 16px",
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      borderRadius: radii.md,
      color: colors.text.primary,
      fontSize: 14,
      outline: "none",
      marginBottom: 20,
      boxSizing: "border-box",
    },

    // Primary button
    primaryButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      padding: "16px 24px",
      background: tokens.gradients.mint,
      border: "none",
      borderRadius: radii.md,
      color: "#ffffff",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: shadows.button,
    },

    // Loading
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px",
      gap: 16,
    },
    loadingIcon: {
      color: colors.aurora.lavender,
      animation: "pulse 1.5s ease-in-out infinite",
    },
    loadingText: {
      color: colors.text.muted,
      fontSize: 14,
    },

    // Amiya response
    amiyaHeader: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: colors.aurora.mint,
      textTransform: "uppercase",
      letterSpacing: "1px",
      marginBottom: 12,
      fontWeight: 600,
    },
    amiyaResponse: {
      fontSize: 15,
      lineHeight: 1.6,
      color: colors.text.primary,
      marginBottom: 24,
    },

    // Alternatives
    alternativesContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginBottom: 24,
    },
    alternativeOption: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "16px",
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      borderRadius: radii.md,
      color: colors.text.primary,
      fontSize: 14,
      textAlign: "left",
      cursor: "pointer",
      transition: "all 0.15s ease",
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      border: `2px solid ${colors.aurora.mint}`,
      flexShrink: 0,
      marginTop: 2,
    },

    // Custom alternative row
    customAlternativeRow: {
      display: "flex",
      gap: 12,
      alignItems: "center",
    },
    checkButton: {
      width: 50,
      height: 50,
      borderRadius: radii.md,
      background: tokens.gradients.success,
      border: "none",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    },
  };
}
