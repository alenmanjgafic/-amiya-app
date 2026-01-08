/**
 * ENTDECKEN PAGE - app/entdecken/page.js
 * Learning series overview with carousel
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { ALL_SERIES } from "../../lib/learning-content";
import FeatureCarousel from "../../components/FeatureCarousel";
import LearningSeriesSlide from "../../components/slides/LearningSeriesSlide";
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
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Helper: Get user-specific localStorage key
  const getStorageKey = (userId) => `amiya_chapter_progress_${userId}`;

  // Helper: Load progress from localStorage (user-specific)
  const getLocalProgress = (userId) => {
    if (typeof window === "undefined" || !userId) return {};
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
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

      // Merge with localStorage (user-specific)
      const localProgress = getLocalProgress(user.id);
      for (const [seriesId, chapters] of Object.entries(localProgress)) {
        if (!grouped[seriesId]) {
          grouped[seriesId] = {};
        }
        for (const [chapterId, chapterProgress] of Object.entries(chapters)) {
          if (!grouped[seriesId][chapterId]) {
            grouped[seriesId][chapterId] = chapterProgress;
          } else {
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
      setLoadingProgress(false);
    };

    if (user?.id) {
      loadProgress();
    }
  }, [user?.id]);

  // Calculate completed chapters for a series
  const getCompletedChaptersCount = (seriesId) => {
    const series = ALL_SERIES.find((s) => s.id === seriesId);
    if (!series || !series.chapters) return 0;

    const seriesProgress = progress[seriesId] || {};
    let completed = 0;

    for (const chapter of series.chapters) {
      const chapterProgress = seriesProgress[chapter.id] || {};
      if (chapterProgress.contentCompleted && chapterProgress.activityCompleted) {
        completed++;
      }
    }

    return completed;
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
          padding: "24px 20px 20px",
        }}
      >
        <h1
          style={{
            ...tokens.typography.h1,
            margin: 0,
            marginBottom: "4px",
            fontSize: "28px",
          }}
        >
          Entdecken
        </h1>
        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.muted,
            margin: 0,
            fontSize: "15px",
          }}
        >
          Werkzeuge für eure Beziehung
        </p>
      </div>

      {/* Series Carousel */}
      <div style={{ marginBottom: "24px" }}>
        <FeatureCarousel
          initialSlide={0}
          showDots={true}
          showHint={true}
          storageKey="amiya-entdecken-series"
        >
          {ALL_SERIES.map((series) => (
            <LearningSeriesSlide
              key={series.id}
              series={series}
              completedChapters={getCompletedChaptersCount(series.id)}
              totalChapters={series.chapters?.length || series.chapterCount || 0}
            />
          ))}
        </FeatureCarousel>
      </div>

      {/* Active Challenges */}
      <ActiveChallenges />

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
