/**
 * WIR PAGE - app/wir/page.js
 * Übersichtsseite für Paar-Features mit Couple Session
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function WirPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [showPrepModal, setShowPrepModal] = useState(false);

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
  const userName = profile?.name || "du";
  const isConnected = !!profile?.couple_id;

  const handleStartCoupleSession = () => {
    setShowPrepModal(true);
  };

  const handleConfirmStart = () => {
    setShowPrepModal(false);
    router.push("/session/couple");
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Wir</h1>
        <p style={styles.subtitle}>{userName} & {partnerName}</p>
      </div>

      <div style={styles.content}>
        {/* Couple Session Card - Only if connected */}
        {isConnected && (
          <div style={styles.card}>
            <div style={styles.cardIconLarge}>💑</div>
            <h2 style={styles.cardTitle}>Gemeinsame Session</h2>
            <p style={styles.cardDescription}>
              Sprecht zusammen mit Amiya über eure Beziehung. 
              Sie moderiert und hilft euch, einander besser zu verstehen.
            </p>
            <button 
              onClick={handleStartCoupleSession}
              style={styles.primaryButton}
            >
              Session starten
            </button>
          </div>
        )}

        {/* Connect Card - Only if not connected */}
        {!isConnected && (
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
        )}

        {/* History Preview Card */}
        <div style={styles.cardSecondary} onClick={() => router.push("/history")}>
          <div style={styles.cardRow}>
            <div style={styles.cardIconSmall}>📋</div>
            <div>
              <h3 style={styles.cardTitleSmall}>Session-Verlauf</h3>
              <p style={styles.cardDescriptionSmall}>
                Alle Solo- und Couple-Sessions ansehen
              </p>
            </div>
            <span style={styles.arrow}>→</span>
          </div>
        </div>

        {/* Future features placeholder */}
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
        <button onClick={() => router.push("/history")} style={styles.navItem}>
          <span style={styles.navIcon}>📋</span>
          <span style={styles.navLabel}>Verlauf</span>
        </button>
        <button onClick={() => router.push("/profile")} style={styles.navItem}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navLabel}>Profil</span>
        </button>
      </div>

      {/* Preparation Modal */}
      {showPrepModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>💜</div>
            <h2 style={styles.modalTitle}>Bereit für eure Session?</h2>
            
            <div style={styles.prepList}>
              <div style={styles.prepItem}>
                <span style={styles.prepIcon}>⏱️</span>
                <div>
                  <strong>Max. 1 Stunde</strong>
                  <p style={styles.prepText}>Plant genug Zeit ein, ohne Zeitdruck.</p>
                </div>
              </div>
              
              <div style={styles.prepItem}>
                <span style={styles.prepIcon}>🔕</span>
                <div>
                  <strong>Nicht stören</strong>
                  <p style={styles.prepText}>Handys auf lautlos, voller Fokus auf euch.</p>
                </div>
              </div>
              
              <div style={styles.prepItem}>
                <span style={styles.prepIcon}>🛋️</span>
                <div>
                  <strong>Gemütlicher Ort</strong>
                  <p style={styles.prepText}>Setzt euch bequem hin, nebeneinander.</p>
                </div>
              </div>
              
              <div style={styles.prepItem}>
                <span style={styles.prepIcon}>🎧</span>
                <div>
                  <strong>Lautsprecher nutzen</strong>
                  <p style={styles.prepText}>Damit ihr beide Amiya gut hört.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleConfirmStart}
              style={styles.startSessionButton}
            >
              Session starten
            </button>
            
            <button 
              onClick={() => setShowPrepModal(false)}
              style={styles.cancelButton}
            >
              Abbrechen
            </button>
          </div>
        </div>
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
    padding: "24px 20px 16px",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "15px",
    color: "#8b5cf6",
    margin: 0,
    fontWeight: "500",
  },
  content: {
    padding: "0 20px",
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(139, 92, 246, 0.1)",
    marginBottom: "16px",
  },
  cardIconLarge: {
    fontSize: "64px",
    marginBottom: "16px",
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
  primaryButton: {
    padding: "16px 32px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
    width: "100%",
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
  cardSecondary: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(139, 92, 246, 0.08)",
    marginBottom: "16px",
    cursor: "pointer",
  },
  cardRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  cardIconSmall: {
    fontSize: "32px",
  },
  cardTitleSmall: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 4px 0",
  },
  cardDescriptionSmall: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  arrow: {
    marginLeft: "auto",
    fontSize: "20px",
    color: "#9ca3af",
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
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "24px",
    padding: "32px 24px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 24px 0",
  },
  prepList: {
    textAlign: "left",
    marginBottom: "24px",
  },
  prepItem: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    alignItems: "flex-start",
  },
  prepIcon: {
    fontSize: "24px",
    marginTop: "2px",
  },
  prepText: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  startSessionButton: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
    marginBottom: "12px",
  },
  cancelButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "15px",
    cursor: "pointer",
    padding: "8px",
  },
};
