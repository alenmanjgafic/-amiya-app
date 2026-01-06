/**
 * COMPLETION EXERCISE - Card-based celebration screen
 */
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { CheckCircleIcon } from "../LearningIcons";

export default function Completion({ exercise, onComplete }) {
  const { tokens } = useTheme();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "24px 20px",
      }}
    >
      {/* Card Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          padding: "32px 24px",
          boxShadow: `0 4px 24px ${tokens.colors.aurora.mint}15`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s ease",
        }}
      >
        {/* Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "-30px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "200px",
            background: `radial-gradient(circle, ${tokens.colors.aurora.mint}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative" }}>
          {/* Badge */}
          <div style={{ marginBottom: "20px" }}>
            {exercise.showBadge ? (
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: tokens.gradients.mintSurface,
                  borderRadius: "50%",
                  border: `2px solid ${tokens.colors.aurora.mint}30`,
                }}
              >
                <CheckCircleIcon size={36} />
              </div>
            ) : (
              <span style={{ fontSize: "44px", display: "block", opacity: 0.9 }}>
                {exercise.emoji || "✓"}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px",
              color: tokens.colors.text.primary,
            }}
          >
            {exercise.title}
          </h2>

          {/* Text */}
          <p
            style={{
              color: tokens.colors.text.secondary,
              lineHeight: "1.7",
              fontSize: "15px",
              margin: 0,
            }}
          >
            {exercise.text}
          </p>
        </div>
      </div>

      {/* Complete Button - outside card */}
      <button
        onClick={onComplete}
        style={{
          ...tokens.buttons.primary,
          marginTop: "24px",
          minWidth: "200px",
          padding: "14px 28px",
          fontSize: "15px",
          fontWeight: "600",
          opacity: showContent ? 1 : 0,
          transition: "opacity 0.5s ease 0.2s",
        }}
      >
        Abschliessen
      </button>
    </div>
  );
}
