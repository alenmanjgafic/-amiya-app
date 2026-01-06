/**
 * COMMITMENT - components/learning/activities/Commitment.js
 * Personal reflection on relationship rules - serves as conversation starter
 * Used for Chapter 7: Ground Rules
 *
 * NOTE: This does NOT create an agreement directly.
 * Instead, it helps the user reflect on what's important to them,
 * then encourages them to discuss with their partner.
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { CheckCircle, MessageCircle, ArrowRight, Sparkles, Heart } from "lucide-react";

export default function Commitment({
  chapterId,
  options = [],
  minSelections = 2,
  maxSelections = 3,
  title = "Was ist dir wichtig?",
  subtitle = "Wähle die Regeln die DIR am wichtigsten sind",
  onComplete,
}) {
  const { tokens } = useTheme();

  const [selected, setSelected] = useState([]);
  const [customText, setCustomText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const canSubmit = selected.length >= minSelections && selected.length <= maxSelections;

  const handleToggle = (optionId) => {
    if (selected.includes(optionId)) {
      setSelected(selected.filter((id) => id !== optionId));
    } else if (selected.length < maxSelections) {
      setSelected([...selected, optionId]);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsComplete(true);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        selectedOptions: selected,
        customText,
      });
    }
  };

  // Get selected option objects for summary
  const selectedOptions = options.filter((opt) => selected.includes(opt.id));

  // Success/Summary screen
  if (isComplete) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          padding: "24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: tokens.gradients.mintSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Sparkles size={32} color={tokens.colors.aurora.mint} />
          </div>

          <h2
            style={{
              ...tokens.typography.h2,
              margin: "0 0 8px 0",
              textAlign: "center",
            }}
          >
            Deine Auswahl
          </h2>

          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
              textAlign: "center",
            }}
          >
            Diese Punkte sind dir wichtig
          </p>
        </div>

        {/* Selected items summary */}
        <div
          style={{
            background: tokens.colors.bg.surface,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          {selectedOptions.map((option, index) => (
            <div
              key={option.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 0",
                borderBottom: index < selectedOptions.length - 1
                  ? `1px solid ${tokens.colors.bg.elevated}`
                  : "none",
              }}
            >
              <CheckCircle
                size={20}
                color={tokens.colors.aurora.mint}
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    margin: "0 0 4px 0",
                  }}
                >
                  {option.label}
                </p>
                {option.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                      margin: 0,
                    }}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {customText && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                paddingTop: "12px",
                borderTop: `1px solid ${tokens.colors.bg.elevated}`,
              }}
            >
              <Heart
                size={20}
                color={tokens.colors.aurora.rose}
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: tokens.colors.text.muted,
                    margin: "0 0 4px 0",
                  }}
                >
                  Eigene Ergänzung
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    color: tokens.colors.text.primary,
                    margin: 0,
                  }}
                >
                  {customText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Next step hint */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "16px",
            background: tokens.gradients.surfaceLight,
            borderRadius: "12px",
            marginBottom: "24px",
          }}
        >
          <MessageCircle
            size={24}
            color={tokens.colors.aurora.lavender}
            style={{ flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 6px 0",
              }}
            >
              Nächster Schritt
            </p>
            <p
              style={{
                fontSize: "14px",
                color: tokens.colors.text.secondary,
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              Besprich diese Punkte mit deinem Partner. Findet heraus, was euch beiden wichtig ist.
              Ihr könnt dann gemeinsam unter "Wir" eine Vereinbarung erstellen.
            </p>
          </div>
        </div>

        {/* Complete button */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleComplete}
            style={{
              width: "100%",
              padding: "16px",
              background: tokens.gradients.primary,
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Kapitel abschliessen
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Selection screen
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
        <p
          style={{
            fontSize: "13px",
            color: tokens.colors.text.muted,
            margin: "12px 0 0 0",
          }}
        >
          Wähle {minSelections}-{maxSelections} Punkte
        </p>
      </div>

      {/* Info banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          background: `${tokens.colors.aurora.mint}10`,
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <MessageCircle size={18} color={tokens.colors.aurora.mint} style={{ flexShrink: 0 }} />
        <p
          style={{
            fontSize: "13px",
            color: tokens.colors.text.secondary,
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          Dies ist deine persönliche Reflexion. Besprecht eure Auswahl anschliessend gemeinsam.
        </p>
      </div>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabled = !isSelected && selected.length >= maxSelections;

          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              disabled={isDisabled}
              style={{
                padding: "16px",
                background: isSelected
                  ? tokens.gradients.surfaceSubtle
                  : tokens.colors.bg.surface,
                border: isSelected
                  ? `2px solid ${tokens.colors.aurora.lavender}`
                  : `1px solid ${tokens.colors.bg.elevated}`,
                borderRadius: "12px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                opacity: isDisabled ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  border: isSelected ? "none" : `2px solid ${tokens.colors.text.muted}40`,
                  background: isSelected ? tokens.colors.aurora.lavender : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {isSelected && <CheckCircle size={16} color="#fff" />}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    margin: "0 0 4px 0",
                  }}
                >
                  {option.label}
                </p>
                {option.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom addition */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            color: tokens.colors.text.muted,
            marginBottom: "8px",
          }}
        >
          Eigene Ergänzung (optional)
        </label>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Was ist dir sonst noch wichtig?"
          rows={3}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: tokens.colors.bg.surface,
            border: `1px solid ${tokens.colors.bg.elevated}`,
            borderRadius: "12px",
            color: tokens.colors.text.primary,
            fontSize: "15px",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Selection count */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: canSubmit ? tokens.colors.aurora.mint : tokens.colors.text.muted,
            fontWeight: canSubmit ? "600" : "400",
          }}
        >
          {selected.length} von {minSelections}-{maxSelections} gewählt
        </span>
      </div>

      {/* Submit */}
      <div style={{ marginTop: "auto" }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "16px",
            background: canSubmit
              ? tokens.gradients.primary
              : tokens.colors.bg.surface,
            border: "none",
            borderRadius: "12px",
            color: canSubmit ? "#fff" : tokens.colors.text.muted,
            fontSize: "16px",
            fontWeight: "600",
            cursor: canSubmit ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          Weiter
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
