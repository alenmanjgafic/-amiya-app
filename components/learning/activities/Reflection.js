/**
 * REFLECTION - components/learning/activities/Reflection.js
 * Guided reflection with optional quiz elements
 * Used for Chapter 6: Repair Attempts
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { ArrowRight, FileText, CheckCircle, Sparkles, Save } from "lucide-react";

export default function Reflection({
  sections = [],
  title = "Reflexion",
  subtitle = "",
  onComplete,
  onSave,
}) {
  const { tokens } = useTheme();

  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const section = sections[currentSection];
  const totalSections = sections.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const currentResponse = responses[section?.id];
  const isSectionComplete = section?.type === "multiselect"
    ? (currentResponse && currentResponse.length > 0)
    : section?.type === "select"
      ? currentResponse !== undefined
      : currentResponse?.trim()?.length > 0;

  const handleTextChange = (value) => {
    setResponses({
      ...responses,
      [section.id]: value,
    });
  };

  const handleSelect = (optionId) => {
    if (section.type === "multiselect") {
      const current = responses[section.id] || [];
      if (current.includes(optionId)) {
        setResponses({
          ...responses,
          [section.id]: current.filter((id) => id !== optionId),
        });
      } else if (section.maxSelections ? current.length < section.maxSelections : true) {
        setResponses({
          ...responses,
          [section.id]: [...current, optionId],
        });
      }
    } else {
      setResponses({
        ...responses,
        [section.id]: optionId,
      });
    }
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleComplete = async () => {
    // Build summary
    const summary = sections.map((s) => {
      if (s.type === "multiselect") {
        const selectedOptions = s.options?.filter((o) =>
          (responses[s.id] || []).includes(o.id)
        );
        return {
          sectionId: s.id,
          title: s.title,
          type: s.type,
          value: selectedOptions?.map((o) => o.label) || [],
        };
      } else if (s.type === "select") {
        const selectedOption = s.options?.find((o) => o.id === responses[s.id]);
        return {
          sectionId: s.id,
          title: s.title,
          type: s.type,
          value: selectedOption?.label || "",
        };
      } else {
        return {
          sectionId: s.id,
          title: s.title,
          type: s.type,
          value: responses[s.id] || "",
        };
      }
    });

    if (onSave) {
      try {
        await onSave(summary);
      } catch (error) {
        console.error("Save error:", error);
      }
    }

    setIsComplete(true);

    if (onComplete) {
      onComplete({ responses, summary });
    }
  };

  // Summary screen
  if (isComplete) {
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
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: tokens.gradients.mintSurface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <Sparkles size={32} color={tokens.colors.aurora.mint} />
        </div>

        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          Reflexion abgeschlossen
        </h2>

        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.secondary,
            margin: "0 0 32px 0",
            maxWidth: "280px",
          }}
        >
          Deine Gedanken sind gespeichert
        </p>

        <button
          onClick={() => onComplete?.({ responses, completed: true })}
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

  if (!section) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={tokens.typography.body}>Keine Abschnitte definiert</p>
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
            {currentSection + 1} von {totalSections}
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
              background: tokens.gradients.primaryHorizontal,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Section Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: tokens.gradients.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <FileText size={24} color={tokens.colors.aurora.lavender} />
      </div>

      {/* Question */}
      <h2
        style={{
          ...tokens.typography.h2,
          margin: "0 0 8px 0",
          fontSize: "20px",
        }}
      >
        {section.title}
      </h2>

      {section.subtitle && (
        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.muted,
            margin: "0 0 20px 0",
          }}
        >
          {section.subtitle}
        </p>
      )}

      {/* Content based on type */}
      {section.type === "text" && (
        <textarea
          value={responses[section.id] || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={section.placeholder || "Deine Gedanken..."}
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
      )}

      {(section.type === "select" || section.type === "multiselect") && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {section.options?.map((option) => {
            const isSelected = section.type === "multiselect"
              ? (responses[section.id] || []).includes(option.id)
              : responses[section.id] === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                style={{
                  padding: "14px 16px",
                  background: isSelected
                    ? tokens.gradients.surfaceSubtle
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
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: section.type === "multiselect" ? "6px" : "50%",
                    border: isSelected ? "none" : `2px solid ${tokens.colors.text.muted}40`,
                    background: isSelected ? tokens.colors.aurora.lavender : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <CheckCircle size={14} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: "14px",
                      color: tokens.colors.text.primary,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <p
                      style={{
                        fontSize: "12px",
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

      {/* Hint */}
      {section.hint && (
        <div
          style={{
            padding: "12px 16px",
            background: `${tokens.colors.aurora.lavender}10`,
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: tokens.colors.text.secondary,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {section.hint}
          </p>
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
        {currentSection > 0 && (
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
            }}
          >
            Zurück
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={!isSectionComplete}
          style={{
            flex: 1,
            padding: "16px",
            background: isSectionComplete
              ? tokens.gradients.primary
              : tokens.colors.bg.surface,
            border: "none",
            borderRadius: "12px",
            color: isSectionComplete ? "#fff" : tokens.colors.text.muted,
            fontSize: "16px",
            fontWeight: "600",
            cursor: isSectionComplete ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {currentSection < totalSections - 1 ? "Weiter" : "Speichern"}
          {currentSection < totalSections - 1 ? (
            <ArrowRight size={18} />
          ) : (
            <Save size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
