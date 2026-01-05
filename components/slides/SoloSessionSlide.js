/**
 * SOLO SESSION SLIDE - components/slides/SoloSessionSlide.js
 * Start screen for solo voice session
 * Navigates to dedicated /session/solo page
 */
"use client";
import { useRouter } from "next/navigation";
import { Headphones } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";
import { SoloSessionIllustration } from "../AmiyaIllustrations";

export default function SoloSessionSlide({
  userName = "du",
  partnerName = "Partner",
  analysisError = null,
}) {
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const handleStartSession = () => {
    router.push("/session/solo");
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
        <SoloSessionIllustration isDarkMode={isDarkMode} />
      </div>

      <h2 style={{
        ...tokens.typography.h2,
        fontSize: "24px",
        marginBottom: "8px",
      }}>
        Solo Session
      </h2>

      <p style={{
        ...tokens.typography.body,
        marginBottom: "32px",
        lineHeight: "1.6",
        maxWidth: "280px",
      }}>
        Sprich mit Amiya uber das,<br />
        was dich beschaftigt.
      </p>

      {/* Analysis Error Alert */}
      {analysisError && (
        <div style={{
          ...tokens.alerts.error,
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          textAlign: "left",
          border: `1px solid ${tokens.colors.error}`,
          maxWidth: "300px",
        }}>
          <p style={{
            color: tokens.colors.error,
            fontSize: "14px",
            margin: 0,
            lineHeight: "1.5",
          }}>
            {analysisError}
          </p>
        </div>
      )}

      {/* Start Session Button */}
      <button
        onClick={handleStartSession}
        style={tokens.buttons.primaryLarge}
      >
        Session starten
      </button>

      {/* Headphones hint */}
      <p style={{
        ...tokens.typography.small,
        marginTop: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}>
        <Headphones size={16} /> Beste Erfahrung mit Kopfhorern
      </p>
    </div>
  );
}
