/**
 * MESSAGE ANALYZER PAGE - app/analyze/message/page.js
 * Upload screenshots or paste text to analyze communication
 * Uses Design System tokens from ThemeContext
 */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import {
  ArrowLeft,
  Upload,
  Type,
  Camera,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Home,
  Heart,
  ClipboardList,
  User,
  PenLine,
  Mic,
  ChevronRight
} from "lucide-react";

export default function MessageAnalyzerPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState("text"); // 'text' | 'screenshot'
  const [textContent, setTextContent] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const [showContext, setShowContext] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Bitte nur Bilder hochladen (PNG, JPEG, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Bild zu gross. Maximal 5MB erlaubt.");
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setImageBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (inputMode === "text" && textContent.length < 20) {
      setError("Bitte mehr Text eingeben (mindestens 20 Zeichen)");
      return;
    }

    if (inputMode === "screenshot" && !imageBase64) {
      setError("Bitte ein Screenshot hochladen");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/message-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          coupleId: profile?.couple_id || null,
          inputType: inputMode,
          content: inputMode === "screenshot" ? imageBase64 : textContent,
          additionalContext: additionalContext || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Analyse fehlgeschlagen");
        setIsAnalyzing(false);
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setResult(null);
    setTextContent("");
    setImagePreview(null);
    setImageBase64(null);
    setAdditionalContext("");
    setError(null);
  };

  if (authLoading) {
    return (
      <div style={{ ...tokens.layout.pageCentered, flexDirection: "column", gap: "16px" }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RESULT VIEW
  // ════════════════════════════════════════════════════════════
  if (result) {
    // Defensive: ensure analysis object exists
    const analysis = result.analysis || {};
    const analysisText = analysis.text || "Analyse nicht verfügbar.";
    const analysisThemes = analysis.themes || [];
    const analysisPatterns = analysis.patterns || null;

    return (
      <div style={{ ...tokens.layout.page, padding: 0, paddingBottom: "100px" }}>
        {/* Header */}
        <div style={tokens.layout.header}>
          <button onClick={resetAnalyzer} style={tokens.buttons.ghost}>
            <ArrowLeft size={20} />
            <span style={{ marginLeft: "8px" }}>Neue Analyse</span>
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>
          {/* Success Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: tokens.gradients.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h1 style={{ ...tokens.typography.h2, margin: 0 }}>Deine Analyse</h1>
              <p style={{ ...tokens.typography.small, margin: 0 }}>
                Basierend auf Gottman-Methode & NVC
              </p>
            </div>
          </div>

          {/* Analysis Text */}
          <div style={{ ...tokens.cards.elevated, marginBottom: "20px" }}>
            <AnalysisRenderer text={analysisText} tokens={tokens} />
          </div>

          {/* Themes */}
          {analysisThemes.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ ...tokens.typography.label, marginBottom: "8px" }}>THEMEN</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {analysisThemes.map((theme, i) => (
                  <span key={i} style={tokens.badges.muted}>
                    {getThemeLabel(theme)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Patterns */}
          {analysisPatterns && (
            <PatternsView patterns={analysisPatterns} tokens={tokens} />
          )}

          {/* Rewrite Suggestions */}
          {result.rewrites?.length > 0 && (
            <RewritesView rewrites={result.rewrites} tokens={tokens} />
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ACTION SECTION - What do you want to do now? */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: `1px solid ${tokens.colors.bg.soft}`
          }}>
            <p style={{
              ...tokens.typography.label,
              marginBottom: "16px",
              textAlign: "center"
            }}>
              WAS MÖCHTEST DU JETZT TUN?
            </p>

            {/* Primary Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Compose Response Button */}
              <button
                onClick={() => router.push(`/coach/message?sessionId=${result.sessionId}`)}
                style={{
                  ...tokens.cards.interactive,
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  border: `2px solid ${tokens.colors.aurora.lavender}20`,
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <PenLine size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...tokens.typography.h3,
                    fontSize: "16px",
                    margin: 0,
                    marginBottom: "4px"
                  }}>
                    Antwort verfassen
                  </p>
                  <p style={{
                    ...tokens.typography.small,
                    margin: 0
                  }}>
                    Amiya hilft dir die richtigen Worte zu finden
                  </p>
                </div>
                <ChevronRight size={20} color={tokens.colors.text.muted} />
              </button>

              {/* Voice Session Button */}
              <button
                onClick={() => router.push(`/?fromAnalysis=${result.sessionId}`)}
                style={{
                  ...tokens.cards.interactive,
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  border: `2px solid ${tokens.colors.aurora.mint}20`,
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: tokens.gradients.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Mic size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...tokens.typography.h3,
                    fontSize: "16px",
                    margin: 0,
                    marginBottom: "4px"
                  }}>
                    Darüber sprechen
                  </p>
                  <p style={{
                    ...tokens.typography.small,
                    margin: 0
                  }}>
                    Voice-Session zu diesem Thema starten
                  </p>
                </div>
                <ChevronRight size={20} color={tokens.colors.text.muted} />
              </button>
            </div>

            {/* Secondary Actions */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px"
            }}>
              <button
                onClick={resetAnalyzer}
                style={{ ...tokens.buttons.secondary, flex: 1 }}
              >
                <RefreshCw size={16} style={{ marginRight: "6px" }} />
                Neue Analyse
              </button>
              <button
                onClick={() => router.push("/history")}
                style={{ ...tokens.buttons.ghost, flex: 1 }}
              >
                Verlauf
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav tokens={tokens} router={router} active="analyze" />

        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // INPUT VIEW
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{ ...tokens.layout.page, padding: 0, paddingBottom: "100px" }}>
      {/* Header */}
      <div style={tokens.layout.header}>
        <button onClick={() => router.back()} style={tokens.buttons.ghost}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ ...tokens.typography.h3, margin: 0 }}>Nachrichtenanalyse</h1>
        <div style={{ width: "40px" }} />
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Intro */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: tokens.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <MessageSquare size={32} color="white" />
          </div>
          <p style={{ ...tokens.typography.body, lineHeight: "1.6" }}>
            Lade einen Screenshot hoch oder kopiere Text aus eurem Chat.
            Amiya analysiert die Kommunikation und gibt Tipps.
          </p>
        </div>

        {/* Input Mode Tabs */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px"
        }}>
          <button
            onClick={() => setInputMode("text")}
            style={{
              ...tokens.buttons.tab(inputMode === "text"),
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <Type size={18} />
            Text
          </button>
          <button
            onClick={() => setInputMode("screenshot")}
            style={{
              ...tokens.buttons.tab(inputMode === "screenshot"),
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <Camera size={18} />
            Screenshot
          </button>
        </div>

        {/* Text Input */}
        {inputMode === "text" && (
          <div style={{ marginBottom: "20px" }}>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={`Kopiere hier euren Chat-Verlauf ein...\n\nBeispiel:\n${profile?.name || "Ich"}: Hast du die Milch gekauft?\n${profile?.partner_name || "Partner"}: Nein, hab ich vergessen.\n${profile?.name || "Ich"}: Das ist jetzt schon das dritte Mal!`}
              style={{
                ...tokens.inputs.textarea,
                minHeight: "200px",
                fontFamily: "inherit"
              }}
            />
            <p style={{ ...tokens.typography.small, marginTop: "8px" }}>
              {textContent.length} Zeichen
            </p>
          </div>
        )}

        {/* Screenshot Upload */}
        {inputMode === "screenshot" && (
          <div style={{ marginBottom: "20px" }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {!imagePreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "40px 20px",
                  border: `2px dashed ${tokens.colors.bg.soft}`,
                  borderRadius: tokens.radii.lg,
                  background: tokens.colors.bg.surface,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <Upload size={32} color={tokens.colors.text.muted} />
                <span style={tokens.typography.body}>
                  Screenshot hochladen
                </span>
                <span style={tokens.typography.small}>
                  PNG, JPEG, WebP (max 5MB)
                </span>
              </button>
            ) : (
              <div style={{ position: "relative" }}>
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  style={{
                    width: "100%",
                    borderRadius: tokens.radii.lg,
                    border: `1px solid ${tokens.colors.bg.soft}`
                  }}
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  style={{
                    ...tokens.buttons.icon,
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: tokens.colors.bg.elevated,
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px"
                  }}
                >
                  X
                </button>
              </div>
            )}
          </div>
        )}

        {/* Additional Context (collapsible) */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setShowContext(!showContext)}
            style={{
              ...tokens.buttons.ghostAccent,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>Kontext hinzufugen (optional)</span>
            {showContext ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showContext && (
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="z.B. 'Nach unserem Streit uber die Finanzen...' oder 'Das war heute Morgen bevor er zur Arbeit ging...'"
              style={{
                ...tokens.inputs.textarea,
                marginTop: "12px",
                minHeight: "80px"
              }}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            ...tokens.alerts.error,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (inputMode === "text" && textContent.length < 20) || (inputMode === "screenshot" && !imageBase64)}
          style={{
            ...tokens.buttons.primaryLarge,
            width: "100%",
            opacity: isAnalyzing || (inputMode === "text" && textContent.length < 20) || (inputMode === "screenshot" && !imageBase64) ? 0.5 : 1
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={20} style={{ marginRight: "8px", animation: "spin 1s linear infinite" }} />
              Analysiere...
            </>
          ) : (
            <>
              <Sparkles size={20} style={{ marginRight: "8px" }} />
              Analysieren
            </>
          )}
        </button>

        {/* Privacy Note */}
        <p style={{
          ...tokens.typography.small,
          textAlign: "center",
          marginTop: "16px"
        }}>
          Screenshots werden nicht gespeichert - nur die Analyse.
        </p>
      </div>

      {/* Bottom Navigation */}
      <BottomNav tokens={tokens} router={router} active="analyze" />

      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ════════════════════════════════════════════════════════════

function AnalysisRenderer({ text, tokens }) {
  // Defensive null check to prevent crashes
  if (!text || typeof text !== 'string') {
    return (
      <p style={tokens.typography.body}>
        Analyse wird geladen...
      </p>
    );
  }

  const lines = text.split("\n");

  return (
    <div>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // H2 Headers
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <h2 key={i} style={{
              ...tokens.typography.h3,
              color: tokens.colors.aurora.lavender,
              marginTop: i > 0 ? "20px" : 0,
              marginBottom: "12px"
            }}>
              {trimmed.replace(/\*\*/g, "")}
            </h2>
          );
        }

        // H3 Headers
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} style={{
              fontSize: "15px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
              marginTop: "16px",
              marginBottom: "8px"
            }}>
              {trimmed.replace("### ", "")}
            </h3>
          );
        }

        // List items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} style={{
              display: "flex",
              gap: "8px",
              marginBottom: "6px",
              paddingLeft: "4px"
            }}>
              <span style={{ color: tokens.colors.aurora.mint }}>-</span>
              <span style={tokens.typography.body}>
                {trimmed.substring(2)}
              </span>
            </div>
          );
        }

        // Numbered items
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} style={{
              display: "flex",
              gap: "8px",
              marginBottom: "6px",
              paddingLeft: "4px"
            }}>
              <span style={{ color: tokens.colors.aurora.lavender, fontWeight: "600" }}>
                {trimmed.match(/^\d+/)[0]}.
              </span>
              <span style={tokens.typography.body}>
                {trimmed.replace(/^\d+\.\s*/, "")}
              </span>
            </div>
          );
        }

        // Empty lines
        if (!trimmed) {
          return <div key={i} style={{ height: "12px" }} />;
        }

        // Regular paragraphs
        return (
          <p key={i} style={{ ...tokens.typography.body, marginBottom: "8px" }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function PatternsView({ patterns, tokens }) {
  const hasHorsemen = patterns.horsemen?.length > 0;
  const hasRepairs = patterns.repairs?.length > 0;

  if (!hasHorsemen && !hasRepairs) return null;

  const horsemenLabels = {
    criticism: "Kritik",
    contempt: "Verachtung",
    defensiveness: "Defensivitat",
    stonewalling: "Mauern"
  };

  const repairLabels = {
    humor: "Humor",
    affection: "Zuneigung",
    responsibility: "Verantwortung",
    we_language: "Wir-Sprache"
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ ...tokens.typography.label, marginBottom: "12px" }}>ERKANNTE MUSTER</p>

      {hasHorsemen && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ ...tokens.typography.small, marginBottom: "8px", fontWeight: "600" }}>
            Herausforderungen (Gottman):
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {patterns.horsemen.map((h, i) => (
              <span key={i} style={tokens.badges.warning}>
                {horsemenLabels[h] || h}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasRepairs && (
        <div>
          <p style={{ ...tokens.typography.small, marginBottom: "8px", fontWeight: "600" }}>
            Starken (Reparaturversuche):
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {patterns.repairs.map((r, i) => (
              <span key={i} style={tokens.badges.success}>
                {repairLabels[r] || r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RewritesView({ rewrites, tokens }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ ...tokens.typography.label, marginBottom: "12px" }}>
        BESSER FORMULIEREN
      </p>

      {rewrites.map((rewrite, i) => (
        <div
          key={i}
          style={{
            ...tokens.cards.surface,
            marginBottom: "12px",
            cursor: "pointer"
          }}
          onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{
                ...tokens.typography.small,
                fontWeight: "600",
                marginBottom: "4px",
                color: tokens.colors.text.muted
              }}>
                {rewrite.sender === "user" ? "Deine Nachricht" : "Partner-Nachricht"}
              </p>
              <p style={{
                ...tokens.typography.body,
                color: tokens.colors.text.secondary,
                fontStyle: "italic"
              }}>
                "{rewrite.original}"
              </p>
            </div>
            {expandedIndex === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedIndex === i && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${tokens.colors.bg.soft}` }}>
              <p style={{
                ...tokens.typography.small,
                fontWeight: "600",
                marginBottom: "4px",
                color: tokens.colors.aurora.mint
              }}>
                Vorschlag:
              </p>
              <p style={{
                ...tokens.typography.body,
                color: tokens.colors.text.primary,
                marginBottom: "12px"
              }}>
                "{rewrite.rewrite}"
              </p>

              {rewrite.nvc_format && (
                <>
                  <p style={{
                    ...tokens.typography.small,
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: tokens.colors.aurora.lavender
                  }}>
                    NVC-Format:
                  </p>
                  <p style={{
                    ...tokens.typography.body,
                    color: tokens.colors.text.secondary,
                    fontStyle: "italic",
                    marginBottom: "12px"
                  }}>
                    "{rewrite.nvc_format}"
                  </p>
                </>
              )}

              <p style={{
                ...tokens.typography.small,
                color: tokens.colors.text.muted
              }}>
                {rewrite.rationale}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BottomNav({ tokens, router, active }) {
  return (
    <div style={tokens.layout.navBar}>
      <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
        <Home size={24} />
        <span>Home</span>
      </button>
      <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
        <Heart size={24} />
        <span>Wir</span>
      </button>
      <button onClick={() => router.push("/history")} style={tokens.buttons.nav(false)}>
        <ClipboardList size={24} />
        <span>Verlauf</span>
      </button>
      <button onClick={() => router.push("/profile")} style={tokens.buttons.nav(false)}>
        <User size={24} />
        <span>Profil</span>
      </button>
    </div>
  );
}

function getThemeLabel(theme) {
  const labels = {
    kommunikation: "Kommunikation",
    kinder: "Kinder",
    finanzen: "Finanzen",
    arbeit: "Arbeit",
    intimität: "Intimitat",
    alltag: "Alltag",
    zeit: "Zeit",
    vertrauen: "Vertrauen",
    zukunft: "Zukunft",
    anerkennung: "Anerkennung"
  };
  return labels[theme] || theme;
}
