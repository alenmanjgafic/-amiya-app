/**
 * SERIES CARD - components/learning/SeriesCard.js
 * Beautiful card showing a learning series overview
 * Children (bites) are rendered INSIDE the card frame when expanded
 */
"use client";

import { useTheme } from "../../lib/ThemeContext";
import { SeriesIconMap, CheckCircleIcon } from "./LearningIcons";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SeriesCard({
  series,
  progress = [],
  completionPercent = 0, // New: pass completion percent directly
  onClick,
  isExpanded = false,
  children, // Chapters are passed as children
}) {
  const { tokens } = useTheme();

  // Support both chapters (new) and bites (legacy)
  const totalItems = series.chapters?.length || series.bites?.length || 0;
  const progressPercent = completionPercent;
  const isStarted = progressPercent > 0;
  const isCompleted = progressPercent >= 100;

  const IconComponent = SeriesIconMap[series.id];

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {/* Main Card with Gradient Border */}
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          padding: "2px",
          background: isCompleted
            ? tokens.gradients.mint
            : isStarted
              ? tokens.gradients.primary
              : tokens.colors.bg.elevated,
        }}
      >
        <div
          style={{
            background: tokens.colors.bg.elevated,
            borderRadius: "18px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Background Gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "150px",
              height: "150px",
              background: `radial-gradient(circle at top right, ${series.color}15 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Header Section - Clickable */}
          <button
            onClick={onClick}
            style={{
              width: "100%",
              padding: "20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ position: "relative" }}>
              {/* Header Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {/* Icon Container */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${series.color}20 0%, ${series.color}10 100%)`,
                    borderRadius: "16px",
                    boxShadow: `0 4px 12px ${series.color}20`,
                  }}
                >
                  {IconComponent ? (
                    <IconComponent size={36} />
                  ) : (
                    <span style={{ fontSize: "28px" }}>{series.icon}</span>
                  )}
                </div>

                {/* Title & Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        ...tokens.typography.h3,
                        margin: 0,
                        fontSize: "18px",
                      }}
                    >
                      {series.title}
                    </h3>
                    {isCompleted && <CheckCircleIcon size={20} />}
                  </div>
                  <p
                    style={{
                      ...tokens.typography.small,
                      margin: 0,
                      marginTop: "2px",
                      color: tokens.colors.text.muted,
                    }}
                  >
                    {series.subtitle}
                  </p>
                </div>

                {/* Expand Indicator */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: tokens.colors.bg.surface,
                    borderRadius: "10px",
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp size={18} color={tokens.colors.text.muted} />
                  ) : (
                    <ChevronDown size={18} color={tokens.colors.text.muted} />
                  )}
                </div>
              </div>

              {/* Stats Pills */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "4px 10px",
                    background: tokens.colors.bg.surface,
                    borderRadius: "20px",
                    ...tokens.typography.small,
                    color: tokens.colors.text.muted,
                    fontSize: "12px",
                  }}
                >
                  {totalItems} Kapitel
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    background: tokens.colors.bg.surface,
                    borderRadius: "20px",
                    ...tokens.typography.small,
                    color: tokens.colors.text.muted,
                    fontSize: "12px",
                  }}
                >
                  ~{series.totalDurationMin} Min
                </span>
                {isCompleted && (
                  <span
                    style={{
                      padding: "4px 10px",
                      background: `${tokens.colors.aurora.mint}20`,
                      borderRadius: "20px",
                      ...tokens.typography.small,
                      color: tokens.colors.aurora.mint,
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Abgeschlossen
                  </span>
                )}
              </div>

              {/* Progress Section */}
              <div>
                {/* Progress Bar */}
                <div
                  style={{
                    height: "8px",
                    background: tokens.colors.bg.surface,
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: isCompleted
                        ? tokens.gradients.mintHorizontal
                        : tokens.gradients.primaryHorizontal,
                      borderRadius: "4px",
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>

                {/* Progress Text */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "8px",
                  }}
                >
                  <p
                    style={{
                      ...tokens.typography.small,
                      margin: 0,
                      color: isStarted
                        ? tokens.colors.aurora.lavender
                        : tokens.colors.text.muted,
                      fontWeight: isStarted ? "600" : "400",
                    }}
                  >
                    {isCompleted
                      ? "Alle Kapitel abgeschlossen"
                      : isStarted
                        ? "In Bearbeitung"
                        : "Noch nicht gestartet"}
                  </p>
                  <p
                    style={{
                      ...tokens.typography.small,
                      margin: 0,
                      color: tokens.colors.text.muted,
                    }}
                  >
                    {Math.round(progressPercent)}%
                  </p>
                </div>
              </div>

              {/* Description - only when collapsed */}
              {!isExpanded && (
                <p
                  style={{
                    ...tokens.typography.body,
                    margin: 0,
                    marginTop: "16px",
                    color: tokens.colors.text.secondary,
                    lineHeight: "1.6",
                    fontSize: "14px",
                  }}
                >
                  {series.description}
                </p>
              )}
            </div>
          </button>

          {/* Expanded Content - Bites inside the frame */}
          {isExpanded && children && (
            <div
              style={{
                padding: "0 16px 16px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Divider line */}
              <div
                style={{
                  height: "1px",
                  background: `linear-gradient(90deg, transparent 0%, ${tokens.colors.aurora.lavender}30 50%, transparent 100%)`,
                  marginBottom: "8px",
                }}
              />

              {/* Bites */}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
