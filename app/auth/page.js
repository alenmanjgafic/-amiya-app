/**
 * AUTH PAGE - app/auth/page.js
 * Login & Registrierung (nur E-Mail + Passwort)
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { Heart } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { tokens, isDarkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        await signIn(email, password);
        router.push("/");
      } else {
        await signUp(email, password);
        setSuccess("Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach.");
      }
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: tokens.colors.bg.deep,
      transition: "background 0.3s ease",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: tokens.colors.bg.elevated,
        borderRadius: tokens.radii.xl,
        padding: "32px",
        boxShadow: tokens.shadows.medium,
      }}>
        {/* Logo */}
        <div style={{
          textAlign: "center",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "70px",
            height: "70px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
            borderRadius: tokens.radii.xl,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDarkMode
              ? tokens.shadows.glow(tokens.colors.aurora.lavender)
              : "0 8px 30px rgba(139,92,246,0.3)",
          }}><Heart size={35} color="white" fill="white" /></div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: tokens.colors.text.primary,
            margin: "0 0 8px 0",
            fontFamily: tokens.fonts.display,
          }}>Amiya</h1>
          <p style={{
            color: tokens.colors.text.secondary,
            margin: 0,
            fontSize: "15px",
          }}>
            {isLogin ? "Willkommen zurück" : "Erstelle dein Konto"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            <label style={{
              fontSize: "14px",
              fontWeight: "500",
              color: tokens.colors.text.primary,
            }}>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.ch"
              style={{
                padding: "14px 16px",
                borderRadius: tokens.radii.md,
                border: `2px solid ${tokens.colors.bg.soft}`,
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
                background: tokens.colors.bg.surface,
                color: tokens.colors.text.primary,
                fontFamily: tokens.fonts.body,
              }}
              required
            />
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            <label style={{
              fontSize: "14px",
              fontWeight: "500",
              color: tokens.colors.text.primary,
            }}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Dein Passwort" : "Min. 6 Zeichen"}
              style={{
                padding: "14px 16px",
                borderRadius: tokens.radii.md,
                border: `2px solid ${tokens.colors.bg.soft}`,
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
                background: tokens.colors.bg.surface,
                color: tokens.colors.text.primary,
                fontFamily: tokens.fonts.body,
              }}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p style={{
              color: tokens.colors.error,
              fontSize: "14px",
              background: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "#fef2f2",
              padding: "12px",
              borderRadius: tokens.radii.sm,
              margin: 0,
            }}>{error}</p>
          )}

          {success && (
            <p style={{
              color: tokens.colors.success,
              fontSize: "14px",
              background: isDarkMode ? "rgba(52, 211, 153, 0.1)" : "#f0fdf4",
              padding: "12px",
              borderRadius: tokens.radii.sm,
              margin: 0,
            }}>{success}</p>
          )}

          <button
            type="submit"
            style={{
              padding: "16px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
              color: "white",
              border: "none",
              borderRadius: tokens.radii.md,
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "wait" : "pointer",
              marginTop: "8px",
              fontFamily: tokens.fonts.body,
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s ease",
            }}
            disabled={loading}
          >
            {loading
              ? "Laden..."
              : isLogin
                ? "Anmelden"
                : "Registrieren"
            }
          </button>
        </form>

        {/* Switch login/register */}
        <div style={{
          marginTop: "24px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
        }}>
          <p style={{
            color: tokens.colors.text.secondary,
            margin: 0,
            fontSize: "14px",
          }}>
            {isLogin ? "Noch kein Konto?" : "Bereits ein Konto?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            style={{
              background: "none",
              border: "none",
              color: tokens.colors.aurora.lavender,
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isLogin ? "Registrieren" : "Anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}

// All styles now use theme tokens inline
