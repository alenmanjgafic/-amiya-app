/**
 * QUIZ SLIDE - components/slides/QuizSlide.js
 * Entry point for Beziehungskompass quiz
 */
"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "../../lib/ThemeContext";
import { useAuth } from "../../lib/AuthContext";
import { CompassIllustration } from "../AmiyaIllustrations";
import { CheckCircle } from "lucide-react";

export default function QuizSlide() {
  const { tokens, isDarkMode } = useTheme();
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
        <CompassIllustration isDarkMode={isDarkMode} />
      </div>

      <h2 style={{
        ...tokens.typography.h2,
        fontSize: "24px",
        marginBottom: "8px",
      }}>
        Beziehungskompass
      </h2>

      <p style={{
        ...tokens.typography.body,
        marginBottom: "32px",
        lineHeight: "1.6",
        maxWidth: "280px",
      }}>
        {hasCompleted
          ? "Dein Beziehungsprofil ansehen"
          : "Entdecke deinen Beziehungstyp in 5 Minuten"
        }
      </p>

      {/* Start/View Button */}
      <button
        onClick={handleStart}
        style={{
          ...tokens.buttons.primaryLarge,
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {hasCompleted && <CheckCircle size={20} />}
        {hasCompleted ? "Ergebnis ansehen" : "Quiz starten"}
      </button>

      {/* Hint */}
      <p style={{
        ...tokens.typography.small,
        marginTop: "24px",
        maxWidth: "260px",
        lineHeight: "1.5",
      }}>
        {hasCompleted
          ? "Du kannst das Quiz jederzeit wiederholen"
          : "24 Fragen zu deinen Beziehungsbedürfnissen"
        }
      </p>
    </div>
  );
}
