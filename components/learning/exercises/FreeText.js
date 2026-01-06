/**
 * FREE TEXT EXERCISE - Card-based text input
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";

export default function FreeText({
  exercise,
  savedResponse,
  onResponse,
  onContinue,
}) {
  const { tokens } = useTheme();
  const [text, setText] = useState(savedResponse?.text || "");

  const minLength = exercise.minLength || 1;
  const canContinue = text.trim().length >= minLength;

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onResponse({ text: newText });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "24px 20px",
      }}
    >
      {/* Card Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          padding: "24px 20px",
          boxShadow: `0 4px 24px ${tokens.colors.aurora.lavender}10`,
        }}
      >
        {/* Question */}
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            lineHeight: "1.4",
            color: tokens.colors.text.primary,
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          {exercise.question}
        </h2>

        {/* Hint */}
        {exercise.hint && (
          <p
            style={{
              textAlign: "center",
              color: tokens.colors.text.muted,
              marginBottom: "20px",
              padding: "12px 16px",
              background: tokens.colors.bg.surface,
              borderRadius: "12px",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {exercise.hint}
          </p>
        )}

        {/* Text Area */}
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={exercise.placeholder || "Deine Antwort..."}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "140px",
              padding: "16px",
              background: tokens.colors.bg.surface,
              border: `1.5px solid ${text ? `${tokens.colors.aurora.lavender}50` : "transparent"}`,
              borderRadius: "14px",
              fontSize: "16px",
              fontFamily: "inherit",
              color: tokens.colors.text.primary,
              resize: "none",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
          />
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          ...tokens.buttons.primary,
          marginTop: "20px",
          opacity: canContinue ? 1 : 0.4,
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        Weiter
      </button>
    </div>
  );
}
