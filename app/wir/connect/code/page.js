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
import { supabase } from "../../../../lib/supabase";

export default function CodePage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();

  const [myCode, setMyCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(true);
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

  // Generate or fetch invite code
  useEffect(() => {
    if (user && profile) {
      fetchOrCreateCode();
    }
  }, [user, profile]);

  const fetchOrCreateCode = async () => {
    try {
      // Check for existing code
      const { data: existingCode } = await supabase
        .from("invite_codes")
        .select("code")
        .eq("user_id", user.id)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (existingCode) {
        setMyCode(existingCode.code);
      } else {
        // Generate new code
        const newCode = generateCode();
        const { error } = await supabase
          .from("invite_codes")
          .insert({
            code: newCode,
            user_id: user.id,
          });

        if (!error) {
          setMyCode(newCode);
        }
      }
    } catch (err) {
      // Generate new code if none exists
      const newCode = generateCode();
      await supabase.from("invite_codes").insert({
        code: newCode,
        user_id: user.id,
      });
      setMyCode(newCode);
    } finally {
      setLoadingCode(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
      // Find the invite code
      const { data: inviteCode, error: findError } = await supabase
        .from("invite_codes")
        .select("*, user_id")
        .eq("code", code)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (findError || !inviteCode) {
        setError("Code ungueltig oder abgelaufen");
        setPairing(false);
        return;
      }

      // Create couple with both user IDs
      const { data: couple, error: coupleError } = await supabase
        .from("couples")
        .insert({
          user_a_id: inviteCode.user_id,  // The inviter
          user_b_id: user.id,              // The invited
          owner_id: inviteCode.user_id,    // Inviter owns subscription
        })
        .select()
        .single();

      if (coupleError) {
        console.error("Couple creation error:", coupleError);
        setError("Fehler beim Verbinden");
        setPairing(false);
        return;
      }

      // Update both profiles with couple_id and partner_id
      const { error: updateAError } = await supabase
        .from("profiles")
        .update({
          couple_id: couple.id,
          partner_id: user.id
        })
        .eq("id", inviteCode.user_id);

      if (updateAError) {
        console.error("Profile A update error:", updateAError);
      }

      const { error: updateBError } = await supabase
        .from("profiles")
        .update({
          couple_id: couple.id,
          partner_id: inviteCode.user_id
        })
        .eq("id", user.id);

      if (updateBError) {
        console.error("Profile B update error:", updateBError);
      }

      // Mark code as used
      await supabase
        .from("invite_codes")
        .update({
          used_by: user.id,
          used_at: new Date().toISOString()
        })
        .eq("id", inviteCode.id);

      // Refresh profile
      await fetchProfile(user.id);

      setSuccess("Verbunden!");
      setTimeout(() => {
        router.push("/wir");
      }, 1500);

    } catch (err) {
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
            ) : (
              myCode.split("").map((char, i) => (
                <div key={i} style={codeCharStyle}>{char}</div>
              ))
            )}
          </div>

          <button
            onClick={handleShare}
            style={{
              ...tokens.buttons.secondary,
              width: "100%",
              padding: "16px",
              background: tokens.colors.text.primary,
              color: tokens.colors.bg.deep,
              borderRadius: tokens.radii.md,
              fontSize: "16px",
              fontWeight: "600",
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
