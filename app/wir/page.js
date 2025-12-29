/**
 * WIR PAGE - app/wir/page.js
 * Übersichtsseite für Paar-Features
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function WirPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && profile && (!profile.name || !profile.partner_name)) {
      router.push("/onboarding");
    }
  }, [user, profile, loading, router]);

  if (loading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";
  const isConnected = !!profile?.couple_id;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push("/")} style={styles.backButton}>
          ← Zurück
        </button>
        <h1 style={styles.title}>Wir</h1>
      </div>

      <div style={styles.content}>
        {/* Connect Card */}
        {!isConnected ? (
          <div style={styles.card}>
            <div style={styles.cardIcon}>💑</div>
            <h2 style={styles.cardTitle}>Mehr gemeinsam erleben</h2>
            <p style={styles.cardSubtitle}>
              Näher. Tiefer. Mühelos.
            </p>
            <p style={styles.cardDescription}>
              Ein Abo, zwei Accounts. Füge {partnerName} zu deinem Abo hinzu – 
              oder tritt ihrem bei, ohne zusätzliche Kosten.
            </p>
            <button 
              onClick={() => router.push("/wir/connect")}
              style={styles.connectButton}
            >
              Verbinden
            </button>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.cardIcon}>💜</div>
            <h2 style={styles.cardTitle}>Verbunden mit {partnerName}</h2>
            <p style={styles.cardDescription}>
              Ihr seid verbunden und könnt gemeinsame Features nutzen.
            </p>
            {/* Future: More couple features here */}
          </div>
        )}

        {/* Future cards placeholder */}
        <div style={styles.comingSoon}>
          <p style={styles.comingSoonText}>Weitere Features folgen...</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <button onClick={() => router.push("/")} style={styles.navItem}>
          <span style={styles.navIcon}>🏠</span>
          <span style={styles.navLabel}>Home</span>
        </button>
        <button style={{...styles.navItem, ...styles.navItemActive}}>
          <span style={styles.navIcon}>💑</span>
          <span style={{...styles.navLabel, ...styles.navLabelActive}}>Wir</span>
        </button>
        <button onClick={() => router.push("/profile")} style={styles.navItem}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>Profil</span>
        </button>
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
    alignItems: "center",
    justifyContent: "center",
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
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
    paddingBottom: "100px",
  },
  header: {
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e9d5ff",
  },
  backButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#6b7280",
    cursor: "pointer",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  content: {
    padding: "24px 20px",
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(139, 92, 246, 0.1)",
  },
  cardIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  cardSubtitle: {
    fontSize: "16px",
    color: "#8b5cf6",
    fontWeight: "500",
    margin: "0 0 16px 0",
  },
  cardDescription: {
    fontSize: "15px",
    color: "#6b7280",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
  },
  connectButton: {
    padding: "16px 32px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
  },
  comingSoon: {
    marginTop: "24px",
    padding: "20px",
    textAlign: "center",
  },
  comingSoonText: {
    color: "#9ca3af",
    fontSize: "14px",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    padding: "12px 0 24px 0",
  },
  navItem: {
    background: "none",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    padding: "8px 16px",
  },
  navItemActive: {},
  navIcon: {
    fontSize: "24px",
  },
  navLabel: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  navLabelActive: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
};
