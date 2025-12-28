"use client";
import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Du bist Amiya, ein erfahrener Paartherapeut in einer Solo-Session. Die Person spricht alleine mit dir über ihre Beziehung.

## DEIN CHARAKTER
- Direkt, warm, aufmerksam
- Du führst das Gespräch – du bist nicht passiv
- Kurze Sätze, kein Therapeuten-Jargon
- Du sagst auch unbequeme Wahrheiten

## DEINE KERN-PRINZIPIEN

### CLARITY OVER COMFORT
Dein Ziel ist Klarheit, nicht Wohlgefühl. Du bist nicht hier um jemanden gut fühlen zu lassen. Du bist hier um zu helfen, klar zu sehen.

### FAKTEN ZUERST
Bevor du interpretierst, sammle konkrete Fakten:
- "Wie viele Kinder habt ihr? Wie alt?"
- "Wie oft passiert das – einmal die Woche, einmal im Monat?"
- "Was genau hat sie gesagt? Wort für Wort wenn möglich."
- "Wer macht was im Haushalt konkret?"

### BEIDE PERSPEKTIVEN
Du verstehst die Situation erst, wenn du beide Seiten kennst:
- "Wie siehst du das?"
- "Wie glaubst du sieht sie/er das?"
- "Was könnte sie/er in dem Moment gefühlt haben?"

### AKTIV FÜHREN
- Du bestimmst die Richtung wenn nötig
- Du benennst Muster: "Du kreist um etwas herum."
- Du konfrontierst Vermeidung direkt

## GESPRÄCHS-STRUKTUR

### PHASE 1: VERSTEHEN (Hauptteil)
Sammle Fakten. Verstehe die Situation konkret.
- "Was ist passiert?"
- "Wann genau?"
- "Was hat er/sie gesagt?"
- "Und du? Was hast du geantwortet?"
- "Wie hat er/sie reagiert – wütend, traurig, kalt?"

Bei neuen Informationen: Frag nach Details.
- Sie erwähnt Kinder → "Wie viele? Wie alt sind sie?"
- Er erwähnt Arbeit → "Was für ein Job? Wie oft kommst du spät?"

### PHASE 2: SPIEGELN
Nach genug Information, fasse zusammen:
"Ok, lass mich zusammenfassen: [Zusammenfassung]. Stimmt das?"

### PHASE 3: EINORDNEN
Erst jetzt gibst du Perspektive:
- Muster benennen
- Die tiefere Ebene aufzeigen
- Konkrete nächste Schritte

## FORMAT
- Maximal 1-2 Sätze, dann EINE Frage
- Keine Listen, keine Bullet Points
- Wenn sie "ich weiss nicht" sagen: Hilf mit Optionen oder frag anders

## START
Beginne mit: "Hey. Was ist los?"`;

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setSessionTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "de-DE";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const speakText = async (text) => {
    if (!voiceEnabled) return;
    
    setIsSpeaking(true);
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("Speech error:", err);
      setIsSpeaking(false);
    }
  };

  const startSession = async () => {
    setStarted(true);
    const greeting = "Hey. Was ist los?";
    setMessages([{ role: "assistant", content: greeting }]);
    await speakText(greeting);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Spracherkennung wird von deinem Browser nicht unterstützt. Bitte nutze Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          system: SYSTEM_PROMPT,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, { role: "assistant", content: data.message }]);
      await speakText(data.message);
    } catch (err) {
      console.error("Error:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Entschuldige, es gab ein technisches Problem. Kannst du das nochmal sagen?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setMessages([]);
    setStarted(false);
    setSessionTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!started) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{ maxWidth: "400px", textAlign: "center" }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
            borderRadius: "24px",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            boxShadow: "0 10px 40px rgba(139, 92, 246, 0.3)"
          }}>
            💜
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
            Amiya
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "8px", fontSize: "14px" }}>Solo Session</p>
          <p style={{ color: "#4b5563", marginBottom: "32px" }}>
            Nimm dir einen Moment. Erzähl mir was dich beschäftigt.
          </p>
          <button
            onClick={startSession}
            style={{
              padding: "16px 32px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)"
            }}
          >
            Session starten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e9d5ff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: isSpeaking 
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            transition: "background 0.3s"
          }}>
            {isSpeaking ? "🔊" : "💜"}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "#1f2937" }}>Amiya</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Solo Session • {formatTime(sessionTime)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{
              padding: "8px 12px",
              background: voiceEnabled ? "#8b5cf6" : "#e5e7eb",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: voiceEnabled ? "white" : "#6b7280",
              fontSize: "14px"
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          <button
            onClick={resetSession}
            style={{
              padding: "8px 16px",
              background: "#f3f4f6",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#4b5563",
              fontSize: "14px"
            }}
          >
            Beenden
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px"
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: "16px",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"
                  : "white",
                color: msg.role === "user" ? "white" : "#1f2937",
                boxShadow: msg.role === "assistant" ? "0 2px 8px rgba(0,0,0,0.05)" : "none"
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div style={{
              background: "white",
              padding: "12px 16px",
              borderRadius: "16px",
              borderBottomLeftRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", background: "#a855f7", borderRadius: "50%", animation: "bounce 1s infinite" }}></div>
                <div style={{ width: "8px", height: "8px", background: "#a855f7", borderRadius: "50%", animation: "bounce 1s infinite 0.15s" }}></div>
                <div style={{ width: "8px", height: "8px", background: "#a855f7", borderRadius: "50%", animation: "bounce 1s infinite 0.3s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid #e9d5ff",
        padding: "16px"
      }}>
        <div style={{ display: "flex", gap: "8px", maxWidth: "600px", margin: "0 auto" }}>
          <button
            onClick={toggleListening}
            disabled={loading || isSpeaking}
            style={{
              padding: "12px 16px",
              background: isListening 
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: loading || isSpeaking ? "default" : "pointer",
              opacity: loading || isSpeaking ? 0.5 : 1,
              fontSize: "18px"
            }}
          >
            {isListening ? "⏹" : "🎤"}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={isListening ? "Ich höre zu..." : "Schreib oder sprich..."}
            disabled={loading || isListening}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: isListening ? "#fef2f2" : "#f3f4f6",
              border: isListening ? "2px solid #ef4444" : "none",
              borderRadius: "12px",
              outline: "none",
              fontSize: "16px"
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || isSpeaking}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: loading || !input.trim() || isSpeaking ? "default" : "pointer",
              opacity: loading || !input.trim() || isSpeaking ? 0.5 : 1,
              fontSize: "16px"
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
