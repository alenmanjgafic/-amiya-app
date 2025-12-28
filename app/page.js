"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SYSTEM_PROMPT = `Du bist Amiya, ein erfahrener Paartherapeut in einer Solo-Session. Die Person spricht alleine mit dir über ihre Beziehung.

## DEIN CHARAKTER
- Direkt, warm, aufmerksam
- Du führst das Gespräch – du bist nicht passiv
- Kurze Sätze, kein Therapeuten-Jargon
- Du sagst auch unbequeme Wahrheiten

## WICHTIG FÜR VOICE
- Halte Antworten KURZ (1-3 Sätze max)
- Sprich natürlich, nicht schriftlich
- Eine Frage pro Antwort

## DEINE KERN-PRINZIPIEN

### CLARITY OVER COMFORT
Dein Ziel ist Klarheit, nicht Wohlgefühl.

### FAKTEN ZUERST
Bevor du interpretierst, sammle konkrete Fakten:
- "Wie viele Kinder habt ihr? Wie alt?"
- "Wie oft passiert das?"
- "Was genau hat sie gesagt?"

### BEIDE PERSPEKTIVEN
- "Wie siehst du das?"
- "Wie glaubst du sieht sie das?"

### AKTIV FÜHREN
- Benenne Muster wenn du sie siehst
- Konfrontiere Vermeidung direkt

## GESPRÄCHS-STRUKTUR
1. VERSTEHEN: Sammle Fakten, frag nach Details
2. SPIEGELN: Fasse zusammen was du verstanden hast
3. EINORDNEN: Gib Perspektive und nächste Schritte

## START
Beginne mit: "Hey. Was ist los?"`;

// Voice States
const STATE = {
  IDLE: "idle",
  LISTENING: "listening", 
  THINKING: "thinking",
  SPEAKING: "speaking"
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [started, setStarted] = useState(false);
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SR = window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "de-DE";

      recognitionRef.current.onresult = (e) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        
        setTranscript(prev => {
          const newTranscript = prev + final;
          if (interim) return newTranscript + interim;
          return newTranscript;
        });

        // Reset silence timer on speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        if (final) {
          // Start silence detection after final result
          silenceTimerRef.current = setTimeout(() => {
            if (voiceState === STATE.LISTENING) {
              handleSendMessage();
            }
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (e) => {
        console.error("Speech error:", e.error);
        if (e.error !== "no-speech") {
          setVoiceState(STATE.IDLE);
        }
      };

      recognitionRef.current.onend = () => {
        // Restart if still in listening mode
        if (voiceState === STATE.LISTENING) {
          try {
            recognitionRef.current.start();
          } catch (err) {}
        }
      };
    }
  }, [voiceState]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Spracherkennung nicht unterstützt. Bitte nutze Chrome.");
      return;
    }
    setTranscript("");
    setVoiceState(STATE.LISTENING);
    try {
      recognitionRef.current.start();
    } catch (err) {}
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const speakText = useCallback(async (text) => {
    setVoiceState(STATE.SPEAKING);
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioRef.current = new Audio(url);
        
        audioRef.current.onended = () => {
          setVoiceState(STATE.IDLE);
          // Auto-start listening after Amiya finishes
          setTimeout(() => startListening(), 300);
        };
        
        await audioRef.current.play();
      } else {
        setVoiceState(STATE.IDLE);
        startListening();
      }
    } catch (err) {
      console.error("Speech error:", err);
      setVoiceState(STATE.IDLE);
      startListening();
    }
  }, [startListening]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setVoiceState(STATE.IDLE);
  }, []);

  const handleSendMessage = useCallback(async () => {
    const text = transcript.trim();
    if (!text) {
      startListening();
      return;
    }

    stopListening();
    setVoiceState(STATE.THINKING);
    
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setTranscript("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, system: SYSTEM_PROMPT }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
      await speakText(data.message);
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = "Entschuldige, da gab es ein Problem. Kannst du das nochmal sagen?";
      setMessages([...newMessages, { role: "assistant", content: errorMsg }]);
      await speakText(errorMsg);
    }
  }, [transcript, messages, stopListening, speakText, startListening]);

  // Handle interruption
  const handleInterrupt = useCallback(() => {
    if (voiceState === STATE.SPEAKING) {
      stopSpeaking();
      startListening();
    }
  }, [voiceState, stopSpeaking, startListening]);

  const startSession = async () => {
    setStarted(true);
    const greeting = "Hey. Was ist los?";
    setMessages([{ role: "assistant", content: greeting }]);
    await speakText(greeting);
  };

  const endSession = () => {
    stopListening();
    stopSpeaking();
    setMessages([]);
    setStarted(false);
    setSessionTime(0);
    setTranscript("");
    setVoiceState(STATE.IDLE);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start Screen
  if (!started) {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Amiya</h1>
          <p style={styles.subtitle}>Solo Session</p>
          <p style={styles.description}>
            Sprich frei. Ich höre zu und antworte dir.
          </p>
          <button onClick={startSession} style={styles.startButton}>
            Session starten
          </button>
          <p style={styles.hint}>🎤 Nutze Chrome für beste Spracherkennung</p>
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
            <div style={styles.headerTitle}>Amiya</div>
            <div style={styles.headerSubtitle}>{formatTime(sessionTime)}</div>
          </div>
        </div>
        <button onClick={endSession} style={styles.endButton}>Beenden</button>
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

      {/* Voice Interface */}
      <div style={styles.voiceInterface}>
        {/* Status Indicator */}
        <div style={styles.statusContainer}>
          <div style={{
            ...styles.statusRing,
            ...getStatusRingStyle(voiceState)
          }}>
            <div style={styles.statusInner}>
              {voiceState === STATE.LISTENING && (
                <div style={styles.listeningWave}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      ...styles.waveBar,
                      animationDelay: `${i * 0.1}s`
                    }} />
                  ))}
                </div>
              )}
              {voiceState === STATE.THINKING && (
                <div style={styles.thinkingDots}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{
                      ...styles.dot,
                      animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </div>
              )}
              {voiceState === STATE.SPEAKING && (
                <div style={styles.speakingWave}>
                  {[...Array(7)].map((_, i) => (
                    <div key={i} style={{
                      ...styles.speakBar,
                      animationDelay: `${i * 0.08}s`
                    }} />
                  ))}
                </div>
              )}
              {voiceState === STATE.IDLE && (
                <span style={styles.idleIcon}>🎤</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Text */}
        <p style={styles.statusText}>{getStatusText(voiceState)}</p>

        {/* Transcript Preview */}
        {transcript && voiceState === STATE.LISTENING && (
          <div style={styles.transcriptPreview}>
            "{transcript}"
          </div>
        )}

        {/* Control Buttons */}
        <div style={styles.controls}>
          {voiceState === STATE.IDLE && (
            <button onClick={startListening} style={styles.controlButton}>
              🎤 Sprechen
            </button>
          )}
          {voiceState === STATE.LISTENING && (
            <button onClick={handleSendMessage} style={styles.sendButton}>
              ➤ Senden
            </button>
          )}
          {voiceState === STATE.SPEAKING && (
            <button onClick={handleInterrupt} style={styles.interruptButton}>
              ✋ Unterbrechen
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        @keyframes speak {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getStateColor(state) {
  switch (state) {
    case STATE.LISTENING: return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    case STATE.THINKING: return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    case STATE.SPEAKING: return "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
    default: return "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)";
  }
}

function getStateEmoji(state) {
  switch (state) {
    case STATE.LISTENING: return "👂";
    case STATE.THINKING: return "💭";
    case STATE.SPEAKING: return "🔊";
    default: return "💜";
  }
}

function getStatusText(state) {
  switch (state) {
    case STATE.LISTENING: return "Ich höre zu...";
    case STATE.THINKING: return "Ich denke nach...";
    case STATE.SPEAKING: return "Amiya spricht...";
    default: return "Tippe auf Sprechen oder sprich einfach los";
  }
}

function getStatusRingStyle(state) {
  switch (state) {
    case STATE.LISTENING:
      return { 
        borderColor: "#ef4444", 
        boxShadow: "0 0 20px rgba(239,68,68,0.4)",
        animation: "pulse 1.5s infinite"
      };
    case STATE.THINKING:
      return { 
        borderColor: "#f59e0b", 
        boxShadow: "0 0 20px rgba(245,158,11,0.4)",
        animation: "spin 1s infinite"
      };
    case STATE.SPEAKING:
      return { 
        borderColor: "#22c55e", 
        boxShadow: "0 0 20px rgba(34,197,94,0.4)" 
      };
    default:
      return { borderColor: "#8b5cf6" };
  }
}

// Styles
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)"
  },
  startScreen: {
    maxWidth: "400px",
    textAlign: "center"
  },
  logo: {
    width: "100px",
    height: "100px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    borderRadius: "28px",
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "50px",
    boxShadow: "0 10px 40px rgba(139,92,246,0.3)"
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
    lineHeight: "1.6"
  },
  startButton: {
    padding: "18px 40px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    color: "white",
    fontWeight: "600",
    fontSize: "18px",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(139,92,246,0.3)"
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
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)"
  },
  header: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e9d5ff",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
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
    transition: "background 0.3s"
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
    fontWeight: "500"
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "14px 18px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: "1.5"
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    color: "white",
    borderBottomRightRadius: "4px"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "white",
    color: "#1f2937",
    borderBottomLeftRadius: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  voiceInterface: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid #e9d5ff",
    padding: "24px 20px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  statusContainer: {
    marginBottom: "16px"
  },
  statusRing: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "4px solid #8b5cf6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s"
  },
  statusInner: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(139,92,246,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  listeningWave: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    height: "30px"
  },
  waveBar: {
    width: "4px",
    height: "8px",
    background: "#ef4444",
    borderRadius: "2px",
    animation: "wave 0.6s ease-in-out infinite"
  },
  thinkingDots: {
    display: "flex",
    gap: "6px"
  },
  dot: {
    width: "10px",
    height: "10px",
    background: "#f59e0b",
    borderRadius: "50%",
    animation: "bounce 0.8s infinite"
  },
  speakingWave: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    height: "30px"
  },
  speakBar: {
    width: "4px",
    height: "4px",
    background: "#22c55e",
    borderRadius: "2px",
    animation: "speak 0.5s ease-in-out infinite"
  },
  idleIcon: {
    fontSize: "32px"
  },
  statusText: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "12px"
  },
  transcriptPreview: {
    background: "#f3f4f6",
    padding: "12px 20px",
    borderRadius: "12px",
    marginBottom: "16px",
    maxWidth: "90%",
    color: "#4b5563",
    fontStyle: "italic",
    fontSize: "14px"
  },
  controls: {
    display: "flex",
    gap: "12px"
  },
  controlButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px"
  },
  sendButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px"
  },
  interruptButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "16px"
  }
};
