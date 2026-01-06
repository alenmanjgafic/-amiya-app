/**
 * CHAPTER CONTENT PAGE - app/entdecken/chapter/[id]/content/page.js
 * Plays the content (theory screens) part of a chapter
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "../../../../../lib/AuthContext";
import { useTheme } from "../../../../../lib/ThemeContext";
import { getChapterFromAnySeries } from "../../../../../lib/learning-content";
import ProgressDots from "../../../../../components/learning/ProgressDots";
import TheoryScreen from "../../../../../components/learning/TheoryScreen";
import ExerciseScreen from "../../../../../components/learning/ExerciseScreen";
import { ChevronLeft, ArrowRight } from "lucide-react";

export default function ChapterContentPage() {
  const params = useParams();
  const chapterId = params.id;

  const searchParams = useSearchParams();
  const seriesId = searchParams.get("series") || "healthy-conflict";

  const { user, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [chapter, setChapter] = useState(null);
  const [series, setSeries] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [responses, setResponses] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load chapter content
  useEffect(() => {
    const loadChapter = async () => {
      if (!user?.id || !chapterId) return;

      try {
        const result = getChapterFromAnySeries(chapterId);
        if (!result) {
          console.error("Chapter not found:", chapterId);
          router.push("/entdecken");
          return;
        }

        setChapter(result.chapter);
        setSeries(result.series);

        // Load existing progress
        const progressResponse = await fetch(
          `/api/learning/progress?userId=${user.id}&seriesId=${result.series.id}`
        );
        const progressData = await progressResponse.json();

        const chapterProgress = (progressData.progress || []).find(
          (p) => (p.chapter_id || p.bite_id) === chapterId
        );

        if (chapterProgress && chapterProgress.current_screen) {
          setCurrentScreen(chapterProgress.current_screen);
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadChapter();
    }
  }, [user?.id, chapterId, router]);

  const screens = chapter?.content?.screens || [];
  const totalScreens = screens.length;
  const screen = screens[currentScreen];

  // Save progress
  const saveProgress = useCallback(async (screenIndex, completed = false) => {
    if (!user?.id || !chapter) return;

    try {
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          chapterId: chapter.id,
          seriesId: series?.id || seriesId,
          contentCompleted: completed,
          currentScreen: screenIndex,
        }),
      });

      // Also save to localStorage for immediate UI feedback
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("amiya_chapter_progress");
          const progress = stored ? JSON.parse(stored) : {};
          if (!progress[seriesId]) progress[seriesId] = {};
          progress[seriesId][chapter.id] = {
            ...progress[seriesId][chapter.id],
            contentCompleted: completed,
            currentScreen: screenIndex,
          };
          localStorage.setItem("amiya_chapter_progress", JSON.stringify(progress));
        } catch (e) {
          console.error("LocalStorage error:", e);
        }
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [user?.id, chapter, series?.id, seriesId]);

  // Handle response
  const handleResponse = (response) => {
    const key = screen?.responseKey || screen?.id;
    setResponses({ ...responses, [key]: response });
  };

  // Handle continue
  const handleContinue = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (currentScreen < totalScreens - 1) {
      await saveProgress(currentScreen + 1, false);
      setCurrentScreen(currentScreen + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    } else {
      // Content complete - save and go to activity
      await saveProgress(totalScreens, true);
      router.push(`/entdecken/chapter/${chapterId}/activity?series=${seriesId}`);
    }
  };

  // Handle back
  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    } else {
      router.push("/entdecken");
    }
  };

  // Check if can continue
  const canContinue = () => {
    if (!screen) return false;
    if (screen.type === "theory" || screen.type === "title") return true;
    if (screen.requireResponse) {
      const key = screen.responseKey || screen.id;
      return responses[key] !== undefined;
    }
    return true;
  };

  if (authLoading || loading) {
    return (
      <div
        style={{
          ...tokens.layout.pageCentered,
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  if (!chapter || !screen) {
    return (
      <div
        style={{
          ...tokens.layout.pageCentered,
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <p style={tokens.typography.body}>Inhalt nicht gefunden</p>
        <button
          onClick={() => router.push("/entdecken")}
          style={tokens.buttons.primary}
        >
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: tokens.colors.bg.base,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${tokens.colors.bg.elevated}`,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: tokens.colors.text.muted,
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <ProgressDots
          total={totalScreens}
          current={currentScreen}
          showNumbers={false}
        />

        <div style={{ width: "40px" }} />
      </div>

      {/* Chapter Info */}
      <div
        style={{
          padding: "12px 20px",
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}10 0%, ${tokens.colors.aurora.rose}10 100%)`,
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: tokens.colors.aurora.lavender,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          Kapitel {chapter.number} - Content
        </p>
        <p
          style={{
            fontSize: "14px",
            color: tokens.colors.text.secondary,
            margin: "4px 0 0 0",
          }}
        >
          {chapter.content.title}
        </p>
      </div>

      {/* Screen Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
        }}
      >
        {screen.type === "theory" || screen.type === "title" ? (
          <TheoryScreen screen={screen} />
        ) : (
          <ExerciseScreen
            screen={screen}
            responses={responses}
            onResponse={handleResponse}
          />
        )}
      </div>

      {/* Continue Button */}
      <div
        style={{
          padding: "20px",
          borderTop: `1px solid ${tokens.colors.bg.elevated}`,
        }}
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue() || isTransitioning}
          style={{
            width: "100%",
            padding: "16px",
            background: canContinue()
              ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
              : tokens.colors.bg.surface,
            border: "none",
            borderRadius: "12px",
            color: canContinue() ? "#fff" : tokens.colors.text.muted,
            fontSize: "16px",
            fontWeight: "600",
            cursor: canContinue() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {currentScreen < totalScreens - 1 ? "Weiter" : "Zur Aktivität"}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
