/**
 * ACTIVE CHALLENGES - Collapsible challenge section with tabs
 */
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../../lib/ThemeContext";
import { useAuth } from "../../lib/AuthContext";
import { ChevronDown, ChevronUp, CheckCircle2, Clock } from "lucide-react";
import { ChallengeIcon, TrophyIcon } from "./LearningIcons";

export default function ActiveChallenges() {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const [allChallenges, setAllChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "completed"
  const [completingId, setCompletingId] = useState(null);
  const [celebrationId, setCelebrationId] = useState(null);
  const [confirmingChallenge, setConfirmingChallenge] = useState(null); // For confirmation popup

  // Derived states
  const activeChallenges = allChallenges.filter(c => c.status === "active");
  const completedChallenges = allChallenges.filter(c => c.status === "completed");

  // Load challenges from localStorage
  useEffect(() => {
    const loadChallenges = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Try API first
      try {
        const response = await fetch(`/api/learning/challenges?userId=${user.id}`);
        const data = await response.json();
        if (data.challenges && data.challenges.length > 0) {
          setAllChallenges(data.challenges);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("API error:", error);
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("amiya_challenges");
        if (stored) {
          setAllChallenges(JSON.parse(stored));
        }
      } catch (e) {
        console.error("localStorage error:", e);
      }

      setLoading(false);
    };

    loadChallenges();
  }, [user?.id]);

  // Calculate days remaining
  const getDaysRemaining = (dueAt) => {
    if (!dueAt) return null;
    const now = new Date();
    const due = new Date(dueAt);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Show confirmation popup
  const handleCompleteClick = (challenge) => {
    setConfirmingChallenge(challenge);
  };

  // Cancel confirmation
  const handleCancelConfirm = () => {
    setConfirmingChallenge(null);
  };

  // Mark challenge as complete with animation
  const handleConfirmComplete = async () => {
    if (!confirmingChallenge) return;

    const challengeId = confirmingChallenge.id;
    setConfirmingChallenge(null);
    setCompletingId(challengeId);
    setCelebrationId(challengeId);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 600));

    // Update state
    const now = new Date().toISOString();
    setAllChallenges(prev =>
      prev.map(c =>
        c.id === challengeId
          ? { ...c, status: "completed", completed_at: now }
          : c
      )
    );

    // Update localStorage
    try {
      const stored = localStorage.getItem("amiya_challenges");
      if (stored) {
        const localChallenges = JSON.parse(stored);
        const updated = localChallenges.map(c =>
          c.id === challengeId
            ? { ...c, status: "completed", completed_at: now }
            : c
        );
        localStorage.setItem("amiya_challenges", JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Failed to update localStorage:", e);
    }

    // Try API
    if (user?.id) {
      try {
        await fetch("/api/learning/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            action: "complete",
          }),
        });
      } catch (error) {
        console.error("Failed to update API:", error);
      }
    }

    setCompletingId(null);

    // Clear celebration after delay
    setTimeout(() => setCelebrationId(null), 2000);
  };

  if (loading) {
    return null;
  }

  // Show nothing if no challenges at all
  if (allChallenges.length === 0) {
    return null;
  }

  // Current list based on active tab
  const currentList = activeTab === "active" ? activeChallenges : completedChallenges;

  // Render a single challenge card
  const renderChallengeCard = (challenge, isCompleted = false) => {
    const daysLeft = getDaysRemaining(challenge.due_at);
    const isBeingCompleted = completingId === challenge.id;
    const isCelebrating = celebrationId === challenge.id;

    return (
      <div
        key={challenge.id}
        style={{
          padding: "14px",
          background: tokens.colors.bg.surface,
          borderRadius: "12px",
          position: "relative",
          overflow: "hidden",
          opacity: isCompleted ? 0.8 : 1,
          transform: isBeingCompleted ? "scale(0.95)" : "scale(1)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Celebration overlay */}
        {isCelebrating && !isCompleted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}30 0%, ${tokens.colors.aurora.lavender}30 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.3s ease",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: "32px", animation: "bounce 0.5s ease" }}>✓</span>
          </div>
        )}

        {/* Challenge Content */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isCompleted
                ? `${tokens.colors.aurora.mint}15`
                : `${tokens.colors.aurora.rose}10`,
              borderRadius: "10px",
            }}
          >
            {isCompleted ? (
              <TrophyIcon size={20} />
            ) : (
              <ChallengeIcon size={20} />
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                ...tokens.typography.body,
                fontWeight: "600",
                margin: 0,
                marginBottom: "2px",
                fontSize: "14px",
                textDecoration: isCompleted ? "line-through" : "none",
                color: isCompleted ? tokens.colors.text.muted : tokens.colors.text.primary,
              }}
            >
              {challenge.title || challenge.challenge_type}
            </p>

            {!isCompleted && challenge.description && (
              <p
                style={{
                  ...tokens.typography.small,
                  color: tokens.colors.text.muted,
                  margin: 0,
                  lineHeight: "1.4",
                  fontSize: "12px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {challenge.description}
              </p>
            )}

            {/* Time Badge or Completed Date */}
            {isCompleted ? (
              <span
                style={{
                  fontSize: "11px",
                  color: tokens.colors.aurora.mint,
                }}
              >
                {challenge.completed_at
                  ? `Erledigt am ${new Date(challenge.completed_at).toLocaleDateString("de-DE")}`
                  : "Erledigt"}
              </span>
            ) : daysLeft !== null && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "8px",
                  padding: "3px 8px",
                  background: daysLeft <= 1
                    ? `${tokens.colors.aurora.rose}15`
                    : tokens.colors.bg.elevated,
                  borderRadius: "20px",
                }}
              >
                <Clock size={11} color={daysLeft <= 1 ? tokens.colors.aurora.rose : tokens.colors.text.muted} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: daysLeft <= 1
                      ? tokens.colors.aurora.rose
                      : tokens.colors.text.muted,
                  }}
                >
                  {daysLeft === 0 ? "Heute" : daysLeft === 1 ? "1 Tag" : `${daysLeft} Tage`}
                </span>
              </div>
            )}
          </div>

          {/* Complete Button - only for active */}
          {!isCompleted && (
            <button
              onClick={() => handleCompleteClick(challenge)}
              disabled={isBeingCompleted}
              style={{
                flexShrink: 0,
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.mint}10 100%)`,
                border: "none",
                borderRadius: "10px",
                cursor: isBeingCompleted ? "default" : "pointer",
                transition: "transform 0.2s ease",
                opacity: isBeingCompleted ? 0.5 : 1,
              }}
            >
              <CheckCircle2 size={20} color={tokens.colors.aurora.mint} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "0 20px",
        marginBottom: "24px",
      }}
    >
      {/* Collapsed Header / Expandable Container */}
      <div
        style={{
          background: tokens.colors.bg.elevated,
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          {/* Left: Icon + Title + Count */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.rose}15 0%, ${tokens.colors.aurora.lavender}15 100%)`,
                borderRadius: "10px",
              }}
            >
              <ChallengeIcon size={20} />
            </div>

            <div style={{ textAlign: "left" }}>
              <p
                style={{
                  ...tokens.typography.body,
                  fontWeight: "600",
                  margin: 0,
                  fontSize: "15px",
                  color: tokens.colors.text.primary,
                }}
              >
                Challenges
              </p>
              <p
                style={{
                  ...tokens.typography.small,
                  margin: 0,
                  fontSize: "12px",
                  color: tokens.colors.text.muted,
                }}
              >
                {activeChallenges.length > 0
                  ? `${activeChallenges.length} aktiv`
                  : completedChallenges.length > 0
                    ? `${completedChallenges.length} abgeschlossen`
                    : "Keine Challenges"}
              </p>
            </div>
          </div>

          {/* Right: Chevron */}
          <div
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tokens.colors.bg.surface,
              borderRadius: "8px",
            }}
          >
            {isExpanded ? (
              <ChevronUp size={18} color={tokens.colors.text.muted} />
            ) : (
              <ChevronDown size={18} color={tokens.colors.text.muted} />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div
            style={{
              padding: "0 16px 16px",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "14px",
                padding: "4px",
                background: tokens.colors.bg.surface,
                borderRadius: "10px",
              }}
            >
              <button
                onClick={() => setActiveTab("active")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: activeTab === "active"
                    ? `linear-gradient(135deg, ${tokens.colors.aurora.rose}20 0%, ${tokens.colors.aurora.lavender}20 100%)`
                    : "transparent",
                  color: activeTab === "active"
                    ? tokens.colors.aurora.rose
                    : tokens.colors.text.muted,
                  transition: "all 0.2s ease",
                }}
              >
                Aktiv ({activeChallenges.length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: activeTab === "completed"
                    ? `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`
                    : "transparent",
                  color: activeTab === "completed"
                    ? tokens.colors.aurora.mint
                    : tokens.colors.text.muted,
                  transition: "all 0.2s ease",
                }}
              >
                Erledigt ({completedChallenges.length})
              </button>
            </div>

            {/* Challenge List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {currentList.length > 0 ? (
                currentList.map((challenge) =>
                  renderChallengeCard(challenge, activeTab === "completed")
                )
              ) : (
                <div
                  style={{
                    padding: "20px",
                    background: tokens.colors.bg.surface,
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      ...tokens.typography.small,
                      color: tokens.colors.text.muted,
                      margin: 0,
                    }}
                  >
                    {activeTab === "active"
                      ? "Keine aktiven Challenges. Starte eine neue Lektion!"
                      : "Noch keine Challenges abgeschlossen."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Popup */}
      {confirmingChallenge && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={handleCancelConfirm}
        >
          <div
            style={{
              background: tokens.colors.bg.elevated,
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "320px",
              width: "100%",
              animation: "scaleIn 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`,
                  borderRadius: "50%",
                }}
              >
                <TrophyIcon size={28} />
              </div>
            </div>

            {/* Title */}
            <h3
              style={{
                ...tokens.typography.h3,
                textAlign: "center",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Challenge abschliessen?
            </h3>

            {/* Challenge Name */}
            <p
              style={{
                ...tokens.typography.body,
                textAlign: "center",
                color: tokens.colors.text.secondary,
                margin: 0,
                marginBottom: "24px",
              }}
            >
              {confirmingChallenge.title || confirmingChallenge.challenge_type}
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button
                onClick={handleConfirmComplete}
                style={{
                  ...tokens.buttons.primary,
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.mint} 0%, ${tokens.colors.aurora.lavender} 100%)`,
                }}
              >
                Ja, abschliessen
              </button>
              <button
                onClick={handleCancelConfirm}
                style={{
                  ...tokens.buttons.secondary,
                  background: tokens.colors.bg.surface,
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
