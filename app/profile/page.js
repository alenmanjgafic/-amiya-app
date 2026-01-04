/**
 * PROFILE PAGE - app/profile/page.js
 * Profil-Einstellungen (Name + Partner-Name ändern)
 *
 * Migrated to Design System tokens from ThemeContext
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { ArrowLeft, Sun, Moon, Check, BarChart3 } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { tokens, isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [autoAnalyze, setAutoAnalyze] = useState(true);
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
      setAutoAnalyze(profile.auto_analyze !== false); // Default to true
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

  const toggleAutoAnalyze = async () => {
    const newValue = !autoAnalyze;
    setAutoAnalyze(newValue);
    try {
      await updateProfile({ auto_analyze: newValue });
    } catch (err) {
      // Revert on error
      setAutoAnalyze(!newValue);
      console.error("Failed to update auto_analyze:", err);
    }
  };

  if (loading) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.small}>Laden...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={tokens.layout.page}>
      <div style={{
        ...tokens.cards.elevated,
        ...tokens.layout.container,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}>
          <button
            onClick={() => router.push("/")}
            style={{
              ...tokens.buttons.ghost,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={20} /> Zuruck
          </button>
          <h1 style={{
            ...tokens.typography.h1,
            fontSize: "24px",
            marginBottom: 0,
          }}>Profil</h1>
        </div>

        {/* Avatar */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: tokens.gradients.primary,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
            fontFamily: tokens.fonts.display,
          }}>
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <label style={tokens.inputs.label}>Dein Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wie heisst du?"
              style={tokens.inputs.text}
            />
            <p style={tokens.inputs.hint}>So wird Amiya dich ansprechen</p>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <label style={tokens.inputs.label}>Name deines Partners / deiner Partnerin</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Wie heisst dein/e Partner/in?"
              style={tokens.inputs.text}
            />
            <p style={tokens.inputs.hint}>Fur personalisierte Gesprache und Analysen</p>
          </div>

          {error && (
            <p style={tokens.alerts.error}>{error}</p>
          )}

          {saved && (
            <p style={{
              ...tokens.alerts.success,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <Check size={16} /> Gespeichert
            </p>
          )}

          <button
            type="submit"
            style={{
              ...tokens.buttons.primary,
              width: "100%",
              marginTop: "8px",
            }}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </form>

        {/* Email info */}
        <div style={tokens.layout.section}>
          <p style={tokens.typography.small}>E-Mail</p>
          <p style={{
            ...tokens.typography.body,
            marginTop: "4px",
          }}>{user?.email}</p>
        </div>

        {/* Theme Toggle Section */}
        <div style={tokens.layout.section}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                ...tokens.inputs.label,
                marginBottom: "4px",
              }}>Erscheinungsbild</p>
              <p style={tokens.typography.small}>
                {isDarkMode ? "Dunkler Modus aktiv" : "Heller Modus aktiv"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              style={tokens.buttons.toggle(isDarkMode)}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {isDarkMode ? "Hell" : "Dunkel"}
            </button>
          </div>
        </div>

        {/* Analysis Preference Section */}
        <div style={tokens.layout.section}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                ...tokens.inputs.label,
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <BarChart3 size={16} />
                Session-Analysen
              </p>
              <p style={tokens.typography.small}>
                {autoAnalyze ? "Automatisch nach jeder Session" : "Jedes Mal fragen"}
              </p>
            </div>
            <button
              onClick={toggleAutoAnalyze}
              style={tokens.buttons.toggle(autoAnalyze)}
            >
              {autoAnalyze ? "Auto" : "Manuell"}
            </button>
          </div>
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
