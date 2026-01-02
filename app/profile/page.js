/**
 * PROFILE PAGE - app/profile/page.js
 * Profil-Einstellungen (Name + Partner-Name ändern)
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ color: tokens.colors.text.secondary }}>Laden...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: "20px",
      background: tokens.colors.bg.deep,
      transition: "background 0.3s ease",
    }}>
      <div style={{
        maxWidth: "500px",
        margin: "0 auto",
        background: tokens.colors.bg.elevated,
        borderRadius: tokens.radii.xl,
        padding: "24px",
        boxShadow: tokens.shadows.medium,
        transition: "all 0.3s ease",
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
              background: "none",
              border: "none",
              color: tokens.colors.text.secondary,
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={20} /> Zurück
          </button>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: tokens.colors.text.primary,
            margin: 0,
            fontFamily: tokens.fonts.display,
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
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
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
            <label style={{
              fontSize: "14px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
            }}>Dein Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wie heisst du?"
              style={{
                padding: "14px 16px",
                borderRadius: tokens.radii.md,
                border: `2px solid ${tokens.colors.bg.soft}`,
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
                background: tokens.colors.bg.surface,
                color: tokens.colors.text.primary,
                fontFamily: tokens.fonts.body,
              }}
            />
            <p style={{
              fontSize: "13px",
              color: tokens.colors.text.muted,
              margin: 0,
            }}>So wird Amiya dich ansprechen</p>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <label style={{
              fontSize: "14px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
            }}>Name deines Partners / deiner Partnerin</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Wie heisst dein/e Partner/in?"
              style={{
                padding: "14px 16px",
                borderRadius: tokens.radii.md,
                border: `2px solid ${tokens.colors.bg.soft}`,
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
                background: tokens.colors.bg.surface,
                color: tokens.colors.text.primary,
                fontFamily: tokens.fonts.body,
              }}
            />
            <p style={{
              fontSize: "13px",
              color: tokens.colors.text.muted,
              margin: 0,
            }}>Für personalisierte Gespräche und Analysen</p>
          </div>

          {error && <p style={{
            color: tokens.colors.error,
            fontSize: "14px",
            background: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "#fef2f2",
            padding: "12px",
            borderRadius: tokens.radii.sm,
            margin: 0,
          }}>{error}</p>}

          {saved && <p style={{
            color: tokens.colors.success,
            fontSize: "14px",
            background: isDarkMode ? "rgba(52, 211, 153, 0.1)" : "#f0fdf4",
            padding: "12px",
            borderRadius: tokens.radii.sm,
            margin: 0,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}><Check size={16} /> Gespeichert</p>}

          <button
            type="submit"
            style={{
              padding: "16px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
              color: "white",
              border: "none",
              borderRadius: tokens.radii.md,
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "8px",
              fontFamily: tokens.fonts.body,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </form>

        {/* Email info */}
        <div style={{
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: `1px solid ${tokens.colors.bg.soft}`,
        }}>
          <p style={{
            fontSize: "13px",
            color: tokens.colors.text.muted,
            margin: "0 0 4px 0",
          }}>E-Mail</p>
          <p style={{
            fontSize: "15px",
            color: tokens.colors.text.secondary,
            margin: 0,
          }}>{user?.email}</p>
        </div>

        {/* Theme Toggle Section */}
        <div style={{
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: `1px solid ${tokens.colors.bg.soft}`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 4px 0",
              }}>Erscheinungsbild</p>
              <p style={{
                fontSize: "13px",
                color: tokens.colors.text.muted,
                margin: 0,
              }}>
                {isDarkMode ? "Dunkler Modus aktiv" : "Heller Modus aktiv"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                background: isDarkMode
                  ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`
                  : tokens.colors.bg.surface,
                border: isDarkMode ? "none" : `2px solid ${tokens.colors.bg.soft}`,
                borderRadius: tokens.radii.pill,
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: isDarkMode ? "#fff" : tokens.colors.text.secondary,
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {isDarkMode ? "Hell" : "Dunkel"}
            </button>
          </div>
        </div>

        {/* Analysis Preference Section */}
        <div style={{
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: `1px solid ${tokens.colors.bg.soft}`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <BarChart3 size={16} />
                Session-Analysen
              </p>
              <p style={{
                fontSize: "13px",
                color: tokens.colors.text.muted,
                margin: 0,
              }}>
                {autoAnalyze ? "Automatisch nach jeder Session" : "Jedes Mal fragen"}
              </p>
            </div>
            <button
              onClick={toggleAutoAnalyze}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                background: autoAnalyze
                  ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`
                  : tokens.colors.bg.surface,
                border: autoAnalyze ? "none" : `2px solid ${tokens.colors.bg.soft}`,
                borderRadius: tokens.radii.pill,
                cursor: "pointer",
                transition: "all 0.3s ease",
                color: autoAnalyze ? "#fff" : tokens.colors.text.secondary,
                fontSize: "14px",
                fontWeight: "500",
              }}
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

// All styles now use theme tokens inline
