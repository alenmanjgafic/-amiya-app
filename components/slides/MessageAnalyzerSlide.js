/**
 * MESSAGE ANALYZER SLIDE - components/slides/MessageAnalyzerSlide.js
 * Entry point for message/chat analysis feature
 */
"use client";
import { useRouter } from "next/navigation";
import { MessageSquare, Camera, Type } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";

export default function MessageAnalyzerSlide({
  isActive = false,
}) {
  const { tokens } = useTheme();
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
      {/* Session Type Icon */}
      <div style={{
        width: "80px",
        height: "80px",
        background: `linear-gradient(135deg, ${tokens.colors.aurora.sky} 0%, ${tokens.colors.aurora.lavender} 100%)`,
        borderRadius: tokens.radii.xl,
        margin: "0 auto 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: tokens.shadows.glow(tokens.colors.aurora.sky),
      }}>
        <MessageSquare size={36} color="white" />
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
          background: `linear-gradient(135deg, ${tokens.colors.aurora.sky} 0%, ${tokens.colors.aurora.lavender} 100%)`,
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
