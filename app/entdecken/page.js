/**
 * ENTDECKEN PAGE - app/entdecken/page.js
 * Learning series overview with Chapter-based progress tracking
 * Updated for Content + Activity structure
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { ALL_SERIES } from "../../lib/learning-content";
import SeriesCard from "../../components/learning/SeriesCard";
import ChapterCard from "../../components/learning/ChapterCard";
import ActiveChallenges from "../../components/learning/ActiveChallenges";
import { EntdeckenIcon } from "../../components/learning/LearningIcons";
import {
  Home as HomeIcon,
  Heart,
} from "lucide-react";

export default function EntdeckenPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [progress, setProgress] = useState({});
  const [expandedSeries, setExpandedSeries] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Helper: Load progress from localStorage
  const getLocalProgress = () => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("amiya_chapter_progress");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Helper: Save progress to localStorage
  const saveLocalProgress = (newProgress) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("amiya_chapter_progress", JSON.stringify(newProgress));
    } catch (e) {
      console.error("Failed to save local progress:", e);
    }
  };

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load progress (API + localStorage fallback)
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;

      let grouped = {};

      try {
        const response = await fetch(`/api/learning/progress?userId=${user.id}`);
        const data = await response.json();

        // Group by series from API
        // Progress now tracks: chapter_id, content_completed, activity_completed
        (data.progress || []).forEach((p) => {
          if (!grouped[p.series_id]) {
            grouped[p.series_id] = {};
          }
          grouped[p.series_id][p.bite_id || p.chapter_id] = {
            contentCompleted: p.content_completed || p.status === "completed",
            activityCompleted: p.activity_completed || false,
            currentScreen: p.current_screen || 0,
          };
        });
      } catch (error) {
        console.error("Failed to load progress from API:", error);
      }

      // Merge with localStorage
      const localProgress = getLocalProgress();
      for (const [seriesId, chapters] of Object.entries(localProgress)) {
        if (!grouped[seriesId]) {
          grouped[seriesId] = {};
        }
        for (const [chapterId, chapterProgress] of Object.entries(chapters)) {
          if (!grouped[seriesId][chapterId]) {
            grouped[seriesId][chapterId] = chapterProgress;
          } else {
            // Merge: if local says completed, trust that
            if (chapterProgress.contentCompleted) {
              grouped[seriesId][chapterId].contentCompleted = true;
            }
            if (chapterProgress.activityCompleted) {
              grouped[seriesId][chapterId].activityCompleted = true;
            }
          }
        }
      }

      setProgress(grouped);

      // Auto-expand series with progress
      for (const [seriesId, chaptersProgress] of Object.entries(grouped)) {
        const hasProgress = Object.values(chaptersProgress).some(
          (p) => p.contentCompleted || p.activityCompleted
        );
        if (hasProgress) {
          setExpandedSeries(seriesId);
          break;
        }
      }

      setLoadingProgress(false);
    };

    if (user?.id) {
      loadProgress();
    }
  }, [user?.id]);

  // Handle series click
  const handleSeriesClick = (series) => {
    if (expandedSeries === series.id) {
      setExpandedSeries(null);
    } else {
      setExpandedSeries(series.id);
    }
  };

  // Handle content click - go to content player
  const handleContentClick = (chapter, seriesId) => {
    router.push(`/entdecken/chapter/${chapter.id}/content?series=${seriesId}`);
  };

  // Handle activity click - go to activity player
  const handleActivityClick = (chapter, seriesId) => {
    router.push(`/entdecken/chapter/${chapter.id}/activity?series=${seriesId}`);
  };

  // Get chapter status
  const getChapterProgress = (chapterId, seriesId) => {
    const seriesProgress = progress[seriesId] || {};
    return seriesProgress[chapterId] || {
      contentCompleted: false,
      activityCompleted: false,
      currentScreen: 0,
    };
  };

  // Check if chapter is locked (previous chapter not completed)
  const isChapterLocked = (chapter, seriesId) => {
    // First chapter is never locked
    if (chapter.number === 1) return false;

    const series = ALL_SERIES.find((s) => s.id === seriesId);
    if (!series) return true;

    // Find previous chapter
    const prevChapter = series.chapters.find((c) => c.number === chapter.number - 1);
    if (!prevChapter) return false;

    // Check if previous chapter is fully completed (content + activity)
    const prevProgress = getChapterProgress(prevChapter.id, seriesId);
    return !(prevProgress.contentCompleted && prevProgress.activityCompleted);
  };

  // Calculate series completion percentage
  const getSeriesCompletionPercent = (seriesId) => {
    const series = ALL_SERIES.find((s) => s.id === seriesId);
    if (!series) return 0;

    const seriesProgress = progress[seriesId] || {};
    let completed = 0;
    const total = series.chapters.length * 2; // content + activity for each

    for (const chapter of series.chapters) {
      const chapterProgress = seriesProgress[chapter.id] || {};
      if (chapterProgress.contentCompleted) completed++;
      if (chapterProgress.activityCompleted) completed++;
    }

    return Math.round((completed / total) * 100);
  };

  if (authLoading || loadingProgress) {
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

  return (
    <div
      style={{
        ...tokens.layout.page,
        padding: 0,
        paddingBottom: "100px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            background: `${tokens.colors.aurora.lavender}15`,
            borderRadius: "50%",
            marginBottom: "12px",
          }}
        >
          <EntdeckenIcon size={32} active={true} />
        </div>
        <h1
          style={{
            ...tokens.typography.h1,
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Entdecken
        </h1>
        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.muted,
            margin: 0,
          }}
        >
          Lerne Werkzeuge für eure Beziehung
        </p>
      </div>

      {/* Active Challenges */}
      <ActiveChallenges />

      {/* Series List */}
      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {ALL_SERIES.map((series) => {
          const isExpanded = expandedSeries === series.id;
          const completionPercent = getSeriesCompletionPercent(series.id);

          return (
            <SeriesCard
              key={series.id}
              series={series}
              progress={[]} // Legacy prop, not used for display
              completionPercent={completionPercent}
              onClick={() => handleSeriesClick(series)}
              isExpanded={isExpanded}
            >
              {/* Chapters rendered inside the SeriesCard frame */}
              {series.chapters.map((chapter) => {
                const chapterProgress = getChapterProgress(chapter.id, series.id);
                const locked = isChapterLocked(chapter, series.id);

                return (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    progress={chapterProgress}
                    onContentClick={() => handleContentClick(chapter, series.id)}
                    onActivityClick={() => handleActivityClick(chapter, series.id)}
                    isLocked={locked}
                  />
                );
              })}
            </SeriesCard>
          );
        })}

        {/* Coming Soon Placeholder */}
        <div
          style={{
            padding: "24px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
            }}
          >
            Weitere Serien kommen bald...
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={tokens.layout.navBar}>
        <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
          <HomeIcon size={24} color={tokens.colors.text.muted} />
          <span>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
          <Heart size={24} color={tokens.colors.text.muted} />
          <span>Wir</span>
        </button>
        <button style={tokens.buttons.nav(true)}>
          <EntdeckenIcon size={24} active={true} />
          <span style={{ color: tokens.colors.aurora.lavender, fontWeight: "600" }}>
            Entdecken
          </span>
        </button>
      </div>
    </div>
  );
}
