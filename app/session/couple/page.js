/**
 * COUPLE SESSION PAGE - app/session/couple/page.js
 * Gemeinsame Session für beide Partner
 * 
 * v2.1: Speaker Detection
 * - Trackt welche Person zuletzt von Amiya angesprochen wurde
 * - Versucht aus Kontext zu erkennen wer spricht
 * - Bessere Summary-Struktur für Analyse
 */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { sessionsService } from "../../../lib/sessions";

const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";

const STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

export default function CoupleSessionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  
  // Speaker Detection: Track who Amiya last addressed
  const lastAddressedRef = useRef(null);  // "user" | "partner" | null

  // Max session time: 1 hour
  const MAX_SESSION_TIME = 60 * 60; // seconds

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Redirect if not connected to partner
  useEffect(() => {
    if (!authLoading && user && profile && !profile.couple_id) {
      router.push("/wir");
    }
  }, [user, profile, authLoading, router]);

  // Session timer
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

  /**
   * Detect who is being addressed in Amiya's message
   * Returns: "user" | "partner" | null
   */
  const detectAddressedPerson = useCallback((amiyaMessage) => {
    if (!amiyaMessage) return null;
    
    const messageLower = amiyaMessage.toLowerCase();
    const userNameLower = userName.toLowerCase();
    const partnerNameLower = partnerName.toLowerCase();
    
    // Check if message ends with addressing someone (most reliable)
    // Patterns like "..., Alen?" or "...Alen, was denkst du?"
    const addressPatterns = [
      new RegExp(`${userNameLower}[,?]?\\s*$`, 'i'),
      new RegExp(`${userNameLower},\\s+(was|wie|kannst|möchtest|würdest)`, 'i'),
      new RegExp(`(und du|was denkst du|wie siehst du das),?\\s*${userNameLower}`, 'i'),
    ];
    
    const partnerPatterns = [
      new RegExp(`${partnerNameLower}[,?]?\\s*$`, 'i'),
      new RegExp(`${partnerNameLower},\\s+(was|wie|kannst|möchtest|würdest)`, 'i'),
      new RegExp(`(und du|was denkst du|wie siehst du das),?\\s*${partnerNameLower}`, 'i'),
    ];
    
    // Check user patterns
    for (const pattern of addressPatterns) {
      if (pattern.test(messageLower)) {
        return "user";
      }
    }
    
    // Check partner patterns
    for (const pattern of partnerPatterns) {
      if (pattern.test(messageLower)) {
        return "partner";
      }
    }
    
    // Fallback: check if name appears at all (less reliable)
    const userMentioned = messageLower.includes(userNameLower);
    const partnerMentioned = messageLower.includes(partnerNameLower);
    
    if (userMentioned && !partnerMentioned) return "user";
    if (partnerMentioned && !userMentioned) return "partner";
    
    return null;
  }, [userName, partnerName]);

  /**
   * Determine speaker label for a user message
   * Uses context from Amiya's previous message
   */
  const getSpeakerLabel = useCallback((userMessage) => {
    // If we know who was addressed, use that
    if (lastAddressedRef.current === "user") {
      return userName;
    }
    if (lastAddressedRef.current === "partner") {
      return partnerName;
    }
    
    // Try to detect from message content
    const messageLower = userMessage.toLowerCase();
    
    // Self-identification patterns
    if (messageLower.includes("ich als " + userName.toLowerCase()) ||
        messageLower.includes("ich, " + userName.toLowerCase()) ||
        messageLower.startsWith(userName.toLowerCase() + " hier")) {
      return userName;
    }
    if (messageLower.includes("ich als " + partnerName.toLowerCase()) ||
        messageLower.includes("ich, " + partnerName.toLowerCase()) ||
        messageLower.startsWith(partnerName.toLowerCase() + " hier")) {
      return partnerName;
    }
    
    // Fallback: unknown speaker
    return "Paar";
  }, [userName, partnerName]);

  // Start conversation
  const startSession = useCallback(async () => {
    if (!user || !profile) return;
    
    setIsStarted(true);
    setVoiceState(STATE.CONNECTING);
    messagesRef.current = [];
    setMessageCount(0);
    setAnalysisError(null);
    lastAddressedRef.current = null;

    try {
      // Load context from Memory System
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

      // Create session in database as "couple" type
      const session = await sessionsService.create(user.id, "couple", profile.couple_id);
      setCurrentSessionId(session.id);

      // Dynamically import ElevenLabs SDK
      const { Conversation } = await import("@elevenlabs/client");

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("Couple context length:", userContext.length);

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: userName,
          partner_name: partnerName,
          user_context: userContext || "Erste gemeinsame Session.",
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
            const isAmiya = message.source !== "user";
            const content = message.message;
            
            // Avoid duplicates
            const lastMsg = messagesRef.current[messagesRef.current.length - 1];
            if (lastMsg && lastMsg.content === content) return;
            
            if (isAmiya) {
              // Amiya's message - detect who she's addressing
              const addressed = detectAddressedPerson(content);
              if (addressed) {
                lastAddressedRef.current = addressed;
                console.log(`Amiya addressed: ${addressed === "user" ? userName : partnerName}`);
              }
              
              messagesRef.current.push({ 
                role: "assistant", 
                content,
                speaker: "Amiya"
              });
            } else {
              // User message - determine speaker
              const speaker = getSpeakerLabel(content);
              console.log(`Speaker detected: ${speaker}`);
              
              messagesRef.current.push({ 
                role: "user", 
                content,
                speaker: speaker
              });
              
              // Reset after user responds (next turn is unknown)
              // Keep it for one message in case of follow-up
            }
            
            setMessageCount(messagesRef.current.length);
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
  }, [user, profile, userName, partnerName, router, detectAddressedPerson, getSpeakerLabel]);

  // Auto-start on mount
  useEffect(() => {
    if (!authLoading && user && profile && profile.couple_id && !isStarted) {
      startSession();
    }
  }, [authLoading, user, profile, isStarted, startSession]);

  // Stop audio immediately when End button clicked
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
    setShowEndDialog(true);
  }, []);

  // Check if enough context for meaningful analysis
  const checkAnalysisViability = useCallback(async () => {
    const messages = messagesRef.current;
    if (messages.length === 0) return { viable: false, reason: "empty" };
    
    // Create transcript for check
    const transcript = messages
      .map(m => `${m.speaker || (m.role === "user" ? "Paar" : "Amiya")}: ${m.content}`)
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
    lastAddressedRef.current = null;
    
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
        // Build summary with speaker labels
        let summary = "";
        summary += `[Couple Session: ${userName} & ${partnerName}]\n`;
        summary += `[Hinweis: Wenn "Paar" als Sprecher steht, war der genaue Sprecher nicht eindeutig erkennbar]\n\n`;
        
        // Group messages by speaker for better readability
        summary += currentMessages
          .map(m => {
            const speaker = m.speaker || (m.role === "user" ? "Paar" : "Amiya");
            return `${speaker}: ${m.content}`;
          })
          .join("\n");
        
        await sessionsService.end(currentSessionId, summary, []);
        
        if (requestAnalysis) {
          setIsGeneratingAnalysis(true);
          setShowEndDialog(false);
          
          // Check viability
          const viability = await checkAnalysisViability();
          
          if (!viability.viable) {
            setIsGeneratingAnalysis(false);
            const errorMessages = {
              "empty": "Keine Analyse möglich – es wurden keine Gespräche aufgezeichnet.",
              "too_short": "Keine Analyse möglich – das Gespräch war zu kurz für eine aussagekräftige Auswertung.",
              "no_context": "Keine Analyse möglich – es fehlt verwertbarer Kontext für eine sinnvolle Analyse.",
              "unclear": "Keine Analyse möglich – der Gesprächsinhalt war nicht klar genug für eine Auswertung."
            };
            setAnalysisError(errorMessages[viability.reason] || "Keine Analyse möglich – nicht genügend Inhalt vorhanden.");
            setTimeout(() => {
              router.push("/wir");
            }, 3000);
            return;
          }
          
          try {
            const analysisResult = await sessionsService.requestAnalysis(currentSessionId);
            
            // Memory update after successful analysis
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

  // Cleanup on unmount
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

  // Time warning at 50 minutes
  const timeWarning = sessionTime >= 50 * 60 && sessionTime < 50 * 60 + 5;

  if (authLoading || !profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  // ============ ANALYSIS GENERATING SCREEN ============
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

  // ============ ERROR SCREEN ============
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
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.headerIcon, background: getStateColor(voiceState)}}>
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

      {/* Couple indicator */}
      <div style={styles.coupleIndicator}>
        <span style={styles.coupleName}>{userName}</span>
        <span style={styles.coupleHeart}>💜</span>
        <span style={styles.coupleName}>{partnerName}</span>
      </div>

      {/* Voice Interface */}
      <div style={styles.voiceOnlyContainer}>
        <div style={{...styles.statusRing, ...getStatusRingStyle(voiceState)}}>
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
          {voiceState === STATE.LISTENING && "Sprecht abwechselnd – Amiya wird euch ansprechen"}
          {voiceState === STATE.SPEAKING && "Amiya moderiert..."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {/* End Session Dialog */}
      {showEndDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Session beenden?</h3>
            <p style={styles.dialogText}>
              {messageCount > 0
                ? "Möchtet ihr eine gemeinsame Analyse?"
                : "Keine Gespräche aufgezeichnet."
              }
            </p>
            <div style={styles.dialogButtons}>
              <button 
                onClick={() => endSession(false)} 
                style={styles.dialogButtonSecondary}
              >
                Ohne Analyse
              </button>
              <button 
                onClick={() => endSession(true)} 
                style={{
                  ...styles.dialogButtonPrimary,
                  opacity: messageCount > 0 ? 1 : 0.5,
                  cursor: messageCount > 0 ? "pointer" : "not-allowed"
                }}
                disabled={messageCount === 0}
              >
                Mit Analyse
              </button>
            </div>
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

// Helpers
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

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
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
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
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
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
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
    textAlign: "center",
  },
  // Analysis Loading Screen
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
    border: "5px solid #e5e7eb",
    borderTopColor: "#8b5cf6",
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
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
