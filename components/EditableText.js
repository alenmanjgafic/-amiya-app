"use client";

/**
 * EDITABLE TEXT COMPONENT
 *
 * Tap-to-edit text editor for message suggestions
 * Users can tap on any word/phrase to edit it inline
 *
 * Features:
 * - Segments text into editable chunks
 * - Tap to open edit popover
 * - Real-time text updates
 * - Highlights edited sections
 */

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";

export default function EditableText({ text, onChange, readOnly = false }) {
  const [segments, setSegments] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editedIndices, setEditedIndices] = useState(new Set());
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Split text into segments (by sentence or clause)
  useEffect(() => {
    if (!text) return;

    // Split by sentence-ending punctuation, keeping the delimiter
    const parts = text.split(/([.!?,;:]\s*)/);
    const newSegments = [];

    for (let i = 0; i < parts.length; i += 2) {
      const content = parts[i] || "";
      const delimiter = parts[i + 1] || "";
      if (content.trim() || delimiter.trim()) {
        newSegments.push({
          text: content + delimiter,
          original: content + delimiter,
        });
      }
    }

    // If we only have one segment, split by phrases (commas, conjunctions)
    if (newSegments.length <= 1 && text.length > 50) {
      const phrasesParts = text.split(/(\s*(?:und|aber|oder|weil|dass|wenn|denn|also|jedoch)\s*|,\s*)/i);
      const phraseSegments = [];

      for (let i = 0; i < phrasesParts.length; i++) {
        const part = phrasesParts[i];
        if (part && part.trim()) {
          phraseSegments.push({
            text: part,
            original: part,
          });
        }
      }

      if (phraseSegments.length > 1) {
        setSegments(phraseSegments);
        return;
      }
    }

    setSegments(newSegments.length > 0 ? newSegments : [{ text, original: text }]);
  }, [text]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        cancelEdit();
      }
    };

    if (editingIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [editingIndex]);

  const startEdit = (index) => {
    if (readOnly) return;
    setEditingIndex(index);
    setEditValue(segments[index].text);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;

    const newSegments = [...segments];
    newSegments[editingIndex] = {
      ...newSegments[editingIndex],
      text: editValue,
    };
    setSegments(newSegments);

    // Track edited indices
    const newEdited = new Set(editedIndices);
    newEdited.add(editingIndex);
    setEditedIndices(newEdited);

    // Notify parent of change
    const newText = newSegments.map((s) => s.text).join("");
    onChange?.(newText);

    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  if (!text) return null;

  return (
    <div style={styles.container}>
      {!readOnly && (
        <div style={styles.hint}>
          <Pencil size={12} />
          <span>Tippe auf einen Teil zum Bearbeiten</span>
        </div>
      )}

      <div style={styles.textContainer}>
        {segments.map((segment, index) => (
          <span
            key={index}
            onClick={() => startEdit(index)}
            style={{
              ...styles.segment,
              ...(editedIndices.has(index) ? styles.editedSegment : {}),
              ...(editingIndex === index ? styles.activeSegment : {}),
              ...(readOnly ? styles.readOnlySegment : {}),
            }}
          >
            {segment.text}

            {/* Edit Popover */}
            {editingIndex === index && (
              <div ref={popoverRef} style={styles.popover}>
                <textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={styles.editInput}
                  rows={3}
                />
                <div style={styles.popoverActions}>
                  <button onClick={cancelEdit} style={styles.cancelButton}>
                    <X size={16} />
                  </button>
                  <button onClick={confirmEdit} style={styles.confirmButton}>
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}
          </span>
        ))}
      </div>
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
    marginBottom: 8,
    opacity: 0.8,
  },
  textContainer: {
    lineHeight: 1.7,
    fontSize: 15,
  },
  segment: {
    position: "relative",
    cursor: "pointer",
    padding: "2px 0",
    borderRadius: 4,
    transition: "background-color 0.15s ease",
  },
  editedSegment: {
    backgroundColor: "rgba(139, 201, 139, 0.2)",
    color: "#a8e8a8",
  },
  activeSegment: {
    backgroundColor: "rgba(232, 213, 196, 0.3)",
  },
  readOnlySegment: {
    cursor: "default",
  },
  popover: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    minWidth: 250,
    backgroundColor: "#1a1a1a",
    border: "1px solid #444",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    zIndex: 100,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  editInput: {
    width: "100%",
    padding: 12,
    backgroundColor: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.5,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
  },
  popoverActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#333",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  confirmButton: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#8bc98b",
    border: "none",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};
