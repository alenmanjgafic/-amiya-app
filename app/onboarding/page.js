/**
 * ONBOARDING PAGE - app/onboarding/page.js
 * Pflicht-Eingabe von Name + Partner-Name nach Registrierung
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";

export default function OnboardingPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { tokens } = useTheme();
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

  // Redirect if onboarding already done - go to memory consent if needed
  useEffect(() => {
    if (!loading && profile?.name && profile?.partner_name) {
      // Check if memory consent is needed
      if (profile.memory_consent === null || profile.memory_consent === undefined) {
        router.push("/onboarding/memory");
      } else {
        router.push("/");
      }
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
      // Go to memory consent screen
      router.push("/onboarding/memory");
    } catch (err) {
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={tokens.layout.pageCentered}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={tokens.loaders.spinner(40)} />
          <p style={tokens.typography.body}>Laden...</p>
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

  if (!user) {
    return null;
  }

  return (
    <div style={tokens.layout.pageCentered}>
      <div style={{ ...tokens.cards.elevatedLarge, width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: tokens.gradients.primary,
            borderRadius: '20px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '35px',
            boxShadow: tokens.shadows.medium,
          }}>
            <span style={{ color: 'white', fontSize: '32px' }}>A</span>
          </div>
          <h1 style={tokens.typography.h1}>Willkommen bei Amiya</h1>
          <p style={tokens.typography.body}>
            Bevor es losgeht, erzaehl mir kurz von euch.
          </p>
        </div>

        {/* Progress indicator - Step 1 of 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: tokens.gradients.primary,
          }} />
          <div style={{ ...tokens.progress.track, width: '40px' }} />
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: tokens.colors.bg.soft,
          }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={tokens.inputs.label}>Wie heisst du?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              style={tokens.inputs.text}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={tokens.inputs.label}>Wie heisst dein/e Partner/in?</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Vorname deines Partners / deiner Partnerin"
              style={tokens.inputs.text}
            />
            <p style={tokens.inputs.hint}>
              Diese Namen nutze ich, um unsere Gespraeche persoenlicher zu machen.
            </p>
          </div>

          {error && <p style={tokens.alerts.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...tokens.buttons.primary, marginTop: '8px', opacity: saving ? 0.7 : 1 }}
            disabled={saving}
          >
            {saving ? "Speichern..." : "Weiter"}
          </button>
        </form>

        {/* Privacy note */}
        <p style={{ ...tokens.typography.small, marginTop: '24px', textAlign: 'center' }}>
          Deine Daten werden verschluesselt in der Schweiz gespeichert.
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
