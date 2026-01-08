/**
 * QUIZ SLIDE - components/slides/QuizSlide.js
 * Entry point for Archetypen-Quiz
 * Full-bleed image with text overlay
 */
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "../../lib/ThemeContext";
import { useAuth } from "../../lib/AuthContext";
import { CheckCircle } from "lucide-react";

export default function QuizSlide() {
  const { tokens } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();

  const hasCompleted = !!profile?.quiz_completed_at;

  const handleStart = () => {
    if (hasCompleted) {
      router.push("/quiz/result");
    } else {
      router.push("/quiz");
    }
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
          src="/images/quiz-01.jpg"
          alt="Archetypen-Quiz"
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
          Archetypen-Quiz
        </h2>

        <p style={{
          fontSize: "15px",
          color: "rgba(255,255,255,0.9)",
          margin: "0 0 20px 0",
          lineHeight: "1.5",
          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}>
          {hasCompleted
            ? "Deinen Archetyp ansehen"
            : "Entdecke deinen Archetyp in 5 Minuten"
          }
        </p>

        {/* Start/View Button */}
        <button
          onClick={handleStart}
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
          {hasCompleted && <CheckCircle size={20} />}
          {hasCompleted ? "Ergebnis ansehen" : "Quiz starten"}
        </button>

        {/* Hint */}
        <p style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          marginTop: "14px",
          textAlign: "center",
          lineHeight: "1.4",
        }}>
          {hasCompleted
            ? "Du kannst das Quiz jederzeit wiederholen"
            : "24 Fragen zu deinen Beziehungsbedürfnissen"
          }
        </p>
      </div>
    </div>
  );
}
