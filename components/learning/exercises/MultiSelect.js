/**
 * MULTI SELECT EXERCISE - Multiple choice question
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";

export default function MultiSelect({
  exercise,
  savedResponse,
  onResponse,
  onContinue,
}) {
  const { tokens } = useTheme();
  const [selected, setSelected] = useState(savedResponse?.selected || []);

  const minSelections = exercise.minSelections || 1;

  const handleToggle = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];

    setSelected(newSelected);
    onResponse({
      selected: newSelected,
      options: newSelected.map((id) =>
        exercise.options.find((o) => o.id === id)
      ),
    });
  };

  const canContinue = selected.length >= minSelections;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
      }}
    >
      {/* Question */}
      <h2
        style={{
          ...tokens.typography.h3,
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        {exercise.question}
      </h2>

      {/* Hint */}
      <p
        style={{
          ...tokens.typography.small,
          textAlign: "center",
          color: tokens.colors.text.muted,
          marginBottom: "24px",
        }}
      >
        Wähle mindestens {minSelections} aus
      </p>

      {/* Options */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "auto",
        }}
      >
        {exercise.options.map((option) => {
          const isSelected = selected.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                background: isSelected
                  ? `${tokens.colors.aurora.lavender}15`
                  : tokens.colors.bg.elevated,
                border: isSelected
                  ? `2px solid ${tokens.colors.aurora.lavender}`
                  : "2px solid transparent",
                borderRadius: tokens.radii.md,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "6px",
                  border: isSelected
                    ? "none"
                    : `2px solid ${tokens.colors.text.muted}`,
                  background: isSelected
                    ? tokens.gradients.primary
                    : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12L10 17L19 7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Label */}
              <p
                style={{
                  ...tokens.typography.body,
                  margin: 0,
                  flex: 1,
                }}
              >
                {option.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          ...tokens.buttons.primary,
          marginTop: "24px",
          opacity: canContinue ? 1 : 0.5,
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        Weiter
      </button>
    </div>
  );
}
