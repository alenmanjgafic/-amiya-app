/**
 * CODE PAGE - app/wir/connect/code/page.js
 * Einladungscode teilen oder eingeben
 */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/AuthContext";
import { supabase } from "../../../../lib/supabase";

export default function CodePage() {
  const { user, profile, loading, fetchProfile } = useAuth();
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
      setError("Bitte gib den vollständigen Code ein");
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
        setError("Code ungültig oder abgelaufen");
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

      setSuccess("Verbunden! 🎉");
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";
  const isCodeComplete = partnerCode.every(c => c !== "");

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push("/wir/connect")} style={styles.backButton}>
          ←
        </button>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>
          Verbinde dich mit {partnerName}
        </h1>
        <p style={styles.subtitle}>
          Ein Abo, zwei Accounts.<br/>
          Füge {partnerName} hinzu oder tritt ihrem Abo bei.
        </p>

        {/* My Code Section */}
        <div style={styles.codeSection}>
          <p style={styles.codeSectionTitle}>{partnerName} einladen</p>
          
          <div style={styles.codeDisplay}>
            {loadingCode ? (
              <div style={styles.spinnerSmall} />
            ) : (
              myCode.split("").map((char, i) => (
                <div key={i} style={styles.codeChar}>{char}</div>
              ))
            )}
          </div>

          <button onClick={handleShare} style={styles.shareButton}>
            Code mit {partnerName} teilen
          </button>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>ODER</span>
        </div>

        {/* Enter Partner Code Section */}
        <div style={styles.codeSectionAlt}>
          <p style={styles.codeSectionTitle}>{partnerName}s Code eingeben</p>
          
          <div style={styles.codeInputContainer}>
            {partnerCode.map((char, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                value={char}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={styles.codeInput}
                maxLength={1}
              />
            ))}
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button 
            onClick={handlePair}
            style={{
              ...styles.pairButton,
              opacity: isCodeComplete && !pairing ? 1 : 0.5,
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

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fef3f8 0%, #fdf4ff 50%, #f5f3ff 100%)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "24px",
    height: "24px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fef3f8 0%, #fdf4ff 50%, #f5f3ff 100%)",
  },
  header: {
    padding: "16px 20px",
  },
  backButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "white",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  content: {
    padding: "0 24px 40px 24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    margin: "0 0 12px 0",
    lineHeight: "1.3",
  },
  subtitle: {
    fontSize: "15px",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: "1.5",
    margin: "0 0 32px 0",
  },
  codeSection: {
    background: "linear-gradient(135deg, #fce7f3 0%, #f5d0fe 100%)",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "center",
  },
  codeSectionAlt: {
    background: "linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "center",
  },
  codeSectionTitle: {
    fontSize: "15px",
    color: "#374151",
    margin: "0 0 20px 0",
  },
  codeDisplay: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  codeChar: {
    width: "44px",
    height: "52px",
    background: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  shareButton: {
    width: "100%",
    padding: "16px",
    background: "#1f2937",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "24px 0",
  },
  dividerText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: "1px",
  },
  codeInputContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  codeInput: {
    width: "44px",
    height: "52px",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    outline: "none",
    textTransform: "uppercase",
  },
  pairButton: {
    width: "100%",
    padding: "16px",
    background: "#e5e7eb",
    color: "#6b7280",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    marginBottom: "16px",
  },
  success: {
    color: "#0d9488", // aurora.mint
    fontSize: "14px",
    marginBottom: "16px",
  },
};
