/**
 * SUMMARY EXERCISE - Shows compiled responses with template
 */
"use client";

import { useTheme } from "../../../lib/ThemeContext";

export default function Summary({
  exercise,
  allResponses = {},
  allBiteResponses = {}, // Responses from all bites
  onContinue,
}) {
  const { tokens } = useTheme();

  // If there's a template, fill it with responses
  const getFilledTemplate = () => {
    if (!exercise.template) return null;

    let filled = exercise.template;
    const placeholderRegex = /{(\w+)}/g;

    filled = filled.replace(placeholderRegex, (match, key) => {
      const response = allResponses[key];
      if (!response) return `[${key}]`;

      if (response.text) return response.text;
      if (response.option) return response.option.label;
      if (response.selected && typeof response.selected === "string") {
        return response.selected;
      }

      return `[${key}]`;
    });

    return filled;
  };

  // Get response value for sections
  const getResponseValue = (section) => {
    // Check current bite responses first
    let response = allResponses[section.responseKey];

    // If fromBite specified, check all bite responses
    if (section.fromBite && allBiteResponses[section.fromBite]) {
      response = allBiteResponses[section.fromBite][section.responseKey];
    }

    if (!response) return null;

    if (response.text) return { type: "text", value: response.text };
    if (response.option) {
      return {
        type: "option",
        emoji: response.option.emoji,
        label: response.option.label,
      };
    }
    if (response.options) {
      return {
        type: "options",
        values: response.options.map((o) => o.label),
      };
    }

    return null;
  };

  const filledTemplate = getFilledTemplate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
      }}
    >
      {/* Title */}
      <h2
        style={{
          ...tokens.typography.h3,
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        {exercise.title}
      </h2>

      {/* Template Display */}
      {filledTemplate && (
        <div
          style={{
            padding: "20px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.lg,
            marginBottom: "20px",
            borderLeft: `4px solid ${tokens.colors.aurora.lavender}`,
          }}
        >
          <p
            style={{
              ...tokens.typography.body,
              margin: 0,
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
          >
            {filledTemplate}
          </p>
        </div>
      )}

      {/* Sections Display */}
      {exercise.sections && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
          }}
        >
          {exercise.sections.map((section, index) => {
            const responseValue = getResponseValue(section);
            if (!responseValue) return null;

            return (
              <div
                key={index}
                style={{
                  padding: "16px",
                  background: tokens.colors.bg.elevated,
                  borderRadius: tokens.radii.lg,
                }}
              >
                <p
                  style={{
                    ...tokens.typography.small,
                    color: tokens.colors.aurora.lavender,
                    fontWeight: "600",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </p>

                {responseValue.type === "text" && (
                  <p
                    style={{
                      ...tokens.typography.body,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    "{responseValue.value}"
                  </p>
                )}

                {responseValue.type === "option" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>{responseValue.emoji}</span>
                    <span style={tokens.typography.body}>{responseValue.label}</span>
                  </div>
                )}

                {responseValue.type === "options" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {responseValue.values.map((v, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "6px 12px",
                          background: `${tokens.colors.aurora.lavender}15`,
                          borderRadius: tokens.radii.sm,
                          ...tokens.typography.small,
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Text */}
      {exercise.text && (
        <p
          style={{
            ...tokens.typography.body,
            textAlign: "center",
            color: tokens.colors.text.secondary,
            lineHeight: "1.6",
            marginTop: "16px",
          }}
        >
          {exercise.text}
        </p>
      )}

      {/* Continue Button */}
      <button
        onClick={onContinue}
        style={{
          ...tokens.buttons.primary,
          marginTop: "24px",
        }}
      >
        Weiter
      </button>
    </div>
  );
}
