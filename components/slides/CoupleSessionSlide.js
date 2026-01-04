/**
 * COUPLE SESSION SLIDE - components/slides/CoupleSessionSlide.js
 * Start screen for couple voice session
 * Shown only when user is connected to a partner
 */
"use client";
import { Users } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";

export default function CoupleSessionSlide({
  userName = "du",
  partnerName = "Partner",
  onStartSession,
  isActive = false,
}) {
  const { tokens } = useTheme();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      textAlign: "center",
    }}>
      {/* Session Type Icon */}
      <div style={{
        width: "80px",
        height: "80px",
        background: tokens.gradients.primary,
        borderRadius: tokens.radii.xl,
        margin: "0 auto 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: tokens.shadows.glow(tokens.colors.aurora.rose),
      }}>
        <Users size={36} color="white" />
      </div>

      <h2 style={{
        ...tokens.typography.h2,
        fontSize: "24px",
        marginBottom: "8px",
      }}>
        Gemeinsame Session
      </h2>

      <p style={{
        ...tokens.typography.body,
        marginBottom: "32px",
        lineHeight: "1.6",
        maxWidth: "280px",
      }}>
        Sprecht zusammen mit Amiya<br />
        uber eure Beziehung.
      </p>

      {/* Start Session Button */}
      <button
        onClick={onStartSession}
        style={{
          ...tokens.buttons.primaryLarge,
          background: tokens.gradients.primary,
        }}
      >
        Session starten
      </button>

      {/* Team hint */}
      <p style={{
        ...tokens.typography.small,
        marginTop: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}>
        <Users size={16} /> Beide Partner sollten bereit sein
      </p>
    </div>
  );
}
