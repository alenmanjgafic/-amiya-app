/**
 * THEORY SCREEN - Card-based theory content with visual accents
 */
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../lib/ThemeContext";

// Visual accent patterns based on content theme
const getVisualAccent = (emoji, tokens) => {
  // Map emojis to abstract gradient shapes
  const accents = {
    // Research/Science
    "🔬": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.mint}40 0%, ${tokens.colors.aurora.lavender}20 100%)`, shape: "circle" },
    "💡": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}40 0%, ${tokens.colors.aurora.rose}20 100%)`, shape: "circle" },

    // Emotions/Conflict
    "😱": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.rose}30 0%, ${tokens.colors.aurora.lavender}15 100%)`, shape: "wave" },
    "⚔️": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.rose}35 0%, transparent 100%)`, shape: "diagonal" },
    "🛡️": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}35 0%, ${tokens.colors.aurora.mint}15 100%)`, shape: "shield" },
    "🙄": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.rose}25 0%, ${tokens.colors.text.muted}15 100%)`, shape: "circle" },
    "🧱": { gradient: `linear-gradient(135deg, ${tokens.colors.text.muted}30 0%, ${tokens.colors.aurora.lavender}10 100%)`, shape: "blocks" },

    // Positive
    "🐴": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}30 0%, ${tokens.colors.aurora.rose}15 100%)`, shape: "circle" },
    "💬": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.mint}35 0%, ${tokens.colors.aurora.lavender}15 100%)`, shape: "bubble" },
    "❤️": { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.rose}40 0%, ${tokens.colors.aurora.lavender}20 100%)`, shape: "circle" },
  };

  return accents[emoji] || { gradient: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}25 0%, transparent 100%)`, shape: "circle" };
};

// Render abstract shape based on type
const AbstractShape = ({ type, gradient }) => {
  const baseStyle = {
    position: "absolute",
    pointerEvents: "none",
  };

  switch (type) {
    case "wave":
      return (
        <svg style={{ ...baseStyle, top: 0, right: 0, width: "120px", height: "80px", opacity: 0.6 }} viewBox="0 0 120 80" fill="none">
          <path d="M0 40 Q30 10 60 40 T120 40 V80 H0 Z" fill={gradient.includes("rose") ? "url(#waveGrad)" : "url(#waveGrad)"} />
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#db2777" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "diagonal":
      return (
        <svg style={{ ...baseStyle, top: 0, right: 0, width: "100px", height: "100px", opacity: 0.5 }} viewBox="0 0 100 100" fill="none">
          <path d="M100 0 L100 100 L0 100 Z" fill="url(#diagGrad)" />
          <defs>
            <linearGradient id="diagGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#db2777" stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "shield":
      return (
        <svg style={{ ...baseStyle, top: "10px", right: "10px", width: "60px", height: "70px", opacity: 0.4 }} viewBox="0 0 60 70" fill="none">
          <path d="M30 5 L55 15 L55 35 C55 50 42 62 30 68 C18 62 5 50 5 35 L5 15 L30 5 Z" fill="url(#shieldGrad)" />
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "blocks":
      return (
        <svg style={{ ...baseStyle, top: "10px", right: "10px", width: "80px", height: "60px", opacity: 0.35 }} viewBox="0 0 80 60" fill="none">
          <rect x="0" y="0" width="35" height="15" rx="3" fill="url(#blockGrad)" />
          <rect x="40" y="0" width="40" height="15" rx="3" fill="url(#blockGrad)" />
          <rect x="0" y="20" width="50" height="15" rx="3" fill="url(#blockGrad)" />
          <rect x="55" y="20" width="25" height="15" rx="3" fill="url(#blockGrad)" />
          <rect x="0" y="40" width="30" height="15" rx="3" fill="url(#blockGrad)" />
          <rect x="35" y="40" width="45" height="15" rx="3" fill="url(#blockGrad)" />
          <defs>
            <linearGradient id="blockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "bubble":
      return (
        <svg style={{ ...baseStyle, top: "10px", right: "10px", width: "70px", height: "60px", opacity: 0.4 }} viewBox="0 0 70 60" fill="none">
          <ellipse cx="35" cy="25" rx="30" ry="22" fill="url(#bubbleGrad)" />
          <path d="M20 42 L15 55 L30 45" fill="url(#bubbleGrad)" />
          <defs>
            <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "circle":
    default:
      return (
        <div
          style={{
            ...baseStyle,
            top: "10px",
            right: "10px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: gradient,
            opacity: 0.5,
          }}
        />
      );
  }
};

export default function TheoryScreen({
  screen,
  onContinue,
  showHint = true,
}) {
  const { tokens } = useTheme();
  const [hintVisible, setHintVisible] = useState(showHint);

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => setHintVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [showHint]);

  // Parse text for title
  const textParts = screen.text.split("\n\n");
  const hasTitle = textParts.length > 1 && textParts[0].length < 50;
  const title = hasTitle ? textParts[0] : null;
  const bodyText = hasTitle ? textParts.slice(1).join("\n\n") : screen.text;

  // Get visual accent
  const accent = getVisualAccent(screen.emoji, tokens);

  return (
    <div
      onClick={onContinue}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "24px 20px",
        cursor: "pointer",
      }}
    >
      {/* Card Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "360px",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          padding: "28px 24px",
          overflow: "hidden",
          boxShadow: `0 4px 24px ${tokens.colors.aurora.lavender}10`,
        }}
      >
        {/* Abstract Visual Accent */}
        <AbstractShape type={accent.shape} gradient={accent.gradient} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Title */}
          {title && (
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "16px",
                color: tokens.colors.text.primary,
                lineHeight: "1.3",
              }}
            >
              {title}
            </h2>
          )}

          {/* Body Text */}
          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              color: tokens.colors.text.secondary,
              whiteSpace: "pre-line",
              margin: 0,
            }}
          >
            {bodyText}
          </p>
        </div>
      </div>

      {/* Tap hint */}
      {hintVisible && (
        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: tokens.colors.text.muted,
            opacity: 0.5,
          }}
        >
          Tippen zum Fortfahren
        </p>
      )}
    </div>
  );
}
