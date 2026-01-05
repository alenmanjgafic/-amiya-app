/**
 * COUPLE SESSION SLIDE - components/slides/CoupleSessionSlide.js
 * Start screen for couple voice session
 * Navigates to dedicated /session/couple page
 */
"use client";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";
import { CoupleSessionIllustration } from "../AmiyaIllustrations";

export default function CoupleSessionSlide({
  userName = "du",
  partnerName = "Partner",
  isActive = false,
}) {
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const handleStartSession = () => {
    router.push("/session/couple");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      textAlign: "center",
    }}>
      {/* Illustration */}
      <div style={{
        width: "200px",
        height: "120px",
        marginBottom: "16px",
      }}>
        <CoupleSessionIllustration isDarkMode={isDarkMode} />
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
        onClick={handleStartSession}
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
