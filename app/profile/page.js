/**
 * PROFILE PAGE - app/profile/page.js
 * Profil-Einstellungen (Name + Partner-Name ändern)
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPartnerName(profile.partner_name || "");
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await updateProfile({
        name: name.trim(),
        partner_name: partnerName.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
          <button onClick={() => router.push("/")} style={styles.backButton}>
            ← Zurück
          </button>
          <h1 style={styles.title}>Profil</h1>
        </div>

        {/* Avatar */}
        <div style={styles.avatarSection}>
          <div style={styles.avatar}>
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Dein Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wie heisst du?"
              style={styles.input}
            />
            <p style={styles.hint}>So wird Amiya dich ansprechen</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Name deines Partners / deiner Partnerin</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Wie heisst dein/e Partner/in?"
              style={styles.input}
            />
            <p style={styles.hint}>Für personalisierte Gespräche und Analysen</p>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {saved && <p style={styles.success}>✓ Gespeichert</p>}

          <button 
            type="submit" 
            style={styles.saveButton}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </form>

        {/* Email info */}
        <div style={styles.emailSection}>
          <p style={styles.emailLabel}>E-Mail</p>
          <p style={styles.email}>{user?.email}</p>
        </div>
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
    padding: "20px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  card: {
    maxWidth: "500px",
    margin: "0 auto",
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "16px",
    cursor: "pointer",
    padding: "8px 0",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  avatarSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "32px",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
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
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "14px 16px",
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
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    margin: 0,
  },
  success: {
    color: "#16a34a",
    fontSize: "14px",
    background: "#f0fdf4",
    padding: "12px",
    borderRadius: "8px",
    margin: 0,
    textAlign: "center",
  },
  saveButton: {
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
  emailSection: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
  emailLabel: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "0 0 4px 0",
  },
  email: {
    fontSize: "15px",
    color: "#6b7280",
    margin: 0,
  },
};
