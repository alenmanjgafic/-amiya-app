/**
 * ARCHETYPEN COMPARISON CARD - components/QuizComparisonCard.js
 * Shows archetypen quiz sharing status and comparison in "Wir" section
 * "Sealed Letter" concept - both must share to reveal
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../lib/ThemeContext";
import { getTypeInfo, analyzePairDynamic } from "../lib/quizLogic";
import { Mail, Lock, Check, ChevronRight, Sparkles, Send, Link2, Undo2 } from "lucide-react";
import { ArchetypeIconMap } from "./ArchetypeIcons";

export default function QuizComparisonCard({
  user,
  profile,
  partnerProfile,
  onShare,
  onUnshare,
  isSharing,
}) {
  const { tokens } = useTheme();
  const router = useRouter();
  const [justShared, setJustShared] = useState(false);

  // Determine states
  const userCompleted = !!profile?.quiz_completed_at;
  const userShared = !!profile?.quiz_shared_at;
  const partnerCompleted = !!partnerProfile?.quiz_completed_at;
  const partnerShared = !!partnerProfile?.quiz_shared_at;
  const bothShared = userShared && partnerShared;

  // Track when share completes to show success feedback
  useEffect(() => {
    if (userShared && justShared) {
      // Keep success state visible briefly, then clear
      const timer = setTimeout(() => setJustShared(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [userShared, justShared]);

  const handleShare = async () => {
    console.log("QuizComparisonCard handleShare clicked!");
    console.log("onShare function:", typeof onShare);
    setJustShared(true);
    if (onShare) {
      await onShare();
    } else {
      console.error("onShare is not defined!");
    }
  };

  const userName = profile?.name || "Du";
  const partnerName = partnerProfile?.name || "Partner";

  // Get type info if available
  const userType = userCompleted && profile?.quiz_results?.primaryType
    ? getTypeInfo(profile.quiz_results.primaryType)
    : null;
  const partnerType = partnerCompleted && partnerProfile?.quiz_results?.primaryType
    ? getTypeInfo(partnerProfile.quiz_results.primaryType)
    : null;

  // Get pair dynamics if both shared
  const pairDynamics = bothShared && profile?.quiz_results?.scores?.normalized && partnerProfile?.quiz_results?.scores?.normalized
    ? analyzePairDynamic(
        profile.quiz_results.scores.normalized,
        partnerProfile.quiz_results.scores.normalized
      )
    : null;

  // STATE 0: User hasn't completed quiz
  if (!userCompleted) {
    return (
      <div style={styles.card(tokens)}>
        <div style={styles.header(tokens)}>
          <div style={styles.iconBox(tokens)}>
            <Link2 size={24} color="white" />
          </div>
          <div style={styles.headerText}>
            <h3 style={styles.title(tokens)}>Archetypen</h3>
            <p style={styles.subtitle(tokens)}>Vergleicht eure Muster</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/quiz")}
          style={styles.compactButton(tokens)}
        >
          Quiz starten
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // STATE 4: Both shared - REVEAL!
  if (bothShared && userType && partnerType) {
    const tensions = pairDynamics?.filter(d => d.type === "tension") || [];

    return (
      <div style={styles.card(tokens)}>
        <div style={styles.header(tokens)}>
          <div style={styles.iconBox(tokens)}>
            <Link2 size={24} color="white" />
          </div>
          <div style={styles.headerText}>
            <h3 style={styles.title(tokens)}>Eure Archetypen</h3>
            <p style={styles.subtitle(tokens)}>Vergleicht eure Muster</p>
          </div>
        </div>

        {/* Compact Types Row */}
        <div style={styles.compactTypesRow(tokens)}>
          <div
            style={styles.compactTypeBox(tokens)}
            onClick={() => router.push("/quiz/result")}
          >
            {profile?.quiz_results?.primaryType && ArchetypeIconMap[profile.quiz_results.primaryType] && (
              (() => {
                const IconComponent = ArchetypeIconMap[profile.quiz_results.primaryType];
                return <IconComponent size={28} />;
              })()
            )}
            <div>
              <span style={styles.compactTypeName(tokens)}>{userType.name}</span>
              <span style={styles.compactTypeUser(tokens)}>{userName}</span>
            </div>
          </div>

          <Sparkles size={16} color={tokens.colors.aurora.lavender} />

          <div style={styles.compactTypeBox(tokens)}>
            {partnerProfile?.quiz_results?.primaryType && ArchetypeIconMap[partnerProfile.quiz_results.primaryType] && (
              (() => {
                const IconComponent = ArchetypeIconMap[partnerProfile.quiz_results.primaryType];
                return <IconComponent size={28} />;
              })()
            )}
            <div>
              <span style={styles.compactTypeName(tokens)}>{partnerType.name}</span>
              <span style={styles.compactTypeUser(tokens)}>{partnerName}</span>
            </div>
          </div>
        </div>

        {/* Dynamics Preview */}
        {tensions.length > 0 && (
          <div style={styles.dynamicsPreviewCompact(tokens)}>
            <span>⚡</span>
            <span>{tensions.length} Spannungsfeld{tensions.length > 1 ? "er" : ""}</span>
          </div>
        )}

        <button
          onClick={() => router.push("/wir/archetypen")}
          style={styles.compactButton(tokens)}
        >
          Vergleich ansehen
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // STATE 1: User completed, not shared yet
  if (userCompleted && !userShared) {
    return (
      <div style={styles.card(tokens)}>
        <div style={styles.header(tokens)}>
          <div style={styles.iconBox(tokens)}>
            <Link2 size={24} color="white" />
          </div>
          <div style={styles.headerText}>
            <h3 style={styles.title(tokens)}>Archetypen</h3>
            <p style={styles.subtitle(tokens)}>Vergleicht eure Muster</p>
          </div>
        </div>

        {/* Clickable Type Preview */}
        {userType && (
          <div
            style={styles.clickableTypePreview(tokens)}
            onClick={() => router.push("/quiz/result")}
          >
            {profile?.quiz_results?.primaryType && ArchetypeIconMap[profile.quiz_results.primaryType] && (
              (() => {
                const IconComponent = ArchetypeIconMap[profile.quiz_results.primaryType];
                return <IconComponent size={24} />;
              })()
            )}
            <span style={styles.typePreviewText(tokens)}>Du bist: {userType.name}</span>
            <ChevronRight size={16} color={tokens.colors.text.muted} />
          </div>
        )}

        {/* Sealed Letter Box */}
        <div style={styles.letterBox(tokens)}>
          <div style={styles.letterHeader}>
            <Mail size={24} color={tokens.colors.aurora.lavender} />
            <div>
              <p style={styles.letterTitle(tokens)}>
                Mit {partnerName} teilen
              </p>
              <p style={styles.letterDesc(tokens)}>
                {partnerShared
                  ? `${partnerName} hat bereits geteilt – öffne den Brief!`
                  : "Euer Vergleich bleibt versiegelt, bis ihr beide geteilt habt."
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              ...styles.shareButton(tokens),
              opacity: isSharing ? 0.6 : 1,
            }}
          >
            {isSharing ? (
              <>
                <Send size={14} />
                Wird gesendet...
              </>
            ) : (
              <>
                <Lock size={14} />
                Brief versiegeln & senden
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // STATE 2 & 3: User shared, waiting for partner
  if (userShared && !partnerShared) {
    return (
      <div style={styles.card(tokens)}>
        <div style={styles.header(tokens)}>
          <div style={styles.iconBox(tokens)}>
            <Link2 size={24} color="white" />
          </div>
          <div style={styles.headerText}>
            <h3 style={styles.title(tokens)}>Archetypen</h3>
            <p style={styles.subtitle(tokens)}>Vergleicht eure Muster</p>
          </div>
        </div>

        {/* Clickable Type Preview */}
        {userType && (
          <div
            style={styles.clickableTypePreview(tokens)}
            onClick={() => router.push("/quiz/result")}
          >
            {profile?.quiz_results?.primaryType && ArchetypeIconMap[profile.quiz_results.primaryType] && (
              (() => {
                const IconComponent = ArchetypeIconMap[profile.quiz_results.primaryType];
                return <IconComponent size={24} />;
              })()
            )}
            <span style={styles.typePreviewText(tokens)}>Du bist: {userType.name}</span>
            <ChevronRight size={16} color={tokens.colors.text.muted} />
          </div>
        )}

        {/* Sealed Letter Status */}
        <div style={styles.letterBoxShared(tokens)}>
          <div style={styles.letterHeader}>
            <Check size={24} color={tokens.colors.aurora.mint} />
            <div style={{ flex: 1 }}>
              <p style={styles.letterTitle(tokens)}>
                {justShared ? "Brief versendet!" : "Du hast geteilt"}
              </p>
              <p style={styles.letterDesc(tokens)}>
                {partnerCompleted
                  ? `Sobald ${partnerName} auch teilt, könnt ihr euren Vergleich öffnen.`
                  : `${partnerName} muss noch das Quiz machen und teilen.`
                }
              </p>
            </div>
          </div>

          <div style={styles.statusBar(tokens)}>
            <div style={styles.statusIndicatorRow(tokens)}>
              <div style={styles.statusDotLarge(tokens, true)}>
                <Check size={10} color="white" />
              </div>
              <span style={styles.statusLabel(tokens)}>Du</span>
              <div style={styles.statusLineLong(tokens)} />
              <div style={styles.statusDotLarge(tokens, false)}>
                <Mail size={10} color={tokens.colors.text.muted} />
              </div>
              <span style={styles.statusLabel(tokens)}>{partnerName}</span>
            </div>
            {onUnshare && !justShared && (
              <button onClick={onUnshare} style={styles.unshareLink(tokens)}>
                Zurückziehen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

const styles = {
  card: (tokens) => ({
    ...tokens.cards.elevated,
    padding: "16px",
  }),

  header: (tokens) => ({
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  }),

  iconBox: (tokens) => ({
    width: "48px",
    height: "48px",
    borderRadius: tokens.radii.lg,
    background: tokens.colors.aurora.lavender,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),

  headerText: {
    flex: 1,
  },

  title: (tokens) => ({
    ...tokens.typography.h3,
    fontSize: "16px",
    margin: 0,
    marginBottom: "2px",
  }),

  subtitle: (tokens) => ({
    ...tokens.typography.small,
    margin: 0,
    color: tokens.colors.text.muted,
  }),

  compactButton: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
    padding: "10px 16px",
    background: tokens.colors.aurora.lavender,
    color: "white",
    border: "none",
    borderRadius: tokens.radii.md,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  }),

  clickableTypePreview: (tokens) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.md,
    marginBottom: "12px",
    cursor: "pointer",
  }),

  typePreviewText: (tokens) => ({
    flex: 1,
    fontSize: "14px",
    fontWeight: "500",
    color: tokens.colors.text.primary,
  }),

  letterBox: (tokens) => ({
    padding: "16px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.lg,
    border: `2px dashed ${tokens.colors.aurora.lavender}40`,
  }),

  letterBoxShared: (tokens) => ({
    padding: "16px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.lg,
    border: `2px dashed ${tokens.colors.aurora.mint}40`,
  }),

  letterHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
  },

  letterTitle: (tokens) => ({
    fontSize: "15px",
    fontWeight: "600",
    color: tokens.colors.text.primary,
    margin: "0 0 4px 0",
  }),

  letterDesc: (tokens) => ({
    fontSize: "13px",
    color: tokens.colors.text.muted,
    margin: 0,
    lineHeight: "1.4",
  }),

  shareButton: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 16px",
    background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
    color: "white",
    border: "none",
    borderRadius: tokens.radii.md,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  }),

  letterBoxCompact: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.md,
    border: `1px dashed ${tokens.colors.aurora.mint}50`,
  }),

  letterContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  letterTextCompact: (tokens) => ({
    fontSize: "14px",
    fontWeight: "500",
    color: tokens.colors.text.primary,
    margin: 0,
  }),

  letterHint: (tokens) => ({
    fontSize: "12px",
    color: tokens.colors.text.muted,
    margin: "2px 0 0 0",
  }),

  waitingBoxCompact: (tokens) => ({
    padding: "12px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.md,
    border: `1px dashed ${tokens.colors.aurora.mint}50`,
  }),

  successRowCompact: (tokens) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: tokens.colors.aurora.mint,
    fontWeight: "500",
  }),

  waitingRowCompact: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),

  statusBar: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    background: tokens.colors.bg.deep,
    borderRadius: tokens.radii.md,
  }),

  statusIndicatorRow: (tokens) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }),

  statusDotLarge: (tokens, isComplete) => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: isComplete ? tokens.colors.aurora.mint : tokens.colors.bg.soft,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),

  statusLabel: (tokens) => ({
    fontSize: "12px",
    color: tokens.colors.text.muted,
  }),

  statusLineLong: (tokens) => ({
    width: "30px",
    height: "2px",
    background: tokens.colors.bg.soft,
  }),

  unshareLink: (tokens) => ({
    background: "none",
    border: "none",
    color: tokens.colors.text.muted,
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  }),

  compactTypesRow: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "12px",
  }),

  compactTypeBox: (tokens) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.md,
    cursor: "pointer",
    flex: 1,
  }),

  compactTypeName: (tokens) => ({
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: tokens.colors.text.primary,
  }),

  compactTypeUser: (tokens) => ({
    display: "block",
    fontSize: "11px",
    color: tokens.colors.text.muted,
  }),

  dynamicsPreviewCompact: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: `${tokens.colors.aurora.rose}15`,
    borderRadius: tokens.radii.sm,
    marginBottom: "12px",
    fontSize: "12px",
    color: tokens.colors.aurora.rose,
    fontWeight: "500",
  }),

  successIcon: (tokens) => ({
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}, ${tokens.colors.aurora.sky})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    animation: "scaleIn 0.3s ease-out",
  }),

  sharedIcon: (tokens) => ({
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: tokens.colors.aurora.mint,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  }),

  successText: (tokens) => ({
    ...tokens.typography.body,
    fontWeight: "600",
    color: tokens.colors.aurora.mint,
    marginBottom: "8px",
  }),

  unshareButton: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    background: "transparent",
    border: `1px solid ${tokens.colors.bg.soft}`,
    borderRadius: tokens.radii.md,
    color: tokens.colors.text.muted,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),

  statusRow: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "16px",
    padding: "12px",
    background: tokens.colors.bg.surface,
    borderRadius: tokens.radii.md,
  }),

  statusItem: (tokens, isComplete) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: isComplete ? tokens.colors.aurora.mint : tokens.colors.text.muted,
    fontSize: "13px",
    fontWeight: "500",
  }),

  statusDivider: (tokens) => ({
    width: "24px",
    height: "2px",
    background: tokens.colors.bg.soft,
    borderRadius: "1px",
  }),

  typesRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: "20px",
  },

  typeBox: (tokens) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  }),

  typeEmoji: {
    fontSize: "40px",
    marginBottom: "4px",
  },

  typeName: (tokens) => ({
    ...tokens.typography.body,
    fontWeight: "600",
  }),

  typeUser: (tokens) => ({
    ...tokens.typography.small,
  }),

  connector: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),

  dynamicsPreview: (tokens) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    background: `${tokens.colors.aurora.rose}15`,
    borderRadius: tokens.radii.md,
    marginBottom: "16px",
  }),

  dynamicsIcon: {
    fontSize: "16px",
  },

  dynamicsText: (tokens) => ({
    ...tokens.typography.small,
    fontWeight: "600",
    color: tokens.colors.aurora.rose,
  }),
};
