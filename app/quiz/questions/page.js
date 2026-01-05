/**
 * QUIZ QUESTIONS PAGE - app/quiz/questions/page.js
 * 24-question flow with 7-point Likert scale
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { getOrderedQuestions, formatResultsForStorage } from "../../../lib/quizLogic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const QUESTIONS = getOrderedQuestions();
const TOTAL = QUESTIONS.length;

// Likert scale labels
const SCALE_LABELS = {
  1: "Stimmt gar nicht",
  4: "Neutral",
  7: "Stimmt voll",
};

export default function QuizQuestionsPage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(Math.max(0, currentIndex), TOTAL - 1);
  const currentQuestion = QUESTIONS[safeIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const progress = ((safeIndex + 1) / TOTAL) * 100;
  const isLastQuestion = safeIndex === TOTAL - 1;
  const allAnswered = Object.keys(answers).length === TOTAL;

  const handleAnswer = (value) => {
    // Guard against undefined currentQuestion
    if (!currentQuestion) {
      console.error("No current question at index:", currentIndex);
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Auto-advance after short delay (if not last question)
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, TOTAL - 1));
      }, 300);
    }
  };

  const handleBack = () => {
    if (safeIndex > 0) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else {
      router.push("/quiz");
    }
  };

  const handleNext = () => {
    if (currentAnswer && !isLastQuestion) {
      setCurrentIndex(prev => Math.min(prev + 1, TOTAL - 1));
    }
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const results = formatResultsForStorage(answers);

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Nicht authentifiziert");
      }

      // Use REST API with proper auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
        {
          method: "PATCH",
          headers: {
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            quiz_results: results,
            quiz_completed_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", response.status, errorText);
        throw new Error(`Update failed: ${response.status}`);
      }

      // Refresh profile to get updated data
      await fetchProfile(user.id);

      router.push("/quiz/result");
    } catch (err) {
      console.error("Failed to save quiz results:", err);
      setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}>
      {/* Header with Progress */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${tokens.colors.bg.soft}`,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}>
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: tokens.colors.text.muted,
              fontSize: "14px",
            }}
          >
            <ChevronLeft size={20} />
            Zurück
          </button>
          <span style={{
            ...tokens.typography.small,
            fontWeight: "600",
          }}>
            {safeIndex + 1} / {TOTAL}
          </span>
          <div style={{ width: "80px" }} />
        </div>

        {/* Progress Bar */}
        <div style={{
          width: "100%",
          height: "4px",
          background: tokens.colors.bg.surface,
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: tokens.gradients.primary,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "32px 20px",
      }}>
        {/* Dimension Indicator */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "24px",
        }}>
          <span style={{
            padding: "6px 14px",
            borderRadius: "20px",
            background: getDimensionColor(currentQuestion?.dimension, tokens) + "20",
            color: getDimensionColor(currentQuestion?.dimension, tokens),
            fontSize: "12px",
            fontWeight: "500",
            textTransform: "uppercase",
          }}>
            {getDimensionLabel(currentQuestion?.dimension)}
          </span>
        </div>

        {/* Question Text */}
        <p style={{
          ...tokens.typography.h2,
          fontSize: "20px",
          lineHeight: "1.5",
          textAlign: "center",
          marginBottom: "48px",
          maxWidth: "380px",
          alignSelf: "center",
        }}>
          {currentQuestion?.text}
        </p>

        {/* Likert Scale */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {/* Scale Labels */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 8px",
          }}>
            <span style={{ ...tokens.typography.small, fontSize: "11px" }}>
              {SCALE_LABELS[1]}
            </span>
            <span style={{ ...tokens.typography.small, fontSize: "11px" }}>
              {SCALE_LABELS[7]}
            </span>
          </div>

          {/* Scale Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
          }}>
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                style={{
                  flex: 1,
                  aspectRatio: "1",
                  maxWidth: "48px",
                  borderRadius: "50%",
                  border: currentAnswer === value
                    ? "none"
                    : `2px solid ${tokens.colors.bg.soft}`,
                  background: currentAnswer === value
                    ? tokens.gradients.primary
                    : tokens.colors.bg.elevated,
                  color: currentAnswer === value
                    ? "white"
                    : tokens.colors.text.primary,
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: currentAnswer === value ? "scale(1.1)" : "scale(1)",
                }}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Center Label */}
          <div style={{
            textAlign: "center",
            marginTop: "-8px",
          }}>
            <span style={{ ...tokens.typography.small, fontSize: "11px" }}>
              {SCALE_LABELS[4]}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        padding: "20px",
        paddingBottom: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {isLastQuestion ? (
          <>
            {!allAnswered && (
              <p style={{
                ...tokens.typography.small,
                color: tokens.colors.aurora.rose,
                textAlign: "center",
                margin: 0,
              }}>
                {Object.keys(answers).length} von {TOTAL} Fragen beantwortet
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{
                ...tokens.buttons.primaryLarge,
                width: "100%",
                opacity: (!allAnswered || submitting) ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {submitting ? "Wird ausgewertet..." : "Auswerten"}
            </button>
          </>
        ) : (
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            style={{
              ...tokens.buttons.primaryLarge,
              width: "100%",
              opacity: !currentAnswer ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Weiter
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          left: "20px",
          right: "20px",
          padding: "12px 16px",
          background: tokens.colors.aurora.rose,
          color: "white",
          borderRadius: "12px",
          textAlign: "center",
          fontSize: "14px",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getDimensionLabel(dimension) {
  const labels = {
    naehe: "Nähe",
    autonomie: "Autonomie",
    intensitaet: "Intensität",
    sicherheit: "Sicherheit",
  };
  return labels[dimension] || dimension;
}

function getDimensionColor(dimension, tokens) {
  const colors = {
    naehe: tokens.colors.aurora.lavender,
    autonomie: tokens.colors.aurora.sky,
    intensitaet: tokens.colors.aurora.rose,
    sicherheit: tokens.colors.aurora.mint,
  };
  return colors[dimension] || tokens.colors.aurora.lavender;
}
