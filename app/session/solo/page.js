/**
 * SOLO SESSION PAGE - app/session/solo/page.js
 * Dedicated page for solo voice sessions with ElevenLabs
 * Supports ?analysisId=xxx for auto-start with analysis context
 */
"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { sessionsService } from "../../../lib/sessions";
import AnalysisView from "../../../components/AnalysisView";
import { MessageCircle, BarChart2 } from "lucide-react";

const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";

const STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

// Wrapper for Suspense (useSearchParams requires it)
export default function SoloSessionPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SoloSessionContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      background: "#0c0a09",
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #292524",
        borderTopColor: "#a78bfa",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#a8a29e" }}>Laden...</p>
    </div>
  );
}

function SoloSessionContent() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Analysis context from URL parameter
  const analysisIdParam = searchParams.get("analysisId");
  const [analysisContext, setAnalysisContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Session state
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showTooShortModal, setShowTooShortModal] = useState(false);

  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const mediaStreamRef = useRef(null);

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && profile && (!profile.name || !profile.partner_name)) {
      router.push("/onboarding");
    }
  }, [user, profile, authLoading, router]);

  // Load analysis context if analysisId provided
  useEffect(() => {
    const loadAnalysisContext = async () => {
      if (!analysisIdParam || !user || analysisContext) return;

      setIsLoadingContext(true);
      try {
        const response = await fetch(`/api/sessions/${analysisIdParam}`);
        if (response.ok) {
          const session = await response.json();
          if (session.type === "message_analysis" && session.analysis) {
            setAnalysisContext({
              sessionId: session.id,
              analysis: session.analysis,
              themes: session.themes || [],
            });
            console.log("Analysis context loaded for voice session");
          }
        }
      } catch (error) {
        console.error("Error loading analysis context:", error);
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadAnalysisContext();
  }, [analysisIdParam, user, analysisContext]);

  // Timer
  useEffect(() => {
    if (isStarted && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const userName = profile?.name || "du";
  const partnerName = profile?.partner_name || "Partner";

  // Helper functions for styling
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

  // Start session
  const startSession = useCallback(async () => {
    if (!user || !profile) return;

    setIsStarted(true);
    setVoiceState(STATE.CONNECTING);
    messagesRef.current = [];
    setMessageCount(0);
    setAnalysisError(null);

    try {
      // Load context from Memory System
      let userContext = "";
      try {
        const contextResponse = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            coupleId: profile.couple_id || null,
            sessionType: "solo"
          }),
        });

        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          userContext = contextData.context || "";
          console.log("Memory loaded:", contextData.hasMemory ? "with context" : "no consent");
        }
      } catch (contextError) {
        console.error("Failed to load memory:", contextError);
      }

      // Add analysis context if present
      if (analysisContext) {
        const analysisIntro = `
WICHTIG - KONTEXT AUS NACHRICHTENANALYSE:
Der User hat gerade eine Nachrichtenkonversation mit ${partnerName} analysiert.
Er möchte jetzt darüber sprechen.

Zusammenfassung der Analyse:
${analysisContext.analysis.substring(0, 1500)}

Erkannte Themen: ${analysisContext.themes?.join(', ') || 'Keine spezifischen Themen'}

Beginne das Gespräch damit, dass du auf diese Analyse Bezug nimmst.
Frage den User wie er sich dabei fühlt und was er besprechen möchte.
---
`;
        userContext = analysisIntro + userContext;
        console.log("Added analysis context to session");
      }

      const session = await sessionsService.create(user.id, "solo");
      setCurrentSessionId(session.id);

      const { Conversation } = await import("@elevenlabs/client");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

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
          user_context: sanitizedContext || "Keine fruheren Gesprache vorhanden.",
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs (Solo Session)");
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
          if (modeValue === "listening") setVoiceState(STATE.LISTENING);
          else if (modeValue === "thinking") setVoiceState(STATE.THINKING);
          else if (modeValue === "speaking") setVoiceState(STATE.SPEAKING);
        },
        onError: (error) => {
          console.error("ElevenLabs error:", error);
          setVoiceState(STATE.IDLE);
        }
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error("Failed to start solo session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setIsStarted(false);
      setVoiceState(STATE.IDLE);
      router.push("/");
    }
  }, [user, profile, userName, partnerName, router, analysisContext]);

  // Auto-start when ready (like couple session)
  useEffect(() => {
    // Wait for context to load if analysisId is provided
    if (analysisIdParam && (isLoadingContext || !analysisContext)) return;

    if (!authLoading && user && profile && profile.name && !isStarted) {
      startSession();
    }
  }, [authLoading, user, profile, isStarted, startSession, analysisIdParam, isLoadingContext, analysisContext]);

  // Check analysis viability
  const checkAnalysisViability = useCallback(async () => {
    const messages = messagesRef.current;
    if (messages.length === 0) return { viable: false, reason: "empty" };

    const transcript = messages
      .map(m => `${m.role === "user" ? "User" : "Amiya"}: ${m.content}`)
      .join("\n");

    try {
      const response = await fetch("/api/check-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) return { viable: true, reason: null };
      const data = await response.json();
      return { viable: data.viable, reason: data.reason };
    } catch (error) {
      return { viable: true, reason: null };
    }
  }, []);

  // End session
  const endSession = useCallback(async (requestAnalysis = false) => {
    const sessionIdToAnalyze = currentSessionId;
    const currentMessages = messagesRef.current;
    const hasMessages = currentMessages.length > 0;

    setAnalysisError(null);

    if (currentSessionId && hasMessages) {
      try {
        let summary = "";
        if (profile?.name || profile?.partner_name) {
          summary += `[Kontext: User=${profile?.name || "unbekannt"}, Partner=${profile?.partner_name || "unbekannt"}]\n\n`;
        }
        summary += currentMessages
          .map(m => `${m.role === "user" ? (profile?.name || "User") : "Amiya"}: ${m.content}`)
          .join("\n");

        await sessionsService.end(currentSessionId, summary, []);

        if (requestAnalysis) {
          setIsGeneratingAnalysis(true);
          setShowEndDialog(false);

          const viability = await checkAnalysisViability();

          if (!viability.viable) {
            try {
              await sessionsService.delete(sessionIdToAnalyze);
            } catch (e) {}
            setIsGeneratingAnalysis(false);
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
                  coupleId: profile?.couple_id || null,
                  sessionId: currentSessionId,
                  sessionType: "solo",
                  analysis: analysisResult?.analysis || summary
                }),
              });
            } catch (e) {}

            setIsGeneratingAnalysis(false);
            setAnalysisSessionId(sessionIdToAnalyze);
            setShowAnalysis(true);
          } catch (e) {
            setIsGeneratingAnalysis(false);
            setAnalysisError("Analyse konnte nicht erstellt werden.");
            setTimeout(() => router.push("/"), 3000);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    } else if (requestAnalysis && !hasMessages) {
      setShowTooShortModal(true);
      return;
    }

    if (!requestAnalysis) {
      setShowEndDialog(false);
      router.push("/");
    }
  }, [currentSessionId, profile, user, router, checkAnalysisViability]);

  // Handle end button click
  const handleEndClick = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {}
      conversationRef.current = null;
    }

    // Stop microphone stream (fixes Safari red mic indicator)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setVoiceState(STATE.IDLE);

    if (profile?.auto_analyze !== false) {
      setTimeout(() => endSession(true), 100);
    } else {
      setShowEndDialog(true);
    }
  }, [profile?.auto_analyze, endSession]);

  const handleDialogAnalyze = async () => {
    setShowEndDialog(false);
    try {
      await updateProfile({
        memory_consent: true,
        memory_consent_at: new Date().toISOString(),
        auto_analyze: true,
      });
    } catch (e) {}
    endSession(true);
  };

  const handleDialogSkip = async () => {
    setShowEndDialog(false);
    await endSession(false);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisSessionId(null);
    router.push("/");
  };

  // Cleanup on unmount
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

  // Helper for state emoji
  const getStateEmoji = (state) => {
    const emojis = {
      [STATE.CONNECTING]: "\u23F3",
      [STATE.LISTENING]: "\uD83D\uDC42",
      [STATE.THINKING]: "\uD83D\uDCAD",
      [STATE.SPEAKING]: "\uD83D\uDDE3\uFE0F",
      [STATE.IDLE]: "\uD83D\uDC9C"
    };
    return emojis[state] || "\uD83D\uDC9C";
  };

  const getStatusText = (state) => {
    const texts = {
      [STATE.CONNECTING]: "Verbinde...",
      [STATE.LISTENING]: "Ich höre zu",
      [STATE.THINKING]: "Ich denke nach",
      [STATE.SPEAKING]: "Amiya spricht",
      [STATE.IDLE]: "Bereit"
    };
    return texts[state] || "";
  };

  // Loading states
  if (authLoading || !profile) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  if (isGeneratingAnalysis) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: isDarkMode ? tokens.colors.bg.deep : tokens.colors.bg.base,
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}>
          <div style={tokens.loaders.spinner(60)} />
          <h2 style={{ ...tokens.typography.h2, marginTop: "24px" }}>
            Analyse wird erstellt...
          </h2>
          <p style={{ ...tokens.typography.body, textAlign: "center" }}>
            Amiya wertet euer Gespräch aus.<br/>Das dauert einen Moment.
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
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isDarkMode ? tokens.colors.bg.deep : tokens.colors.bg.base,
        padding: "40px 20px",
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: tokens.colors.warning,
          color: "white",
          fontSize: "32px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>!</div>
        <h2 style={{ ...tokens.typography.h2, marginTop: "16px" }}>Hinweis</h2>
        <p style={tokens.typography.body}>{analysisError}</p>
        <p style={{ ...tokens.typography.small, marginTop: "16px" }}>Weiterleitung...</p>
      </div>
    );
  }

  // Main session UI
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: isDarkMode ? tokens.colors.bg.deep : tokens.colors.bg.base,
    }}>
      {/* Header */}
      <div style={{
        ...tokens.layout.header,
        borderBottom: `1px solid ${tokens.colors.bg.soft}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: tokens.radii.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            transition: "all 0.3s",
            background: getStateColor(voiceState),
          }}>
            {getStateEmoji(voiceState)}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: tokens.colors.text.primary, fontSize: "17px" }}>
              Solo Session
            </div>
            <div style={{ fontSize: "13px", color: tokens.colors.text.secondary }}>
              {formatTime(sessionTime)}
            </div>
          </div>
        </div>
        <button onClick={handleEndClick} style={tokens.buttons.danger}>
          Beenden
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}>
        {/* Status Ring */}
        <div style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          border: "6px solid #6b7280",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          ...getStatusRingStyle(voiceState),
        }}>
          <div style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: isDarkMode ? tokens.colors.bg.elevated : "rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {voiceState === STATE.CONNECTING && <div style={tokens.loaders.spinner(40)} />}
            {voiceState === STATE.LISTENING && (
              <div style={{ ...tokens.loaders.pulse, background: tokens.gradients.primary }} />
            )}
            {voiceState === STATE.THINKING && <div style={tokens.loaders.breathe} />}
            {voiceState === STATE.SPEAKING && (
              <div style={{
                ...tokens.loaders.pulse,
                background: tokens.gradients.speaking,
                animation: "pulse 1s ease-in-out infinite",
              }} />
            )}
            {voiceState === STATE.IDLE && <span style={{ fontSize: "60px" }}>🎙️</span>}
          </div>
        </div>

        <p style={{ ...tokens.typography.h3, marginTop: "32px" }}>
          {getStatusText(voiceState)}
        </p>

        <p style={{ ...tokens.typography.small, marginTop: "12px", minHeight: "20px" }}>
          {voiceState === STATE.LISTENING && "Sprich einfach..."}
          {voiceState === STATE.SPEAKING && "Unterbrechen? Einfach sprechen."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {/* End Dialog */}
      {showEndDialog && (
        <div style={tokens.modals.overlay}>
          <div style={{ ...tokens.modals.container, maxWidth: "400px", textAlign: "center" }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: tokens.gradients.primary,
              borderRadius: tokens.radii.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <BarChart2 size={28} color="white" />
            </div>
            <h3 style={{ ...tokens.modals.title, marginBottom: "8px" }}>Session beenden</h3>
            <p style={{ ...tokens.typography.body, marginBottom: "20px" }}>
              Möchtest du eine Analyse dieser Session?
            </p>
            <div style={tokens.modals.buttonGroup}>
              <button onClick={handleDialogSkip} style={{ ...tokens.buttons.secondary, flex: 1 }}>
                Ohne Analyse
              </button>
              <button onClick={handleDialogAnalyze} style={{ ...tokens.buttons.primary, flex: 1, position: "relative" }}>
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
                }}>
                  Empfohlen
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis View */}
      {showAnalysis && analysisSessionId && (
        <AnalysisView sessionId={analysisSessionId} onClose={handleCloseAnalysis} />
      )}

      {/* Too Short Modal */}
      {showTooShortModal && (
        <div style={tokens.modals.overlay}>
          <div style={{ ...tokens.modals.container, maxWidth: "400px", textAlign: "center" }}>
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
            <h3 style={{ ...tokens.modals.title, marginBottom: "12px" }}>Session zu kurz</h3>
            <p style={{ ...tokens.typography.body, marginBottom: "24px" }}>
              Für eine hilfreiche Analyse brauche ich etwas mehr Kontext von dir.
            </p>
            <button
              onClick={() => {
                setShowTooShortModal(false);
                router.push("/");
              }}
              style={{ ...tokens.buttons.primary, width: "100%" }}
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
