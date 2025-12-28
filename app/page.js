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

// Helper function to get supported audio mimeType (Safari compatibility)
function getSupportedMimeType() {
  if (typeof window === 'undefined') return '';
  
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    ''  // Empty string = browser default
  ];
  
  for (const type of types) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) {
      console.log('Using mimeType:', type || 'browser default');
      return type;
    }
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
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voiceStateRef = useRef(voiceState);
  const messagesRef = useRef(messages);
  const silenceTimerRef = useRef(null);
  const streamRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  // Session timer
  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ============ AUDIO PLAYBACK (ElevenLabs Streaming) ============
  const playAudioChunk = useCallback(async (audioData) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    try {
      const arrayBuffer = await audioData.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      return new Promise((resolve) => {
        source.onended = resolve;
        source.start(0);
      });
    } catch (err) {
      console.error("Audio decode error:", err);
    }
  }, []);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    
    while (audioQueueRef.current.length > 0 && voiceStateRef.current === STATE.SPEAKING) {
      const audioData = audioQueueRef.current.shift();
      await playAudioChunk(audioData);
    }
    
    isPlayingRef.current = false;
    
    // If done speaking and queue empty, start listening
    if (audioQueueRef.current.length === 0 && voiceStateRef.current === STATE.SPEAKING) {
      setVoiceState(STATE.IDLE);
      setTimeout(() => startListening(), 300);
    }
  }, [playAudioChunk]);

  // ============ DEEPGRAM CONNECTION ============
  const connectDeepgram = useCallback(async () => {
    try {
      // Get temporary Deepgram token from our API
      const tokenRes = await fetch("/api/deepgram-token");
      const { token } = await tokenRes.json();

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=multi&smart_format=true&interim_results=true&endpointing=300&vad_events=true`,
        ["token", token]
      );

      socket.onopen = () => {
        console.log("Deepgram connected");
        setVoiceState(STATE.LISTENING);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle VAD events for instant interruption
        if (data.type === "SpeechStarted") {
          if (voiceStateRef.current === STATE.SPEAKING) {
            // Interrupt immediately
            stopSpeaking();
          }
        }

        if (data.channel?.alternatives?.[0]) {
          const text = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final;

          if (text) {
            setTranscript(prev => {
              if (isFinal) {
                // Reset silence timer
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                
                // Start new silence timer
                silenceTimerRef.current = setTimeout(() => {
                  if (voiceStateRef.current === STATE.LISTENING) {
                    const finalText = transcriptRef.current;
                    if (finalText?.trim()) {
                      sendMessage(finalText.trim());
                    }
                  }
                }, 1200); // 1.2 seconds of silence
                
                return prev + text + " ";
              }
              return prev.split(" ").slice(0, -1).join(" ") + " " + text;
            });
          }
        }
      };

      socket.onerror = (err) => {
        console.error("Deepgram error:", err);
      };

      socket.onclose = () => {
        console.log("Deepgram closed");
      };

      socketRef.current = socket;
      return socket;
    } catch (err) {
      console.error("Failed to connect Deepgram:", err);
      return null;
    }
  }, []);

  const transcriptRef = useRef(transcript);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // ============ MICROPHONE ============
  const startListening = useCallback(async () => {
    setTranscript("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;

      const socket = await connectDeepgram();
      if (!socket) {
        console.error("Could not connect to Deepgram");
        return;
      }

      // Wait for socket to be ready
      await new Promise((resolve) => {
        if (socket.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          socket.addEventListener("open", resolve, { once: true });
        }
      });

      // Get supported mimeType (Safari doesn't support webm)
      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;

    } catch (err) {
      console.error("Microphone error:", err);
      alert("Mikrofon-Zugriff benötigt. Bitte erlaube den Zugriff.");
    }
  }, [connectDeepgram]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // ============ STOP SPEAKING (Interrupt) ============
  const stopSpeaking = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setCurrentResponse("");
    setVoiceState(STATE.IDLE);
  }, []);

  // ============ SEND MESSAGE (Claude Streaming + ElevenLabs Streaming) ============
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;

    stopListening();
    setVoiceState(STATE.THINKING);
    setTranscript("");
    setCurrentResponse("");

    const userMessage = { role: "user", content: text.trim() };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    messagesRef.current = newMessages;

    try {
      // Call streaming API
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages, 
          system: SYSTEM_PROMPT 
        }),
      });

      if (!response.ok) throw new Error("Chat API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let sentenceBuffer = "";

      setVoiceState(STATE.SPEAKING);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        sentenceBuffer += chunk;
        setCurrentResponse(fullResponse);

        // Check for complete sentences to send to TTS
        const sentenceEnders = /[.!?।。！？]/;
        const sentences = sentenceBuffer.split(sentenceEnders);
        
        if (sentences.length > 1) {
          // We have at least one complete sentence
          for (let i = 0; i < sentences.length - 1; i++) {
            const sentence = sentences[i].trim();
            if (sentence) {
              // Send to TTS streaming
              speakSentence(sentence);
            }
          }
          sentenceBuffer = sentences[sentences.length - 1];
        }
      }

      // Speak any remaining text
      if (sentenceBuffer.trim()) {
        speakSentence(sentenceBuffer.trim());
      }

      // Add assistant message
      const assistantMessage = { role: "assistant", content: fullResponse };
      setMessages(prev => [...prev, assistantMessage]);
      messagesRef.current = [...newMessages, assistantMessage];
      setCurrentResponse("");

    } catch (err) {
      console.error("Error:", err);
      const errorMsg = "Entschuldige, da gab es ein Problem.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      speakSentence(errorMsg);
    }
  }, [stopListening]);

  // ============ SPEAK SENTENCE (ElevenLabs) ============
  const speakSentence = useCallback(async (text) => {
    try {
      const response = await fetch("/api/speak-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const blob = await response.blob();
        audioQueueRef.current.push(blob);
        processAudioQueue();
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  }, [processAudioQueue]);

  // ============ MANUAL SEND ============
  const handleSendMessage = useCallback(() => {
    const text = transcriptRef.current?.trim();
    if (text) {
      sendMessage(text);
    }
  }, [sendMessage]);

  // ============ INTERRUPT ============
  const handleInterrupt = useCallback(() => {
    stopSpeaking();
    setTimeout(() => startListening(), 100);
  }, [stopSpeaking, startListening]);

  // ============ SESSION CONTROL ============
  const startSession = async () => {
    setStarted(true);
    const greeting = "Hey. Was ist los?";
    setMessages([{ role: "assistant", content: greeting }]);
    messagesRef.current = [{ role: "assistant", content: greeting }];
    
    setVoiceState(STATE.SPEAKING);
    await speakSentence(greeting);
  };

  const endSession = () => {
    stopListening();
    stopSpeaking();
    setMessages([]);
    messagesRef.current = [];
    setStarted(false);
    setSessionTime(0);
    setTranscript("");
    setCurrentResponse("");
    setVoiceState(STATE.IDLE);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopListening, stopSpeaking]);

  // ============ START SCREEN ============
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
          <p style={styles.hint}>🎤 Beste Erfahrung mit Kopfhörern</p>
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
          <div style={{ ...styles.headerIcon, background: getStateColor(voiceState) }}>
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
          <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
            {currentResponse}
            <span style={styles.typingCursor}>|</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Interface */}
      <div style={styles.voiceInterface}>
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

        <p style={styles.statusText}>{getStatusText(voiceState)}</p>

        {transcript && voiceState === STATE.LISTENING && (
          <div style={styles.transcriptPreview}>
            "{transcript}"
          </div>
        )}

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
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
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
    case STATE.SPEAKING: return "🗣️";
    default: return "💜";
  }
}

function getStatusText(state) {
  switch (state) {
    case STATE.LISTENING: return "Ich höre zu...";
    case STATE.THINKING: return "Ich denke nach...";
    case STATE.SPEAKING: return "Amiya spricht...";
    default: return "Tippe auf Sprechen";
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
        boxShadow: "0 0 20px rgba(245,158,11,0.4)"
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
  typingCursor: {
    animation: "blink 1s infinite",
    marginLeft: "2px"
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
