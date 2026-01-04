/**
 * CONNECT INFO PAGE - app/wir/connect/page.js
 * Info-Seite was geteilt wird und was privat bleibt
 * Migrated to Design System tokens
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";

export default function ConnectPage() {
  const { user, profile, loading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div style={tokens.layout.pageCentered}>
        <div style={tokens.loaders.spinner(40)} />
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";

  return (
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={() => router.push("/wir")}
          style={{
            ...tokens.buttons.icon,
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: tokens.colors.bg.elevated,
            boxShadow: tokens.shadows.soft,
          }}
        >
          <span style={{ fontSize: "20px" }}>&#8592;</span>
        </button>
      </div>

      <div style={{ flex: 1, padding: "0 24px", textAlign: "center" }}>
        {/* Title */}
        <h1 style={{ ...tokens.typography.h1, marginBottom: "32px", lineHeight: "1.3" }}>
          Teile mehr mit {partnerName}
        </h1>

        {/* Hearts Graphic */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{ position: "relative", width: "100px", height: "120px" }}>
            <div style={{
              position: "absolute",
              top: "0",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "50px",
              animation: "float 3s ease-in-out infinite",
            }}>
              &#x1F49C;
            </div>
            <div style={{
              position: "absolute",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "50px",
              opacity: "0.6",
              animation: "float 3s ease-in-out infinite 0.5s",
            }}>
              &#x1F49C;
            </div>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "32px",
              height: "32px",
              background: tokens.colors.bg.elevated,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              color: tokens.colors.aurora.lavender,
              boxShadow: tokens.shadows.soft,
            }}>
              1
            </div>
          </div>
        </div>

        <p style={{ ...tokens.typography.body, marginBottom: "32px" }}>
          Ein Abo fuer euch beide
        </p>

        {/* What's Shared */}
        <div style={{
          ...tokens.cards.elevated,
          marginBottom: "16px",
          textAlign: "left",
        }}>
          <h3 style={{
            ...tokens.typography.label,
            marginBottom: "16px",
          }}>
            Was ihr teilt
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>&#10003;</span>
              <span>Euer Abo</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>&#10003;</span>
              <span>Sparks (bald verfuegbar)</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>&#10003;</span>
              <span>Quiz-Ergebnisse</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ color: tokens.colors.aurora.mint, fontWeight: "bold" }}>&#10003;</span>
              <span>Paar-Gespraech Analysen</span>
            </li>
          </ul>
        </div>

        {/* What's Private */}
        <div style={{
          ...tokens.cards.elevated,
          textAlign: "left",
        }}>
          <h3 style={{
            ...tokens.typography.label,
            marginBottom: "16px",
          }}>
            Was privat bleibt
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ fontSize: "14px" }}>&#x1F512;</span>
              <span>Alle Nachrichten mit Amiya</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ fontSize: "14px" }}>&#x1F512;</span>
              <span>Solo Sessions</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ fontSize: "14px" }}>&#x1F512;</span>
              <span>Alle Solo-Analysen</span>
            </li>
            <li style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              ...tokens.typography.body,
            }}>
              <span style={{ fontSize: "14px" }}>&#x1F512;</span>
              <span>Alles andere</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div style={{ padding: "20px 24px 40px 24px" }}>
        <button
          onClick={() => router.push("/wir/connect/code")}
          style={{
            ...tokens.buttons.primary,
            width: "100%",
            padding: "18px",
            background: tokens.gradients.primary,
            borderRadius: "14px",
            fontSize: "17px",
          }}
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
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
