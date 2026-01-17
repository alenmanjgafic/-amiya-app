/**
 * CODE PAGE - app/wir/connect/code/page.js
 * Einladungscode teilen oder eingeben
 * Migrated to Design System tokens
 */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/AuthContext";
import { useTheme } from "../../../../lib/ThemeContext";

export default function CodePage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [myCode, setMyCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(true);
  const [codeError, setCodeError] = useState("");  // Fehler beim Code-Abruf
  const [partnerCode, setPartnerCode] = useState(["", "", "", "", "", ""]);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Generate or fetch invite code via API
  useEffect(() => {
    if (user && profile) {
      fetchOrCreateCode();
    }
  }, [user, profile]);

  const fetchOrCreateCode = async () => {
    setCodeError("");  // Reset error
    try {
      const response = await fetch(`/api/couple/pair?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.code) {
        setMyCode(data.code);
      } else {
        console.error("Failed to get code:", data.error);
        setCodeError(data.error || "Fehler beim Laden des Codes");
      }
    } catch (err) {
      console.error("Error fetching code:", err);
      setCodeError("Verbindungsfehler - bitte versuche es erneut");
    } finally {
      setLoadingCode(false);
    }
  };

  const handleShare = async () => {
    const shareText = `Verbinde dich mit mir auf Amiya! Mein Code: ${myCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Amiya Einladung",
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(myCode);
      setSuccess("Code kopiert!");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleCodeInput = (index, value) => {
    // Only allow alphanumeric
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (cleaned.length <= 1) {
      const newCode = [...partnerCode];
      newCode[index] = cleaned;
      setPartnerCode(newCode);
      setError("");

      // Auto-focus next input
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !partnerCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const chars = pasted.slice(0, 6).split("");
    const newCode = [...partnerCode];
    chars.forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setPartnerCode(newCode);

    // Focus last filled or next empty
    const lastIndex = Math.min(chars.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handlePair = async () => {
    const code = partnerCode.join("");

    if (code.length !== 6) {
      setError("Bitte gib den vollstaendigen Code ein");
      return;
    }

    if (code === myCode) {
      setError("Das ist dein eigener Code");
      return;
    }

    setPairing(true);
    setError("");

    try {
      // Sichere Verbindung über API-Route
      const response = await fetch("/api/couple/pair", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          code: code.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fehler beim Verbinden");
        setPairing(false);
        return;
      }

      // Refresh profile to get new couple_id
      await fetchProfile(user.id);

      setSuccess("Verbunden!");
      setTimeout(() => {
        router.push("/wir");
      }, 1500);

    } catch (err) {
      console.error("Pairing error:", err);
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setPairing(false);
    }
  };

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
  const isCodeComplete = partnerCode.every(c => c !== "");

  // Custom styles for code sections using token colors
  const codeSectionPink = {
    background: tokens.gradients.surface,
    borderRadius: tokens.radii.xl,
    padding: "24px",
    textAlign: "center",
  };

  const codeSectionBlue = {
    background: tokens.gradients.mintSurface,
    borderRadius: tokens.radii.xl,
    padding: "24px",
    textAlign: "center",
  };

  const codeCharStyle = {
    width: "44px",
    height: "52px",
    background: tokens.colors.bg.elevated,
    borderRadius: tokens.radii.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: tokens.colors.text.primary,
    boxShadow: tokens.shadows.soft,
  };

  const codeInputStyle = {
    width: "44px",
    height: "52px",
    background: tokens.colors.bg.elevated,
    border: `2px solid ${tokens.colors.bg.soft}`,
    borderRadius: tokens.radii.sm,
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: tokens.colors.text.primary,
    outline: "none",
    textTransform: "uppercase",
    fontFamily: tokens.fonts.body,
  };

  return (
    <div style={{ ...tokens.layout.page, padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={() => router.push("/wir/connect")}
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

      <div style={{ padding: "0 24px 40px 24px" }}>
        <h1 style={{
          ...tokens.typography.h1,
          textAlign: "center",
          marginBottom: "12px",
          lineHeight: "1.3",
        }}>
          Verbinde dich mit {partnerName}
        </h1>
        <p style={{
          ...tokens.typography.body,
          textAlign: "center",
          lineHeight: "1.5",
          marginBottom: "32px",
        }}>
          Ein Abo, zwei Accounts.<br/>
          Fuege {partnerName} hinzu oder tritt ihrem Abo bei.
        </p>

        {/* My Code Section */}
        <div style={codeSectionPink}>
          <p style={{
            ...tokens.typography.body,
            marginBottom: "20px",
          }}>
            {partnerName} einladen
          </p>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
          }}>
            {loadingCode ? (
              <div style={tokens.loaders.spinner(24)} />
            ) : codeError ? (
              <p style={{
                color: tokens.colors.aurora.rose,
                fontSize: "14px",
                textAlign: "center",
                padding: "12px",
              }}>
                {codeError}
              </p>
            ) : (
              myCode.split("").map((char, i) => (
                <div key={i} style={codeCharStyle}>{char}</div>
              ))
            )}
          </div>

          <button
            onClick={handleShare}
            disabled={!myCode || loadingCode}
            style={{
              ...tokens.buttons.secondary,
              width: "100%",
              padding: "16px",
              background: (!myCode || loadingCode) ? tokens.colors.bg.soft : tokens.colors.text.primary,
              color: (!myCode || loadingCode) ? tokens.colors.text.muted : tokens.colors.bg.deep,
              borderRadius: tokens.radii.md,
              fontSize: "16px",
              fontWeight: "600",
              opacity: (!myCode || loadingCode) ? 0.6 : 1,
              cursor: (!myCode || loadingCode) ? "not-allowed" : "pointer",
            }}
          >
            Code mit {partnerName} teilen
          </button>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "24px 0",
        }}>
          <span style={{
            ...tokens.typography.label,
            letterSpacing: "1px",
          }}>
            ODER
          </span>
        </div>

        {/* Enter Partner Code Section */}
        <div style={codeSectionBlue}>
          <p style={{
            ...tokens.typography.body,
            marginBottom: "20px",
          }}>
            {partnerName}s Code eingeben
          </p>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
          }}>
            {partnerCode.map((char, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                value={char}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={codeInputStyle}
                maxLength={1}
              />
            ))}
          </div>

          {error && (
            <p style={{ ...tokens.alerts.error, marginBottom: "16px", background: "transparent", padding: 0 }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ ...tokens.alerts.success, marginBottom: "16px", background: "transparent", padding: 0 }}>
              {success}
            </p>
          )}

          <button
            onClick={handlePair}
            style={{
              ...tokens.buttons.secondary,
              width: "100%",
              padding: "16px",
              background: tokens.colors.bg.soft,
              color: tokens.colors.text.muted,
              borderRadius: tokens.radii.md,
              fontSize: "16px",
              fontWeight: "600",
              opacity: isCodeComplete && !pairing ? 1 : 0.5,
              cursor: isCodeComplete && !pairing ? "pointer" : "default",
            }}
            disabled={!isCodeComplete || pairing}
          >
            {pairing ? "Verbinde..." : "Verbinden"}
          </button>
        </div>
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
