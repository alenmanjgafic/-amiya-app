/**
 * MEMORY CONSENT PAGE - app/onboarding/memory/page.js
 * Consent-Screen für Memory-System nach Namen-Eingabe
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";

export default function MemoryConsentPage() {
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

  // Skip if already has consent decision (explicitly set)
  useEffect(() => {
    if (!loading && profile) {
      // Only skip if consent was explicitly set (has a timestamp)
      const hasDecided = profile.memory_consent_at !== null && profile.memory_consent_at !== undefined;
      if (hasDecided) {
        router.push("/");
      }
    }
  }, [profile, loading, router]);

  const handleConsent = async (consent) => {
    setSaving(true);
    try {
      await updateProfile({
        memory_consent: consent,
        memory_consent_at: new Date().toISOString(),
      });
      // Go to analysis preferences (step 3)
      router.push("/onboarding/analysis");
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

  const partnerName = profile?.partner_name || "Partner";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🧠</div>
          <h1 style={styles.title}>Soll Amiya sich erinnern?</h1>
        </div>

        {/* Progress indicator - Step 2 of 3 */}
        <div style={styles.progress}>
          <div style={{...styles.progressDot, ...styles.progressDotCompleted}} />
          <div style={{...styles.progressLine, ...styles.progressLineCompleted}} />
          <div style={styles.progressDot} />
          <div style={styles.progressLine} />
          <div style={{...styles.progressDot, ...styles.progressDotInactive}} />
        </div>

        {/* Explanation */}
        <div style={styles.content}>
          <p style={styles.intro}>
            Amiya kann sich an eure Gespräche erinnern, um euch besser zu begleiten.
          </p>

          {/* What Amiya remembers */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Was Amiya sich merkt:</h3>
            
            <div style={styles.subsection}>
              <p style={styles.subsectionTitle}>Nur für dich (aus Solo Sessions):</p>
              <ul style={styles.list}>
                <li>Was du erzählt hast</li>
                <li>Deine persönlichen Themen</li>
              </ul>
            </div>

            <div style={styles.subsection}>
              <p style={styles.subsectionTitle}>Für euch beide (aus Couple Sessions):</p>
              <ul style={styles.list}>
                <li>Gemeinsame Fakten (Kinder, Beziehungsdauer)</li>
                <li>Eure Stärken als Paar</li>
                <li>Was bei euch funktioniert</li>
                <li>Eure Vereinbarungen</li>
                <li>Euren Fortschritt über Zeit</li>
              </ul>
            </div>
          </div>

          {/* What Amiya doesn't do */}
          <div style={styles.noteBox}>
            <p style={styles.noteText}>
              <strong>Wichtig:</strong> Amiya erstellt keine Diagnosen oder Bewertungen. 
              Sie speichert nur was ihr selbst erzählt habt.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttons}>
          <button
            onClick={() => handleConsent(true)}
            style={styles.primaryButton}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Ja, Amiya darf sich erinnern"}
          </button>
          
          <button
            onClick={() => handleConsent(false)}
            style={styles.secondaryButton}
            disabled={saving}
          >
            Nein, jede Session startet neu
          </button>
        </div>

        {/* Footer note */}
        <p style={styles.footer}>
          Du kannst das jederzeit in den Einstellungen ändern und alle Notizen löschen.
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
  progressDotInactive: {
    background: "#e5e7eb",
  },
  progressLine: {
    width: "30px",
    height: "3px",
    background: "#e5e7eb",
  },
  progressLineCompleted: {
    background: "#8b5cf6",
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
    fontSize: "35px",
    boxShadow: "0 8px 30px rgba(139,92,246,0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  content: {
    marginBottom: "24px",
  },
  intro: {
    color: "#6b7280",
    fontSize: "15px",
    textAlign: "center",
    marginBottom: "24px",
    lineHeight: "1.6",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "16px",
  },
  subsection: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
  },
  subsectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: "8px",
  },
  list: {
    margin: 0,
    paddingLeft: "20px",
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "1.8",
  },
  noteBox: {
    background: "#fef3c7",
    borderRadius: "12px",
    padding: "16px",
    borderLeft: "4px solid #f59e0b",
  },
  noteText: {
    margin: 0,
    fontSize: "14px",
    color: "#92400e",
    lineHeight: "1.5",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "16px",
  },
  primaryButton: {
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "16px",
    background: "#f3f4f6",
    color: "#6b7280",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
  },
};
