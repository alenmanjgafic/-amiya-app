/**
 * BITE PLAYER PAGE - app/entdecken/bite/[id]/page.js
 * Dynamic page for playing a specific learning bite
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "../../../../lib/AuthContext";
import { useTheme } from "../../../../lib/ThemeContext";
import { getBiteFromAnySeries } from "../../../../lib/learning-content";
import BitePlayer from "../../../../components/learning/BitePlayer";

export default function BitePage() {
  // Use useParams hook for client components
  const params = useParams();
  const biteId = params.id;

  const searchParams = useSearchParams();
  const seriesId = searchParams.get("series") || "healthy-conflict";

  const { user, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [bite, setBite] = useState(null);
  const [series, setSeries] = useState(null);
  const [initialScreen, setInitialScreen] = useState(0);
  const [initialResponses, setInitialResponses] = useState({});
  const [allBiteResponses, setAllBiteResponses] = useState({});
  const [loading, setLoading] = useState(true);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load bite content and progress
  useEffect(() => {
    const loadBite = async () => {
      if (!user?.id || !biteId) return;

      try {
        // Get bite content
        const result = getBiteFromAnySeries(biteId);
        if (!result) {
          console.error("Bite not found:", biteId);
          router.push("/entdecken");
          return;
        }

        setBite(result.bite);
        setSeries(result.series);

        // Load progress
        const progressResponse = await fetch(
          `/api/learning/progress?userId=${user.id}&seriesId=${result.series.id}`
        );
        const progressData = await progressResponse.json();

        const biteProgress = (progressData.progress || []).find(
          (p) => p.bite_id === biteId
        );

        if (biteProgress) {
          setInitialScreen(biteProgress.current_screen || 0);
        }

        // Mark as in_progress if starting fresh
        if (!biteProgress || biteProgress.status === "available") {
          await fetch("/api/learning/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              biteId: biteId,
              seriesId: result.series.id,
              status: "in_progress",
              currentScreen: biteProgress?.current_screen || 0,
            }),
          });
        }

        // Load responses for this bite
        const responsesResponse = await fetch(
          `/api/learning/responses?userId=${user.id}&biteId=${biteId}`
        );
        const responsesData = await responsesResponse.json();

        if (responsesData.responseMap && responsesData.responseMap[biteId]) {
          setInitialResponses(responsesData.responseMap[biteId]);
        }

        // Load responses from all bites (for summary screens)
        const allResponsesResponse = await fetch(
          `/api/learning/responses?userId=${user.id}`
        );
        const allResponsesData = await allResponsesResponse.json();

        if (allResponsesData.responseMap) {
          setAllBiteResponses(allResponsesData.responseMap);
        }
      } catch (error) {
        console.error("Failed to load bite:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadBite();
    }
  }, [user?.id, biteId, router]);

  // Handle bite completion
  const handleComplete = () => {
    // Router push is handled in BitePlayer
    console.log("Bite completed:", biteId);
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

  if (!bite) {
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
    <BitePlayer
      bite={bite}
      seriesId={series?.id || seriesId}
      initialScreen={initialScreen}
      initialResponses={initialResponses}
      allBiteResponses={allBiteResponses}
      onComplete={handleComplete}
    />
  );
}
