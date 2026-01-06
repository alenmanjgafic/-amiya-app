/**
 * PICK - components/learning/activities/Pick.js
 * Multi-step selection activity for building personal routines
 * Used for Chapter 3: Pause Routine Configuration
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { CheckCircle, ArrowRight, ArrowLeft, Save, Sparkles } from "lucide-react";

export default function Pick({
  steps = [],
  title = "Gestalte deine Routine",
  subtitle = "",
  onComplete,
  onSave,
}) {
  const { tokens } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [customValues, setCustomValues] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentSelection = selections[step?.id];
  const isStepComplete = step?.type === "text"
    ? (customValues[step.id]?.trim()?.length > 0)
    : currentSelection !== undefined;

  const handleSelect = (optionId) => {
    setSelections({
      ...selections,
      [step.id]: optionId,
    });
  };

  const handleTextChange = (value) => {
    setCustomValues({
      ...customValues,
      [step.id]: value,
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Build summary of all selections
    const summary = steps.map((s) => {
      if (s.type === "text") {
        return {
          stepId: s.id,
          label: s.title,
          value: customValues[s.id] || "",
        };
      }
      const selectedOption = s.options?.find((o) => o.id === selections[s.id]);
      return {
        stepId: s.id,
        label: s.title,
        value: selectedOption?.label || "",
        optionId: selections[s.id],
      };
    });

    // Try to save if handler provided
    if (onSave) {
      try {
        await onSave(summary);
      } catch (error) {
        console.error("Save error:", error);
      }
    }

    setIsComplete(true);

    if (onComplete) {
      onComplete({ selections, customValues, summary });
    }
  };

  // Summary screen
  if (isComplete) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "60vh",
          padding: "24px",
        }}
      >
        {/* Success Header */}
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
              background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`,
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
            Deine Routine
          </h2>

          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
              textAlign: "center",
            }}
          >
            So sieht dein Plan aus
          </p>
        </div>

        {/* Summary Card */}
        <div
          style={{
            background: tokens.colors.bg.surface,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          {steps.map((s, index) => {
            const value = s.type === "text"
              ? customValues[s.id]
              : s.options?.find((o) => o.id === selections[s.id])?.label;

            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    index < steps.length - 1
                      ? `1px solid ${tokens.colors.bg.elevated}`
                      : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: tokens.colors.text.muted,
                  }}
                >
                  {s.summaryLabel || s.title}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                  }}
                >
                  {value || "-"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "auto",
          }}
        >
          <button
            onClick={() => {
              setIsComplete(false);
              setCurrentStep(0);
            }}
            style={{
              flex: 1,
              padding: "14px",
              background: tokens.colors.bg.elevated,
              border: `1px solid ${tokens.colors.aurora.lavender}30`,
              borderRadius: "12px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={18} />
            Anpassen
          </button>

          <button
            onClick={() => onComplete?.({ selections, customValues, completed: true })}
            style={{
              flex: 1,
              padding: "14px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Fertig
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={tokens.typography.body}>Keine Schritte definiert</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "20px",
      }}
    >
      {/* Progress */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: tokens.colors.aurora.lavender,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Schritt {currentStep + 1} von {totalSteps}
          </span>
        </div>

        <div
          style={{
            height: "4px",
            background: tokens.colors.bg.surface,
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div style={{ marginBottom: "24px" }}>
        {step.icon && (
          <div
            style={{
              fontSize: "32px",
              marginBottom: "12px",
            }}
          >
            {step.icon}
          </div>
        )}

        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          {step.title}
        </h2>

        {step.subtitle && (
          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
            }}
          >
            {step.subtitle}
          </p>
        )}
      </div>

      {/* Options or Text Input */}
      {step.type === "text" ? (
        <div style={{ marginBottom: "20px" }}>
          <textarea
            value={customValues[step.id] || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={step.placeholder || "Deine Antwort..."}
            rows={4}
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
            }}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {step.options?.map((option) => {
            const isSelected = currentSelection === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                style={{
                  padding: "16px",
                  background: isSelected
                    ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}15 0%, ${tokens.colors.aurora.rose}10 100%)`
                    : tokens.colors.bg.surface,
                  border: isSelected
                    ? `2px solid ${tokens.colors.aurora.lavender}`
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
                {/* Radio indicator */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: isSelected ? "none" : `2px solid ${tokens.colors.text.muted}40`,
                    background: isSelected ? tokens.colors.aurora.lavender : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <CheckCircle size={16} color="#fff" />}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  {option.icon && (
                    <span style={{ marginRight: "8px" }}>{option.icon}</span>
                  )}
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: isSelected ? "600" : "400",
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: tokens.colors.text.muted,
                        margin: "4px 0 0 0",
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
      )}

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "auto",
        }}
      >
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            style={{
              padding: "14px 20px",
              background: tokens.colors.bg.elevated,
              border: `1px solid ${tokens.colors.aurora.lavender}30`,
              borderRadius: "12px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={18} />
            Zurück
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={!isStepComplete}
          style={{
            flex: 1,
            padding: "16px",
            background: isStepComplete
              ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
              : tokens.colors.bg.surface,
            border: "none",
            borderRadius: "12px",
            color: isStepComplete ? "#fff" : tokens.colors.text.muted,
            fontSize: "16px",
            fontWeight: "600",
            cursor: isStepComplete ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {currentStep < totalSteps - 1 ? (
            <>
              Weiter
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              <Save size={18} />
              Speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}
