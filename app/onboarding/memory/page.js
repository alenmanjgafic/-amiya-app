/**
 * UNIFIED CONSENT PAGE - app/onboarding/memory/page.js
 * Vereint Memory-Consent und Analyse-Einstellung in eine Entscheidung.
 *
 * Logik: "Analyse" = Memory + Metrics + automatische Analyse
 *        "Ohne Analyse" = Nichts wird gespeichert
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { Sparkles, Power, ChevronDown, ChevronUp } from "lucide-react";

export default function UnifiedConsentPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Redirect if no name yet (should do regular onboarding first)
  useEffect(() => {
    if (!loading && user && profile && (!profile.name || !profile.partner_name)) {
      router.push("/onboarding");
    }
  }, [profile, loading, router, user]);

  // Skip if already has consent decision (explicitly set)
  useEffect(() => {
    if (!loading && profile) {
      const hasDecided = profile.memory_consent_at !== null && profile.memory_consent_at !== undefined;
      if (hasDecided) {
        router.push("/");
      }
    }
  }, [profile, loading, router]);

  /**
   * Handle user choice - unified consent model
   * @param {boolean} enableAnalysis - true = analyze + remember, false = nothing saved
   */
  const handleChoice = async (enableAnalysis) => {
    setSaving(true);
    try {
      await updateProfile({
        // Unified: Analyse = alles aktiviert, sonst alles deaktiviert
        memory_consent: enableAnalysis,
        memory_consent_at: new Date().toISOString(),
        auto_analyze: enableAnalysis,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to save consent:", error);
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <Sparkles size={35} color="white" />
          </div>
          <h1 style={styles.title}>Wie soll Amiya dich begleiten?</h1>
        </div>

        {/* Progress indicator - Step 2 of 2 */}
        <div style={styles.progress}>
          <div style={{...styles.progressDot, ...styles.progressDotCompleted}} />
          <div style={{...styles.progressLine, ...styles.progressLineCompleted}} />
          <div style={styles.progressDot} />
        </div>

        {/* Intro text */}
        <p style={styles.intro}>
          Mit Analyse kann Amiya euren Fortschritt verfolgen und euch von Session zu Session besser unterstützen.
        </p>

        {/* Options */}
        <div style={styles.options}>
          {/* Option 1: Mit Analyse (Recommended) */}
          <button
            onClick={() => handleChoice(true)}
            style={styles.optionButtonPrimary}
            disabled={saving}
          >
            <div style={styles.recommendedBadge}>Empfohlen</div>
            <div style={styles.optionIcon}>
              <Sparkles size={24} color="#7c3aed" />
            </div>
            <div style={styles.optionContent}>
              <span style={styles.optionTitle}>Mit Analyse</span>
              <span style={styles.optionDesc}>
                Amiya analysiert eure Sessions und erinnert sich an euch
              </span>
            </div>
          </button>

          {/* Option 2: Ohne Analyse */}
          <button
            onClick={() => handleChoice(false)}
            style={styles.optionButtonSecondary}
            disabled={saving}
          >
            <div style={styles.optionIconSecondary}>
              <Power size={24} color="#9ca3af" />
            </div>
            <div style={styles.optionContent}>
              <span style={styles.optionTitleSecondary}>Ohne Analyse</span>
              <span style={styles.optionDesc}>
                Jede Session startet neu, ohne Auswertung
              </span>
            </div>
          </button>
        </div>

        {/* More Info Toggle */}
        <button
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          style={styles.moreInfoToggle}
        >
          <span>Warum ist Analyse wichtig?</span>
          {showMoreInfo ? (
            <ChevronUp size={18} color="#7c3aed" />
          ) : (
            <ChevronDown size={18} color="#7c3aed" />
          )}
        </button>

        {/* Expandable Info Section */}
        {showMoreInfo && (
          <div style={styles.infoSection}>
            <div style={styles.infoItem}>
              <span style={styles.infoEmoji}>🎯</span>
              <div>
                <strong>Personalisierte Unterstützung</strong>
                <p style={styles.infoText}>
                  Amiya lernt, wie ihr kommuniziert und was euch wichtig ist.
                  So kann sie euch immer besser begleiten.
                </p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoEmoji}>📈</span>
              <div>
                <strong>Euren Fortschritt sehen</strong>
                <p style={styles.infoText}>
                  Nach jeder Session bekommt ihr eine Zusammenfassung mit konkreten
                  Beobachtungen und nächsten Schritten.
                </p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoEmoji}>🔒</span>
              <div>
                <strong>Volle Kontrolle</strong>
                <p style={styles.infoText}>
                  Ihr könnt jederzeit alle gespeicherten Daten einsehen oder löschen.
                  Amiya speichert nur, was ihr selbst erzählt.
                </p>
              </div>
            </div>

            <div style={styles.highlightBox}>
              <p style={styles.highlightText}>
                Die meisten Paare profitieren am meisten von der Analyse-Funktion,
                weil sie hilft, Muster zu erkennen und echte Fortschritte zu machen.
              </p>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p style={styles.footer}>
          Du kannst das jederzeit in den Einstellungen ändern.
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 10px 40px rgba(124,58,237,0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  progress: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },
  progressDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
  },
  progressDotCompleted: {
    background: "#7c3aed",
  },
  progressLine: {
    width: "40px",
    height: "3px",
    background: "#e5e7eb",
  },
  progressLineCompleted: {
    background: "#7c3aed",
  },
  logo: {
    width: "70px",
    height: "70px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    borderRadius: "20px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 30px rgba(124,58,237,0.3)",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
    lineHeight: "1.3",
  },
  intro: {
    color: "#6b7280",
    fontSize: "15px",
    textAlign: "center",
    marginBottom: "24px",
    lineHeight: "1.6",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  optionButtonPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px 16px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)",
    border: "2px solid #7c3aed",
    borderRadius: "16px",
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
  },
  optionButtonSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px 16px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "16px",
    cursor: "pointer",
    textAlign: "left",
  },
  optionIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(124,58,237,0.1)",
  },
  optionIconSecondary: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  optionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  },
  optionTitleSecondary: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#6b7280",
  },
  optionDesc: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.4",
  },
  recommendedBadge: {
    position: "absolute",
    top: "-10px",
    right: "16px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    color: "white",
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "20px",
    boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
  },
  moreInfoToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#7c3aed",
    marginBottom: "8px",
  },
  infoSection: {
    background: "#fafafa",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
  },
  infoItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  infoEmoji: {
    fontSize: "20px",
    flexShrink: 0,
    marginTop: "2px",
  },
  infoText: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "4px 0 0 0",
    lineHeight: "1.5",
  },
  highlightBox: {
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)",
    borderRadius: "12px",
    padding: "14px",
    marginTop: "8px",
    borderLeft: "3px solid #7c3aed",
  },
  highlightText: {
    margin: 0,
    fontSize: "13px",
    color: "#5b21b6",
    lineHeight: "1.5",
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
  },
};
