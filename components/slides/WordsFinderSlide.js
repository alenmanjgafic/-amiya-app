/**
 * WORDS FINDER SLIDE - components/slides/WordsFinderSlide.js
 * Direct access to Message Coach without prior analysis
 * "Worte finden" - Deine Gedanken, klar formuliert
 */
"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "../../lib/ThemeContext";
import { MessageWriterIllustration } from "../AmiyaIllustrations";

export default function WordsFinderSlide() {
  const { tokens, isDarkMode } = useTheme();
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
      {/* Illustration */}
      <div style={{
        width: "200px",
        height: "120px",
        marginBottom: "16px",
      }}>
        <MessageWriterIllustration isDarkMode={isDarkMode} />
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
          background: tokens.gradients.primary,
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
