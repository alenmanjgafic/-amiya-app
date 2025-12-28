/**
 * ONBOARDING PAGE - app/onboarding/page.js
 * Pflicht-Eingabe von Name + Partner-Name nach Registrierung
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function OnboardingPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Redirect if onboarding already done
  useEffect(() => {
    if (!loading && profile?.name && profile?.partner_name) {
      router.push("/");
    }
  }, [profile, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Bitte gib deinen Namen ein");
      return;
    }
    if (!partnerName.trim()) {
      setError("Bitte gib den Namen deines Partners / deiner Partnerin ein");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProfile({
        name: name.trim(),
        partner_name: partnerName.trim(),
      });
      router.push("/");
    } catch (err) {
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Willkommen bei Amiya</h1>
          <p style={styles.subtitle}>
            Bevor es losgeht, erzähl mir kurz von euch.
          </p>
        </div>

        {/* Progress indicator */}
        <div style={styles.progress}>
          <div style={styles.progressDot} />
          <div style={styles.progressLine} />
          <div style={{...styles.progressDot, ...styles.progressDotInactive}} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Wie heisst du?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Wie heisst dein/e Partner/in?</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Vorname deines Partners / deiner Partnerin"
              style={styles.input}
            />
            <p style={styles.hint}>
              Diese Namen nutze ich, um unsere Gespräche persönlicher zu machen.
            </p>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Weiter"}
          </button>
        </form>

        {/* Privacy note */}
        <p style={styles.privacyNote}>
          🔒 Deine Daten werden verschlüsselt in der Schweiz gespeichert.
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
    maxWidth: "440px",
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
    fontSize: "35px",
    boxShadow: "0 8px 30px rgba(139,92,246,0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#6b7280",
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.5",
  },
  progress: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0",
    marginBottom: "32px",
  },
  progressDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
  },
  progressDotInactive: {
    background: "#e5e7eb",
  },
  progressLine: {
    width: "40px",
    height: "3px",
    background: "#e5e7eb",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "16px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
    lineHeight: "1.4",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    margin: 0,
  },
  submitButton: {
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  privacyNote: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "13px",
    color: "#9ca3af",
  },
};
