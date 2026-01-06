/**
 * NUDGE - components/learning/activities/Nudge.js
 * Reflection + Action task activity
 * Used for Chapter 4: Emotional Bank Account
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { ArrowRight, Lightbulb, Heart, CheckCircle, Sparkles } from "lucide-react";

export default function Nudge({
  reflection = {},
  actionTask = {},
  examples = [],
  onComplete,
}) {
  const { tokens } = useTheme();

  const [step, setStep] = useState("reflection"); // "reflection" | "examples" | "commit" | "complete"
  const [reflectionText, setReflectionText] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [customAction, setCustomAction] = useState("");

  const handleReflectionSubmit = () => {
    if (reflectionText.trim()) {
      setStep("examples");
    }
  };

  const handleActionSelect = (index) => {
    setSelectedAction(index);
    setCustomAction("");
  };

  const handleCommit = () => {
    setStep("complete");
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        reflection: reflectionText,
        action: selectedAction !== null ? examples[selectedAction] : customAction,
        completed: true,
      });
    }
  };

  // Complete screen
  if (step === "complete") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: tokens.gradients.mintSurface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <Sparkles size={40} color={tokens.colors.aurora.mint} />
        </div>

        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          Du hast einen Plan!
        </h2>

        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.secondary,
            margin: "0 0 16px 0",
            maxWidth: "280px",
          }}
        >
          Kleine Gesten machen den grossen Unterschied
        </p>

        {/* Selected action reminder */}
        <div
          style={{
            background: tokens.colors.bg.surface,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "32px",
            maxWidth: "320px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Heart size={18} color={tokens.colors.aurora.rose} />
            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: tokens.colors.aurora.rose,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Deine Einzahlung heute
            </span>
          </div>
          <p
            style={{
              fontSize: "16px",
              color: tokens.colors.text.primary,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {selectedAction !== null ? examples[selectedAction] : customAction}
          </p>
        </div>

        <button
          onClick={handleComplete}
          style={{
            padding: "16px 32px",
            background: tokens.gradients.primary,
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Fertig
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Reflection step
  if (step === "reflection") {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: tokens.gradients.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lightbulb size={24} color={tokens.colors.aurora.lavender} />
          </div>
          <div>
            <h2
              style={{
                ...tokens.typography.h2,
                margin: 0,
                fontSize: "20px",
              }}
            >
              {reflection.title || "Kurze Reflexion"}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.text.muted,
                margin: 0,
              }}
            >
              Schritt 1 von 2
            </p>
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: tokens.colors.bg.surface,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "17px",
              color: tokens.colors.text.primary,
              margin: 0,
              lineHeight: "1.6",
              fontFamily: tokens.fonts.display,
            }}
          >
            {reflection.question || "Wann hast du zuletzt eine 'Einzahlung' auf euer Beziehungskonto gemacht?"}
          </p>
        </div>

        {/* Text input */}
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder={reflection.placeholder || "Denk an eine kleine Geste, ein nettes Wort, oder einen Moment der Aufmerksamkeit..."}
          rows={5}
          style={{
            width: "100%",
            padding: "16px",
            background: tokens.colors.bg.surface,
            border: `1px solid ${tokens.colors.aurora.lavender}30`,
            borderRadius: "12px",
            color: tokens.colors.text.primary,
            fontSize: "15px",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: "20px",
            lineHeight: "1.6",
          }}
        />

        {/* Submit */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleReflectionSubmit}
            disabled={!reflectionText.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background: reflectionText.trim()
                ? tokens.gradients.primary
                : tokens.colors.bg.surface,
              border: "none",
              borderRadius: "12px",
              color: reflectionText.trim() ? "#fff" : tokens.colors.text.muted,
              fontSize: "16px",
              fontWeight: "600",
              cursor: reflectionText.trim() ? "pointer" : "not-allowed",
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

  // Examples + commit step
  if (step === "examples") {
    const hasSelection = selectedAction !== null || customAction.trim();

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: tokens.gradients.mintSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={24} color={tokens.colors.aurora.mint} />
          </div>
          <div>
            <h2
              style={{
                ...tokens.typography.h2,
                margin: 0,
                fontSize: "20px",
              }}
            >
              {actionTask.title || "Deine Aufgabe"}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.text.muted,
                margin: 0,
              }}
            >
              Schritt 2 von 2
            </p>
          </div>
        </div>

        {/* Task description */}
        <p
          style={{
            fontSize: "15px",
            color: tokens.colors.text.secondary,
            margin: "0 0 20px 0",
            lineHeight: "1.6",
          }}
        >
          {actionTask.description || "Mach heute eine 'Einzahlung' auf euer Beziehungskonto. Wähle eine Idee oder definiere deine eigene:"}
        </p>

        {/* Example options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          {examples.map((example, index) => {
            const isSelected = selectedAction === index;

            return (
              <button
                key={index}
                onClick={() => handleActionSelect(index)}
                style={{
                  padding: "14px 16px",
                  background: isSelected
                    ? tokens.gradients.mintSurface
                    : tokens.colors.bg.surface,
                  border: isSelected
                    ? `2px solid ${tokens.colors.aurora.mint}`
                    : `1px solid ${tokens.colors.bg.elevated}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: isSelected ? "none" : `2px solid ${tokens.colors.text.muted}40`,
                    background: isSelected ? tokens.colors.aurora.mint : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <CheckCircle size={14} color="#fff" />}
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: tokens.colors.text.primary,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {example}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom option */}
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
            Oder eigene Idee:
          </label>
          <input
            type="text"
            value={customAction}
            onChange={(e) => {
              setCustomAction(e.target.value);
              setSelectedAction(null);
            }}
            placeholder="Meine eigene Einzahlung..."
            style={{
              width: "100%",
              padding: "14px 16px",
              background: tokens.colors.bg.surface,
              border: customAction
                ? `2px solid ${tokens.colors.aurora.mint}`
                : `1px solid ${tokens.colors.bg.elevated}`,
              borderRadius: "12px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Submit */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleCommit}
            disabled={!hasSelection}
            style={{
              width: "100%",
              padding: "16px",
              background: hasSelection
                ? tokens.gradients.primary
                : tokens.colors.bg.surface,
              border: "none",
              borderRadius: "12px",
              color: hasSelection ? "#fff" : tokens.colors.text.muted,
              fontSize: "16px",
              fontWeight: "600",
              cursor: hasSelection ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Ich mach das heute
            <Heart size={18} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
