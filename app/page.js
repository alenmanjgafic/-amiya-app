"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { sessionsService } from "../lib/sessions";
import AnalysisView from "../components/AnalysisView";

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
  const router = useRouter();
  
  const [started, setStarted] = useState(false);
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [messages, setMessages] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(null);
  
  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Session timer
  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  // Start conversation
  const startSession = useCallback(async () => {
    if (!user) return;
    
    setStarted(true);
    setVoiceState(STATE.CONNECTING);

    try {
      // Create session in database
      const session = await sessionsService.create(user.id, 'solo');
      setCurrentSessionId(session.id);

      // Dynamically import ElevenLabs SDK
      const { Conversation } = await import("@11labs/client");

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        onConnect: () => {
          console.log("Connected to ElevenLabs");
          setVoiceState(STATE.LISTENING);
        },
        onDisconnect: () => {
          console.log("Disconnected from ElevenLabs");
          setVoiceState(STATE.IDLE);
        },
        onMessage: (message) => {
          console.log("Message:", message);
          
          if (message.type === "user_transcript") {
            setCurrentTranscript(message.text || "");
          }
          
          if (message.type === "agent_response") {
            if (message.user_transcript) {
              setMessages(prev => [...prev, { 
                role: "user", 
                content: message.user_transcript 
              }]);
              setCurrentTranscript("");
            }
            
            if (message.agent_response) {
              setMessages(prev => [...prev, { 
                role: "assistant", 
                content: message.agent_response 
              }]);
            }
          }
        },
        onModeChange: (mode) => {
          if (mode.mode === "listening") {
            setVoiceState(STATE.LISTENING);
          } else if (mode.mode === "thinking") {
            setVoiceState(STATE.THINKING);
          } else if (mode.mode === "speaking") {
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
      console.error("Failed to start session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setStarted(false);
      setVoiceState(STATE.IDLE);
    }
  }, [user]);

  // End conversation - show dialog
  const handleEndClick = () => {
    setShowEndDialog(true);
  };

  // Actually end the session
  const endSession = useCallback(async (requestAnalysis = false) => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    
    const sessionIdToAnalyze = currentSessionId;
    
    // Save session to database
    if (currentSessionId) {
      try {
        // Create summary from messages
        const summary = messages
          .map(m => `${m.role === 'user' ? 'User' : 'Amiya'}: ${m.content}`)
          .join('\n');
        
        await sessionsService.end(currentSessionId, summary, []);
        
        if (requestAnalysis) {
          await sessionsService.requestAnalysis(currentSessionId);
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    }
    
    // Reset session state
    setShowEndDialog(false);
    setStarted(false);
    setVoiceState(STATE.IDLE);
    setMessages([]);
    setSessionTime(0);
    setCurrentTranscript("");
    setCurrentSessionId(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Show analysis if requested
    if (requestAnalysis && sessionIdToAnalyze) {
      setAnalysisSessionId(sessionIdToAnalyze);
      setShowAnalysis(true);
    }
  }, [currentSessionId, messages]);

  // Close analysis view
  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisSessionId(null);
  };

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

  // Loading state
  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  // Not logged in (will redirect)
  if (!user) {
    return null;
  }

  // ============ START SCREEN ============
  if (!started) {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          {/* User info */}
          <div style={styles.userBar}>
            <span>Hallo, {profile?.name || 'du'} 👋</span>
            <button onClick={signOut} style={styles.signOutButton}>
              Abmelden
            </button>
          </div>

          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Amiya</h1>
          <p style={styles.subtitle}>Solo Session</p>
          <p style={styles.description}>
            Sprich frei. Ich höre zu und antworte dir.<br/>
            Du kannst mich jederzeit unterbrechen.
          </p>
          <button onClick={startSession} style={styles.startButton}>
            Session starten
          </button>
          <p style={styles.hint}>🎧 Beste Erfahrung mit Kopfhörern</p>
        </div>

        {/* Show analysis overlay if active */}
        {showAnalysis && analysisSessionId && (
          <AnalysisView 
            sessionId={analysisSessionId} 
            onClose={handleCloseAnalysis} 
          />
        )}
      </div>
    );
  }

  // ============ SESSION SCREEN ============
  return (
    <div style={styles.sessionContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.headerIcon, background: getStateColor(voiceState)}}>
            {getStateEmoji(voiceState)}
          </div>
          <div>
            <div style={styles.headerTitle}>Amiya</div>
            <div style={styles.headerSubtitle}>{formatTime(sessionTime)}</div>
          </div>
        </div>
        <button onClick={handleEndClick} style={styles.endButton}>Beenden</button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            ...styles.messageBubble,
            ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble)
          }}>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Status */}
      <div style={styles.voiceStatus}>
        <div style={{...styles.statusRing, ...getStatusRingStyle(voiceState)}}>
          <div style={styles.statusInner}>
            {voiceState === STATE.CONNECTING && <div style={styles.spinnerSmall} />}
            {voiceState === STATE.LISTENING && <div style={styles.listeningPulse} />}
            {voiceState === STATE.THINKING && <span style={styles.thinkingDots}>...</span>}
            {voiceState === STATE.SPEAKING && <span style={styles.speakingIcon}>🗣️</span>}
            {voiceState === STATE.IDLE && <span style={styles.micIcon}>🎤</span>}
          </div>
        </div>

        <p style={styles.statusText}>{getStatusText(voiceState)}</p>

        {currentTranscript && (
          <div style={styles.transcriptBox}>
            "{currentTranscript}"
          </div>
        )}
      </div>

      {/* End Session Dialog */}
      {showEndDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Session beenden?</h3>
            <p style={styles.dialogText}>
              Möchtest du eine Analyse dieser Session?
            </p>
            <div style={styles.dialogButtons}>
              <button 
                onClick={() => endSession(false)} 
                style={styles.dialogButtonSecondary}
              >
                Nein, nur beenden
              </button>
              <button 
                onClick={() => endSession(true)} 
                style={styles.dialogButtonPrimary}
              >
                Ja, mit Analyse
              </button>
            </div>
            <button 
              onClick={() => setShowEndDialog(false)} 
              style={styles.dialogCancel}
            >
              Weiter sprechen
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
    [STATE.LISTENING]: "Ich höre zu...",
    [STATE.THINKING]: "Ich denke nach...",
    [STATE.SPEAKING]: "Amiya spricht...",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

function getStatusRingStyle(state) {
  const ringStyles = {
    [STATE.CONNECTING]: { borderColor: "#6b7280" },
    [STATE.LISTENING]: { borderColor: "#22c55e", boxShadow: "0 0 20px rgba(34,197,94,0.4)" },
    [STATE.THINKING]: { borderColor: "#f59e0b", boxShadow: "0 0 20px rgba(245,158,11,0.4)" },
    [STATE.SPEAKING]: { borderColor: "#8b5cf6", boxShadow: "0 0 20px rgba(139,92,246,0.4)" },
    [STATE.IDLE]: { borderColor: "#6b7280" }
  };
  return ringStyles[state] || ringStyles[STATE.IDLE];
}

// Styles
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
    width: "30px",
    height: "30px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#6b7280",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  startScreen: { 
    maxWidth: "400px", 
    textAlign: "center",
    width: "100%",
  },
  userBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    padding: "12px 16px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  signOutButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
  },
  logo: {
    width: "100px",
    height: "100px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "28px",
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "50px",
    boxShadow: "0 10px 40px rgba(139,92,246,0.3)",
  },
  title: { 
    fontSize: "36px", 
    fontWeight: "bold", 
    color: "#1f2937", 
    marginBottom: "8px" 
  },
  subtitle: { 
    color: "#6b7280", 
    fontSize: "16px", 
    marginBottom: "16px" 
  },
  description: { 
    color: "#4b5563", 
    marginBottom: "32px", 
    lineHeight: "1.8" 
  },
  startButton: {
    padding: "18px 40px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    fontWeight: "600",
    fontSize: "18px",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
  },
  hint: { 
    marginTop: "24px", 
    fontSize: "13px", 
    color: "#9ca3af" 
  },
  sessionContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)",
  },
  header: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e9d5ff",
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
  endButton: {
    padding: "8px 16px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "14px 18px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    borderBottomRightRadius: "4px",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "white",
    color: "#1f2937",
    borderBottomLeftRadius: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  voiceStatus: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid #e9d5ff",
    padding: "24px 20px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statusRing: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "4px solid #6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  statusInner: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(139,92,246,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  listeningPulse: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#22c55e",
    animation: "pulse 1.5s infinite",
  },
  thinkingDots: {
    fontSize: "32px",
    color: "#f59e0b",
  },
  speakingIcon: {
    fontSize: "32px",
  },
  micIcon: {
    fontSize: "32px",
  },
  statusText: { 
    color: "#6b7280", 
    fontSize: "14px", 
    marginTop: "16px" 
  },
  transcriptBox: {
    marginTop: "12px",
    padding: "12px 20px",
    background: "#f3f4f6",
    borderRadius: "12px",
    maxWidth: "90%",
    color: "#4b5563",
    fontSize: "14px",
    fontStyle: "italic",
  },
  // Dialog styles
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
  dialogCancel: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "14px",
    cursor: "pointer",
  },
};
