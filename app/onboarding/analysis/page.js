/**
 * ANALYSIS PREFERENCES PAGE - app/onboarding/analysis/page.js
 * DEPRECATED: Wird nicht mehr separat verwendet.
 * Unified Consent Model: Memory + Analyse werden gemeinsam in /onboarding/memory entschieden.
 * Migrated to Design System tokens
 *
 * Diese Seite redirected nun direkt zur Startseite.
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../../lib/ThemeContext";

export default function AnalysisPreferencesPage() {
  const router = useRouter();
  const { tokens } = useTheme();

  useEffect(() => {
    // Unified Consent Model: Diese Seite wird nicht mehr gebraucht
    // Redirect zur Startseite
    router.push("/");
  }, [router]);

  return (
    <div style={tokens.layout.pageCentered}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Weiterleitung...</p>
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
