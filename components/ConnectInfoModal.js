/**
 * CONNECT INFO MODAL - components/ConnectInfoModal.js
 * Modal showing connect benefits before navigating to code entry
 * Content from /wir/connect as a reusable modal
 */
"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "../lib/ThemeContext";
import {
  X,
  Check,
  Lock,
  Users,
} from "lucide-react";

export default function ConnectInfoModal({ onClose, partnerName = "Partner" }) {
  const { tokens } = useTheme();
  const router = useRouter();

  const handleContinue = () => {
    onClose();
    router.push("/wir/connect/code");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          maxHeight: "90vh",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: tokens.colors.bg.surface,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <X size={18} color={tokens.colors.text.muted} />
        </button>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {/* Icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: tokens.gradients.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Users size={40} color={tokens.colors.aurora.lavender} />
          </div>

          {/* Title */}
          <h2
            style={{
              ...tokens.typography.h2,
              textAlign: "center",
              marginBottom: "8px",
              fontSize: "22px",
            }}
          >
            Teile mehr mit {partnerName}
          </h2>

          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.aurora.lavender,
              fontWeight: "500",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            Ein Abo für euch beide
          </p>

          {/* What's Shared */}
          <div
            style={{
              background: tokens.colors.bg.surface,
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: tokens.colors.aurora.mint,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}
            >
              Was ihr teilt
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Euer Abo",
                "Vereinbarungen",
                "Quiz-Ergebnisse (wenn geteilt)",
                "Paar-Gespräch Analysen",
              ].map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom:
                      index < 3
                        ? `1px solid ${tokens.colors.bg.elevated}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: `${tokens.colors.aurora.mint}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} color={tokens.colors.aurora.mint} />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* What's Private */}
          <div
            style={{
              background: tokens.colors.bg.surface,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: tokens.colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}
            >
              Was privat bleibt
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Alle Nachrichten mit Amiya",
                "Solo Sessions",
                "Solo-Analysen",
                "Dein persönlicher Kontext",
              ].map((item, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 0",
                    borderBottom:
                      index < 3
                        ? `1px solid ${tokens.colors.bg.elevated}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: `${tokens.colors.text.muted}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={10} color={tokens.colors.text.muted} />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Button */}
        <div style={{ padding: "16px 24px 24px" }}>
          <button
            onClick={handleContinue}
            style={{
              width: "100%",
              padding: "14px",
              background: tokens.gradients.primary,
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
    </div>
  );
}
