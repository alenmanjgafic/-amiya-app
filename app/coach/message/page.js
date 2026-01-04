"use client";

/**
 * MESSAGE COACH - Collaborative Response Writing
 * Uses Amiya Theme System for consistent styling
 */

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
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
  const { tokens } = useTheme();

  // Build dynamic styles
  const styles = buildStyles(tokens);

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
  const recognitionRef = useRef(null);

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
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Entschuldige, da ist etwas schief gelaufen. Kannst du es nochmal versuchen?",
          type: "error",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Spracherkennung wird von deinem Browser nicht unterstützt.");
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
      setInputText(finalTranscript + interimTranscript);
    };

    recognitionRef.current.onerror = () => setIsRecording(false);
    recognitionRef.current.onend = () => {
      setIsRecording(false);
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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const updateSuggestion = (messageIndex, newText) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]?.suggestion) {
        updated[messageIndex] = { ...updated[messageIndex], suggestion: newText };
      }
      return updated;
    });
    setFinalDraft(newText);
  };

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
              ...(message.role === "user" ? styles.userBubble : styles.assistantBubble),
            }}
          >
            {message.role === "assistant" && (
              <div style={styles.amiyaLabel}>Amiya</div>
            )}
            <p style={styles.messageText}>{message.content}</p>

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

      {/* Final Draft Bar */}
      {finalDraft && (
        <div style={styles.draftBar}>
          <p style={styles.draftLabel}>Aktueller Entwurf</p>
          <p style={styles.draftText} onClick={() => copyToClipboard(finalDraft)}>
            {finalDraft}
          </p>
          <button onClick={() => copyToClipboard(finalDraft)} style={styles.copyDraftButton}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{ ...styles.micButton, ...(isRecording ? styles.micButtonActive : {}) }}
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

// Build styles dynamically from theme tokens
function buildStyles(tokens) {
  const { colors, radii, shadows, gradients } = tokens;

  return {
    container: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      backgroundColor: colors.bg.deep,
      color: colors.text.primary,
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: colors.bg.deep,
      color: colors.text.primary,
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
      backgroundColor: colors.bg.deep,
      color: colors.text.primary,
      gap: 16,
    },
    backButton: {
      padding: "12px 24px",
      backgroundColor: colors.bg.surface,
      border: "none",
      borderRadius: radii.md,
      color: colors.text.primary,
      cursor: "pointer",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      borderBottom: `1px solid ${colors.bg.soft}`,
      backgroundColor: colors.bg.deep,
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    headerButton: {
      background: "none",
      border: "none",
      color: colors.text.primary,
      cursor: "pointer",
      padding: 8,
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      fontSize: 16,
      fontWeight: 600,
      color: colors.text.primary,
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
      borderRadius: radii.lg,
      lineHeight: 1.5,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.aurora.mint,
      color: "#1a1a1a",
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      borderBottomLeftRadius: 4,
      border: `1px solid ${colors.bg.soft}`,
    },
    amiyaLabel: {
      fontSize: 11,
      color: colors.aurora.mint,
      marginBottom: 4,
      fontWeight: 600,
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
      backgroundColor: `${colors.aurora.lavender}10`,
      borderRadius: radii.md,
      border: `1px solid ${colors.aurora.lavender}30`,
    },
    suggestionHeader: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      color: colors.aurora.lavender,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 600,
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
      padding: "10px 14px",
      backgroundColor: `${colors.aurora.mint}15`,
      border: `1px solid ${colors.aurora.mint}30`,
      borderRadius: radii.md,
      color: colors.aurora.mint,
      fontSize: 13,
      fontWeight: 500,
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
      backgroundColor: colors.text.muted,
      borderRadius: "50%",
      animation: "bounce 1.4s infinite ease-in-out both",
    },
    draftBar: {
      position: "fixed",
      bottom: 80,
      left: 16,
      right: 16,
      padding: "14px 16px",
      backgroundColor: colors.bg.elevated,
      borderRadius: radii.md,
      border: `1px solid ${colors.aurora.mint}30`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      zIndex: 5,
      boxShadow: shadows.medium,
    },
    draftLabel: {
      fontSize: 11,
      color: colors.aurora.mint,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 600,
      margin: 0,
      flexShrink: 0,
    },
    draftText: {
      flex: 1,
      margin: 0,
      fontSize: 14,
      color: colors.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      cursor: "pointer",
    },
    copyDraftButton: {
      background: "none",
      border: "none",
      color: colors.aurora.mint,
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
      backgroundColor: colors.bg.deep,
      borderTop: `1px solid ${colors.bg.soft}`,
    },
    micButton: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      color: colors.text.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    },
    micButtonActive: {
      background: gradients.primary,
      color: "#ffffff",
      border: "none",
    },
    textInput: {
      flex: 1,
      padding: "12px 16px",
      backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.bg.soft}`,
      borderRadius: radii.pill,
      color: colors.text.primary,
      fontSize: 15,
      outline: "none",
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: gradients.primary,
      border: "none",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
      boxShadow: shadows.button,
    },
  };
}
