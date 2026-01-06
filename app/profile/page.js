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
import { ChevronLeft, Sun, Moon, Check, BarChart3, LogOut, Users, ChevronRight, ClipboardList, Home as HomeIcon, Heart } from "lucide-react";
import { EntdeckenIcon } from "../../components/learning/LearningIcons";
import DisconnectDialog from "../../components/DisconnectDialog";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, signOut, fetchProfile } = useAuth();
  const { tokens, isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showDisconnect, setShowDisconnect] = useState(false);

  const isConnected = !!profile?.couple_id;

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
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      paddingBottom: "100px",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: tokens.colors.bg.elevated,
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} color={tokens.colors.text.secondary} />
        </button>
        <h1 style={{
          ...tokens.typography.h1,
          margin: 0,
          fontSize: "20px",
        }}>Profil</h1>
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px" }}>
        {/* Avatar */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "24px",
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: tokens.gradients.primary,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
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

        {/* Session History Section */}
        <div style={tokens.layout.section}>
          <div
            onClick={() => router.push("/history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              cursor: "pointer",
            }}
          >
            <ClipboardList size={20} color={tokens.colors.aurora.lavender} />
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.inputs.label,
                marginBottom: "2px",
              }}>Session-Verlauf</p>
              <p style={tokens.typography.small}>
                Vergangene Sessions und Analysen
              </p>
            </div>
            <ChevronRight size={20} color={tokens.colors.text.muted} />
          </div>
        </div>

        {/* Connection Management - Only if connected */}
        {isConnected && (
          <div style={tokens.layout.section}>
            <div
              onClick={() => setShowDisconnect(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 0",
                cursor: "pointer",
              }}
            >
              <Users size={20} color={tokens.colors.text.muted} />
              <div style={{ flex: 1 }}>
                <p style={{
                  ...tokens.inputs.label,
                  marginBottom: "2px",
                }}>Verbindung verwalten</p>
                <p style={tokens.typography.small}>
                  Paar-Einstellungen und Trennung
                </p>
              </div>
              <ChevronRight size={20} color={tokens.colors.text.muted} />
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div style={{
          ...tokens.layout.section,
          borderTop: `1px solid ${tokens.colors.border}`,
          paddingTop: "24px",
          marginTop: "24px",
        }}>
          <button
            onClick={signOut}
            style={{
              ...tokens.buttons.ghost,
              width: "100%",
              justifyContent: "center",
              color: tokens.colors.error,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={tokens.layout.navBar}>
        <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
          <HomeIcon size={24} />
          <span>Home</span>
        </button>
        <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
          <Heart size={24} />
          <span>Wir</span>
        </button>
        <button onClick={() => router.push("/entdecken")} style={tokens.buttons.nav(false)}>
          <EntdeckenIcon size={24} active={false} />
          <span>Entdecken</span>
        </button>
      </div>

      {/* Disconnect Dialog */}
      {showDisconnect && (
        <DisconnectDialog
          onClose={() => setShowDisconnect(false)}
          onComplete={async () => {
            setShowDisconnect(false);
            await fetchProfile(user.id);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
