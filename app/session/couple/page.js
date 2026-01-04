/**
 * COUPLE SESSION PAGE - app/session/couple/page.js
 * Gemeinsame Session für beide Partner
 * UPDATED: Kontext-Limit auf 4000 Zeichen erhöht für Agreements
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { sessionsService } from "../../../lib/sessions";
import { MessageCircle, BarChart2 } from "lucide-react";

const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";

const STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

export default function CoupleSessionPage() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showTooShortModal, setShowTooShortModal] = useState(false);

  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);

  const MAX_SESSION_TIME = 60 * 60; // 1 hour

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && profile && !profile.couple_id) {
      router.push("/wir");
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (isStarted && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setSessionTime(t => {
          if (t >= MAX_SESSION_TIME - 1) {
            handleEndClick();
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const userName = profile?.name || "du";
  const partnerName = profile?.partner_name || "Partner";

  const startSession = useCallback(async () => {
    if (!user || !profile) return;
    
    setIsStarted(true);
    setVoiceState(STATE.CONNECTING);
    messagesRef.current = [];
    setMessageCount(0);
    setAnalysisError(null);

    try {
      let userContext = "";
      try {
        const contextResponse = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id,
            coupleId: profile.couple_id,
            sessionType: "couple"
          }),
        });
        
        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          userContext = contextData.context || "";
          console.log("Couple memory loaded:", contextData.hasMemory ? "with context" : "no consent");
        }
      } catch (contextError) {
        console.error("Failed to load memory:", contextError);
      }

      const session = await sessionsService.create(user.id, "couple", profile.couple_id);
      setCurrentSessionId(session.id);

      const { Conversation } = await import("@elevenlabs/client");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("Couple context length:", userContext.length);

      // UPDATED: Kontext-Limit auf 4000 Zeichen erhöht für Agreements
      let sanitizedContext = userContext
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 4000);
      
      if (userContext.length > 4000) {
        sanitizedContext += "...";
      }

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: userName,
          partner_name: partnerName,
          user_context: sanitizedContext || "Erste gemeinsame Session.",
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs (Couple Session)");
          setVoiceState(STATE.LISTENING);
        },
        onDisconnect: () => {
          console.log("Disconnected from ElevenLabs");
          setVoiceState(STATE.IDLE);
        },
        onMessage: (message) => {
          if (message.source && message.message) {
            const role = message.source === "user" ? "user" : "assistant";
            const content = message.message;
            
            const lastMsg = messagesRef.current[messagesRef.current.length - 1];
            if (!(lastMsg && lastMsg.role === role && lastMsg.content === content)) {
              messagesRef.current.push({ role, content });
              setMessageCount(messagesRef.current.length);
            }
          }
        },
        onModeChange: (mode) => {
          const modeValue = mode.mode || mode;
          if (modeValue === "listening") {
            setVoiceState(STATE.LISTENING);
          } else if (modeValue === "thinking") {
            setVoiceState(STATE.THINKING);
          } else if (modeValue === "speaking") {
            setVoiceState(STATE.SPEAKING);
          }
        },
        onError: (error) => {
          console.error("ElevenLabs error:", error);
          setVoiceState(STATE.IDLE);
        }
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error("Failed to start couple session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setIsStarted(false);
      setVoiceState(STATE.IDLE);
      router.push("/wir");
    }
  }, [user, profile, userName, partnerName, router]);

  useEffect(() => {
    if (!authLoading && user && profile && profile.couple_id && !isStarted) {
      startSession();
    }
  }, [authLoading, user, profile, isStarted, startSession]);

  const handleEndClick = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.log("Session already ended");
      }
      conversationRef.current = null;
    }
    setVoiceState(STATE.IDLE);

    // Check if auto_analyze is enabled
    if (profile?.auto_analyze !== false) {
      // Auto-analyze: skip dialog and directly analyze
      // We need to call endSession after this function returns
      setTimeout(() => {
        // Trigger analysis directly
        const endSessionFn = async () => {
          const sessionIdToAnalyze = currentSessionId;
          const currentMessages = messagesRef.current;
          const hasMessages = currentMessages.length > 0;

          if (!hasMessages) {
            setShowTooShortModal(true);
            return;
          }

          // Save session first
          let summary = "";
          summary += `[Couple Session: ${profile?.name || "User"} & ${profile?.partner_name || "Partner"}]\n\n`;
          summary += currentMessages
            .map(m => `${m.role === "user" ? "Paar" : "Amiya"}: ${m.content}`)
            .join("\n");

          try {
            await sessionsService.end(sessionIdToAnalyze, summary, []);

            setIsGeneratingAnalysis(true);

            // Check viability
            const transcript = currentMessages
              .map(m => `${m.role === "user" ? "Paar" : "Amiya"}: ${m.content}`)
              .join("\n");

            const response = await fetch("/api/check-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript }),
            });

            const viability = response.ok ? await response.json() : { viable: true };

            if (!viability.viable) {
              try {
                await sessionsService.delete(sessionIdToAnalyze);
              } catch (e) {
                console.error("Failed to delete session:", e);
              }
              setIsGeneratingAnalysis(false);
              setShowTooShortModal(true);
              return;
            }

            // Generate analysis
            await sessionsService.requestAnalysis(sessionIdToAnalyze);
            setIsGeneratingAnalysis(false);
            router.push(`/history?session=${sessionIdToAnalyze}`);
          } catch (error) {
            console.error("Auto-analysis failed:", error);
            setIsGeneratingAnalysis(false);
            router.push("/wir");
          }
        };
        endSessionFn();
      }, 100);
    } else {
      // Manual mode: show dialog
      setShowEndDialog(true);
    }
  }, [profile, currentSessionId, router]);

  const checkAnalysisViability = useCallback(async () => {
    const messages = messagesRef.current;
    if (messages.length === 0) return { viable: false, reason: "empty" };
    
    const transcript = messages
      .map(m => `${m.role === "user" ? "Paar" : "Amiya"}: ${m.content}`)
      .join("\n");
    
    try {
      const response = await fetch("/api/check-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      
      if (!response.ok) {
        return { viable: true, reason: null };
      }
      
      const data = await response.json();
      return { viable: data.viable, reason: data.reason };
    } catch (error) {
      console.error("Analysis viability check failed:", error);
      return { viable: true, reason: null };
    }
  }, []);

  const resetSession = useCallback(() => {
    setIsStarted(false);
    setVoiceState(STATE.IDLE);
    messagesRef.current = [];
    setMessageCount(0);
    setSessionTime(0);
    setCurrentSessionId(null);
    setIsGeneratingAnalysis(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endSession = useCallback(async (requestAnalysis = false) => {
    const sessionIdToAnalyze = currentSessionId;
    const currentMessages = messagesRef.current;
    const hasMessages = currentMessages.length > 0;
    
    setAnalysisError(null);
    
    if (currentSessionId && hasMessages) {
      try {
        let summary = "";
        summary += `[Couple Session: ${userName} & ${partnerName}]\n\n`;
        summary += currentMessages
          .map(m => `${m.role === "user" ? "Paar" : "Amiya"}: ${m.content}`)
          .join("\n");
        
        await sessionsService.end(currentSessionId, summary, []);
        
        if (requestAnalysis) {
          setIsGeneratingAnalysis(true);
          setShowEndDialog(false);

          const viability = await checkAnalysisViability();
          
          if (!viability.viable) {
            // Session löschen wenn nicht genug Inhalt
            try {
              await sessionsService.delete(sessionIdToAnalyze);
              console.log("Couple session deleted - not enough content");
            } catch (deleteError) {
              console.error("Failed to delete couple session:", deleteError);
            }

            setIsGeneratingAnalysis(false);
            // Show friendly "too short" modal
            setShowTooShortModal(true);
            return;
          }
          
          try {
            const analysisResult = await sessionsService.requestAnalysis(currentSessionId);
            
            try {
              await fetch("/api/memory/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user.id,
                  coupleId: profile.couple_id,
                  sessionId: currentSessionId,
                  sessionType: "couple",
                  analysis: analysisResult?.analysis || summary
                }),
              });
              console.log("Memory updated after couple session");
            } catch (memoryError) {
              console.error("Memory update failed:", memoryError);
            }
            
            setIsGeneratingAnalysis(false);
            router.push(`/history?session=${sessionIdToAnalyze}`);
          } catch (analysisErr) {
            console.error("Analysis failed:", analysisErr);
            setIsGeneratingAnalysis(false);
            setAnalysisError("Analyse konnte nicht erstellt werden. Bitte versuche es später erneut.");
            setTimeout(() => {
              router.push("/wir");
            }, 3000);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    } else if (requestAnalysis && !hasMessages) {
      setAnalysisError("Keine Analyse möglich – es wurden keine Gespräche aufgezeichnet.");
      setShowEndDialog(false);
      setTimeout(() => {
        router.push("/wir");
      }, 3000);
      return;
    }

    if (!requestAnalysis) {
      setShowEndDialog(false);
      resetSession();
      router.push("/wir");
    }
  }, [currentSessionId, userName, partnerName, router, checkAnalysisViability, resetSession, user, profile]);

  /**
   * User wählt "Mit Analyse" im Dialog
   * → Consent dauerhaft aktivieren + Session analysieren
   */
  const handleDialogAnalyze = async () => {
    setShowEndDialog(false);

    // Consent dauerhaft aktivieren
    try {
      await updateProfile({
        memory_consent: true,
        memory_consent_at: new Date().toISOString(),
        auto_analyze: true,
      });
      console.log("Consent permanently enabled via dialog (couple)");
    } catch (err) {
      console.error("Failed to update consent:", err);
    }

    // Session analysieren
    endSession(true);
  };

  /**
   * User wählt "Ohne Analyse" im Dialog
   * → Session beenden ohne Analyse
   */
  const handleDialogSkip = async () => {
    setShowEndDialog(false);
    await endSession(false);
  };

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const timeWarning = sessionTime >= 50 * 60 && sessionTime < 50 * 60 + 5;

  if (authLoading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  if (isGeneratingAnalysis) {
    return (
      <div style={styles.sessionContainer}>
        <div style={styles.analysisLoadingContainer}>
          <div style={styles.analysisSpinner} />
          <h2 style={styles.analysisLoadingTitle}>Analyse wird erstellt...</h2>
          <p style={styles.analysisLoadingText}>
            Amiya wertet euer gemeinsames Gespräch aus.<br/>
            Das dauert einen Moment.
          </p>
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

  if (analysisError) {
    return (
      <div style={styles.sessionContainer}>
        <div style={styles.analysisLoadingContainer}>
          <div style={styles.errorIconLarge}>⚠️</div>
          <h2 style={styles.analysisLoadingTitle}>Hinweis</h2>
          <p style={styles.analysisLoadingText}>{analysisError}</p>
          <p style={styles.redirectText}>Weiterleitung...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sessionContainer}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.headerIcon, background: getStateColor(voiceState, isDarkMode)}}>
            {getStateEmoji(voiceState)}
          </div>
          <div>
            <div style={styles.headerTitle}>Couple Session</div>
            <div style={styles.headerSubtitle}>
              {formatTime(sessionTime)} / 60:00
              {timeWarning && <span style={styles.timeWarning}> ⚠️ 10 Min übrig</span>}
            </div>
          </div>
        </div>
        <button onClick={handleEndClick} style={styles.endButton}>Beenden</button>
      </div>

      <div style={styles.coupleIndicator}>
        <span style={styles.coupleName}>{userName}</span>
        <span style={styles.coupleHeart}>💜</span>
        <span style={styles.coupleName}>{partnerName}</span>
      </div>

      <div style={styles.voiceOnlyContainer}>
        <div style={{...styles.statusRing, ...getStatusRingStyle(voiceState, isDarkMode)}}>
          <div style={styles.statusInner}>
            {voiceState === STATE.CONNECTING && <div style={styles.spinnerSmall} />}
            {voiceState === STATE.LISTENING && <div style={styles.listeningPulse} />}
            {voiceState === STATE.THINKING && <div style={styles.thinkingPulse} />}
            {voiceState === STATE.SPEAKING && <div style={styles.speakingPulse} />}
            {voiceState === STATE.IDLE && <span style={styles.micIcon}>🎤</span>}
          </div>
        </div>

        <p style={styles.statusText}>{getStatusText(voiceState)}</p>
        
        <p style={styles.tipText}>
          {voiceState === STATE.LISTENING && "Sprecht abwechselnd..."}
          {voiceState === STATE.SPEAKING && "Amiya moderiert..."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {/* Session-Ende Dialog mit Analyse-Empfehlung */}
      {showEndDialog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 1000,
        }}>
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "28px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}>
            {/* Header */}
            <div style={{
              width: "56px",
              height: "56px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <BarChart2 size={28} color="white" />
            </div>

            <h3 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              marginBottom: "8px",
              fontFamily: tokens.fonts.display,
            }}>Session beenden</h3>

            <p style={{
              color: tokens.colors.text.secondary,
              marginBottom: "20px",
              lineHeight: "1.5",
              fontSize: "15px",
            }}>
              Möchtet ihr eine Analyse dieser Session?
            </p>

            {/* Vorteile Box */}
            <div style={{
              background: tokens.colors.bg.surface,
              borderRadius: tokens.radii.md,
              padding: "16px",
              marginBottom: "20px",
              textAlign: "left",
            }}>
              <p style={{
                color: tokens.colors.text.primary,
                fontSize: "14px",
                fontWeight: "600",
                margin: "0 0 12px 0",
              }}>Mit Analyse könnt ihr:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>📈</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Muster in eurer Kommunikation sehen
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>🎯</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Konkrete nächste Schritte erhalten
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>🧠</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Amiya lernt euch besser kennen
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <button
                onClick={handleDialogSkip}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: tokens.colors.bg.surface,
                  color: tokens.colors.text.secondary,
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "15px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Ohne Analyse
              </button>
              <button
                onClick={handleDialogAnalyze}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                  color: "white",
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                Mit Analyse
                <span style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-4px",
                  background: tokens.colors.aurora.mint,
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  boxShadow: `0 2px 8px ${tokens.colors.aurora.mint}66`,
                }}>
                  Empfohlen
                </span>
              </button>
            </div>

            {/* Hinweis */}
            <p style={{
              color: tokens.colors.text.muted,
              fontSize: "12px",
              lineHeight: "1.5",
              margin: 0,
            }}>
              Mit "Mit Analyse" aktiviert ihr das Memory-System dauerhaft.
              Ihr könnt das jederzeit in den Einstellungen ändern.
            </p>
          </div>
        </div>
      )}

      {/* Too Short Modal - Friendly message when session was too short */}
      {showTooShortModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 1000,
        }}>
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "32px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              background: tokens.colors.bg.surface,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <MessageCircle size={32} color={tokens.colors.aurora.lavender} />
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              marginBottom: "12px",
              fontFamily: tokens.fonts.display,
            }}>Session zu kurz</h3>
            <p style={{
              color: tokens.colors.text.secondary,
              marginBottom: "16px",
              lineHeight: "1.6",
              fontSize: "15px",
            }}>
              Für eine hilfreiche Analyse brauche ich etwas mehr Kontext von euch.
            </p>
            <div style={{
              background: tokens.colors.bg.surface,
              borderRadius: tokens.radii.md,
              padding: "16px",
              marginBottom: "24px",
              textAlign: "left",
            }}>
              <p style={{
                color: tokens.colors.text.muted,
                fontSize: "13px",
                margin: "0 0 8px 0",
                fontWeight: "600",
              }}>Tipp für nächstes Mal:</p>
              <p style={{
                color: tokens.colors.text.secondary,
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.5",
              }}>
                Erzählt mir einfach, was euch beschäftigt – auch wenn es nur ein Gefühl oder eine Situation ist.
              </p>
            </div>
            <p style={{
              color: tokens.colors.text.muted,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              Diese Session wurde nicht gespeichert.
            </p>
            <button
              onClick={() => {
                setShowTooShortModal(false);
                router.push("/wir");
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// Helper functions with Design System colors
// Light Mode: lavender=#7c3aed, rose=#db2777, mint=#0d9488
// Dark Mode: lavender=#a78bfa, rose=#f9a8d4, mint=#7dd3c0
function getStateColor(state, isDarkMode = false) {
  const lavender = isDarkMode ? "#a78bfa" : "#7c3aed";
  const rose = isDarkMode ? "#f9a8d4" : "#db2777";
  const mint = isDarkMode ? "#7dd3c0" : "#0d9488";
  const colors = {
    [STATE.CONNECTING]: "linear-gradient(135deg, #6b7280, #4b5563)",
    [STATE.LISTENING]: `linear-gradient(135deg, ${mint}, #0f766e)`,
    [STATE.THINKING]: "linear-gradient(135deg, #f59e0b, #d97706)",
    [STATE.SPEAKING]: `linear-gradient(135deg, ${lavender}, ${rose})`,
    [STATE.IDLE]: "linear-gradient(135deg, #6b7280, #4b5563)"
  };
  return colors[state] || colors[STATE.IDLE];
}

function getStateEmoji(state) {
  const emojis = {
    [STATE.CONNECTING]: "⏳",
    [STATE.LISTENING]: "👂",
    [STATE.THINKING]: "💭",
    [STATE.SPEAKING]: "🗣️",
    [STATE.IDLE]: "💜"
  };
  return emojis[state] || "💜";
}

function getStatusText(state) {
  const texts = {
    [STATE.CONNECTING]: "Verbinde...",
    [STATE.LISTENING]: "Amiya hört zu",
    [STATE.THINKING]: "Amiya denkt nach",
    [STATE.SPEAKING]: "Amiya spricht",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

function getStatusRingStyle(state, isDarkMode = false) {
  const lavender = isDarkMode ? "#a78bfa" : "#7c3aed";
  const mint = isDarkMode ? "#7dd3c0" : "#0d9488";
  const ringStyles = {
    [STATE.CONNECTING]: { borderColor: "#6b7280" },
    [STATE.LISTENING]: { borderColor: mint, boxShadow: `0 0 40px ${mint}50` },
    [STATE.THINKING]: { borderColor: "#f59e0b", boxShadow: "0 0 40px rgba(245,158,11,0.3)" },
    [STATE.SPEAKING]: { borderColor: lavender, boxShadow: `0 0 40px ${lavender}50` },
    [STATE.IDLE]: { borderColor: "#6b7280" }
  };
  return ringStyles[state] || ringStyles[STATE.IDLE];
}

// Static styles use Light Mode Design System colors
// lavender=#7c3aed, rose=#db2777, bg.deep=#fafaf9, bg.soft=#e7e5e4
const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "#fafaf9",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e7e5e4",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#6b7280",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  sessionContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #fce7f3 0%, #f5f3ff 50%, #fdf4ff 100%)",
  },
  header: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #f9a8d4",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px" 
  },
  headerIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    transition: "all 0.3s",
  },
  headerTitle: { 
    fontWeight: "600", 
    color: "#1f2937", 
    fontSize: "17px" 
  },
  headerSubtitle: { 
    fontSize: "13px", 
    color: "#6b7280" 
  },
  timeWarning: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  endButton: {
    padding: "8px 16px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  coupleIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
    background: "rgba(255,255,255,0.6)",
  },
  coupleName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#6b7280",
  },
  coupleHeart: {
    fontSize: "20px",
  },
  voiceOnlyContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  statusRing: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    border: "6px solid #6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  statusInner: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  listeningPulse: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0d9488, #0f766e)", // aurora.mint
    animation: "pulse 2s ease-in-out infinite",
  },
  thinkingPulse: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    animation: "breathe 1.5s ease-in-out infinite",
  },
  speakingPulse: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    animation: "pulse 1s ease-in-out infinite",
  },
  micIcon: {
    fontSize: "60px",
  },
  statusText: { 
    color: "#374151", 
    fontSize: "20px", 
    fontWeight: "600",
    marginTop: "32px" 
  },
  tipText: {
    color: "#9ca3af",
    fontSize: "14px",
    marginTop: "12px",
    minHeight: "20px",
  },
  analysisLoadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  analysisSpinner: {
    width: "60px",
    height: "60px",
    border: "5px solid #e7e5e4",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "24px",
  },
  analysisLoadingTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "12px",
  },
  analysisLoadingText: {
    color: "#6b7280",
    fontSize: "15px",
    textAlign: "center",
    lineHeight: "1.6",
  },
  errorIconLarge: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  redirectText: {
    color: "#9ca3af",
    fontSize: "13px",
    marginTop: "16px",
  },
  dialogOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  dialog: {
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  dialogTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "12px",
  },
  dialogText: {
    color: "#6b7280",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  dialogButtons: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  dialogButtonSecondary: {
    flex: 1,
    padding: "14px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
  },
  dialogButtonPrimary: {
    flex: 1,
    padding: "14px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
