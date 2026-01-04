/**
 * AUTH PAGE - app/auth/page.js
 * Login & Registrierung (nur E-Mail + Passwort)
 *
 * MIGRATED TO DESIGN SYSTEM - Uses tokens.buttons, tokens.inputs, etc.
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
  const { tokens } = useTheme();

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
    <div style={tokens.layout.pageCentered}>
      <div style={{
        ...tokens.cards.elevatedLarge,
        width: "100%",
        maxWidth: "400px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "70px",
            height: "70px",
            background: tokens.gradients.primary,
            borderRadius: tokens.radii.xl,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: tokens.shadows.button,
          }}>
            <Heart size={35} color="white" fill="white" />
          </div>
          <h1 style={tokens.typography.h1}>Amiya</h1>
          <p style={tokens.typography.body}>
            {isLogin ? "Willkommen zurück" : "Erstelle dein Konto"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}>
          {/* Email Field */}
          <div>
            <label style={tokens.inputs.label}>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.ch"
              style={tokens.inputs.text}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={tokens.inputs.label}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Dein Passwort" : "Min. 6 Zeichen"}
              style={tokens.inputs.text}
              required
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {error && <p style={tokens.alerts.error}>{error}</p>}

          {/* Success Message */}
          {success && <p style={tokens.alerts.success}>{success}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...tokens.buttons.primary,
              width: "100%",
              marginTop: "8px",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
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
          <p style={tokens.typography.body}>
            {isLogin ? "Noch kein Konto?" : "Bereits ein Konto?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            style={tokens.buttons.ghostAccent}
          >
            {isLogin ? "Registrieren" : "Anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}
