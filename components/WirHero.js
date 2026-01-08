/**
 * WIR HERO - components/WirHero.js
 * Hero header with background image for Wir page
 * Two variants: compact (connected) and full (not connected)
 */
"use client";
import Image from "next/image";
import { useTheme } from "../lib/ThemeContext";

export default function WirHero({
  userName,
  partnerName,
  isConnected = false,
  sessionCount = 0,
  memberSince = "",
}) {
  const { tokens } = useTheme();

  // Compact version for connected users
  if (isConnected) {
    return (
      <div
        style={{
          position: "relative",
          height: "200px",
          marginBottom: "20px",
        }}
      >
        {/* Background Image */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/images/pairing-01.jpg"
            alt="Zusammen"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "20px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 4px 0",
            }}
          >
            ZUSAMMEN
          </p>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#fff",
              margin: "0 0 4px 0",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              fontFamily: tokens.fonts.display,
            }}
          >
            {userName} & {partnerName}
          </h1>
          {memberSince && (
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.aurora.mint,
                margin: 0,
                fontWeight: "500",
              }}
            >
              {memberSince}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full version for not connected users
  return (
    <div
      style={{
        position: "relative",
        height: "280px",
        marginBottom: "20px",
      }}
    >
      {/* Background Image */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Image
          src="/images/pairing-01.jpg"
          alt="Zusammen"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "24px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 8px 0",
          }}
        >
          ZUSAMMEN
        </p>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#fff",
            margin: "0 0 8px 0",
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontFamily: tokens.fonts.display,
          }}
        >
          Mehr gemeinsam erleben
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Verbinde dich mit {partnerName} und<br />
          entdeckt neue Möglichkeiten
        </p>
      </div>
    </div>
  );
}
