/**
 * MAIN PAGE - app/page.js
 * Hauptseite mit Solo Voice-Session
 * OPTIMIERT: Sofortiges Audio-Stop + Analyse-Loading-State
 */
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
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);

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
      // Lade Kontext aus früheren Sessions
      let userContext = "";
      try {
        const contextResponse = await fetch("/api/get-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.id,
            coupleId: profile?.couple_id || null
          }),
        });
        
        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          userContext = contextData.context || "";
          console.log(`Loaded context from ${contextData.sessionCount} sessions`);
        }
      } catch (contextError) {
        console.error("Failed to load context:", contextError);
        // Weitermachen ohne Kontext
      }

      const session = await sessionsService.create(user.id, "solo");
      setCurrentSessionId(session.id);

      const { Conversation } = await import("@11labs/client");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        dynamicVariables: {
          user_name: profile?.name || "",
          partner_name: profile?.partner_name || "",
          user_context: userContext,
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs");
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
      console.error("Failed to start session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setStarted(false);
      setVoiceState(STATE.IDLE);
    }
  }, [user, profile]);

  // OPTIMIERT: Sofort Audio stoppen wenn End-Button geklickt wird
  const handleEndClick = useCallback(async () => {
    // Sofort aufhören zuzuhören
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

  // Prüft via Claude ob genug Kontext für eine sinnvolle Analyse vorhanden ist
  const checkAnalysisViability = useCallback(async () => {
    const messages = messagesRef.current;
    if (messages.length === 0) return { viable: false, reason: "empty" };
    
    // Erstelle Transcript für Check
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
        // Fallback: Wenn API fehlschlägt, erlaube Analyse
        return { viable: true, reason: null };
      }
      
      const data = await response.json();
      return { viable: data.viable, reason: data.reason };
    } catch (error) {
      console.error("Analysis viability check failed:", error);
      // Fallback: Wenn API fehlschlägt, erlaube Analyse
      return { viable: true, reason: null };
    }
  }, []);

  // resetSession muss VOR endSession definiert werden
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
    
    // Reset error state
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
          // Zeige Loading-State während Viability-Check
          setIsGeneratingAnalysis(true);
          setShowEndDialog(false);
          
          // Prüfe ob genug Inhalt vorhanden
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
              resetSession();
            }, 3000);
            return;
          }
          
          try {
            await sessionsService.requestAnalysis(currentSessionId);
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
      setAnalysisError("Keine Analyse möglich – es wurden keine Gespräche aufgezeichnet.");
      setShowEndDialog(false);
      setTimeout(() => {
        resetSession();
      }, 3000);
      return;
    }
    
    if (!requestAnalysis) {
      setShowEndDialog(false);
      resetSession();
    }
  }, [currentSessionId, profile, checkAnalysisViability, resetSession]);

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisSessionId(null);
    setAnalysisError(null);
    resetSession();
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

  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Laden...</p>
      </div>
    );
  }

  if (!user || !profile?.name || !profile?.partner_name) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // ============ START SCREEN ============
  if (!started && !isGeneratingAnalysis) {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          <div style={styles.userBar}>
            <button 
              onClick={() => router.push("/profile")} 
              style={styles.profileButton}
            >
              <span style={styles.profileAvatar}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span>{displayName}</span>
            </button>
            <button onClick={signOut} style={styles.signOutButton}>
              Abmelden
            </button>
          </div>

          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Amiya</h1>
          <p style={styles.subtitle}>Solo Session</p>
          
          <p style={styles.description}>
            Hey {displayName}. Erzähl mir was dich beschäftigt –<br/>
            über dich und {partnerName}.
          </p>
          
          {analysisError && (
            <div style={styles.errorBanner}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.errorText}>{analysisError}</p>
            </div>
          )}
          
          <button onClick={startSession} style={styles.startButton}>
            Session starten
          </button>
          
          <p style={styles.hint}>🎧 Beste Erfahrung mit Kopfhörern</p>
        </div>

        {/* Bottom Navigation */}
        <div style={styles.bottomNav}>
          <button style={{...styles.navItem, ...styles.navItemActive}}>
            <span style={styles.navIcon}>🏠</span>
            <span style={{...styles.navLabel, ...styles.navLabelActive}}>Home</span>
          </button>
          <button onClick={() => router.push("/wir")} style={styles.navItem}>
            <span style={styles.navIcon}>💑</span>
            <span style={styles.navLabel}>Wir</span>
          </button>
          <button onClick={() => router.push("/history")} style={styles.navItem}>
            <span style={styles.navIcon}>📋</span>
            <span style={styles.navLabel}>Verlauf</span>
          </button>
          <button onClick={() => router.push("/profile")} style={styles.navItem}>
            <span style={styles.navIcon}>👤</span>
            <span style={styles.navLabel}>Profil</span>
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

  // ============ ANALYSIS GENERATING SCREEN ============
  if (isGeneratingAnalysis) {
    return (
      <div style={styles.sessionContainer}>
        <div style={styles.analysisLoadingContainer}>
          <div style={styles.analysisSpinner} />
          <h2 style={styles.analysisLoadingTitle}>Analyse wird erstellt...</h2>
          <p style={styles.analysisLoadingText}>
            Amiya wertet euer Gespräch aus.<br/>
            Das dauert einen Moment.
          </p>
        </div>

        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // ============ SESSION SCREEN ============
  return (
    <div style={styles.sessionContainer}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.headerIcon, background: getStateColor(voiceState)}}>
            {getStateEmoji(voiceState)}
          </div>
          <div>
            <div style={styles.headerTitle}>Solo Session</div>
            <div style={styles.headerSubtitle}>{formatTime(sessionTime)}</div>
          </div>
        </div>
        <button onClick={handleEndClick} style={styles.endButton}>Beenden</button>
      </div>

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
          {voiceState === STATE.LISTENING && "Sprich einfach..."}
          {voiceState === STATE.SPEAKING && "Unterbrechen? Einfach sprechen."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {showEndDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Session beenden?</h3>
            <p style={styles.dialogText}>
              {messageCount > 0
                ? "Möchtest du eine Analyse dieser Session?"
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

      {showAnalysis && analysisSessionId && (
        <AnalysisView 
          sessionId={analysisSessionId} 
          onClose={handleCloseAnalysis} 
        />
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
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    paddingBottom: "100px",
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
    padding: "8px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#374151",
  },
  profileAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
  },
  signOutButton: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "14px",
    padding: "8px 12px",
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
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    textAlign: "left",
  },
  errorIcon: {
    fontSize: "20px",
    flexShrink: 0,
  },
  errorText: {
    color: "#dc2626",
    fontSize: "14px",
    margin: 0,
    lineHeight: "1.5",
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
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    padding: "12px 0 24px 0",
  },
  navItem: {
    background: "none",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    padding: "8px 16px",
  },
  navItemActive: {},
  navIcon: {
    fontSize: "24px",
  },
  navLabel: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  navLabelActive: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
};
