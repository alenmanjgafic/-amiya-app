/**
 * LEARNING SERIES SLIDE - components/slides/LearningSeriesSlide.js
 * Card for learning series in carousel
 * Shows progress, status, and allows starting/continuing
 */
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, CheckCircle, BookOpen } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";

export default function LearningSeriesSlide({
  series,
  completedChapters = 0,
  totalChapters = 0,
  isActive = true,
}) {
  const { tokens } = useTheme();
  const router = useRouter();

  const isComingSoon = series.comingSoon;
  const isCompleted = completedChapters >= totalChapters && totalChapters > 0;
  const isStarted = completedChapters > 0;
  const progressPercent = totalChapters > 0
    ? Math.round((completedChapters / totalChapters) * 100)
    : 0;

  const handleClick = () => {
    if (isComingSoon) return;
    router.push(`/entdecken/series/${series.id}`);
  };

  // Status badge
  const getStatusBadge = () => {
    if (isComingSoon) {
      return {
        text: "Bald verfügbar",
        bg: "rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.9)",
        icon: Lock,
      };
    }
    if (isCompleted) {
      return {
        text: "Abgeschlossen",
        bg: tokens.colors.aurora.mint,
        color: "#fff",
        icon: CheckCircle,
      };
    }
    if (isStarted) {
      return {
        text: `${completedChapters}/${totalChapters} Kapitel`,
        bg: tokens.colors.aurora.lavender,
        color: "#fff",
        icon: BookOpen,
      };
    }
    return {
      text: `${totalChapters} Kapitel`,
      bg: "rgba(255,255,255,0.2)",
      color: "rgba(255,255,255,0.9)",
      icon: BookOpen,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div style={{
      position: "relative",
      height: "420px",
      display: "flex",
      flexDirection: "column",
      opacity: isComingSoon ? 0.85 : 1,
    }}>
      {/* Full-bleed background image */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}>
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
          background: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }} />
      </div>

      {/* Status Badge - Top right */}
      <div style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: status.bg,
        borderRadius: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <StatusIcon size={14} color={status.color} />
        <span style={{
          fontSize: "12px",
          fontWeight: "600",
          color: status.color,
        }}>
          {status.text}
        </span>
      </div>

      {/* Content overlay */}
      <div style={{
        position: "relative",
        zIndex: 1,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "24px 20px",
      }}>
        {/* Duration pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 10px",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "12px",
          marginBottom: "12px",
          alignSelf: "flex-start",
        }}>
          <span style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.8)",
            fontWeight: "500",
          }}>
            ~{series.totalDurationMin} Min
          </span>
        </div>

        <h2 style={{
          fontSize: "26px",
          fontWeight: "700",
          color: "#fff",
          margin: "0 0 6px 0",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: tokens.fonts.display,
        }}>
          {series.title}
        </h2>

        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.85)",
          margin: "0 0 6px 0",
          fontWeight: "500",
        }}>
          {series.subtitle}
        </p>

        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.7)",
          margin: "0 0 20px 0",
          lineHeight: "1.5",
        }}>
          {series.description}
        </p>

        {/* Progress bar - only if started */}
        {isStarted && !isComingSoon && (
          <div style={{
            marginBottom: "16px",
          }}>
            <div style={{
              height: "6px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "3px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: isCompleted
                  ? tokens.colors.aurora.mint
                  : tokens.colors.aurora.lavender,
                borderRadius: "3px",
                transition: "width 0.5s ease-out",
              }} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClick}
          disabled={isComingSoon}
          style={{
            width: "100%",
            padding: "14px 24px",
            background: isComingSoon
              ? "rgba(255,255,255,0.3)"
              : "rgba(255,255,255,0.95)",
            border: "none",
            borderRadius: "12px",
            color: isComingSoon
              ? "rgba(255,255,255,0.7)"
              : tokens.colors.aurora.lavender,
            fontSize: "16px",
            fontWeight: "600",
            cursor: isComingSoon ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isComingSoon ? "none" : "0 4px 16px rgba(0,0,0,0.2)",
            transition: "transform 0.2s ease",
          }}
        >
          {isComingSoon ? (
            <>
              <Lock size={18} />
              Bald verfügbar
            </>
          ) : isCompleted ? (
            "Nochmal ansehen"
          ) : isStarted ? (
            "Weitermachen"
          ) : (
            "Starten"
          )}
        </button>
      </div>
    </div>
  );
}
