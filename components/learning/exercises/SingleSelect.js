/**
 * SINGLE SELECT EXERCISE - Card-based single choice
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { PatternIconMap } from "../LearningIcons";

export default function SingleSelect({
  exercise,
  savedResponse,
  onResponse,
  onContinue,
}) {
  const { tokens } = useTheme();
  const [selected, setSelected] = useState(savedResponse?.selected || null);

  const handleSelect = (optionId) => {
    setSelected(optionId);
    onResponse({
      selected: optionId,
      option: exercise.options.find((o) => o.id === optionId),
    });
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
          overflow: "hidden",
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
            marginBottom: "24px",
          }}
        >
          {exercise.question}
        </h2>

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
            const isSelected = selected === option.id;
            const IconComponent = PatternIconMap[option.id];

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  background: isSelected
                    ? tokens.gradients.surfaceSubtle
                    : tokens.colors.bg.surface,
                  border: isSelected
                    ? `1.5px solid ${tokens.colors.aurora.lavender}60`
                    : `1px solid transparent`,
                  borderRadius: "14px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Icon Container */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSelected
                      ? `${tokens.colors.aurora.lavender}20`
                      : `${tokens.colors.text.muted}10`,
                    borderRadius: "12px",
                    flexShrink: 0,
                  }}
                >
                  {IconComponent ? (
                    <IconComponent size={24} />
                  ) : (
                    <span style={{ fontSize: "20px" }}>{option.emoji}</span>
                  )}
                </div>

                {/* Label & Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: "600",
                      margin: 0,
                      marginBottom: option.description ? "3px" : 0,
                      fontSize: "15px",
                      color: isSelected ? tokens.colors.text.primary : tokens.colors.text.secondary,
                    }}
                  >
                    {option.label}
                  </p>
                  {option.description && (
                    <p
                      style={{
                        margin: 0,
                        color: tokens.colors.text.muted,
                        fontSize: "13px",
                        lineHeight: "1.4",
                      }}
                    >
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Selection indicator */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: isSelected
                      ? "none"
                      : `2px solid ${tokens.colors.text.muted}30`,
                    background: isSelected
                      ? tokens.gradients.primary
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Button - outside card */}
      <button
        onClick={onContinue}
        disabled={!selected}
        style={{
          ...tokens.buttons.primary,
          marginTop: "20px",
          opacity: selected ? 1 : 0.4,
          cursor: selected ? "pointer" : "not-allowed",
        }}
      >
        Weiter
      </button>
    </div>
  );
}
