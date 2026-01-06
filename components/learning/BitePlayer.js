/**
 * BITE PLAYER - Main component for playing through a learning bite
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../lib/ThemeContext";
import { useAuth } from "../../lib/AuthContext";
import ProgressDots from "./ProgressDots";
import TheoryScreen from "./TheoryScreen";
import ExerciseScreen from "./ExerciseScreen";
import { ChevronLeft } from "lucide-react";

export default function BitePlayer({
  bite,
  seriesId,
  initialScreen = 0,
  initialResponses = {},
  allBiteResponses = {},
  onComplete,
}) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [responses, setResponses] = useState(initialResponses);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFirstHint, setShowFirstHint] = useState(true);

  const screens = bite.screens || [];
  const totalScreens = screens.length;
  const screen = screens[currentScreen];

  // Save progress periodically
  const saveProgress = useCallback(async (screenIndex, newResponses) => {
    if (!user?.id) return;

    try {
      // Save screen position
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          biteId: bite.id,
          seriesId,
          status: "in_progress",
          currentScreen: screenIndex,
        }),
      });

      // Save any new responses
      for (const [key, value] of Object.entries(newResponses)) {
        if (value && typeof value === "object") {
          await fetch("/api/learning/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              biteId: bite.id,
              exerciseId: screen.id,
              responseKey: key,
              responseData: value,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [user?.id, bite.id, seriesId, screen?.id]);

  // Handle response from exercise
  const handleResponse = (response) => {
    const key = screen.responseKey || screen.id;
    const newResponses = { ...responses, [key]: response };
    setResponses(newResponses);
  };

  // Handle continue/next screen
  const handleContinue = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setShowFirstHint(false);

    // Save current progress
    await saveProgress(currentScreen, responses);

    // Move to next screen or complete bite
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    } else {
      // Last screen - complete the bite
      await handleComplete();
    }
  };

  // Handle going back
  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    } else {
      router.push("/entdecken");
    }
  };

  // Helper: Save to localStorage as fallback
  const saveLocalProgress = (biteId, seriesId, status) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("amiya_bite_progress");
      const progress = stored ? JSON.parse(stored) : {};
      if (!progress[seriesId]) {
        progress[seriesId] = {};
      }
      progress[seriesId][biteId] = status;
      localStorage.setItem("amiya_bite_progress", JSON.stringify(progress));
      console.log("Saved to localStorage:", { biteId, seriesId, status });
    } catch (e) {
      console.error("Failed to save local progress:", e);
    }
  };

  // Handle bite completion
  const handleComplete = async () => {
    try {
      // Mark bite as completed (only if logged in)
      if (user?.id) {
        await fetch("/api/learning/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            biteId: bite.id,
            seriesId,
            status: "completed",
            currentScreen: totalScreens,
          }),
        });
      }

      // ALWAYS save to localStorage as fallback
      saveLocalProgress(bite.id, seriesId, "completed");

      onComplete?.();
      router.push("/entdecken");
    } catch (error) {
      console.error("Failed to complete bite:", error);
      // Still save to localStorage and navigate
      saveLocalProgress(bite.id, seriesId, "completed");
      router.push("/entdecken");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle challenge acceptance
  const handleAcceptChallenge = async (challenge) => {
    if (!user?.id) return;

    try {
      await fetch("/api/learning/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          biteId: bite.id,
          challengeType: challenge.type,
          action: "accept",
          durationDays: challenge.duration?.includes("3") ? 3 : 7,
        }),
      });
    } catch (error) {
      console.error("Failed to accept challenge:", error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        if (screen.type === "theory") {
          handleContinue();
        }
      }
      if (e.key === "ArrowLeft") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentScreen, screen]);

  if (!screen) {
    return (
      <div style={tokens.layout.pageCentered}>
        <p>Keine Inhalte gefunden</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: tokens.colors.bg.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          background: tokens.colors.bg.primary,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            color: tokens.colors.text.muted,
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <div style={{ flex: 1 }}>
          <ProgressDots
            current={currentScreen}
            total={totalScreens}
            showCounter={true}
          />
        </div>

        {/* Placeholder for symmetry */}
        <div style={{ width: "40px" }} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          opacity: isTransitioning ? 0.5 : 1,
          transition: "opacity 0.2s ease",
          overflow: "hidden",
        }}
      >
        {screen.type === "theory" ? (
          <TheoryScreen
            screen={screen}
            onContinue={handleContinue}
            showHint={showFirstHint && currentScreen === 0}
          />
        ) : (
          <ExerciseScreen
            screen={screen}
            savedResponse={responses[screen.responseKey || screen.id]}
            allResponses={responses}
            allBiteResponses={allBiteResponses}
            onResponse={handleResponse}
            onContinue={handleContinue}
            onComplete={handleComplete}
            onAcceptChallenge={handleAcceptChallenge}
          />
        )}
      </div>

      {/* Swipe indicator for theory screens */}
      {screen.type === "theory" && currentScreen < totalScreens - 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: tokens.colors.text.muted,
            opacity: 0.5,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
