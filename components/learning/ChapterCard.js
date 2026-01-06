/**
 * CHAPTER CARD - components/learning/ChapterCard.js
 * Shows a chapter with Content + Activity cards side by side
 * Based on Ember's design with Amiya styling
 */
"use client";

import { useTheme } from "../../lib/ThemeContext";
import { CheckCircleIcon, LockIcon } from "./LearningIcons";
import { BookOpen, MessageSquare, HelpCircle, ListChecks, Bell, FileText, Handshake } from "lucide-react";

// Activity type configuration
const ACTIVITY_CONFIG = {
  chat_practice: {
    icon: MessageSquare,
    label: "PRACTICE",
    gradient: ["#0d9488", "#06b6d4"], // mint-cyan
  },
  quiz: {
    icon: HelpCircle,
    label: "QUIZ",
    gradient: ["#8b5cf6", "#3b82f6"], // purple-blue
  },
  pick: {
    icon: ListChecks,
    label: "PICK",
    gradient: ["#db2777", "#f97316"], // rose-orange
  },
  nudge: {
    icon: Bell,
    label: "NUDGE",
    gradient: ["#0d9488", "#22c55e"], // mint-green
  },
  reflection: {
    icon: FileText,
    label: "REFLECTION",
    gradient: ["#7c3aed", "#a78bfa"], // lavender
  },
  commitment: {
    icon: Handshake,
    label: "COMMITMENT",
    gradient: ["#db2777", "#f472b6"], // rose-pink
  },
};

export default function ChapterCard({
  chapter,
  progress = {},
  onContentClick,
  onActivityClick,
  isLocked = false,
}) {
  const { tokens } = useTheme();

  const contentCompleted = progress.contentCompleted || false;
  const activityCompleted = progress.activityCompleted || false;
  const activityLocked = !contentCompleted; // Activity locked until content done

  const activityConfig = ACTIVITY_CONFIG[chapter.activity.type] || ACTIVITY_CONFIG.reflection;
  const ActivityIcon = activityConfig.icon;

  return (
    <div
      style={{
        background: tokens.colors.bg.surface,
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "16px",
        opacity: isLocked ? 0.5 : 1,
        border: `1px solid ${tokens.colors.text.muted}10`,
      }}
    >
      {/* Chapter Badge */}
      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}20 0%, ${tokens.colors.aurora.rose}20 100%)`,
          borderRadius: "12px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: tokens.colors.aurora.lavender,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Kapitel {chapter.number}
        </span>
      </div>

      {/* Title & Subtitle */}
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "700",
          color: tokens.colors.text.primary,
          margin: "0 0 4px 0",
          fontFamily: tokens.fonts.display,
        }}
      >
        {chapter.title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: tokens.colors.text.muted,
          margin: "0 0 16px 0",
        }}
      >
        {chapter.subtitle}
      </p>

      {/* Two Cards: Content + Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {/* Content Card */}
        <button
          onClick={isLocked ? undefined : onContentClick}
          disabled={isLocked}
          style={{
            padding: "16px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}15 0%, ${tokens.colors.aurora.rose}10 100%)`,
            borderRadius: "14px",
            border: contentCompleted
              ? `2px solid ${tokens.colors.aurora.mint}40`
              : `1px solid ${tokens.colors.aurora.lavender}20`,
            cursor: isLocked ? "not-allowed" : "pointer",
            textAlign: "left",
            position: "relative",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Status Icon */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
            }}
          >
            {isLocked ? (
              <LockIcon size={16} />
            ) : contentCompleted ? (
              <CheckCircleIcon size={18} />
            ) : null}
          </div>

          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <BookOpen size={14} color={tokens.colors.aurora.lavender} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: tokens.colors.aurora.lavender,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Content
            </span>
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: contentCompleted
                ? tokens.colors.aurora.mint
                : tokens.colors.text.primary,
              margin: 0,
              flex: 1,
              lineHeight: "1.3",
            }}
          >
            {chapter.content.title}
          </p>
        </button>

        {/* Activity Card */}
        <button
          onClick={activityLocked || isLocked ? undefined : onActivityClick}
          disabled={activityLocked || isLocked}
          style={{
            padding: "16px",
            background: activityLocked
              ? tokens.colors.bg.elevated
              : `linear-gradient(135deg, ${activityConfig.gradient[0]}15 0%, ${activityConfig.gradient[1]}10 100%)`,
            borderRadius: "14px",
            border: activityCompleted
              ? `2px solid ${tokens.colors.aurora.mint}40`
              : activityLocked
                ? `1px solid ${tokens.colors.text.muted}15`
                : `1px solid ${activityConfig.gradient[0]}20`,
            cursor: activityLocked || isLocked ? "not-allowed" : "pointer",
            textAlign: "left",
            position: "relative",
            minHeight: "100px",
            display: "flex",
            flexDirection: "column",
            opacity: activityLocked ? 0.6 : 1,
          }}
        >
          {/* Status Icon */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
            }}
          >
            {activityLocked || isLocked ? (
              <LockIcon size={16} />
            ) : activityCompleted ? (
              <CheckCircleIcon size={18} />
            ) : null}
          </div>

          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <ActivityIcon
              size={14}
              color={activityLocked ? tokens.colors.text.muted : activityConfig.gradient[0]}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: activityLocked ? tokens.colors.text.muted : activityConfig.gradient[0],
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {activityConfig.label}
            </span>
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: activityCompleted
                ? tokens.colors.aurora.mint
                : activityLocked
                  ? tokens.colors.text.muted
                  : tokens.colors.text.primary,
              margin: 0,
              flex: 1,
              lineHeight: "1.3",
            }}
          >
            {chapter.activity.title}
          </p>

          {/* Locked hint */}
          {activityLocked && !isLocked && (
            <p
              style={{
                fontSize: "11px",
                color: tokens.colors.text.muted,
                margin: "8px 0 0 0",
              }}
            >
              Erst Content abschliessen
            </p>
          )}
        </button>
      </div>

      {/* Duration */}
      <p
        style={{
          fontSize: "12px",
          color: tokens.colors.text.muted,
          margin: "12px 0 0 0",
          textAlign: "center",
        }}
      >
        ~{chapter.durationMin} Minuten
      </p>
    </div>
  );
}
