/**
 * ANALYSIS PREFERENCES PAGE - app/onboarding/analysis/page.js
 * DEPRECATED: Wird nicht mehr separat verwendet.
 * Unified Consent Model: Memory + Analyse werden gemeinsam in /onboarding/memory entschieden.
 *
 * Diese Seite redirected nun direkt zur Startseite.
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalysisPreferencesPage() {
  const router = useRouter();

  useEffect(() => {
    // Unified Consent Model: Diese Seite wird nicht mehr gebraucht
    // Redirect zur Startseite
    router.push("/");
  }, [router]);

  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
      <p>Weiterleitung...</p>
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
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
