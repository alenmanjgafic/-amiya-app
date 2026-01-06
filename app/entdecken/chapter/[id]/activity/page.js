/**
 * CHAPTER ACTIVITY PAGE - app/entdecken/chapter/[id]/activity/page.js
 * Plays the activity part of a chapter
 * Dynamically loads the correct activity component based on type
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "../../../../../lib/AuthContext";
import { useTheme } from "../../../../../lib/ThemeContext";
import { getChapterFromAnySeries } from "../../../../../lib/learning-content";
import { ChevronLeft } from "lucide-react";

// Activity components
import QuizGame from "../../../../../components/learning/activities/QuizGame";
import ChatPractice from "../../../../../components/learning/activities/ChatPractice";
import Pick from "../../../../../components/learning/activities/Pick";
import Nudge from "../../../../../components/learning/activities/Nudge";
import Reflection from "../../../../../components/learning/activities/Reflection";
import Commitment from "../../../../../components/learning/activities/Commitment";

// Map activity types to components
const ACTIVITY_COMPONENTS = {
  quiz: QuizGame,
  chat_practice: ChatPractice,
  pick: Pick,
  nudge: Nudge,
  reflection: Reflection,
  commitment: Commitment,
};

export default function ChapterActivityPage() {
  const params = useParams();
  const chapterId = params.id;

  const searchParams = useSearchParams();
  const seriesId = searchParams.get("series") || "healthy-conflict";

  const { user, profile, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [chapter, setChapter] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentCompleted, setContentCompleted] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load chapter and check if content is completed
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

        // Check if content is completed
        const progressResponse = await fetch(
          `/api/learning/progress?userId=${user.id}&seriesId=${result.series.id}`
        );
        const progressData = await progressResponse.json();

        const chapterProgress = (progressData.progress || []).find(
          (p) => (p.chapter_id || p.bite_id) === chapterId
        );

        if (chapterProgress?.content_completed) {
          setContentCompleted(true);
        } else {
          // Also check localStorage
          try {
            const stored = localStorage.getItem("amiya_chapter_progress");
            const localProgress = stored ? JSON.parse(stored) : {};
            if (localProgress[result.series.id]?.[chapterId]?.contentCompleted) {
              setContentCompleted(true);
            }
          } catch (e) {
            console.error("LocalStorage error:", e);
          }
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

  // Handle activity completion
  const handleActivityComplete = async (result) => {
    if (!user?.id || !chapter) return;

    try {
      // Save activity completion
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          chapterId: chapter.id,
          seriesId: series?.id || seriesId,
          activityCompleted: true,
        }),
      });

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("amiya_chapter_progress");
          const progress = stored ? JSON.parse(stored) : {};
          if (!progress[seriesId]) progress[seriesId] = {};
          progress[seriesId][chapter.id] = {
            ...progress[seriesId][chapter.id],
            activityCompleted: true,
          };
          localStorage.setItem("amiya_chapter_progress", JSON.stringify(progress));
        } catch (e) {
          console.error("LocalStorage error:", e);
        }
      }

      // Navigate back to entdecken
      router.push("/entdecken");
    } catch (error) {
      console.error("Failed to save activity completion:", error);
      router.push("/entdecken");
    }
  };

  // Handle back
  const handleBack = () => {
    router.push("/entdecken");
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

  if (!chapter) {
    return (
      <div
        style={{
          ...tokens.layout.pageCentered,
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <p style={tokens.typography.body}>Kapitel nicht gefunden</p>
        <button
          onClick={() => router.push("/entdecken")}
          style={tokens.buttons.primary}
        >
          Zurück
        </button>
      </div>
    );
  }

  // Check if content is completed
  if (!contentCompleted) {
    return (
      <div
        style={{
          ...tokens.layout.pageCentered,
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ ...tokens.typography.body, color: tokens.colors.text.secondary }}>
          Bitte schliesse zuerst den Content-Teil ab.
        </p>
        <button
          onClick={() => router.push(`/entdecken/chapter/${chapterId}/content?series=${seriesId}`)}
          style={{
            padding: "14px 24px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Zum Content
        </button>
      </div>
    );
  }

  // Get the activity component
  const activity = chapter.activity;
  const ActivityComponent = ACTIVITY_COMPONENTS[activity?.type];

  if (!ActivityComponent) {
    return (
      <div
        style={{
          ...tokens.layout.pageCentered,
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <p style={tokens.typography.body}>Aktivitätstyp nicht unterstützt: {activity?.type}</p>
        <button
          onClick={() => router.push("/entdecken")}
          style={tokens.buttons.primary}
        >
          Zurück
        </button>
      </div>
    );
  }

  // Build props based on activity type
  const activityProps = {
    chapterId: chapter.id,
    onComplete: handleActivityComplete,
    userId: user?.id,
    ...activity.config,
  };

  // Type-specific props
  if (activity.type === "chat_practice") {
    activityProps.exerciseType = activity.config?.exerciseType || chapter.id;
    activityProps.scenario = activity.config?.scenario || {};
  } else if (activity.type === "quiz") {
    activityProps.questions = activity.config?.questions || [];
    activityProps.title = activity.title;
  } else if (activity.type === "pick") {
    activityProps.steps = activity.config?.steps || [];
    activityProps.title = activity.title;
  } else if (activity.type === "nudge") {
    activityProps.reflection = activity.config?.reflection || {};
    activityProps.actionTask = activity.config?.actionTask || {};
    activityProps.examples = activity.config?.examples || [];
  } else if (activity.type === "reflection") {
    activityProps.sections = activity.config?.sections || [];
    activityProps.title = activity.title;
  } else if (activity.type === "commitment") {
    activityProps.options = activity.config?.options || [];
    activityProps.title = activity.title;
    activityProps.minSelections = activity.config?.minSelections || 2;
    activityProps.maxSelections = activity.config?.maxSelections || 3;
    activityProps.agreementConfig = activity.config?.agreementConfig || {};
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

        <div style={{ flex: 1, textAlign: "center" }}>
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
            Kapitel {chapter.number} - {activity.type.replace("_", " ").toUpperCase()}
          </p>
        </div>

        <div style={{ width: "40px" }} />
      </div>

      {/* Activity Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <ActivityComponent {...activityProps} />
      </div>
    </div>
  );
}
