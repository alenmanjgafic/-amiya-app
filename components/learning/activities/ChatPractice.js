/**
 * CHAT PRACTICE - components/learning/activities/ChatPractice.js
 * Mini-chat with Amiya for practicing communication skills
 * Used for Chapter 1 (Soft Startup) and Chapter 5 (Validation)
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { Send, CheckCircle, ArrowRight, RefreshCw, Sparkles } from "lucide-react";

export default function ChatPractice({
  chapterId,
  scenario = {},
  exerciseType = "soft-startup", // "soft-startup" | "validation"
  onComplete,
  userId,
  maxTurns: maxTurnsProp = 4,
}) {
  const { tokens } = useTheme();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showScenario, setShowScenario] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const maxTurns = maxTurnsProp;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with scenario
  useEffect(() => {
    if (scenario.initialMessage && messages.length === 0) {
      setMessages([
        {
          role: "amiya",
          content: scenario.initialMessage,
        },
      ]);
    }
  }, [scenario.initialMessage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setTurnCount((prev) => prev + 1);

    try {
      const response = await fetch("/api/learning/chat-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          exerciseType,
          scenario: scenario.context,
          messages: [...messages, { role: "user", content: userMessage }],
          turnCount: turnCount + 1,
          maxTurns,
          userId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "amiya", content: "Etwas ist schiefgelaufen. Bitte versuche es nochmal." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "amiya", content: data.response }]);

        if (data.isComplete || turnCount + 1 >= maxTurns) {
          setFeedback(data.finalFeedback || data.response);
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error("Chat practice error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "amiya", content: "Verbindungsfehler. Bitte versuche es nochmal." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    setMessages([]);
    setInput("");
    setTurnCount(0);
    setIsComplete(false);
    setFeedback(null);
    setShowScenario(true);
    if (scenario.initialMessage) {
      setMessages([{ role: "amiya", content: scenario.initialMessage }]);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({ turnCount, feedback });
    }
  };

  // Completion screen
  if (isComplete && feedback) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          padding: "24px",
        }}
      >
        {/* Success Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Sparkles size={32} color={tokens.colors.aurora.mint} />
          </div>

          <h2
            style={{
              ...tokens.typography.h2,
              margin: "0 0 8px 0",
              textAlign: "center",
            }}
          >
            Gut geübt!
          </h2>

          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
              textAlign: "center",
            }}
          >
            Hier ist mein Feedback
          </p>
        </div>

        {/* Feedback Card */}
        <div
          style={{
            background: tokens.colors.bg.surface,
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "24px",
            border: `1px solid ${tokens.colors.aurora.mint}20`,
          }}
        >
          <p
            style={{
              fontSize: "15px",
              color: tokens.colors.text.secondary,
              margin: 0,
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            }}
          >
            {feedback}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "auto",
          }}
        >
          <button
            onClick={handleRetry}
            style={{
              flex: 1,
              padding: "14px",
              background: tokens.colors.bg.elevated,
              border: `1px solid ${tokens.colors.aurora.lavender}30`,
              borderRadius: "12px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <RefreshCw size={18} />
            Nochmal
          </button>

          <button
            onClick={handleComplete}
            style={{
              flex: 1,
              padding: "14px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Fertig
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "60vh",
      }}
    >
      {/* Scenario Card (collapsible) */}
      {showScenario && scenario.situation && (
        <div
          style={{
            padding: "16px 20px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}10 0%, ${tokens.colors.aurora.rose}10 100%)`,
            borderBottom: `1px solid ${tokens.colors.aurora.lavender}20`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: tokens.colors.aurora.lavender,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Situation
            </span>
            <button
              onClick={() => setShowScenario(false)}
              style={{
                background: "none",
                border: "none",
                color: tokens.colors.text.muted,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Ausblenden
            </button>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: tokens.colors.text.secondary,
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            {scenario.situation}
          </p>
        </div>
      )}

      {/* Hidden scenario toggle */}
      {!showScenario && (
        <button
          onClick={() => setShowScenario(true)}
          style={{
            padding: "8px 20px",
            background: tokens.colors.bg.surface,
            border: "none",
            borderBottom: `1px solid ${tokens.colors.bg.elevated}`,
            color: tokens.colors.text.muted,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Situation anzeigen
        </button>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background:
                  msg.role === "user"
                    ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
                    : tokens.colors.bg.surface,
                color: msg.role === "user" ? "#fff" : tokens.colors.text.primary,
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  margin: 0,
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 4px",
                background: tokens.colors.bg.surface,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: tokens.colors.aurora.lavender,
                      opacity: 0.6,
                      animation: `bounce 1.4s infinite ease-in-out both`,
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Turn Counter */}
      <div
        style={{
          padding: "8px 20px",
          borderTop: `1px solid ${tokens.colors.bg.elevated}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: tokens.colors.text.muted,
            }}
          >
            {turnCount} von {maxTurns} Runden
          </span>
          <div
            style={{
              height: "4px",
              width: "100px",
              background: tokens.colors.bg.surface,
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(turnCount / maxTurns) * 100}%`,
                background: `linear-gradient(90deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: `1px solid ${tokens.colors.bg.elevated}`,
          background: tokens.colors.bg.base,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={scenario.inputPlaceholder || "Deine Antwort..."}
            disabled={isLoading}
            rows={2}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: tokens.colors.bg.surface,
              border: `1px solid ${tokens.colors.aurora.lavender}30`,
              borderRadius: "16px",
              color: tokens.colors.text.primary,
              fontSize: "15px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background:
                input.trim() && !isLoading
                  ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
                  : tokens.colors.bg.surface,
              border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Send
              size={20}
              color={input.trim() && !isLoading ? "#fff" : tokens.colors.text.muted}
            />
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
