/**
 * ENTDECKEN PAGE - app/entdecken/page.js
 * Learning series overview with progress tracking
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { ALL_SERIES } from "../../lib/learning-content";
import SeriesCard from "../../components/learning/SeriesCard";
import BiteCard from "../../components/learning/BiteCard";
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
      const stored = localStorage.getItem("amiya_bite_progress");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Helper: Save progress to localStorage
  const saveLocalProgress = (newProgress) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("amiya_bite_progress", JSON.stringify(newProgress));
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
        (data.progress || []).forEach((p) => {
          if (!grouped[p.series_id]) {
            grouped[p.series_id] = [];
          }
          grouped[p.series_id].push(p);
        });
      } catch (error) {
        console.error("Failed to load progress from API:", error);
      }

      // Merge with localStorage (localStorage takes precedence for completed bites)
      const localProgress = getLocalProgress();
      for (const [seriesId, bites] of Object.entries(localProgress)) {
        if (!grouped[seriesId]) {
          grouped[seriesId] = [];
        }
        for (const [biteId, status] of Object.entries(bites)) {
          const existingIndex = grouped[seriesId].findIndex(p => p.bite_id === biteId);
          if (existingIndex >= 0) {
            // If localStorage says completed, trust that
            if (status === "completed") {
              grouped[seriesId][existingIndex].status = "completed";
            }
          } else {
            // Add from localStorage
            grouped[seriesId].push({
              bite_id: biteId,
              series_id: seriesId,
              status: status,
              current_screen: 0,
            });
          }
        }
      }

      setProgress(grouped);

      // Auto-expand series that has in-progress bites or completed bites
      for (const [seriesId, seriesProgress] of Object.entries(grouped)) {
        const hasInProgress = seriesProgress.some(
          (p) => p.status === "in_progress" || p.status === "completed"
        );
        if (hasInProgress) {
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

  // Initialize progress for first series if needed
  const initializeSeriesProgress = async (seriesId) => {
    if (!user?.id) return;

    const series = ALL_SERIES.find((s) => s.id === seriesId);
    if (!series) return;

    // Check if first bite already has progress
    const existingProgress = progress[seriesId] || [];
    if (existingProgress.length > 0) return;

    try {
      // Create available status for first bite
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          biteId: series.bites[0].id,
          seriesId,
          status: "available",
        }),
      });

      // Refresh progress
      const response = await fetch(`/api/learning/progress?userId=${user.id}`);
      const data = await response.json();

      const grouped = {};
      (data.progress || []).forEach((p) => {
        if (!grouped[p.series_id]) {
          grouped[p.series_id] = [];
        }
        grouped[p.series_id].push(p);
      });

      setProgress(grouped);
    } catch (error) {
      console.error("Failed to initialize progress:", error);
    }
  };

  // Handle series click
  const handleSeriesClick = async (series) => {
    if (expandedSeries === series.id) {
      setExpandedSeries(null);
    } else {
      await initializeSeriesProgress(series.id);
      setExpandedSeries(series.id);
    }
  };

  // Handle bite click
  const handleBiteClick = (bite, seriesId) => {
    router.push(`/entdecken/bite/${bite.id}?series=${seriesId}`);
  };

  // Get bite status
  const getBiteStatus = (biteId, seriesId) => {
    const seriesProgress = progress[seriesId] || [];
    const biteProgress = seriesProgress.find((p) => p.bite_id === biteId);
    const series = ALL_SERIES.find((s) => s.id === seriesId);

    if (!series) {
      return { status: "locked", currentScreen: 0 };
    }

    // Find bite index in series
    const biteIndex = series.bites.findIndex((b) => b.id === biteId);

    // First bite is always available
    if (biteIndex === 0) {
      if (biteProgress) {
        return {
          status: biteProgress.status,
          currentScreen: biteProgress.current_screen || 0,
        };
      }
      return { status: "available", currentScreen: 0 };
    }

    // For other bites: check if previous bite is completed
    const previousBite = series.bites[biteIndex - 1];
    const previousProgress = seriesProgress.find((p) => p.bite_id === previousBite.id);
    const previousCompleted = previousProgress?.status === "completed";

    if (biteProgress) {
      // If we have progress, use it - but upgrade to available if previous is done
      if (biteProgress.status === "locked" && previousCompleted) {
        return { status: "available", currentScreen: 0 };
      }
      return {
        status: biteProgress.status,
        currentScreen: biteProgress.current_screen || 0,
      };
    }

    // No progress yet - available if previous is completed, otherwise locked
    if (previousCompleted) {
      return { status: "available", currentScreen: 0 };
    }

    return { status: "locked", currentScreen: 0 };
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
          const seriesProgress = progress[series.id] || [];
          const isExpanded = expandedSeries === series.id;

          return (
            <SeriesCard
              key={series.id}
              series={series}
              progress={seriesProgress}
              onClick={() => handleSeriesClick(series)}
              isExpanded={isExpanded}
            >
              {/* Bites rendered inside the SeriesCard frame */}
              {series.bites.map((bite, index) => {
                const { status, currentScreen } = getBiteStatus(
                  bite.id,
                  series.id
                );

                return (
                  <BiteCard
                    key={bite.id}
                    bite={bite}
                    status={status}
                    currentScreen={currentScreen}
                    onClick={() => handleBiteClick(bite, series.id)}
                    index={index}
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
