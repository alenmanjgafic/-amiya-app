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

## START
Beginne mit: "Hey. Was ist los?"`;

const STATE = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

function getSupportedMimeType() {
  if (typeof window === 'undefined') return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''];
  for (const type of types) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [started, setStarted] = useState(false);
  const [voiceState, setVoiceState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [currentResponse, setCurrentResponse] = useState("");

  // Refs
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const silenceTimerRef = useRef(null);
  
  // State refs
  const voiceStateRef = useRef(voiceState);
  const messagesRef = useRef(messages);
  const transcriptRef = useRef("");
  const isProcessingRef = useRef(false);

  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  // ============ STOP AUDIO IMMEDIATELY ============
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  // ============ SPEAK TEXT ============
  const speakText = useCallback(async (text) => {
    try {
      const response = await fetch("/api/speak-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("TTS failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      return new Promise((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve();
        };

        audio.play().catch(() => resolve());
      });
    } catch (err) {
      console.error("Speak error:", err);
    }
  }, []);

  // ============ SEND MESSAGE ============
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setVoiceState(STATE.THINKING);
    setTranscript("");
    transcriptRef.current = "";

    const userMessage = { role: "user", content: text.trim() };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    messagesRef.current = newMessages;

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, system: SYSTEM_PROMPT }),
      });

      if (!response.ok) throw new Error("Chat API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
        setCurrentResponse(fullResponse);
      }

      const assistantMessage = { role: "assistant", content: fullResponse };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;
      setCurrentResponse("");

      // Speak
      setVoiceState(STATE.SPEAKING);
      await speakText(fullResponse);
      
      // Back to listening
      setVoiceState(STATE.LISTENING);
      isProcessingRef.current = false;

    } catch (err) {
      console.error("Error:", err);
      const errorMsg = "Entschuldige, da gab es ein Problem.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      setCurrentResponse("");
      setVoiceState(STATE.SPEAKING);
      await speakText(errorMsg);
      setVoiceState(STATE.LISTENING);
      isProcessingRef.current = false;
    }
  }, [speakText]);

  // ============ HANDLE SPEECH DETECTED ============
  const handleSpeechDetected = useCallback(() => {
    // If Amiya is speaking, interrupt immediately
    if (voiceStateRef.current === STATE.SPEAKING) {
      console.log("User interrupted - stopping audio");
      stopAudio();
      setVoiceState(STATE.LISTENING);
    }
  }, [stopAudio]);

  // ============ START ALWAYS-ON MICROPHONE ============
  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;

      const tokenRes = await fetch("/api/deepgram-token");
      const { token } = await tokenRes.json();

      if (!token) {
        console.error("No Deepgram token");
        return;
      }

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=de&smart_format=true&interim_results=true&endpointing=800&punctuate=true&vad_events=true`,
        ["token", token]
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("Deepgram connected - always listening");
        
        const mimeType = getSupportedMimeType();
        const recorder = mimeType 
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(e.data);
          }
        };
        
        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setVoiceState(STATE.LISTENING);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // VAD: Speech started
        if (data.type === "SpeechStarted") {
          handleSpeechDetected();
          return;
        }

        // Transcript
        if (data.channel?.alternatives?.[0]) {
          const text = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final;

          // Any speech = interrupt if speaking
          if (text && voiceStateRef.current === STATE.SPEAKING) {
            handleSpeechDetected();
          }

          if (text && voiceStateRef.current === STATE.LISTENING) {
            if (isFinal) {
              transcriptRef.current += text + " ";
              setTranscript(transcriptRef.current.trim());
              
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              
              silenceTimerRef.current = setTimeout(() => {
                const finalText = transcriptRef.current.trim();
                if (finalText && voiceStateRef.current === STATE.LISTENING && !isProcessingRef.current) {
                  sendMessage(finalText);
                }
              }, 1500);
            } else {
              setTranscript(transcriptRef.current + text);
            }
          }
        }
      };

      socket.onerror = (err) => {
        console.error("Deepgram error:", err);
      };

      socket.onclose = () => {
        console.log("Deepgram closed");
      };

    } catch (err) {
      console.error("Microphone error:", err);
      alert("Mikrofon-Zugriff benötigt.");
    }
  }, [handleSpeechDetected, sendMessage]);

  // ============ STOP MICROPHONE ============
  const stopMicrophone = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  }, []);

  // ============ SESSION ============
  const startSession = async () => {
    setStarted(true);
    const greeting = "Hey. Was ist los?";
    setMessages([{ role: "assistant", content: greeting }]);
    messagesRef.current = [{ role: "assistant", content: greeting }];
    
    // Start microphone FIRST (always on)
    await startMicrophone();
    
    // Then speak greeting
    setVoiceState(STATE.SPEAKING);
    await speakText(greeting);
    setVoiceState(STATE.LISTENING);
  };

  const endSession = () => {
    stopMicrophone();
    stopAudio();
    setMessages([]);
    messagesRef.current = [];
    setStarted(false);
    setSessionTime(0);
    setTranscript("");
    transcriptRef.current = "";
    setCurrentResponse("");
    setVoiceState(STATE.IDLE);
    isProcessingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
      stopAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopMicrophone, stopAudio]);

  // ============ START SCREEN ============
  if (!started) {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          <div style={styles.logo}>💜</div>
          <h1 style={styles.title}>Amiya</h1>
          <p style={styles.subtitle}>Solo Session</p>
          <p style={styles.description}>
            Sprich frei. Ich höre zu und antworte dir.<br/>
            Du kannst mich jederzeit unterbrechen – einfach anfangen zu sprechen.
          </p>
          <button onClick={startSession} style={styles.startButton}>
            Session starten
          </button>
          <p style={styles.hint}>🎧 Beste Erfahrung mit Kopfhörern</p>
        </div>
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
        {currentResponse && (
          <div style={{...styles.messageBubble, ...styles.assistantBubble}}>
            {currentResponse}<span style={styles.cursor}>|</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Status */}
      <div style={styles.voiceStatus}>
        <div style={{...styles.statusIndicator, ...getStatusStyle(voiceState)}}>
          <div style={styles.statusDot} />
          <span style={styles.statusLabel}>{getStatusText(voiceState)}</span>
        </div>
        
        {transcript && (
          <div style={styles.transcriptBox}>
            "{transcript}"
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Helpers
function getStateColor(state) {
  const colors = {
    [STATE.LISTENING]: "linear-gradient(135deg, #22c55e, #16a34a)",
    [STATE.THINKING]: "linear-gradient(135deg, #f59e0b, #d97706)",
    [STATE.SPEAKING]: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    [STATE.IDLE]: "linear-gradient(135deg, #6b7280, #4b5563)"
  };
  return colors[state] || colors[STATE.IDLE];
}

function getStateEmoji(state) {
  const emojis = {
    [STATE.LISTENING]: "👂",
    [STATE.THINKING]: "💭",
    [STATE.SPEAKING]: "🗣️",
    [STATE.IDLE]: "💜"
  };
  return emojis[state] || "💜";
}

function getStatusText(state) {
  const texts = {
    [STATE.LISTENING]: "Ich höre zu...",
    [STATE.THINKING]: "Ich denke nach...",
    [STATE.SPEAKING]: "Amiya spricht...",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

function getStatusStyle(state) {
  if (state === STATE.LISTENING) {
    return { background: "rgba(34, 197, 94, 0.1)", borderColor: "#22c55e" };
  }
  if (state === STATE.SPEAKING) {
    return { background: "rgba(139, 92, 246, 0.1)", borderColor: "#8b5cf6" };
  }
  if (state === STATE.THINKING) {
    return { background: "rgba(245, 158, 11, 0.1)", borderColor: "#f59e0b" };
  }
  return { background: "rgba(107, 114, 128, 0.1)", borderColor: "#6b7280" };
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
  startScreen: { maxWidth: "400px", textAlign: "center" },
  logo: {
    width: "100px", height: "100px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    borderRadius: "28px", margin: "0 auto 24px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "50px", boxShadow: "0 10px 40px rgba(139,92,246,0.3)"
  },
  title: { fontSize: "36px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" },
  subtitle: { color: "#6b7280", fontSize: "16px", marginBottom: "16px" },
  description: { color: "#4b5563", marginBottom: "32px", lineHeight: "1.8" },
  startButton: {
    padding: "18px 40px",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white", fontWeight: "600", fontSize: "18px",
    border: "none", borderRadius: "16px", cursor: "pointer",
    boxShadow: "0 4px 20px rgba(139,92,246,0.3)"
  },
  hint: { marginTop: "24px", fontSize: "13px", color: "#9ca3af" },
  sessionContainer: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)"
  },
  header: {
    background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e9d5ff", padding: "12px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerIcon: {
    width: "44px", height: "44px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "22px", transition: "background 0.3s"
  },
  headerTitle: { fontWeight: "600", color: "#1f2937", fontSize: "17px" },
  headerSubtitle: { fontSize: "13px", color: "#6b7280" },
  endButton: {
    padding: "8px 16px", background: "#fee2e2", color: "#dc2626",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500"
  },
  messagesContainer: {
    flex: 1, overflowY: "auto", padding: "20px",
    display: "flex", flexDirection: "column", gap: "12px"
  },
  messageBubble: {
    maxWidth: "85%", padding: "14px 18px", borderRadius: "18px",
    fontSize: "15px", lineHeight: "1.5"
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    color: "white", borderBottomRightRadius: "4px"
  },
  assistantBubble: {
    alignSelf: "flex-start", background: "white", color: "#1f2937",
    borderBottomLeftRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  cursor: { animation: "blink 1s infinite", marginLeft: "2px" },
  voiceStatus: {
    background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
    borderTop: "1px solid #e9d5ff", padding: "16px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px"
  },
  statusIndicator: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 16px", borderRadius: "20px",
    border: "2px solid", transition: "all 0.3s"
  },
  statusDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "currentColor", animation: "pulse 1.5s infinite"
  },
  statusLabel: { fontSize: "14px", fontWeight: "500", color: "#374151" },
  transcriptBox: {
    padding: "10px 16px", background: "#f3f4f6", borderRadius: "12px",
    maxWidth: "90%", color: "#4b5563", fontSize: "14px", fontStyle: "italic"
  }
};
