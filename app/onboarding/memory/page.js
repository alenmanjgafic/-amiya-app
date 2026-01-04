/**
 * UNIFIED CONSENT PAGE - app/onboarding/memory/page.js
 * Vereint Memory-Consent und Analyse-Einstellung in eine Entscheidung.
 * Migrated to Design System tokens
 *
 * Logik: "Analyse" = Memory + Metrics + automatische Analyse
 *        "Ohne Analyse" = Nichts wird gespeichert
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { Sparkles, Power, ChevronDown, ChevronUp } from "lucide-react";

export default function UnifiedConsentPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { tokens } = useTheme();
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

  return (
    <div style={tokens.layout.pageCentered}>
      <div style={{ ...tokens.cards.elevatedLarge, width: '100%', maxWidth: '480px' }}>
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
            boxShadow: tokens.shadows.medium,
          }}>
            <Sparkles size={35} color="white" />
          </div>
          <h1 style={{ ...tokens.typography.h2, lineHeight: '1.3' }}>Wie soll Amiya dich begleiten?</h1>
        </div>

        {/* Progress indicator - Step 2 of 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: tokens.colors.aurora.lavender,
          }} />
          <div style={{ width: '40px', height: '3px', background: tokens.colors.aurora.lavender }} />
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: tokens.gradients.primary,
          }} />
        </div>

        {/* Intro text */}
        <p style={{ ...tokens.typography.body, textAlign: 'center', marginBottom: '24px', lineHeight: '1.6' }}>
          Mit Analyse kann Amiya euren Fortschritt verfolgen und euch von Session zu Session besser unterstuetzen.
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Option 1: Mit Analyse (Recommended) */}
          <button
            onClick={() => handleChoice(true)}
            style={{
              ...tokens.inputs.selection(true),
              position: 'relative',
              opacity: saving ? 0.7 : 1,
            }}
            disabled={saving}
          >
            <div style={{
              ...tokens.badges.primary,
              position: 'absolute',
              top: '-10px',
              right: '16px',
              boxShadow: tokens.shadows.soft,
            }}>
              Empfohlen
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: tokens.colors.bg.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: tokens.shadows.soft,
            }}>
              <Sparkles size={24} color={tokens.colors.aurora.lavender} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: tokens.colors.text.primary }}>
                Mit Analyse
              </span>
              <span style={tokens.typography.small}>
                Amiya analysiert eure Sessions und erinnert sich an euch
              </span>
            </div>
          </button>

          {/* Option 2: Ohne Analyse */}
          <button
            onClick={() => handleChoice(false)}
            style={{
              ...tokens.inputs.selection(false),
              opacity: saving ? 0.7 : 1,
            }}
            disabled={saving}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: tokens.colors.bg.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Power size={24} color={tokens.colors.text.muted} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: tokens.colors.text.secondary }}>
                Ohne Analyse
              </span>
              <span style={tokens.typography.small}>
                Jede Session startet neu, ohne Auswertung
              </span>
            </div>
          </button>
        </div>

        {/* More Info Toggle */}
        <button
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          style={{
            ...tokens.buttons.ghostAccent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            marginBottom: '8px',
          }}
        >
          <span>Warum ist Analyse wichtig?</span>
          {showMoreInfo ? (
            <ChevronUp size={18} color={tokens.colors.aurora.lavender} />
          ) : (
            <ChevronDown size={18} color={tokens.colors.aurora.lavender} />
          )}
        </button>

        {/* Expandable Info Section */}
        {showMoreInfo && (
          <div style={{
            ...tokens.cards.surface,
            borderRadius: tokens.radii.lg,
            padding: '20px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>*</span>
              <div>
                <strong style={{ color: tokens.colors.text.primary }}>Personalisierte Unterstuetzung</strong>
                <p style={{ ...tokens.typography.small, marginTop: '4px', lineHeight: '1.5' }}>
                  Amiya lernt, wie ihr kommuniziert und was euch wichtig ist.
                  So kann sie euch immer besser begleiten.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>+</span>
              <div>
                <strong style={{ color: tokens.colors.text.primary }}>Euren Fortschritt sehen</strong>
                <p style={{ ...tokens.typography.small, marginTop: '4px', lineHeight: '1.5' }}>
                  Nach jeder Session bekommt ihr eine Zusammenfassung mit konkreten
                  Beobachtungen und naechsten Schritten.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>~</span>
              <div>
                <strong style={{ color: tokens.colors.text.primary }}>Volle Kontrolle</strong>
                <p style={{ ...tokens.typography.small, marginTop: '4px', lineHeight: '1.5' }}>
                  Ihr koennt jederzeit alle gespeicherten Daten einsehen oder loeschen.
                  Amiya speichert nur, was ihr selbst erzaehlt.
                </p>
              </div>
            </div>

            <div style={{
              ...tokens.alerts.info,
              borderLeft: `3px solid ${tokens.colors.aurora.lavender}`,
              marginTop: '8px',
            }}>
              <p style={{ ...tokens.alerts.infoText, margin: 0, fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>
                Die meisten Paare profitieren am meisten von der Analyse-Funktion,
                weil sie hilft, Muster zu erkennen und echte Fortschritte zu machen.
              </p>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p style={{ ...tokens.typography.small, textAlign: 'center' }}>
          Du kannst das jederzeit in den Einstellungen aendern.
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
