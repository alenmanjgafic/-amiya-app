/**
 * COUPLE SESSION PAGE - app/session/couple/page.js
 * Gemeinsame Session fur beide Partner
 * UPDATED: Migrated to use centralized Design System tokens
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
  const mediaStreamRef = useRef(null);
  const endRequestedRef = useRef(false); // Track if user wants to end during connection

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

  // Helper function for state colors using Design System tokens
  const getStateColor = useCallback((state) => {
    const stateColors = {
      [STATE.CONNECTING]: tokens.gradients.connecting,
      [STATE.LISTENING]: tokens.gradients.primary,
      [STATE.THINKING]: tokens.gradients.thinking,
      [STATE.SPEAKING]: tokens.gradients.speaking,
      [STATE.IDLE]: tokens.gradients.connecting
    };
    return stateColors[state] || stateColors[STATE.IDLE];
  }, [tokens]);

  // Helper function for status ring styles using Design System tokens
  const getStatusRingStyle = useCallback((state) => {
    const { mint, lavender } = tokens.colors.aurora;
    const ringStyles = {
      [STATE.CONNECTING]: { borderColor: "#6b7280" },
      [STATE.LISTENING]: {
        borderColor: mint,
        boxShadow: isDarkMode ? `0 0 40px ${mint}30` : `0 4px 20px ${mint}20`
      },
      [STATE.THINKING]: {
        borderColor: "#f59e0b",
        boxShadow: isDarkMode ? "0 0 40px rgba(245,158,11,0.3)" : "0 4px 20px rgba(245,158,11,0.2)"
      },
      [STATE.SPEAKING]: {
        borderColor: lavender,
        boxShadow: isDarkMode ? `0 0 40px ${lavender}30` : `0 4px 20px ${lavender}20`
      },
      [STATE.IDLE]: { borderColor: "#6b7280" }
    };
    return ringStyles[state] || ringStyles[STATE.IDLE];
  }, [tokens, isDarkMode]);

  const startSession = useCallback(async () => {
    if (!user || !profile) return;

    // Reset end request flag at start
    endRequestedRef.current = false;

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      console.log("Couple context length:", userContext.length);

      // UPDATED: Kontext-Limit auf 4000 Zeichen erhoht fur Agreements
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

      // Check if user clicked end while we were connecting
      if (endRequestedRef.current) {
        console.log("User requested end during connection, cleaning up...");
        try {
          await conversation.endSession();
        } catch (e) {}
        conversationRef.current = null;

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }

        setVoiceState(STATE.IDLE);
        router.push("/wir");
        return;
      }

    } catch (error) {
      console.error("Failed to start couple session:", error);

      // Clean up media stream on error too
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

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
    // Signal that user wants to end (in case we're still connecting)
    endRequestedRef.current = true;

    // Check if we're still connecting (conversation not established yet)
    const wasConnecting = voiceState === STATE.CONNECTING && !conversationRef.current;

    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.log("Session already ended");
      }
      conversationRef.current = null;
    }

    // Stop microphone stream (fixes Safari red mic indicator)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setVoiceState(STATE.IDLE);

    // If we were still connecting, just go home (startSession will also check endRequestedRef)
    if (wasConnecting) {
      router.push("/wir");
      return;
    }

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
  }, [profile, currentSessionId, router, voiceState]);

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
            // Session loschen wenn nicht genug Inhalt
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
            setAnalysisError("Analyse konnte nicht erstellt werden. Bitte versuche es spater erneut.");
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
      setAnalysisError("Keine Analyse moglich - es wurden keine Gesprache aufgezeichnet.");
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
   * User wahlt "Mit Analyse" im Dialog
   * -> Consent dauerhaft aktivieren + Session analysieren
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
   * User wahlt "Ohne Analyse" im Dialog
   * -> Session beenden ohne Analyse
   */
  const handleDialogSkip = async () => {
    setShowEndDialog(false);
    await endSession(false);
  };

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
        conversationRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Stop microphone stream (fixes Safari red mic indicator)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const timeWarning = sessionTime >= 50 * 60 && sessionTime < 50 * 60 + 5;

  // Build dynamic styles using Design System tokens
  const styles = buildStyles(tokens, isDarkMode);

  if (authLoading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  if (isGeneratingAnalysis) {
    return (
      <div style={styles.sessionContainer}>
        <div style={styles.analysisLoadingContainer}>
          <div style={tokens.loaders.spinner(60)} />
          <h2 style={{ ...tokens.typography.h2, marginTop: '24px' }}>Analyse wird erstellt...</h2>
          <p style={{ ...tokens.typography.body, textAlign: 'center' }}>
            Amiya wertet euer gemeinsames Gesprach aus.<br/>
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
          <div style={styles.errorIconLarge}>!</div>
          <h2 style={{ ...tokens.typography.h2, marginTop: '16px' }}>Hinweis</h2>
          <p style={tokens.typography.body}>{analysisError}</p>
          <p style={{ ...tokens.typography.small, marginTop: '16px' }}>Weiterleitung...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sessionContainer}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.headerIcon, background: getStateColor(voiceState)}}>
            {getStateEmoji(voiceState)}
          </div>
          <div>
            <div style={styles.headerTitle}>Couple Session</div>
            <div style={styles.headerSubtitle}>
              {formatTime(sessionTime)} / 60:00
              {timeWarning && <span style={styles.timeWarning}> 10 Min ubrig</span>}
            </div>
          </div>
        </div>
        <button onClick={handleEndClick} style={tokens.buttons.danger}>Beenden</button>
      </div>

      <div style={styles.coupleIndicator}>
        <span style={styles.coupleName}>{userName}</span>
        <span style={styles.coupleHeart}>&#128156;</span>
        <span style={styles.coupleName}>{partnerName}</span>
      </div>

      <div style={styles.voiceOnlyContainer}>
        <div style={{...styles.statusRing, ...getStatusRingStyle(voiceState)}}>
          <div style={styles.statusInner}>
            {voiceState === STATE.CONNECTING && <div style={tokens.loaders.spinner(40)} />}
            {voiceState === STATE.LISTENING && <div style={{
              ...tokens.loaders.pulse,
              background: tokens.gradients.primary,
            }} />}
            {voiceState === STATE.THINKING && <div style={tokens.loaders.breathe} />}
            {voiceState === STATE.SPEAKING && <div style={{
              ...tokens.loaders.pulse,
              background: tokens.gradients.speaking,
              animation: 'pulse 1s ease-in-out infinite',
            }} />}
            {voiceState === STATE.IDLE && <span style={styles.micIcon}>&#127908;</span>}
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
        <div style={tokens.modals.overlay}>
          <div style={{ ...tokens.modals.container, maxWidth: '400px', textAlign: 'center' }}>
            {/* Header */}
            <div style={{
              width: '56px',
              height: '56px',
              background: tokens.gradients.primary,
              borderRadius: tokens.radii.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <BarChart2 size={28} color="white" />
            </div>

            <h3 style={{ ...tokens.modals.title, marginBottom: '8px' }}>Session beenden</h3>

            <p style={{ ...tokens.typography.body, marginBottom: '20px' }}>
              Mochtet ihr eine Analyse dieser Session?
            </p>

            {/* Vorteile Box */}
            <div style={{ ...tokens.cards.surface, marginBottom: '20px', textAlign: 'left' }}>
              <p style={{
                ...tokens.typography.body,
                fontWeight: '600',
                color: tokens.colors.text.primary,
                margin: '0 0 12px 0',
              }}>Mit Analyse konnt ihr:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>&#128200;</span>
                  <span style={tokens.typography.body}>
                    Muster in eurer Kommunikation sehen
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>&#127919;</span>
                  <span style={tokens.typography.body}>
                    Konkrete nachste Schritte erhalten
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>&#129504;</span>
                  <span style={tokens.typography.body}>
                    Amiya lernt euch besser kennen
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={tokens.modals.buttonGroup}>
              <button
                onClick={handleDialogSkip}
                style={{ ...tokens.buttons.secondary, flex: 1 }}
              >
                Ohne Analyse
              </button>
              <button
                onClick={handleDialogAnalyze}
                style={{ ...tokens.buttons.primary, flex: 1, position: 'relative' }}
              >
                Mit Analyse
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-4px',
                  background: tokens.colors.aurora.mint,
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  boxShadow: `0 2px 8px ${tokens.colors.aurora.mint}66`,
                }}>
                  Empfohlen
                </span>
              </button>
            </div>

            {/* Hinweis */}
            <p style={{ ...tokens.typography.small, marginTop: '16px' }}>
              Mit "Mit Analyse" aktiviert ihr das Memory-System dauerhaft.
              Ihr konnt das jederzeit in den Einstellungen andern.
            </p>
          </div>
        </div>
      )}

      {/* Too Short Modal - Friendly message when session was too short */}
      {showTooShortModal && (
        <div style={tokens.modals.overlay}>
          <div style={{ ...tokens.modals.container, maxWidth: '400px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: tokens.colors.bg.surface,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <MessageCircle size={32} color={tokens.colors.aurora.lavender} />
            </div>
            <h3 style={{ ...tokens.modals.title, marginBottom: '12px' }}>Session zu kurz</h3>
            <p style={{ ...tokens.typography.body, marginBottom: '16px' }}>
              Fur eine hilfreiche Analyse brauche ich etwas mehr Kontext von euch.
            </p>
            <div style={{ ...tokens.cards.surface, marginBottom: '24px', textAlign: 'left' }}>
              <p style={{
                ...tokens.typography.small,
                fontWeight: '600',
                margin: '0 0 8px 0',
              }}>Tipp fur nachstes Mal:</p>
              <p style={{ ...tokens.typography.body, margin: 0 }}>
                Erzahlt mir einfach, was euch beschaftigt - auch wenn es nur ein Gefuhl oder eine Situation ist.
              </p>
            </div>
            <p style={{ ...tokens.typography.small, marginBottom: '20px' }}>
              Diese Session wurde nicht gespeichert.
            </p>
            <button
              onClick={() => {
                setShowTooShortModal(false);
                router.push("/wir");
              }}
              style={{ ...tokens.buttons.primary, width: '100%' }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// Helper function for state emoji
function getStateEmoji(state) {
  const emojis = {
    [STATE.CONNECTING]: "\u23F3",
    [STATE.LISTENING]: "\uD83D\uDC42",
    [STATE.THINKING]: "\uD83D\uDCAD",
    [STATE.SPEAKING]: "\uD83D\uDDE3\uFE0F",
    [STATE.IDLE]: "\uD83D\uDC9C"
  };
  return emojis[state] || "\uD83D\uDC9C";
}

// Helper function for status text
function getStatusText(state) {
  const texts = {
    [STATE.CONNECTING]: "Verbinde...",
    [STATE.LISTENING]: "Amiya hort zu",
    [STATE.THINKING]: "Amiya denkt nach",
    [STATE.SPEAKING]: "Amiya spricht",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

// Build dynamic styles using Design System tokens
function buildStyles(tokens, isDarkMode) {
  return {
    loadingContainer: {
      ...tokens.layout.pageCentered,
      flexDirection: 'column',
      gap: tokens.spacing.md,
    },
    sessionContainer: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDarkMode
        ? tokens.colors.bg.deep
        : `linear-gradient(135deg, #fce7f3 0%, #f5f3ff 50%, #fdf4ff 100%)`,
    },
    header: {
      ...tokens.layout.header,
      borderBottom: `1px solid ${tokens.colors.aurora.rose}40`,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing.md,
    },
    headerIcon: {
      width: '44px',
      height: '44px',
      borderRadius: tokens.radii.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      transition: tokens.transitions.slow,
    },
    headerTitle: {
      fontWeight: '600',
      color: tokens.colors.text.primary,
      fontSize: '17px',
    },
    headerSubtitle: {
      fontSize: '13px',
      color: tokens.colors.text.secondary,
    },
    timeWarning: {
      color: tokens.colors.warning,
      fontWeight: '600',
    },
    coupleIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.md,
      padding: tokens.spacing.md,
      background: isDarkMode ? tokens.colors.bg.surface : 'rgba(255,255,255,0.6)',
    },
    coupleName: {
      fontSize: '16px',
      fontWeight: '600',
      color: tokens.colors.text.secondary,
    },
    coupleHeart: {
      fontSize: '20px',
    },
    voiceOnlyContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
    },
    statusRing: {
      width: '180px',
      height: '180px',
      borderRadius: '50%',
      border: '6px solid #6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: tokens.transitions.slow,
    },
    statusInner: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      background: isDarkMode ? tokens.colors.bg.elevated : 'rgba(255,255,255,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    micIcon: {
      fontSize: '60px',
    },
    statusText: {
      ...tokens.typography.h3,
      marginTop: tokens.spacing.xl,
    },
    tipText: {
      ...tokens.typography.small,
      marginTop: tokens.spacing.md,
      minHeight: '20px',
    },
    analysisLoadingContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
    },
    errorIconLarge: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: tokens.colors.warning,
      color: 'white',
      fontSize: '32px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
}
