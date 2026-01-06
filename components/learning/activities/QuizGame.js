/**
 * QUIZ GAME - components/learning/activities/QuizGame.js
 * Interactive quiz with immediate feedback
 * Used for Chapter 2: Four Horsemen identification
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";

export default function QuizGame({
  questions = [],
  onComplete,
  title = "Quiz",
  subtitle = "",
}) {
  const { tokens } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + (showFeedback ? 1 : 0)) / totalQuestions) * 100;

  const handleSelect = (optionIndex) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsComplete(true);
      if (onComplete) {
        onComplete({ score: score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0), total: totalQuestions });
      }
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setIsComplete(false);
  };

  // Results screen
  if (isComplete) {
    const finalScore = score;
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    const isPassing = percentage >= 70;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        {/* Score Circle */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: isPassing
              ? `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`
              : `linear-gradient(135deg, ${tokens.colors.aurora.rose}20 0%, ${tokens.colors.aurora.lavender}20 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            border: `3px solid ${isPassing ? tokens.colors.aurora.mint : tokens.colors.aurora.rose}`,
          }}
        >
          <span
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: isPassing ? tokens.colors.aurora.mint : tokens.colors.aurora.rose,
              fontFamily: tokens.fonts.display,
            }}
          >
            {percentage}%
          </span>
        </div>

        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          {isPassing ? "Gut gemacht!" : "Weiter üben"}
        </h2>

        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.secondary,
            margin: "0 0 24px 0",
          }}
        >
          {finalScore} von {totalQuestions} richtig
        </p>

        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.muted,
            maxWidth: "300px",
            margin: "0 0 32px 0",
            lineHeight: "1.6",
          }}
        >
          {isPassing
            ? "Du erkennst die Stolperfallen gut! Mit der Zeit wirst du sie auch in echten Gesprächen früher bemerken."
            : "Die vier Stolperfallen zu erkennen braucht Übung. Versuch es nochmal oder komm später zurück."}
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleRetry}
            style={{
              padding: "14px 24px",
              background: tokens.colors.bg.elevated,
              border: `1px solid ${tokens.colors.aurora.lavender}30`,
              borderRadius: "12px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <RotateCcw size={18} />
            Nochmal
          </button>

          {isPassing && onComplete && (
            <button
              onClick={() => onComplete({ score: finalScore, total: totalQuestions, completed: true })}
              style={{
                padding: "14px 24px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Fertig
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={tokens.typography.body}>Keine Fragen verfügbar</p>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: tokens.colors.aurora.lavender,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 8px 0",
          }}
        >
          Frage {currentIndex + 1} von {totalQuestions}
        </p>

        {/* Progress Bar */}
        <div
          style={{
            height: "4px",
            background: tokens.colors.bg.surface,
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          background: tokens.colors.bg.surface,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {currentQuestion.context && (
          <p
            style={{
              fontSize: "12px",
              color: tokens.colors.text.muted,
              margin: "0 0 12px 0",
              fontStyle: "italic",
            }}
          >
            {currentQuestion.context}
          </p>
        )}

        <p
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: tokens.colors.text.primary,
            margin: 0,
            lineHeight: "1.5",
            fontFamily: tokens.fonts.display,
          }}
        >
          "{currentQuestion.statement}"
        </p>
      </div>

      {/* Question Prompt */}
      <p
        style={{
          fontSize: "15px",
          color: tokens.colors.text.secondary,
          margin: "0 0 16px 0",
        }}
      >
        {currentQuestion.question || "Welche Stolperfalle ist das?"}
      </p>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === currentQuestion.correctIndex;

          let borderColor = tokens.colors.bg.elevated;
          let bgColor = tokens.colors.bg.elevated;

          if (showFeedback) {
            if (isCorrectOption) {
              borderColor = tokens.colors.aurora.mint;
              bgColor = `${tokens.colors.aurora.mint}15`;
            } else if (isSelected && !isCorrectOption) {
              borderColor = tokens.colors.aurora.rose;
              bgColor = `${tokens.colors.aurora.rose}15`;
            }
          } else if (isSelected) {
            borderColor = tokens.colors.aurora.lavender;
            bgColor = `${tokens.colors.aurora.lavender}15`;
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showFeedback}
              style={{
                padding: "16px",
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: "12px",
                cursor: showFeedback ? "default" : "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {/* Radio/Check indicator */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: showFeedback && isCorrectOption
                    ? "none"
                    : `2px solid ${isSelected ? tokens.colors.aurora.lavender : tokens.colors.text.muted}40`,
                  background: showFeedback && isCorrectOption
                    ? tokens.colors.aurora.mint
                    : showFeedback && isSelected && !isCorrectOption
                      ? tokens.colors.aurora.rose
                      : isSelected
                        ? tokens.colors.aurora.lavender
                        : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {showFeedback && isCorrectOption && (
                  <CheckCircle size={16} color="#fff" />
                )}
                {showFeedback && isSelected && !isCorrectOption && (
                  <XCircle size={16} color="#fff" />
                )}
              </div>

              <span
                style={{
                  fontSize: "15px",
                  color: tokens.colors.text.primary,
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          style={{
            padding: "16px",
            background: isCorrect
              ? `${tokens.colors.aurora.mint}10`
              : `${tokens.colors.aurora.rose}10`,
            borderRadius: "12px",
            marginBottom: "20px",
            border: `1px solid ${isCorrect ? tokens.colors.aurora.mint : tokens.colors.aurora.rose}30`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            {isCorrect ? (
              <CheckCircle size={20} color={tokens.colors.aurora.mint} />
            ) : (
              <XCircle size={20} color={tokens.colors.aurora.rose} />
            )}
            <span
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: isCorrect ? tokens.colors.aurora.mint : tokens.colors.aurora.rose,
              }}
            >
              {isCorrect ? "Richtig!" : "Nicht ganz"}
            </span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: tokens.colors.text.secondary,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Action Button */}
      <div style={{ marginTop: "auto" }}>
        {!showFeedback ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            style={{
              width: "100%",
              padding: "16px",
              background: selectedAnswer !== null
                ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
                : tokens.colors.bg.surface,
              border: "none",
              borderRadius: "12px",
              color: selectedAnswer !== null ? "#fff" : tokens.colors.text.muted,
              fontSize: "16px",
              fontWeight: "600",
              cursor: selectedAnswer !== null ? "pointer" : "not-allowed",
            }}
          >
            Antworten
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              width: "100%",
              padding: "16px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {currentIndex < totalQuestions - 1 ? "Weiter" : "Ergebnis anzeigen"}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
