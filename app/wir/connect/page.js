/**
 * CONNECT INFO PAGE - app/wir/connect/page.js
 * Info-Seite was geteilt wird und was privat bleibt
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";

export default function ConnectPage() {
  const { user, profile, loading } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push("/wir")} style={styles.backButton}>
          ←
        </button>
      </div>

      <div style={styles.content}>
        {/* Title */}
        <h1 style={styles.title}>Teile mehr mit {partnerName}</h1>

        {/* Hearts Graphic */}
        <div style={styles.heartsContainer}>
          <div style={styles.heartWrapper}>
            <div style={styles.heartTop}>💜</div>
            <div style={styles.heartBottom}>💜</div>
            <div style={styles.heartBadge}>1</div>
          </div>
        </div>

        <p style={styles.subtitle}>Ein Abo für euch beide</p>

        {/* What's Shared */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Was ihr teilt</h3>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>✓</span>
              <span>Euer Abo</span>
            </li>
            <li style={styles.listItem}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>✓</span>
              <span>Sparks (bald verfügbar)</span>
            </li>
            <li style={styles.listItem}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>✓</span>
              <span>Quiz-Ergebnisse</span>
            </li>
            <li style={styles.listItem}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>✓</span>
              <span>Paar-Gespräch Analysen</span>
            </li>
          </ul>
        </div>

        {/* What's Private */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Was privat bleibt</h3>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.listIconPrivate}>🔒</span>
              <span>Alle Nachrichten mit Amiya</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.listIconPrivate}>🔒</span>
              <span>Solo Sessions</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.listIconPrivate}>🔒</span>
              <span>Alle Solo-Analysen</span>
            </li>
            <li style={styles.listItem}>
              <span style={styles.listIconPrivate}>🔒</span>
              <span>Alles andere</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div style={styles.bottomSection}>
        <button 
          onClick={() => router.push("/wir/connect/code")}
          style={styles.continueButton}
        >
          Verstanden
        </button>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
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
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "16px 20px",
  },
  backButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "white",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  content: {
    flex: 1,
    padding: "0 24px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 32px 0",
    lineHeight: "1.3",
  },
  heartsContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px",
  },
  heartWrapper: {
    position: "relative",
    width: "100px",
    height: "120px",
  },
  heartTop: {
    position: "absolute",
    top: "0",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "50px",
    animation: "float 3s ease-in-out infinite",
  },
  heartBottom: {
    position: "absolute",
    bottom: "0",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "50px",
    opacity: "0.6",
    animation: "float 3s ease-in-out infinite 0.5s",
  },
  heartBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "32px",
    height: "32px",
    background: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    color: "#7c3aed",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "32px",
  },
  section: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 16px 0",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    fontSize: "15px",
    color: "#374151",
  },
  // listIcon now uses inline tokens.colors.aurora.mint
  listIconPrivate: {
    fontSize: "14px",
  },
  bottomSection: {
    padding: "20px 24px 40px 24px",
  },
  continueButton: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
  },
};
