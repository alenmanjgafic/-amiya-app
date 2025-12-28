"use client";
import { useState, useEffect } from "react";

export default function AnalysisView({ sessionId, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateAnalysis();
  }, [sessionId]);

  const generateAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }

      setAnalysis(data.analysis);
      setThemes(data.themes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const themeLabels = {
    kommunikation: "💬 Kommunikation",
    kinder: "👶 Kinder & Familie",
    finanzen: "💰 Finanzen",
    arbeit: "💼 Arbeit",
    intimität: "❤️ Intimität",
    alltag: "🏠 Alltag",
    zeit: "⏰ Zeit",
    vertrauen: "🤝 Vertrauen",
    zukunft: "🔮 Zukunft",
    anerkennung: "⭐ Anerkennung",
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Analyse wird erstellt...</p>
            <p style={styles.loadingSubtext}>Das dauert einen Moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <p style={styles.errorText}>{error}</p>
            <button onClick={onClose} style={styles.button}>
              Schliessen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Session-Analyse</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {themes.length > 0 && (
          <div style={styles.themesContainer}>
            {themes.map((theme) => (
              <span key={theme} style={styles.themeTag}>
                {themeLabels[theme] || theme}
              </span>
            ))}
          </div>
        )}

        <div style={styles.analysisContent}>
          {analysis.split("\n").map((paragraph, i) => {
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <h3 key={i} style={styles.sectionTitle}>
                  {paragraph.replace(/\*\*/g, "")}
                </h3>
              );
            }
            if (paragraph.trim()) {
              return <p key={i} style={styles.paragraph}>{paragraph}</p>;
            }
            return null;
          })}
        </div>

        <button onClick={onClose} style={styles.doneButton}>
          Verstanden
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
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
    overflowY: "auto",
  },
  card: {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px",
  },
  themesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  themeTag: {
    background: "linear-gradient(135deg, #f3e8ff, #fae8ff)",
    color: "#7c3aed",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  analysisContent: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginTop: "20px",
    marginBottom: "8px",
  },
  paragraph: {
    color: "#4b5563",
    lineHeight: "1.7",
    marginBottom: "12px",
    fontSize: "15px",
  },
  doneButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  loadingText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  loadingSubtext: {
    color: "#6b7280",
    fontSize: "14px",
  },
  errorContainer: {
    textAlign: "center",
    padding: "40px 20px",
  },
  errorIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  errorText: {
    color: "#dc2626",
    marginBottom: "20px",
  },
  button: {
    padding: "12px 24px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    cursor: "pointer",
  },
};
