/**
 * SOLO SESSION SLIDE - components/slides/SoloSessionSlide.js
 * Start screen for solo voice session
 * Full-bleed image with text overlay
 */
"use client";
import { useRouter } from "next/navigation";
import { Headphones } from "lucide-react";
import Image from "next/image";
import { useTheme } from "../../lib/ThemeContext";

export default function SoloSessionSlide({
  userName = "du",
  partnerName = "Partner",
  analysisError = null,
}) {
  const { tokens } = useTheme();
  const router = useRouter();

  const handleStartSession = () => {
    router.push("/session/solo");
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
          src="/images/solo-session-01.jpg"
          alt="Solo Session"
          fill
          style={{ objectFit: "cover" }}
          priority
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
        {/* Analysis Error Alert */}
        {analysisError && (
          <div style={{
            ...tokens.alerts.error,
            marginBottom: "16px",
            background: "rgba(220, 38, 38, 0.9)",
            border: "none",
          }}>
            <p style={{
              color: "#fff",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5",
            }}>
              {analysisError}
            </p>
          </div>
        )}

        <h2 style={{
          fontSize: "26px",
          fontWeight: "700",
          color: "#fff",
          margin: "0 0 6px 0",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: tokens.fonts.display,
        }}>
          Solo Session
        </h2>

        <p style={{
          fontSize: "15px",
          color: "rgba(255,255,255,0.9)",
          margin: "0 0 20px 0",
          lineHeight: "1.5",
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}>
          Sprich mit Amiya über das, was dich beschäftigt.
        </p>

        {/* Start Session Button */}
        <button
          onClick={handleStartSession}
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
          Session starten
        </button>

        {/* Headphones hint */}
        <p style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          marginTop: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}>
          <Headphones size={14} /> Beste Erfahrung mit Kopfhörern
        </p>
      </div>
    </div>
  );
}
