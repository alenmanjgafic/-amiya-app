/**
 * MAIN PAGE - app/page.js
 * Home page with Feature Carousel (Solo, Couple, Message Analyzer)
 * All sessions now navigate to dedicated pages
 */
"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import FeatureCarousel from "../components/FeatureCarousel";
import SoloSessionSlide from "../components/slides/SoloSessionSlide";
import CoupleSessionSlide from "../components/slides/CoupleSessionSlide";
import MessageAnalyzerSlide from "../components/slides/MessageAnalyzerSlide";
import {
  Home as HomeIcon,
  Heart,
  ClipboardList,
} from "lucide-react";

// Wrapper for Suspense (useSearchParams requires it in child components)
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      background: "#fafaf9",
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #e7e5e4",
        borderTopColor: "#7c3aed",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#57534e" }}>Laden...</p>
    </div>
  );
}

function HomeContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && profile && (!profile.name || !profile.partner_name)) {
      router.push("/onboarding");
    }
  }, [user, profile, authLoading, router]);

  // Check for memory consent
  useEffect(() => {
    if (!authLoading && user && profile && profile.name && profile.partner_name) {
      const neverDecided = profile.memory_consent === null ||
                           profile.memory_consent === undefined ||
                           (profile.memory_consent === false && !profile.memory_consent_at);
      if (neverDecided) {
        router.push("/onboarding/memory");
      }
    }
  }, [user, profile, authLoading, router]);

  // Load pending suggestions count for badge
  useEffect(() => {
    const loadPendingSuggestionsCount = async () => {
      if (!profile?.couple_id || !user?.id) return;
      try {
        const response = await fetch(
          `/api/agreements/suggestions?coupleId=${profile.couple_id}&userId=${user.id}`
        );
        const data = await response.json();
        setPendingSuggestionsCount(data.totalPending || 0);
      } catch (error) {
        console.error("Failed to load suggestions count:", error);
      }
    };

    if (user && profile?.couple_id) {
      loadPendingSuggestionsCount();
    }
  }, [user, profile?.couple_id]);

  // Time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Guten Morgen";
    if (hour >= 12 && hour < 17) return "Guten Tag";
    if (hour >= 17 && hour < 21) return "Guten Abend";
    return "Gute Nacht";
  };

  const displayName = profile?.name || "du";
  const partnerName = profile?.partner_name || "";
  const timeGreeting = getTimeGreeting();
  const isConnected = !!profile?.couple_id;

  // Loading state
  if (authLoading) {
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

  if (!user || !profile?.name || !profile?.partner_name) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={{ ...tokens.typography.small, marginTop: "16px" }}>
          {!user ? "Anmeldung wird gepruft..." : "Profil wird geladen..."}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      ...tokens.layout.page,
      paddingBottom: "100px",
      padding: 0,
    }}>
      {/* Header - Profile icon top right */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "16px 20px 0",
      }}>
        <button
          onClick={() => router.push("/profile")}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: tokens.gradients.primary,
            border: "none",
            cursor: "pointer",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: tokens.shadows.soft,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Greeting */}
      <div style={{
        padding: "16px 20px 24px",
        textAlign: "center",
      }}>
        <p style={{
          ...tokens.typography.label,
          marginBottom: "4px",
        }}>
          {timeGreeting.toUpperCase()}
        </p>
        <h1 style={{
          ...tokens.typography.h1,
          fontSize: "32px",
          margin: 0,
        }}>
          {displayName}
        </h1>
      </div>

      {/* Feature Carousel */}
      <FeatureCarousel
        showDots={true}
        showHint={true}
        storageKey="amiya-home-slide"
      >
        {/* Slide 1: Solo Session */}
        <SoloSessionSlide
          userName={displayName}
          partnerName={partnerName}
        />

        {/* Slide 2: Couple Session (only if connected) */}
        {isConnected && (
          <CoupleSessionSlide
            userName={displayName}
            partnerName={partnerName}
          />
        )}

        {/* Slide 3: Message Analyzer */}
        <MessageAnalyzerSlide />
      </FeatureCarousel>

      {/* Bottom Navigation */}
      <div style={tokens.layout.navBar}>
        <button style={tokens.buttons.nav(true)}>
          <HomeIcon size={24} color={tokens.colors.aurora.lavender} />
          <span style={{ color: tokens.colors.aurora.lavender, fontWeight: "600" }}>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Heart size={24} color={tokens.colors.text.muted} />
            {pendingSuggestionsCount > 0 && (
              <span style={tokens.badges.notification}>{pendingSuggestionsCount}</span>
            )}
          </div>
          <span>Wir</span>
        </button>
        <button onClick={() => router.push("/history")} style={tokens.buttons.nav(false)}>
          <ClipboardList size={24} color={tokens.colors.text.muted} />
          <span>Verlauf</span>
        </button>
      </div>
    </div>
  );
}
