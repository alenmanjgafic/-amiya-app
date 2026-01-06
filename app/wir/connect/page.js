/**
 * CONNECT INFO PAGE - app/wir/connect/page.js
 * Info-Seite was geteilt wird und was privat bleibt
 * Updated with Lucide icons and Aurora design
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import {
  ChevronLeft,
  Heart,
  Check,
  Lock,
  Users,
  MessageCircle,
  BarChart3,
  Sparkles
} from "lucide-react";

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
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.colors.bg.deep,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={() => router.push("/wir")}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: tokens.colors.bg.elevated,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={24} color={tokens.colors.text.primary} />
        </button>
      </div>

      <div style={{ flex: 1, padding: "0 24px", textAlign: "center" }}>
        {/* Icon */}
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}20 0%, ${tokens.colors.aurora.rose}20 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Users size={48} color={tokens.colors.aurora.lavender} />
        </div>

        {/* Title */}
        <h1 style={{
          ...tokens.typography.h1,
          marginBottom: "8px",
          fontSize: "24px",
        }}>
          Teile mehr mit {partnerName}
        </h1>

        <p style={{
          ...tokens.typography.body,
          color: tokens.colors.aurora.lavender,
          fontWeight: "500",
          marginBottom: "32px",
        }}>
          Ein Abo für euch beide
        </p>

        {/* What's Shared */}
        <div style={{
          background: tokens.colors.bg.surface,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          textAlign: "left",
        }}>
          <h3 style={{
            fontSize: "12px",
            fontWeight: "700",
            color: tokens.colors.aurora.mint,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}>
            Was ihr teilt
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "Euer Abo",
              "Vereinbarungen",
              "Quiz-Ergebnisse (wenn geteilt)",
              "Paar-Gespräch Analysen",
            ].map((item, index) => (
              <li key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom: index < 3 ? `1px solid ${tokens.colors.bg.elevated}` : "none",
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: `${tokens.colors.aurora.mint}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Check size={14} color={tokens.colors.aurora.mint} />
                </div>
                <span style={{
                  fontSize: "15px",
                  color: tokens.colors.text.primary,
                }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What's Private */}
        <div style={{
          background: tokens.colors.bg.surface,
          borderRadius: "16px",
          padding: "20px",
          textAlign: "left",
        }}>
          <h3 style={{
            fontSize: "12px",
            fontWeight: "700",
            color: tokens.colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}>
            Was privat bleibt
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "Alle Nachrichten mit Amiya",
              "Solo Sessions",
              "Solo-Analysen",
              "Dein persönlicher Kontext",
            ].map((item, index) => (
              <li key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom: index < 3 ? `1px solid ${tokens.colors.bg.elevated}` : "none",
              }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: `${tokens.colors.text.muted}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Lock size={12} color={tokens.colors.text.muted} />
                </div>
                <span style={{
                  fontSize: "15px",
                  color: tokens.colors.text.secondary,
                }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div style={{ padding: "20px 24px 40px 24px" }}>
        <button
          onClick={() => router.push("/wir/connect/code")}
          style={{
            width: "100%",
            padding: "16px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
