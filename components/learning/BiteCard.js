/**
 * BITE CARD - components/learning/BiteCard.js
 * Beautiful card showing a single bite in the series list
 */
"use client";

import { useTheme } from "../../lib/ThemeContext";
import {
  LockIcon,
  UnlockIcon,
  CheckCircleIcon,
  ProgressCircleIcon,
} from "./LearningIcons";
import { Play, ChevronRight } from "lucide-react";

export default function BiteCard({
  bite,
  status = "locked",
  currentScreen = 0,
  onClick,
  index = 0,
}) {
  const { tokens } = useTheme();

  const isLocked = status === "locked";
  const isAvailable = status === "available";
  const isInProgress = status === "in_progress";
  const isCompleted = status === "completed";

  const totalScreens = bite.screens?.length || 0;
  const progress = totalScreens > 0 ? currentScreen / totalScreens : 0;

  const StatusIcon = () => {
    if (isLocked) return <LockIcon size={18} />;
    if (isCompleted) return <CheckCircleIcon size={18} />;
    if (isInProgress) return <ProgressCircleIcon size={18} progress={progress} />;
    return <Play size={16} fill={tokens.colors.aurora.lavender} color={tokens.colors.aurora.lavender} />;
  };

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        background: isInProgress
          ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}12 0%, ${tokens.colors.aurora.rose}08 100%)`
          : isCompleted
            ? `${tokens.colors.aurora.mint}08`
            : tokens.colors.bg.surface,
        border: isInProgress
          ? `1px solid ${tokens.colors.aurora.lavender}25`
          : isCompleted
            ? `1px solid ${tokens.colors.aurora.mint}20`
            : `1px solid ${tokens.colors.text.muted}08`,
        borderRadius: "14px",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.5 : 1,
        textAlign: "left",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left Border Accent for In Progress */}
      {isInProgress && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "3px",
            background: `linear-gradient(180deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
          }}
        />
      )}

      {/* Order Number / Status */}
      <div
        style={{
          flexShrink: 0,
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isCompleted
            ? `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.mint}10 100%)`
            : isInProgress
              ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}20 0%, ${tokens.colors.aurora.rose}20 100%)`
              : isAvailable
                ? `${tokens.colors.aurora.lavender}15`
                : tokens.colors.bg.surface,
          borderRadius: "10px",
          border: isAvailable && !isInProgress && !isCompleted
            ? `1px solid ${tokens.colors.aurora.lavender}40`
            : "none",
        }}
      >
        {isLocked ? (
          <LockIcon size={16} />
        ) : isCompleted ? (
          <CheckCircleIcon size={18} />
        ) : isInProgress ? (
          <ProgressCircleIcon size={18} progress={progress} />
        ) : (
          <span
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: tokens.colors.aurora.lavender,
            }}
          >
            {index + 1}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            ...tokens.typography.body,
            fontWeight: "600",
            margin: 0,
            marginBottom: "2px",
            fontSize: "15px",
            color: isLocked
              ? tokens.colors.text.muted
              : isCompleted
                ? tokens.colors.aurora.mint
                : tokens.colors.text.primary,
          }}
        >
          {bite.title}
        </p>
        <p
          style={{
            ...tokens.typography.small,
            margin: 0,
            color: tokens.colors.text.muted,
            fontSize: "13px",
          }}
        >
          {bite.subtitle}
        </p>
      </div>

      {/* Right Side */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Progress or Duration */}
        {isInProgress ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "2px",
            }}
          >
            <span
              style={{
                ...tokens.typography.small,
                color: tokens.colors.aurora.lavender,
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              {Math.round(progress * 100)}%
            </span>
            <span
              style={{
                ...tokens.typography.small,
                color: tokens.colors.text.muted,
                fontSize: "11px",
              }}
            >
              Fortsetzen
            </span>
          </div>
        ) : (
          <span
            style={{
              ...tokens.typography.small,
              color: tokens.colors.text.muted,
              fontSize: "12px",
            }}
          >
            {bite.durationMin} Min
          </span>
        )}

        {/* Arrow */}
        {!isLocked && (
          <ChevronRight
            size={18}
            color={
              isCompleted
                ? tokens.colors.aurora.mint
                : isInProgress
                  ? tokens.colors.aurora.lavender
                  : tokens.colors.text.muted
            }
          />
        )}
      </div>
    </button>
  );
}
