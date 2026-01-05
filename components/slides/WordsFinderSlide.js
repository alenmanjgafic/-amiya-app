/**
 * WORDS FINDER SLIDE - components/slides/WordsFinderSlide.js
 * Direct access to Message Coach without prior analysis
 * "Worte finden" - Deine Gedanken, klar formuliert
 */
"use client";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";

export default function WordsFinderSlide() {
  const { tokens } = useTheme();
  const router = useRouter();

  const handleStart = () => {
    router.push("/coach/message");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        width: "80px",
        height: "80px",
        background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
        borderRadius: tokens.radii.xl,
        margin: "0 auto 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: tokens.shadows.glow(tokens.colors.aurora.lavender),
      }}>
        <PenLine size={36} color="white" />
      </div>

      <h2 style={{
        ...tokens.typography.h2,
        fontSize: "24px",
        marginBottom: "8px",
      }}>
        Worte finden
      </h2>

      <p style={{
        ...tokens.typography.body,
        marginBottom: "32px",
        lineHeight: "1.6",
        maxWidth: "280px",
      }}>
        Deine Gedanken, klar formuliert.
      </p>

      {/* Start Button */}
      <button
        onClick={handleStart}
        style={{
          ...tokens.buttons.primaryLarge,
          background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
        }}
      >
        Nachricht verfassen
      </button>

      {/* Hint */}
      <p style={{
        ...tokens.typography.small,
        marginTop: "24px",
        maxWidth: "260px",
        lineHeight: "1.5",
      }}>
        Amiya hilft dir, das auszudrucken was du sagen mochtest
      </p>
    </div>
  );
}
