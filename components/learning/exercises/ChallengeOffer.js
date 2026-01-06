/**
 * CHALLENGE OFFER EXERCISE - Card-based challenge
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { ChallengeIcon, TrophyIcon } from "../LearningIcons";

// Helper to save challenge to localStorage
const saveChallengeLocally = (challenge) => {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem("amiya_challenges");
    const challenges = stored ? JSON.parse(stored) : [];

    const daysMatch = challenge.duration?.match(/(\d+)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 7;
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + days);

    challenges.push({
      id: `${challenge.type}-${Date.now()}`,
      challenge_type: challenge.type,
      title: challenge.title,
      description: challenge.description,
      status: "active",
      started_at: new Date().toISOString(),
      due_at: dueAt.toISOString(),
    });

    localStorage.setItem("amiya_challenges", JSON.stringify(challenges));
  } catch (e) {
    console.error("Failed to save challenge:", e);
  }
};

export default function ChallengeOffer({
  exercise,
  onAcceptChallenge,
  onContinue,
}) {
  const { tokens } = useTheme();
  const [accepted, setAccepted] = useState(null);

  const challenge = exercise.challenge;

  const handleAccept = () => {
    setAccepted(true);
    saveChallengeLocally(challenge);
    onAcceptChallenge?.(challenge);
  };

  const handleSkip = () => {
    setAccepted(false);
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
      {/* Main Card Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          padding: "24px 20px",
          boxShadow: `0 4px 24px ${tokens.colors.aurora.lavender}10`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "120px",
            background: `radial-gradient(circle at top right, ${tokens.colors.aurora.rose}15 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              background: tokens.gradients.surfaceLight,
              borderRadius: "14px",
              marginBottom: "14px",
            }}
          >
            <ChallengeIcon size={26} />
          </div>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              margin: 0,
              marginBottom: "4px",
              color: tokens.colors.text.primary,
            }}
          >
            Herausforderung
          </h2>
          <p
            style={{
              color: tokens.colors.text.muted,
              margin: 0,
              fontSize: "13px",
            }}
          >
            Setze das Gelernte in die Praxis um
          </p>
        </div>

        {/* Challenge Content */}
        <div
          style={{
            flex: 1,
            background: tokens.colors.bg.surface,
            borderRadius: "14px",
            padding: "18px",
            borderLeft: `3px solid ${tokens.colors.aurora.rose}`,
          }}
        >
          <h3
            style={{
              fontWeight: "600",
              marginBottom: "10px",
              fontSize: "16px",
              color: tokens.colors.text.primary,
            }}
          >
            {challenge.title}
          </h3>

          <p
            style={{
              color: tokens.colors.text.secondary,
              lineHeight: "1.6",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {challenge.description}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: `${tokens.colors.aurora.lavender}10`,
              borderRadius: "20px",
            }}
          >
            <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>
              Zeitraum:
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: tokens.colors.aurora.lavender }}>
              {challenge.duration}
            </span>
          </div>
        </div>

        {/* Result Messages */}
        {accepted !== null && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              background: accepted ? `${tokens.colors.aurora.mint}10` : tokens.colors.bg.surface,
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            {accepted ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
                  <TrophyIcon size={18} />
                  <p style={{ color: tokens.colors.aurora.mint, fontWeight: "600", margin: 0, fontSize: "14px" }}>
                    Challenge angenommen
                  </p>
                </div>
                <p style={{ color: tokens.colors.text.muted, margin: 0, fontSize: "12px" }}>
                  Du findest sie in deiner Challenge-Liste
                </p>
              </>
            ) : (
              <p style={{ color: tokens.colors.text.muted, margin: 0, fontSize: "13px" }}>
                Kein Problem – du kannst jederzeit zurückkommen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      {accepted === null ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={handleAccept}
            style={{
              ...tokens.buttons.primary,
              background: tokens.gradients.primary,
            }}
          >
            Challenge annehmen
          </button>
          <button
            onClick={handleSkip}
            style={{
              ...tokens.buttons.secondary,
              background: tokens.colors.bg.elevated,
            }}
          >
            Vielleicht später
          </button>
        </div>
      ) : (
        <button
          onClick={onContinue}
          style={{
            ...tokens.buttons.primary,
            marginTop: "20px",
          }}
        >
          Weiter
        </button>
      )}
    </div>
  );
}
