/**
 * MESSAGE ANALYZER SLIDE - components/slides/MessageAnalyzerSlide.js
 * Entry point for message/chat analysis feature
 */
"use client";
import { useRouter } from "next/navigation";
import { Camera, Type } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";
import { MessageAnalysisIllustration } from "../AmiyaIllustrations";

export default function MessageAnalyzerSlide({
  isActive = false,
}) {
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const handleAnalyze = () => {
    router.push("/analyze/message");
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
        <MessageAnalysisIllustration isDarkMode={isDarkMode} />
      </div>

      <h2 style={{
        ...tokens.typography.h2,
        fontSize: "24px",
        marginBottom: "8px",
      }}>
        Nachrichtenanalyse
      </h2>

      <p style={{
        ...tokens.typography.body,
        marginBottom: "24px",
        lineHeight: "1.6",
        maxWidth: "280px",
      }}>
        Lass Amiya deine Chat-Nachrichten<br />
        analysieren und verbessern.
      </p>

      {/* Input type indicators */}
      <div style={{
        display: "flex",
        gap: "24px",
        marginBottom: "32px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: tokens.colors.text.muted,
          fontSize: "14px",
        }}>
          <Camera size={18} />
          <span>Screenshot</span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: tokens.colors.text.muted,
          fontSize: "14px",
        }}>
          <Type size={18} />
          <span>Text</span>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        style={{
          ...tokens.buttons.primaryLarge,
          background: tokens.gradients.primary,
        }}
      >
        Nachricht analysieren
      </button>

      {/* Privacy hint */}
      <p style={{
        ...tokens.typography.small,
        marginTop: "24px",
        maxWidth: "280px",
      }}>
        Screenshots werden nicht gespeichert - nur die Analyse.
      </p>
    </div>
  );
}
