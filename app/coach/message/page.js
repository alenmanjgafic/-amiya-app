"use client";

/**
 * MESSAGE COACH - Collaborative Response Writing
 *
 * Flow:
 * 1. User comes from message analysis with sessionId
 * 2. Amiya loads context and offers to help write a response
 * 3. User dictates (voice) or types what they want to say
 * 4. Amiya suggests improved phrasing
 * 5. Iterative refinement until user is satisfied
 * 6. Copy final message
 */

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import EditableText from "../../../components/EditableText";

export default function MessageCoachPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { user, profile } = useAuth();

  // State
  const [analysisContext, setAnalysisContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [finalDraft, setFinalDraft] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load analysis context on mount
  useEffect(() => {
    if (sessionId && user) {
      loadContext();
    }
  }, [sessionId, user]);

  const loadContext = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const session = await response.json();
        if (session.type === "message_analysis" && session.analysis) {
          setAnalysisContext({
            sessionId: session.id,
            analysis: session.analysis,
            themes: session.themes || [],
            rawConversation: session.summary || "",
          });

          // Start conversation with Amiya's greeting
          const partnerName = profile?.partner_name || "deinem Partner";
          setMessages([
            {
              role: "assistant",
              content: `Ich habe mir eure Konversation angeschaut und verstehe die Situation jetzt besser.

Was möchtest du ${partnerName} als Nächstes sagen?

Du kannst es mir einfach erzählen - in deinen eigenen Worten, auch wenn es noch nicht perfekt formuliert ist. Ich helfe dir dann, es klar und einfühlsam auszudrücken.`,
              type: "text",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to load context:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send message to coach API
  const sendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    const userMessage = { role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      const response = await fetch("/api/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          analysisContext,
          userName: profile?.name,
          partnerName: profile?.partner_name,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();

      // Add Amiya's response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          type: "text",
          suggestion: data.suggestion || null,
        },
      ]);

      // If there's a final draft suggestion
      if (data.suggestion) {
        setFinalDraft(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Entschuldige, da ist etwas schief gelaufen. Kannst du es nochmal versuchen?",
          type: "error",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Voice recording with Web Speech API
  const recognitionRef = useRef(null);

  const startRecording = () => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Spracherkennung wird von deinem Browser nicht unterstützt. Bitte nutze Chrome oder Safari.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "de-DE";
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    let finalTranscript = "";

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      // Show interim results in input
      setInputText(finalTranscript + interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      // If we have text, send it
      if (finalTranscript.trim()) {
        sendMessage(finalTranscript.trim());
      }
    };

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Update suggestion when user edits via tap-to-edit
  const updateSuggestion = (messageIndex, newText) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[messageIndex] && updated[messageIndex].suggestion) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          suggestion: newText,
        };
      }
      return updated;
    });
    // Also update the final draft
    setFinalDraft(newText);
  };

  // Request new variation of suggestion
  const requestVariation = async () => {
    if (!finalDraft || isSending) return;

    setIsSending(true);
    const variationRequest = {
      role: "user",
      content: "Kannst du mir eine andere Variante vorschlagen?",
      type: "text",
    };
    setMessages((prev) => [...prev, variationRequest]);

    try {
      const response = await fetch("/api/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, variationRequest],
          analysisContext,
          userName: profile?.name,
          partnerName: profile?.partner_name,
          requestVariation: true,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          type: "text",
          suggestion: data.suggestion || null,
        },
      ]);

      if (data.suggestion) {
        setFinalDraft(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to get variation:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={32} style={styles.spinner} />
        <p>Lade Kontext...</p>
      </div>
    );
  }

  if (!analysisContext) {
    return (
      <div style={styles.errorContainer}>
        <p>Konnte Analyse nicht laden.</p>
        <button onClick={() => router.back()} style={styles.backButton}>
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} />
        </button>
        <div style={styles.headerTitle}>
          <Sparkles size={18} style={{ marginRight: 8 }} />
          Antwort verfassen
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Chat Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubble,
              ...(message.role === "user"
                ? styles.userBubble
                : styles.assistantBubble),
            }}
          >
            {message.role === "assistant" && (
              <div style={styles.amiyaLabel}>Amiya</div>
            )}
            <p style={styles.messageText}>{message.content}</p>

            {/* Show suggestion box if present - with tap-to-edit */}
            {message.suggestion && (
              <div style={styles.suggestionBox}>
                <div style={styles.suggestionHeader}>
                  <MessageSquare size={16} />
                  <span>Vorschlag für deine Nachricht:</span>
                </div>
                <EditableText
                  text={message.suggestion}
                  onChange={(newText) => updateSuggestion(index, newText)}
                  partnerName={profile?.partner_name}
                />
                <div style={styles.suggestionActions}>
                  <button
                    onClick={() => copyToClipboard(message.suggestion)}
                    style={styles.actionButton}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Kopiert!" : "Kopieren"}
                  </button>
                  <button
                    onClick={requestVariation}
                    style={styles.actionButton}
                    disabled={isSending}
                  >
                    <RefreshCw size={18} />
                    Andere Variante
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
            <div style={styles.typingIndicator}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Final Draft Bar (if available) */}
      {finalDraft && (
        <div style={styles.draftBar}>
          <p style={styles.draftLabel}>Aktueller Entwurf</p>
          <p style={styles.draftText} onClick={() => copyToClipboard(finalDraft)}>
            {finalDraft}
          </p>
          <button
            onClick={() => copyToClipboard(finalDraft)}
            style={styles.copyDraftButton}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            ...styles.micButton,
            ...(isRecording ? styles.micButtonActive : {}),
          }}
          disabled={isSending}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Was möchtest du sagen..."
          style={styles.textInput}
          disabled={isSending || isRecording}
        />

        <button
          onClick={() => sendMessage(inputText)}
          style={styles.sendButton}
          disabled={!inputText.trim() || isSending}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff",
  },
  spinner: {
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff",
    gap: 16,
  },
  backButton: {
    padding: "12px 24px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #222",
    backgroundColor: "#0a0a0a",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: 8,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    fontSize: 16,
    fontWeight: 600,
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 100px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "12px 16px",
    borderRadius: 16,
    lineHeight: 1.5,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#e8d5c4",
    color: "#1a1a1a",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderBottomLeftRadius: 4,
    border: "1px solid #333",
  },
  amiyaLabel: {
    fontSize: 11,
    color: "#e8d5c4",
    marginBottom: 4,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  messageText: {
    margin: 0,
    fontSize: 15,
    whiteSpace: "pre-wrap",
  },
  suggestionBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#0d1f0d",
    borderRadius: 12,
    border: "1px solid #1a3a1a",
  },
  suggestionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#8bc98b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  suggestionText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#c8e8c8",
    whiteSpace: "pre-wrap",
  },
  suggestionActions: {
    display: "flex",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    backgroundColor: "rgba(139, 201, 139, 0.15)",
    border: "1px solid #2a4a2a",
    borderRadius: 8,
    color: "#8bc98b",
    fontSize: 13,
    cursor: "pointer",
  },
  typingIndicator: {
    display: "flex",
    gap: 4,
    padding: "8px 0",
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: "#666",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite ease-in-out both",
  },
  draftBar: {
    position: "fixed",
    bottom: 80,
    left: 16,
    right: 16,
    padding: "12px 16px",
    backgroundColor: "#1a2a1a",
    borderRadius: 12,
    border: "1px solid #2a4a2a",
    display: "flex",
    alignItems: "center",
    gap: 12,
    zIndex: 5,
  },
  draftLabel: {
    fontSize: 11,
    color: "#8bc98b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: 0,
    flexShrink: 0,
  },
  draftText: {
    flex: 1,
    margin: 0,
    fontSize: 14,
    color: "#c8e8c8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  copyDraftButton: {
    background: "none",
    border: "none",
    color: "#8bc98b",
    cursor: "pointer",
    padding: 8,
    flexShrink: 0,
  },
  inputArea: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    backgroundColor: "#0a0a0a",
    borderTop: "1px solid #222",
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  micButtonActive: {
    backgroundColor: "#e8d5c4",
    color: "#0a0a0a",
    border: "none",
  },
  textInput: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 24,
    color: "#fff",
    fontSize: 15,
    outline: "none",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: "#e8d5c4",
    border: "none",
    color: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
};
