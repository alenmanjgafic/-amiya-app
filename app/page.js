/**
 * MAIN PAGE - app/page.js
 * Hauptseite mit Solo Voice-Session
 * UPDATED: Kontext-Limit auf 4000 Zeichen erhöht für Agreements
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import { sessionsService } from "../lib/sessions";
import AnalysisView from "../components/AnalysisView";
import {
  Home as HomeIcon,
  Heart,
  ClipboardList,
  User,
  Mic,
  Headphones,
  AlertTriangle,
  Loader2,
  Ear,
  MessageCircle,
  Volume2,
  LogOut
} from "lucide-react";

const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";

const STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

export default function Home() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [showTooShortModal, setShowTooShortModal] = useState(false);

  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const mediaStreamRef = useRef(null); // Für Mikrofon-Cleanup

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

  // Check for memory consent
  useEffect(() => {
    if (!authLoading && user && profile && profile.name && profile.partner_name) {
      const neverDecided = profile.memory_consent === null ||
                           profile.memory_consent === undefined ||
                           (profile.memory_consent === false && !profile.memory_consent_at);
      if (neverDecided) {
        router.push("/onboarding/memory");
      }
    }
  }, [user, profile, authLoading, router]);

  // Load pending suggestions count for badge
  useEffect(() => {
    if (user && profile?.couple_id) {
      loadPendingSuggestionsCount();
    }
  }, [user, profile?.couple_id]);

  const loadPendingSuggestionsCount = async () => {
    if (!profile?.couple_id) return;
    try {
      const response = await fetch(
        `/api/agreements/suggestions?coupleId=${profile.couple_id}`
      );
      const data = await response.json();
      setPendingSuggestionsCount(data.suggestions?.length || 0);
    } catch (error) {
      console.error("Failed to load suggestions count:", error);
    }
  };

  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const displayName = profile?.name || "du";
  const partnerName = profile?.partner_name || "";

  const startSession = useCallback(async () => {
    if (!user) return;
    
    setStarted(true);
    setVoiceState(STATE.CONNECTING);
    messagesRef.current = [];
    setMessageCount(0);
    setAnalysisError(null);

    try {
      // Lade Kontext aus Memory System
      let userContext = "";
      try {
        const contextResponse = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id,
            coupleId: profile?.couple_id || null,
            sessionType: "solo"
          }),
        });
        
        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          userContext = contextData.context || "";
          console.log("Memory loaded:", contextData.hasMemory ? "with context" : "no consent");
          if (contextData.debug) {
            console.log("Debug:", contextData.debug);
          }
        }
      } catch (contextError) {
        console.error("Failed to load memory:", contextError);
      }

      const session = await sessionsService.create(user.id, "solo");
      setCurrentSessionId(session.id);

      const { Conversation } = await import("@elevenlabs/client");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // Speichern für Cleanup

      console.log("Context length:", userContext.length);
      console.log("Context preview:", userContext.substring(0, 300));

      // UPDATED: Kontext-Limit auf 4000 Zeichen erhöht für Agreements
      let sanitizedContext = userContext
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 4000);
      
      if (userContext.length > 4000) {
        sanitizedContext += "...";
      }
      
      console.log("Sanitized context length:", sanitizedContext.length);

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: profile?.name || "User",
          partner_name: profile?.partner_name || "Partner",
          user_context: sanitizedContext || "Keine früheren Gespräche vorhanden.",
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs");
          setVoiceState(STATE.LISTENING);
        },
        onDisconnect: (details) => {
          console.log("Disconnected from ElevenLabs", details);
          setVoiceState(STATE.IDLE);
        },
        onError: (error) => {
          console.error("ElevenLabs error:", error);
          setVoiceState(STATE.IDLE);
        },
        onStatusChange: (status) => {
          console.log("Status changed:", status);
        },
        onMessage: (message) => {
          console.log("Message received:", message);
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
          console.log("Mode changed:", mode);
          const modeValue = mode.mode || mode;
          if (modeValue === "listening") {
            setVoiceState(STATE.LISTENING);
          } else if (modeValue === "thinking") {
            setVoiceState(STATE.THINKING);
          } else if (modeValue === "speaking") {
            setVoiceState(STATE.SPEAKING);
          }
        },
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error("Failed to start session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setStarted(false);
      setVoiceState(STATE.IDLE);
    }
  }, [user, profile]);

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
    setStarted(false);
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

    // SOFORT Loading-State setzen wenn Analyse gewünscht
    if (requestAnalysis && hasMessages) {
      setIsGeneratingAnalysis(true);
      setShowEndDialog(false);
    }

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
          
          const viability = await checkAnalysisViability();
          
          if (!viability.viable) {
            // Session löschen wenn nicht genug Inhalt
            try {
              await sessionsService.delete(sessionIdToAnalyze);
              console.log("Session deleted - not enough content");
            } catch (deleteError) {
              console.error("Failed to delete session:", deleteError);
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
                  coupleId: profile?.couple_id || null,
                  sessionId: currentSessionId,
                  sessionType: "solo",
                  analysis: analysisResult?.analysis || summary
                }),
              });
              console.log("Memory updated after solo session");
            } catch (memoryError) {
              console.error("Memory update failed:", memoryError);
            }
            
            setIsGeneratingAnalysis(false);
            setAnalysisSessionId(sessionIdToAnalyze);
            setShowAnalysis(true);
          } catch (analysisErr) {
            console.error("Analysis failed:", analysisErr);
            setIsGeneratingAnalysis(false);
            setAnalysisError("Analyse konnte nicht erstellt werden. Bitte versuche es später erneut.");
            setTimeout(() => {
              resetSession();
            }, 3000);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    } else if (requestAnalysis && !hasMessages) {
      // No messages at all - show friendly modal
      setShowEndDialog(false);
      setShowTooShortModal(true);
      return;
    }
    
    if (!requestAnalysis) {
      setShowEndDialog(false);
      resetSession();
    }
  }, [currentSessionId, profile, checkAnalysisViability, resetSession, user]);

  const handleEndClick = useCallback(async () => {
    // SOFORT visuelles Feedback geben
    setVoiceState(STATE.IDLE);
    setStarted(false);

    // Timer stoppen
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // ElevenLabs Session beenden
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.log("Session already ended");
      }
      conversationRef.current = null;
    }

    // WICHTIG: Mikrofon explizit freigeben (Fix für Safari)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Audio track stopped:", track.label);
      });
      mediaStreamRef.current = null;
    }

    // Check if auto_analyze is enabled
    if (profile?.auto_analyze !== false) {
      // Auto-analyze: skip dialog and directly analyze
      endSession(true);
    } else {
      // Manual mode: show dialog
      setShowEndDialog(true);
    }
  }, [profile?.auto_analyze, endSession]);

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisSessionId(null);
    setAnalysisError(null);
    resetSession();
  };

  useEffect(() => {
    return () => {
      // Cleanup beim Verlassen der Seite
      if (conversationRef.current) {
        conversationRef.current.endSession();
        conversationRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Mikrofon freigeben
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ color: tokens.colors.text.secondary }}>Laden...</p>
      </div>
    );
  }

  if (!user || !profile?.name || !profile?.partner_name) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  // START SCREEN
  if (!started && !isGeneratingAnalysis) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        paddingBottom: "100px",
        background: tokens.colors.bg.deep,
        transition: "background 0.3s ease",
      }}>
        <div style={{ maxWidth: "400px", textAlign: "center", width: "100%" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            padding: "8px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.md,
            boxShadow: tokens.shadows.soft,
          }}>
            <button
              onClick={() => router.push("/profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: tokens.radii.sm,
                fontSize: "15px",
                color: tokens.colors.text.primary,
              }}
            >
              <span style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
              }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span>{displayName}</span>
            </button>
            <button onClick={signOut} style={{
              background: "none",
              border: "none",
              color: tokens.colors.text.muted,
              cursor: "pointer",
              fontSize: "14px",
              padding: "8px 12px",
            }}>
              Abmelden
            </button>
          </div>

          <div style={{
            width: "100px",
            height: "100px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
            borderRadius: tokens.radii.xxl,
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDarkMode
              ? tokens.shadows.glow(tokens.colors.aurora.lavender)
              : "0 10px 40px rgba(139,92,246,0.3)",
          }}><Heart size={50} color="white" fill="white" /></div>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: tokens.colors.text.primary,
            marginBottom: "8px",
            fontFamily: tokens.fonts.display,
          }}>Amiya</h1>
          <p style={{
            color: tokens.colors.text.secondary,
            fontSize: "16px",
            marginBottom: "16px",
          }}>Solo Session</p>

          <p style={{
            color: tokens.colors.text.secondary,
            marginBottom: "32px",
            lineHeight: "1.8",
          }}>
            Hey {displayName}. Erzähl mir was dich beschäftigt –<br />
            über dich und {partnerName}.
          </p>

          {analysisError && (
            <div style={{
              background: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "#fef2f2",
              border: `1px solid ${tokens.colors.error}`,
              borderRadius: tokens.radii.md,
              padding: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              textAlign: "left",
            }}>
              <AlertTriangle size={20} color={tokens.colors.error} style={{ flexShrink: 0 }} />
              <p style={{
                color: tokens.colors.error,
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.5",
              }}>{analysisError}</p>
            </div>
          )}

          <button onClick={startSession} style={{
            padding: "18px 40px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
            color: "white",
            fontWeight: "600",
            fontSize: "18px",
            border: "none",
            borderRadius: tokens.radii.lg,
            cursor: "pointer",
            boxShadow: isDarkMode
              ? tokens.shadows.glow(tokens.colors.aurora.lavender)
              : "0 4px 20px rgba(139,92,246,0.3)",
            fontFamily: tokens.fonts.body,
          }}>
            Session starten
          </button>

          <p style={{
            marginTop: "24px",
            fontSize: "13px",
            color: tokens.colors.text.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}><Headphones size={16} /> Beste Erfahrung mit Kopfhörern</p>
        </div>

        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: tokens.colors.bg.elevated,
          borderTop: `1px solid ${tokens.colors.bg.soft}`,
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0 24px 0",
        }}>
          <button style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            padding: "8px 16px",
          }}>
            <HomeIcon size={24} color={tokens.colors.aurora.lavender} />
            <span style={{
              fontSize: "12px",
              color: tokens.colors.aurora.lavender,
              fontWeight: "600",
            }}>Home</span>
          </button>
          <button onClick={() => router.push("/wir")} style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            padding: "8px 16px",
          }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Heart size={24} color={tokens.colors.text.muted} />
              {pendingSuggestionsCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-10px",
                  background: tokens.colors.error,
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "bold",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}>{pendingSuggestionsCount}</span>
              )}
            </div>
            <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Wir</span>
          </button>
          <button onClick={() => router.push("/history")} style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            padding: "8px 16px",
          }}>
            <ClipboardList size={24} color={tokens.colors.text.muted} />
            <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Verlauf</span>
          </button>
          <button onClick={() => router.push("/profile")} style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            padding: "8px 16px",
          }}>
            <User size={24} color={tokens.colors.text.muted} />
            <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Profil</span>
          </button>
        </div>

        {showAnalysis && analysisSessionId && (
          <AnalysisView
            sessionId={analysisSessionId}
            onClose={handleCloseAnalysis}
          />
        )}
      </div>
    );
  }

  // ANALYSIS GENERATING SCREEN
  if (isGeneratingAnalysis) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: `5px solid ${tokens.colors.bg.soft}`,
            borderTopColor: tokens.colors.aurora.lavender,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "24px",
          }} />
          <h2 style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: tokens.colors.text.primary,
            marginBottom: "12px",
            fontFamily: tokens.fonts.display,
          }}>Analyse wird erstellt...</h2>
          <p style={{
            color: tokens.colors.text.secondary,
            fontSize: "15px",
            textAlign: "center",
            lineHeight: "1.6",
          }}>
            Amiya wertet euer Gespräch aus.<br />
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

  // SESSION SCREEN
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: tokens.colors.bg.deep,
    }}>
      <div style={{
        background: isDarkMode ? "rgba(37, 41, 49, 0.9)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${tokens.colors.bg.soft}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: tokens.radii.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            background: getStateColor(voiceState),
          }}>
            {voiceState === STATE.CONNECTING && <Loader2 size={22} color="white" style={{ animation: "spin 1s linear infinite" }} />}
            {voiceState === STATE.LISTENING && <Ear size={22} color="white" />}
            {voiceState === STATE.THINKING && <MessageCircle size={22} color="white" />}
            {voiceState === STATE.SPEAKING && <Volume2 size={22} color="white" />}
            {voiceState === STATE.IDLE && <Heart size={22} color="white" />}
          </div>
          <div>
            <div style={{
              fontWeight: "600",
              color: tokens.colors.text.primary,
              fontSize: "17px",
            }}>Solo Session</div>
            <div style={{
              fontSize: "13px",
              color: tokens.colors.text.secondary,
            }}>{formatTime(sessionTime)}</div>
          </div>
        </div>
        <button onClick={handleEndClick} style={{
          padding: "8px 16px",
          background: isDarkMode ? "rgba(248, 113, 113, 0.2)" : "#fee2e2",
          color: tokens.colors.error,
          border: "none",
          borderRadius: tokens.radii.sm,
          cursor: "pointer",
          fontWeight: "500",
        }}>Beenden</button>
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}>
        <div style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          border: `6px solid ${tokens.colors.bg.soft}`,
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
            background: tokens.colors.bg.elevated,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {voiceState === STATE.CONNECTING && (
              <div style={{
                width: "40px",
                height: "40px",
                border: `4px solid ${tokens.colors.bg.soft}`,
                borderTopColor: tokens.colors.text.muted,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
            )}
            {voiceState === STATE.LISTENING && (
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${tokens.colors.success}, #16a34a)`,
                animation: "pulse 2s ease-in-out infinite",
              }} />
            )}
            {voiceState === STATE.THINKING && (
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${tokens.colors.warning}, #d97706)`,
                animation: "breathe 1.5s ease-in-out infinite",
              }} />
            )}
            {voiceState === STATE.SPEAKING && (
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                animation: "pulse 1s ease-in-out infinite",
              }} />
            )}
            {voiceState === STATE.IDLE && <Mic size={60} color={tokens.colors.text.muted} />}
          </div>
        </div>

        <p style={{
          color: tokens.colors.text.primary,
          fontSize: "20px",
          fontWeight: "600",
          marginTop: "32px",
        }}>{getStatusText(voiceState)}</p>

        <p style={{
          color: tokens.colors.text.muted,
          fontSize: "14px",
          marginTop: "12px",
          minHeight: "20px",
        }}>
          {voiceState === STATE.LISTENING && "Sprich einfach..."}
          {voiceState === STATE.SPEAKING && "Unterbrechen? Einfach sprechen."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {showEndDialog && (
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
            <h3 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              marginBottom: "12px",
              fontFamily: tokens.fonts.display,
            }}>Session beenden?</h3>
            <p style={{
              color: tokens.colors.text.secondary,
              marginBottom: "24px",
              lineHeight: "1.5",
            }}>
              {messageCount > 0
                ? "Möchtest du eine Analyse dieser Session?"
                : "Keine Gespräche aufgezeichnet."
              }
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <button
                onClick={() => endSession(false)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: tokens.colors.bg.surface,
                  color: tokens.colors.text.primary,
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
                onClick={() => endSession(true)}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                  color: "white",
                  border: "none",
                  borderRadius: tokens.radii.md,
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: messageCount > 0 ? "pointer" : "not-allowed",
                  opacity: messageCount > 0 ? 1 : 0.5,
                }}
                disabled={messageCount === 0}
              >
                Mit Analyse
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalysis && analysisSessionId && (
        <AnalysisView
          sessionId={analysisSessionId}
          onClose={handleCloseAnalysis}
        />
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
              Für eine hilfreiche Analyse brauche ich etwas mehr Kontext von dir.
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
                Erzähl mir einfach, was dich beschäftigt – auch wenn es nur ein Gefühl oder eine Situation ist.
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
                resetSession();
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

function getStateColor(state) {
  const colors = {
    [STATE.CONNECTING]: "linear-gradient(135deg, #6b7280, #4b5563)",
    [STATE.LISTENING]: "linear-gradient(135deg, #22c55e, #16a34a)",
    [STATE.THINKING]: "linear-gradient(135deg, #f59e0b, #d97706)",
    [STATE.SPEAKING]: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    [STATE.IDLE]: "linear-gradient(135deg, #6b7280, #4b5563)"
  };
  return colors[state] || colors[STATE.IDLE];
}

// getStateEmoji removed - using inline Lucide icons instead

function getStatusText(state) {
  const texts = {
    [STATE.CONNECTING]: "Verbinde...",
    [STATE.LISTENING]: "Ich höre zu",
    [STATE.THINKING]: "Ich denke nach",
    [STATE.SPEAKING]: "Amiya spricht",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

function getStatusRingStyle(state) {
  const ringStyles = {
    [STATE.CONNECTING]: { borderColor: "#6b7280" },
    [STATE.LISTENING]: { borderColor: "#22c55e", boxShadow: "0 0 40px rgba(34,197,94,0.3)" },
    [STATE.THINKING]: { borderColor: "#f59e0b", boxShadow: "0 0 40px rgba(245,158,11,0.3)" },
    [STATE.SPEAKING]: { borderColor: "#8b5cf6", boxShadow: "0 0 40px rgba(139,92,246,0.3)" },
    [STATE.IDLE]: { borderColor: "#6b7280" }
  };
  return ringStyles[state] || ringStyles[STATE.IDLE];
}

// All styles now use theme tokens inline
