/**
 * ANALYSIS PREFERENCES PAGE - app/onboarding/analysis/page.js
 * Schritt 3: Automatische Analyse aktivieren oder jedes Mal fragen
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { BarChart3, MessageCircleQuestion } from "lucide-react";

export default function AnalysisPreferencesPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);

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

  // Redirect if no memory consent yet
  useEffect(() => {
    if (!loading && profile) {
      const hasMemoryDecision = profile.memory_consent_at !== null && profile.memory_consent_at !== undefined;
      if (!hasMemoryDecision) {
        router.push("/onboarding/memory");
      }
    }
  }, [profile, loading, router]);

  // Skip if already has analysis preference set (not first time)
  useEffect(() => {
    if (!loading && profile && profile.auto_analyze !== null && profile.auto_analyze !== undefined) {
      // Check if this is a returning user (has completed sessions)
      // For now, we'll let new users go through this step
    }
  }, [profile, loading, router]);

  const handleChoice = async (autoAnalyze) => {
    setSaving(true);
    try {
      await updateProfile({
        auto_analyze: autoAnalyze,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to save preference:", error);
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
            <BarChart3 size={35} color="white" />
          </div>
          <h1 style={styles.title}>Session-Analysen</h1>
        </div>

        {/* Progress indicator - Step 3 of 3 */}
        <div style={styles.progress}>
          <div style={{...styles.progressDot, ...styles.progressDotCompleted}} />
          <div style={{...styles.progressLine, ...styles.progressLineCompleted}} />
          <div style={{...styles.progressDot, ...styles.progressDotCompleted}} />
          <div style={{...styles.progressLine, ...styles.progressLineCompleted}} />
          <div style={styles.progressDot} />
        </div>

        {/* Explanation */}
        <div style={styles.content}>
          <p style={styles.intro}>
            Nach jeder Session kann Amiya eine Zusammenfassung und Analyse erstellen.
          </p>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Die Analyse zeigt dir Muster, Beobachtungen und konkrete nächste Schritte
              basierend auf eurem Gespräch.
            </p>
          </div>
        </div>

        {/* Options */}
        <div style={styles.options}>
          <button
            onClick={() => handleChoice(true)}
            style={styles.optionButton}
            disabled={saving}
          >
            <div style={styles.optionIcon}>
              <BarChart3 size={24} color="#8b5cf6" />
            </div>
            <div style={styles.optionContent}>
              <span style={styles.optionTitle}>Automatisch analysieren</span>
              <span style={styles.optionDesc}>Nach jeder Session direkt Analyse erstellen</span>
            </div>
            <div style={styles.recommendedBadge}>Empfohlen</div>
          </button>

          <button
            onClick={() => handleChoice(false)}
            style={styles.optionButtonSecondary}
            disabled={saving}
          >
            <div style={styles.optionIcon}>
              <MessageCircleQuestion size={24} color="#6b7280" />
            </div>
            <div style={styles.optionContent}>
              <span style={styles.optionTitleSecondary}>Jedes Mal fragen</span>
              <span style={styles.optionDesc}>Ich entscheide nach jeder Session selbst</span>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p style={styles.footer}>
          Du kannst das jederzeit in den Profil-Einstellungen ändern.
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
    borderTopColor: "#8b5cf6",
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
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  logo: {
    width: "70px",
    height: "70px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "20px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 30px rgba(139,92,246,0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  progress: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
  },
  progressDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
  },
  progressDotCompleted: {
    background: "#8b5cf6",
  },
  progressLine: {
    width: "30px",
    height: "3px",
    background: "#e5e7eb",
  },
  progressLineCompleted: {
    background: "#8b5cf6",
  },
  content: {
    marginBottom: "24px",
  },
  intro: {
    color: "#6b7280",
    fontSize: "15px",
    textAlign: "center",
    marginBottom: "20px",
    lineHeight: "1.6",
  },
  infoBox: {
    background: "#f3f4f6",
    borderRadius: "12px",
    padding: "16px",
  },
  infoText: {
    margin: 0,
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  optionButton: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    background: "#f5f3ff",
    border: "2px solid #8b5cf6",
    borderRadius: "16px",
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
  },
  optionButtonSecondary: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
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
    color: "#4b5563",
  },
  optionDesc: {
    fontSize: "13px",
    color: "#6b7280",
  },
  recommendedBadge: {
    position: "absolute",
    top: "-10px",
    right: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
  },
};
