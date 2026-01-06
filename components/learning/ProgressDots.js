/**
 * PROGRESS DOTS - components/learning/ProgressDots.js
 * Shows progress through screens in a bite
 */
"use client";

import { useTheme } from "../../lib/ThemeContext";

export default function ProgressDots({
  current,
  total,
  showCounter = true,
}) {
  const { tokens } = useTheme();

  // Show max 10 dots, compress if more
  const maxVisibleDots = 10;
  const compressedView = total > maxVisibleDots;

  // For compressed view, show dots around current position
  const getVisibleRange = () => {
    if (!compressedView) return { start: 0, end: total };

    const halfRange = Math.floor(maxVisibleDots / 2);
    let start = Math.max(0, current - halfRange);
    let end = Math.min(total, start + maxVisibleDots);

    // Adjust start if we hit the end
    if (end === total) {
      start = Math.max(0, end - maxVisibleDots);
    }

    return { start, end };
  };

  const { start, end } = getVisibleRange();
  const visibleCount = end - start;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "12px 0",
      }}
    >
      {/* Left ellipsis for compressed view */}
      {compressedView && start > 0 && (
        <span
          style={{
            ...tokens.typography.small,
            color: tokens.colors.text.muted,
            marginRight: "4px",
          }}
        >
          ...
        </span>
      )}

      {/* Dots */}
      {Array.from({ length: visibleCount }).map((_, i) => {
        const screenIndex = start + i;
        const isActive = screenIndex === current;
        const isCompleted = screenIndex < current;

        return (
          <div
            key={screenIndex}
            style={{
              width: isActive ? "10px" : "6px",
              height: isActive ? "10px" : "6px",
              borderRadius: "50%",
              background: isActive
                ? tokens.gradients.primary
                : isCompleted
                ? tokens.colors.aurora.lavender
                : tokens.colors.text.muted + "40",
              transition: "all 0.2s ease",
              opacity: isCompleted ? 0.6 : 1,
            }}
          />
        );
      })}

      {/* Right ellipsis for compressed view */}
      {compressedView && end < total && (
        <span
          style={{
            ...tokens.typography.small,
            color: tokens.colors.text.muted,
            marginLeft: "4px",
          }}
        >
          ...
        </span>
      )}

      {/* Counter */}
      {showCounter && (
        <span
          style={{
            ...tokens.typography.small,
            color: tokens.colors.text.muted,
            marginLeft: "12px",
            minWidth: "40px",
          }}
        >
          {current + 1}/{total}
        </span>
      )}
    </div>
  );
}
