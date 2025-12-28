/**
 * AUTH PAGE - app/auth/page.js
 * Login & Registrierung mit Name + Partner-Name
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        // Validation for registration
        if (!name.trim()) {
          throw new Error("Bitte gib deinen Namen ein");
        }
        if (!partnerName.trim()) {
          throw new Error("Bitte gib den Namen deines Partners / deiner Partnerin ein");
        }
        await signUp(email, password, name.trim(), partnerName.trim());
      }
      router.push("/");
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Amiya</h1>
          <p style={styles.subtitle}>
            {isLogin ? "Willkommen zurück" : "Erstelle dein Konto"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Dein Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wie heisst du?"
                  style={styles.input}
                  required={!isLogin}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Name deines Partners / deiner Partnerin</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Wie heisst dein/e Partner/in?"
                  style={styles.input}
                  required={!isLogin}
                />
                <p style={styles.hint}>Für personalisierte Gespräche</p>
              </div>

              <div style={styles.divider} />
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.ch"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Dein Passwort" : "Min. 6 Zeichen"}
              style={styles.input}
              required
              minLength={6}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={loading}
          >
            {loading 
              ? "Laden..." 
              : isLogin 
                ? "Anmelden" 
                : "Konto erstellen"
            }
          </button>
        </form>

        {/* Switch login/register */}
        <div style={styles.switchContainer}>
          <p style={styles.switchText}>
            {isLogin ? "Noch kein Konto?" : "Bereits ein Konto?"}
          </p>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            style={styles.switchButton}
          >
            {isLogin ? "Registrieren" : "Anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.1)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    width: "70px",
    height: "70px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "20px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    boxShadow: "0 8px 30px rgba(139,92,246,0.3)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#6b7280",
    margin: 0,
    fontSize: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "4px 0",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    margin: 0,
  },
  submitButton: {
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  switchContainer: {
    marginTop: "24px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  switchText: {
    color: "#6b7280",
    margin: 0,
    fontSize: "14px",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#8b5cf6",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
};
