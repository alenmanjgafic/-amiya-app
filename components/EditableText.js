"use client";

/**
 * EDITABLE TEXT COMPONENT - Collaborative Editing
 *
 * Vision: Guided, collaborative text refinement with Amiya
 *
 * Flow:
 * 1. User taps on a segment they want to change
 * 2. Modal opens with quick feedback options
 * 3. User selects feedback type or writes custom
 * 4. Amiya suggests alternatives
 * 5. User picks one or writes own version
 * 6. Text updates with visual indicator
 */

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Check, MessageSquare, ChevronRight } from "lucide-react";

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
  const [segments, setSegments] = useState([]);
  const [editedSegments, setEditedSegments] = useState(new Set());
  const [pressedIndex, setPressedIndex] = useState(null);

  // Modal state
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [modalStep, setModalStep] = useState("feedback"); // 'feedback' | 'alternatives' | 'loading'
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [customFeedback, setCustomFeedback] = useState("");
  const [alternatives, setAlternatives] = useState([]);
  const [amiyaResponse, setAmiyaResponse] = useState("");
  const [customAlternative, setCustomAlternative] = useState("");

  // Split text into segments
  useEffect(() => {
    if (!text) return;

    // Split by natural phrases (commas, conjunctions, sentence parts)
    const splitPattern = /([^,;.!?]+[,;.!?]?\s*)/g;
    const parts = text.match(splitPattern) || [text];

    // Combine very short segments with previous
    const merged = [];
    let current = "";

    for (const part of parts) {
      current += part;
      // Keep segment if it's long enough or ends with punctuation
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

    // Build feedback description
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
        // Fallback: Call API directly
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

    // Mark as edited
    const newEdited = new Set(editedSegments);
    newEdited.add(selectedIndex);
    setEditedSegments(newEdited);

    // Notify parent
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
          <MessageSquare size={12} />
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
            {editedSegments.has(index) && (
              <span style={styles.editedMarker}>|</span>
            )}
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
                {/* Selected text */}
                <div style={styles.selectedTextBox}>
                  <span style={styles.selectedText}>
                    "{selectedSegment.text}"
                  </span>
                  <span style={styles.selectedLabel}>ausgewählt</span>
                </div>

                <p style={styles.modalQuestion}>Was stört dich daran?</p>

                {/* Feedback chips */}
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
                <Sparkles size={32} style={styles.loadingIcon} />
                <p>Amiya denkt nach...</p>
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

                {/* Alternative options */}
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
                    style={styles.customInput}
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

const styles = {
  container: {
    position: "relative",
  },
  hint: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#888",
    marginBottom: 12,
    opacity: 0.8,
  },
  textContainer: {
    lineHeight: 1.8,
    fontSize: 15,
  },
  segment: {
    cursor: "pointer",
    padding: "4px 6px",
    margin: "2px 0",
    borderRadius: 6,
    transition: "all 0.15s ease",
    display: "inline",
    backgroundColor: "rgba(232, 213, 196, 0.08)",
    borderBottom: "1px dashed rgba(232, 213, 196, 0.3)",
    // Touch feedback via :active would need CSS, so we add visual hint
  },
  editedSegment: {
    backgroundColor: "rgba(139, 201, 139, 0.15)",
    color: "#a8e8a8",
    borderLeft: "2px solid #8bc98b",
    paddingLeft: 8,
    borderBottom: "none",
  },
  pressedSegment: {
    backgroundColor: "rgba(232, 213, 196, 0.25)",
    transform: "scale(0.98)",
  },
  editedMarker: {
    color: "#8bc98b",
    fontWeight: "bold",
    marginRight: 4,
  },
  readOnlySegment: {
    cursor: "default",
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    paddingBottom: 32,
    position: "relative",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    padding: 4,
  },
  selectedTextBox: {
    backgroundColor: "#0d0d0d",
    border: "1px solid #333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  selectedText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#e8d5c4",
  },
  selectedLabel: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    alignSelf: "flex-end",
  },
  modalQuestion: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 16,
  },
  chipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    padding: "8px 14px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: 20,
    color: "#ccc",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  chipSelected: {
    backgroundColor: "#e8d5c4",
    borderColor: "#e8d5c4",
    color: "#0a0a0a",
  },
  orLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 12,
  },
  customInput: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0d0d0d",
    border: "1px solid #333",
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    marginBottom: 20,
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "14px 20px",
    backgroundColor: "#e8d5c4",
    border: "none",
    borderRadius: 12,
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 16,
    color: "#888",
  },
  loadingIcon: {
    color: "#e8d5c4",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  amiyaHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#e8d5c4",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 12,
  },
  amiyaResponse: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#fff",
    marginBottom: 20,
  },
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
    padding: "14px 16px",
    backgroundColor: "#0d0d0d",
    border: "1px solid #333",
    borderRadius: 12,
    color: "#fff",
    fontSize: 14,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "2px solid #e8d5c4",
    flexShrink: 0,
    marginTop: 2,
  },
  customAlternativeRow: {
    display: "flex",
    gap: 12,
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#8bc98b",
    border: "none",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
};
