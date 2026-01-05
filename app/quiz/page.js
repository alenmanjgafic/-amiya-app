/**
 * QUIZ INTRO PAGE - app/quiz/page.js
 * Landing page for Archetypen-Quiz
 */
"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { CompassIllustration } from "../../components/AmiyaIllustrations";
import { Clock, Heart, Sparkles, ChevronRight } from "lucide-react";

export default function QuizIntroPage() {
  return (
    <Suspense fallback={<QuizLoadingScreen />}>
      <QuizIntroContent />
    </Suspense>
  );
}

function QuizLoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p>Laden...</p>
    </div>
  );
}

function QuizIntroContent() {
  const { user, profile, loading } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetake = searchParams.get("retake") === "true";

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // If already completed and NOT retaking, redirect to results
  useEffect(() => {
    if (!loading && profile?.quiz_completed_at && !isRetake) {
      router.push("/quiz/result");
    }
  }, [profile, loading, router, isRetake]);

  if (loading || !user) {
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

  const features = [
    {
      icon: Clock,
      title: "5 Minuten",
      description: "Kurz aber tiefgehend",
    },
    {
      icon: Heart,
      title: "24 Fragen",
      description: "Zu deinen Beziehungsbedürfnissen",
    },
    {
      icon: Sparkles,
      title: "Dein Archetyp",
      description: "Einer von 11 Archetypen",
    },
  ];

  return (
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: tokens.colors.text.muted,
          }}
        >
          Abbrechen
        </button>
        <div style={{ width: "80px" }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        textAlign: "center",
      }}>
        {/* Illustration */}
        <div style={{
          width: "240px",
          height: "160px",
          marginBottom: "24px",
        }}>
          <CompassIllustration isDarkMode={isDarkMode} />
        </div>

        {/* Title */}
        <h1 style={{
          ...tokens.typography.h1,
          fontSize: "28px",
          marginBottom: "8px",
        }}>
          Archetypen-Quiz
        </h1>

        <p style={{
          ...tokens.typography.body,
          maxWidth: "300px",
          lineHeight: "1.6",
          marginBottom: "32px",
        }}>
          Entdecke deinen Archetyp und verstehe deine Bedürfnisse in Partnerschaften besser.
        </p>

        {/* Feature Cards */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
          maxWidth: "340px",
          marginBottom: "32px",
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                background: tokens.colors.bg.surface,
                borderRadius: "12px",
                textAlign: "left",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: tokens.gradients.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <feature.icon size={22} color="white" />
              </div>
              <div>
                <p style={{
                  ...tokens.typography.body,
                  fontWeight: "600",
                  marginBottom: "2px",
                }}>
                  {feature.title}
                </p>
                <p style={{
                  ...tokens.typography.small,
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dimensions Preview */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "32px",
        }}>
          {[
            { name: "Nähe", color: tokens.colors.aurora.lavender },
            { name: "Autonomie", color: tokens.colors.aurora.sky },
            { name: "Intensität", color: tokens.colors.aurora.rose },
            { name: "Sicherheit", color: tokens.colors.aurora.mint },
          ].map((dim, index) => (
            <span
              key={index}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background: `${dim.color}20`,
                color: dim.color,
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {dim.name}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        padding: "20px",
        paddingBottom: "40px",
      }}>
        <button
          onClick={() => router.push("/quiz/questions")}
          style={{
            ...tokens.buttons.primaryLarge,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          Quiz starten
          <ChevronRight size={20} />
        </button>

        <p style={{
          ...tokens.typography.small,
          textAlign: "center",
          marginTop: "16px",
        }}>
          Deine Antworten bleiben privat
        </p>
      </div>
    </div>
  );
}
