/**
 * SERIES DETAIL PAGE - app/entdecken/series/[seriesId]/page.js
 * Full detail view for a learning series with all chapters
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../../../lib/AuthContext";
import { useTheme } from "../../../../lib/ThemeContext";
import { getSeriesById } from "../../../../lib/learning-content";
import ChapterCard from "../../../../components/learning/ChapterCard";
import { ArrowLeft, Clock, BookOpen, Lock } from "lucide-react";

export default function SeriesDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();
  const params = useParams();
  const seriesId = params.seriesId;

  const [progress, setProgress] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  const series = getSeriesById(seriesId);

  // Helper: Get user-specific localStorage key
  const getStorageKey = (userId) => `amiya_chapter_progress_${userId}`;

  // Helper: Load progress from localStorage
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

  // Load progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id || !seriesId) return;

      let seriesProgress = {};

      try {
        const response = await fetch(`/api/learning/progress?userId=${user.id}`);
        const data = await response.json();

        (data.progress || []).forEach((p) => {
          if (p.series_id === seriesId) {
            seriesProgress[p.bite_id || p.chapter_id] = {
              contentCompleted: p.content_completed || p.status === "completed",
              activityCompleted: p.activity_completed || false,
              currentScreen: p.current_screen || 0,
            };
          }
        });
      } catch (error) {
        console.error("Failed to load progress from API:", error);
      }

      // Merge with localStorage
      const localProgress = getLocalProgress(user.id);
      const localSeriesProgress = localProgress[seriesId] || {};

      for (const [chapterId, chapterProgress] of Object.entries(localSeriesProgress)) {
        if (!seriesProgress[chapterId]) {
          seriesProgress[chapterId] = chapterProgress;
        } else {
          if (chapterProgress.contentCompleted) {
            seriesProgress[chapterId].contentCompleted = true;
          }
          if (chapterProgress.activityCompleted) {
            seriesProgress[chapterId].activityCompleted = true;
          }
        }
      }

      setProgress(seriesProgress);
      setLoadingProgress(false);
    };

    if (user?.id) {
      loadProgress();
    }
  }, [user?.id, seriesId]);

  // Get chapter progress
  const getChapterProgress = (chapterId) => {
    return progress[chapterId] || {
      contentCompleted: false,
      activityCompleted: false,
      currentScreen: 0,
    };
  };

  // Check if chapter is locked
  const isChapterLocked = (chapter) => {
    if (!series) return true;
    if (chapter.number === 1) return false;
    const prevChapter = series.chapters.find((c) => c.number === chapter.number - 1);
    if (!prevChapter) return false;
    const prevProgress = getChapterProgress(prevChapter.id);
    return !(prevProgress.contentCompleted && prevProgress.activityCompleted);
  };

  // Calculate completion
  const getCompletionStats = () => {
    if (!series?.chapters) return { completed: 0, total: 0, percent: 0 };

    let completed = 0;
    const total = series.chapters.length;

    for (const chapter of series.chapters) {
      const chapterProgress = progress[chapter.id] || {};
      if (chapterProgress.contentCompleted && chapterProgress.activityCompleted) {
        completed++;
      }
    }

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // Handlers
  const handleContentClick = (chapter) => {
    router.push(`/entdecken/chapter/${chapter.id}/content?series=${seriesId}`);
  };

  const handleActivityClick = (chapter) => {
    router.push(`/entdecken/chapter/${chapter.id}/activity?series=${seriesId}`);
  };

  if (authLoading || loadingProgress) {
    return (
      <div style={{ ...tokens.layout.pageCentered, flexDirection: "column", gap: "16px" }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div style={{ ...tokens.layout.pageCentered, flexDirection: "column", gap: "16px" }}>
        <p style={tokens.typography.body}>Serie nicht gefunden</p>
        <button onClick={() => router.push("/entdecken")} style={tokens.buttons.secondary}>
          Zurück
        </button>
      </div>
    );
  }

  const stats = getCompletionStats();
  const isComingSoon = series.comingSoon;

  return (
    <div style={{ minHeight: "100vh", background: tokens.colors.bg.deep }}>
      {/* Hero Image */}
      <div style={{ position: "relative", height: "240px" }}>
        {series.image ? (
          <Image
            src={series.image}
            alt={series.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${series.color}40 0%, ${series.color}20 100%)`,
          }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }} />

        {/* Back button */}
        <button
          onClick={() => router.push("/entdecken")}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Title on image */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          right: "20px",
        }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#fff",
            margin: "0 0 4px 0",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontFamily: tokens.fonts.display,
          }}>
            {series.title}
          </h1>
          <p style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.9)",
            margin: 0,
          }}>
            {series.subtitle}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px", paddingBottom: "40px" }}>
        {/* Stats Row */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: tokens.colors.bg.elevated,
            borderRadius: "20px",
          }}>
            <BookOpen size={14} color={tokens.colors.text.muted} />
            <span style={{ fontSize: "13px", color: tokens.colors.text.secondary }}>
              {series.chapters?.length || series.chapterCount} Kapitel
            </span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: tokens.colors.bg.elevated,
            borderRadius: "20px",
          }}>
            <Clock size={14} color={tokens.colors.text.muted} />
            <span style={{ fontSize: "13px", color: tokens.colors.text.secondary }}>
              ~{series.totalDurationMin} Min
            </span>
          </div>
          {!isComingSoon && stats.completed > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: `${tokens.colors.aurora.mint}20`,
              borderRadius: "20px",
            }}>
              <span style={{ fontSize: "13px", color: tokens.colors.aurora.mint, fontWeight: "600" }}>
                {stats.completed}/{stats.total}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.text.secondary,
          marginBottom: "24px",
          lineHeight: "1.6",
        }}>
          {series.description}
        </p>

        {/* Progress Bar */}
        {!isComingSoon && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}>
              <span style={{ fontSize: "13px", color: tokens.colors.text.muted }}>
                Fortschritt
              </span>
              <span style={{ fontSize: "13px", color: tokens.colors.aurora.lavender, fontWeight: "600" }}>
                {stats.percent}%
              </span>
            </div>
            <div style={{
              height: "6px",
              background: tokens.colors.bg.elevated,
              borderRadius: "3px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${stats.percent}%`,
                background: stats.percent >= 100
                  ? tokens.colors.aurora.mint
                  : tokens.gradients.primaryHorizontal,
                borderRadius: "3px",
                transition: "width 0.5s ease-out",
              }} />
            </div>
          </div>
        )}

        {/* Chapters */}
        {!isComingSoon && series.chapters?.length > 0 ? (
          <div>
            <h2 style={{
              ...tokens.typography.h3,
              marginBottom: "16px",
              fontSize: "16px",
            }}>
              Kapitel
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {series.chapters.map((chapter) => {
                const chapterProgress = getChapterProgress(chapter.id);
                const locked = isChapterLocked(chapter);

                return (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    progress={chapterProgress}
                    onContentClick={() => handleContentClick(chapter)}
                    onActivityClick={() => handleActivityClick(chapter)}
                    isLocked={locked}
                  />
                );
              })}
            </div>
          </div>
        ) : isComingSoon ? (
          <div style={{
            padding: "40px 24px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            textAlign: "center",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: `${tokens.colors.aurora.lavender}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Lock size={28} color={tokens.colors.aurora.lavender} />
            </div>
            <h3 style={{
              ...tokens.typography.h3,
              marginBottom: "8px",
            }}>
              Bald verfügbar
            </h3>
            <p style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
            }}>
              Diese Serie ist noch in Arbeit und wird bald freigeschaltet.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
