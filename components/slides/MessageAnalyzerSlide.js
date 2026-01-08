/**
 * MESSAGE ANALYZER SLIDE - components/slides/MessageAnalyzerSlide.js
 * Entry point for message/chat analysis feature
 * Full-bleed image with text overlay
 */
"use client";
import { useRouter } from "next/navigation";
import { Camera, Type } from "lucide-react";
import Image from "next/image";
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
      position: "relative",
      height: "420px",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Full-bleed background image */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}>
        <Image
          src="/images/messageanalyse-01.jpg"
          alt="Nachrichtenanalyse"
          fill
          style={{ objectFit: "cover" }}
        />
        {/* Gradient overlay - only bottom for text readability */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }} />
      </div>

      {/* Content overlay */}
      <div style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "24px 20px",
      }}>
        <h2 style={{
          fontSize: "26px",
          fontWeight: "700",
          color: "#fff",
          margin: "0 0 6px 0",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: tokens.fonts.display,
        }}>
          Nachrichtenanalyse
        </h2>

        <p style={{
          fontSize: "15px",
          color: "rgba(255,255,255,0.9)",
          margin: "0 0 16px 0",
          lineHeight: "1.5",
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}>
          Lass Amiya deine Chat-Nachrichten analysieren und verbessern.
        </p>

        {/* Input type indicators */}
        <div style={{
          display: "flex",
          gap: "16px",
          marginBottom: "16px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
          }}>
            <Camera size={16} />
            <span>Screenshot</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
          }}>
            <Type size={16} />
            <span>Text</span>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: "rgba(255,255,255,0.95)",
            border: "none",
            borderRadius: "12px",
            color: tokens.colors.aurora.lavender,
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            transition: "transform 0.2s ease",
          }}
        >
          Nachricht analysieren
        </button>

        {/* Privacy hint */}
        <p style={{
          fontSize: "11px",
          color: "rgba(255,255,255,0.6)",
          marginTop: "12px",
          textAlign: "center",
        }}>
          Screenshots werden nicht gespeichert - nur die Analyse.
        </p>
      </div>
    </div>
  );
}
