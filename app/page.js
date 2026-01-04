/**
 * MAIN PAGE - app/page.js
 * Hauptseite mit Solo Voice-Session
 * UPDATED: Kontext-Limit auf 4000 Zeichen erhöht für Agreements
 * MIGRATED: Using Design System tokens from ThemeContext
 */
"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import { sessionsService } from "../lib/sessions";
import AnalysisView from "../components/AnalysisView";
import {
  Home as HomeIcon,
  Heart,
  ClipboardList,
  User,
  Mic,
  Headphones,
  AlertTriangle,
  Loader2,
  Ear,
  MessageCircle,
  Volume2,
  LogOut,
  BarChart2,
  Bug,
  X
} from "lucide-react";

const AGENT_ID = "agent_8601kdk8kndtedgbn0ea13zff5aa";

const STATE = {
  IDLE: "idle",
  CONNECTING: "connecting",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking"
};

// Wrapper for Suspense (useSearchParams requires it)
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}

function LoadingScreen() {
  // Static colors for initial load (before ThemeContext)
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      background: "#fafaf9",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #e7e5e4",
        borderTopColor: "#7c3aed",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#57534e" }}>Laden...</p>
    </div>
  );
}

function HomeContent() {
  const { user, profile, loading: authLoading, signOut, updateProfile } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Test mode: ?testMode=true in URL
  const isTestMode = searchParams.get("testMode") === "true";
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [showTooShortModal, setShowTooShortModal] = useState(false);

  const conversationRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const mediaStreamRef = useRef(null); // For microphone cleanup

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

  // Check for memory consent
  useEffect(() => {
    if (!authLoading && user && profile && profile.name && profile.partner_name) {
      const neverDecided = profile.memory_consent === null ||
                           profile.memory_consent === undefined ||
                           (profile.memory_consent === false && !profile.memory_consent_at);
      if (neverDecided) {
        router.push("/onboarding/memory");
      }
    }
  }, [user, profile, authLoading, router]);

  // Load pending suggestions count for badge
  useEffect(() => {
    if (user && profile?.couple_id) {
      loadPendingSuggestionsCount();
    }
  }, [user, profile?.couple_id]);

  const loadPendingSuggestionsCount = async () => {
    if (!profile?.couple_id) return;
    try {
      const response = await fetch(
        `/api/agreements/suggestions?coupleId=${profile.couple_id}`
      );
      const data = await response.json();
      setPendingSuggestionsCount(data.suggestions?.length || 0);
    } catch (error) {
      console.error("Failed to load suggestions count:", error);
    }
  };

  useEffect(() => {
    if (started && !timerRef.current) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  // Time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Guten Morgen";
    if (hour >= 12 && hour < 17) return "Guten Tag";
    if (hour >= 17 && hour < 21) return "Guten Abend";
    return "Gute Nacht";
  };

  const displayName = profile?.name || "du";
  const partnerName = profile?.partner_name || "";
  const timeGreeting = getTimeGreeting();

  const startSession = useCallback(async () => {
    if (!user) return;

    setStarted(true);
    setVoiceState(STATE.CONNECTING);
    messagesRef.current = [];
    setMessageCount(0);
    setAnalysisError(null);

    try {
      // Load context from Memory System
      let userContext = "";
      try {
        const contextResponse = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            coupleId: profile?.couple_id || null,
            sessionType: "solo"
          }),
        });

        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          userContext = contextData.context || "";
          console.log("Memory loaded:", contextData.hasMemory ? "with context" : "no consent");
          if (contextData.debug) {
            console.log("Debug:", contextData.debug);
          }
        }
      } catch (contextError) {
        console.error("Failed to load memory:", contextError);
      }

      const session = await sessionsService.create(user.id, "solo");
      setCurrentSessionId(session.id);

      const { Conversation } = await import("@elevenlabs/client");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // Save for cleanup

      console.log("Context length:", userContext.length);
      console.log("Context preview:", userContext.substring(0, 300));

      // UPDATED: Context limit increased to 4000 characters for Agreements
      let sanitizedContext = userContext
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 4000);

      if (userContext.length > 4000) {
        sanitizedContext += "...";
      }

      console.log("Sanitized context length:", sanitizedContext.length);

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: profile?.name || "User",
          partner_name: profile?.partner_name || "Partner",
          user_context: sanitizedContext || "Keine fruheren Gesprache vorhanden.",
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs");
          setVoiceState(STATE.LISTENING);
        },
        onDisconnect: (details) => {
          console.log("Disconnected from ElevenLabs", details);
          setVoiceState(STATE.IDLE);
        },
        onError: (error) => {
          console.error("ElevenLabs error:", error);
          setVoiceState(STATE.IDLE);
        },
        onStatusChange: (status) => {
          console.log("Status changed:", status);
        },
        onMessage: (message) => {
          console.log("Message received:", message);
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
          console.log("Mode changed:", mode);
          const modeValue = mode.mode || mode;
          if (modeValue === "listening") {
            setVoiceState(STATE.LISTENING);
          } else if (modeValue === "thinking") {
            setVoiceState(STATE.THINKING);
          } else if (modeValue === "speaking") {
            setVoiceState(STATE.SPEAKING);
          }
        },
      });

      conversationRef.current = conversation;

    } catch (error) {
      console.error("Failed to start session:", error);
      alert("Konnte Sitzung nicht starten. Bitte Mikrofon-Zugriff erlauben.");
      setStarted(false);
      setVoiceState(STATE.IDLE);
    }
  }, [user, profile]);

  // ═══════════════════════════════════════════════════════════════════
  // ADAPTIVE COACHING: Calculate engagement metrics
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Calculates engagement metrics for the current session
   * This data is saved and used for personalized coaching
   *
   * @param {Array} messages - Array of {role, content} objects
   * @param {number} durationSec - Session duration in seconds
   * @returns {Object} Engagement metrics
   */
  const calculateEngagementMetrics = useCallback((messages, durationSec) => {
    const userMsgs = messages.filter(m => m.role === "user");
    const aiMsgs = messages.filter(m => m.role === "assistant");

    const userChars = userMsgs.reduce((sum, m) => sum + m.content.length, 0);
    const aiChars = aiMsgs.reduce((sum, m) => sum + m.content.length, 0);
    const totalChars = userChars + aiChars;

    // Trend: Compare first half with second half of user messages
    let trend = "consistent";
    if (userMsgs.length >= 4) {
      const midpoint = Math.floor(userMsgs.length / 2);
      const firstHalfAvg = userMsgs.slice(0, midpoint).reduce((s, m) => s + m.content.length, 0) / midpoint;
      const secondHalfAvg = userMsgs.slice(midpoint).reduce((s, m) => s + m.content.length, 0) / (userMsgs.length - midpoint);

      if (secondHalfAvg > firstHalfAvg * 1.3) trend = "opening_up";
      if (secondHalfAvg < firstHalfAvg * 0.7) trend = "closing_down";
    }

    return {
      user_messages: userMsgs.length,
      user_chars: userChars,
      ai_chars: aiChars,
      ratio: totalChars > 0 ? Math.round((userChars / totalChars) * 100) / 100 : 0,
      avg_msg_length: userMsgs.length > 0 ? Math.round(userChars / userMsgs.length) : 0,
      duration_sec: durationSec,
      trend
    };
  }, []);

  const checkAnalysisViability = useCallback(async () => {
    const messages = messagesRef.current;
    if (messages.length === 0) return { viable: false, reason: "empty" };

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
    const currentDuration = sessionTime;

    setAnalysisError(null);

    // Set loading state immediately if analysis is requested
    if (requestAnalysis && hasMessages) {
      setIsGeneratingAnalysis(true);
    }

    if (currentSessionId && hasMessages) {
      try {
        // Calculate engagement metrics (Adaptive Coaching)
        const engagementMetrics = calculateEngagementMetrics(currentMessages, currentDuration);
        console.log("Engagement metrics:", engagementMetrics);

        let summary = "";
        if (profile?.name || profile?.partner_name) {
          summary += `[Kontext: User=${profile?.name || "unbekannt"}, Partner=${profile?.partner_name || "unbekannt"}]\n\n`;
        }
        summary += currentMessages
          .map(m => `${m.role === "user" ? (profile?.name || "User") : "Amiya"}: ${m.content}`)
          .join("\n");

        // End session WITH engagement metrics
        await sessionsService.end(currentSessionId, summary, [], engagementMetrics);

        // Update coaching profile (if memory_consent given)
        if (profile?.memory_consent) {
          try {
            await fetch("/api/coaching-profile/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                sessionId: currentSessionId,
                engagementMetrics
              }),
            });
            console.log("Coaching profile updated");
          } catch (coachingError) {
            console.error("Coaching profile update failed:", coachingError);
          }
        }

        if (requestAnalysis) {

          const viability = await checkAnalysisViability();

          if (!viability.viable) {
            // Delete session if not enough content
            try {
              await sessionsService.delete(sessionIdToAnalyze);
              console.log("Session deleted - not enough content");
            } catch (deleteError) {
              console.error("Failed to delete session:", deleteError);
            }

            setIsGeneratingAnalysis(false);
            // Show friendly "too short" modal
            setShowTooShortModal(true);
            return;
          }

          try {
            const analysisResult = await sessionsService.requestAnalysis(currentSessionId);

            try {
              await fetch("/api/memory/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user.id,
                  coupleId: profile?.couple_id || null,
                  sessionId: currentSessionId,
                  sessionType: "solo",
                  analysis: analysisResult?.analysis || summary
                }),
              });
              console.log("Memory updated after solo session");
            } catch (memoryError) {
              console.error("Memory update failed:", memoryError);
            }

            setIsGeneratingAnalysis(false);
            setAnalysisSessionId(sessionIdToAnalyze);
            setShowAnalysis(true);
          } catch (analysisErr) {
            console.error("Analysis failed:", analysisErr);
            setIsGeneratingAnalysis(false);
            setAnalysisError("Analyse konnte nicht erstellt werden. Bitte versuche es spater erneut.");
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
      // No messages at all - show friendly modal
      setShowTooShortModal(true);
      return;
    }
  }, [currentSessionId, profile, checkAnalysisViability, resetSession, user, sessionTime, calculateEngagementMetrics]);

  const handleEndClick = useCallback(async () => {
    // Give immediate visual feedback
    setVoiceState(STATE.IDLE);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // End ElevenLabs session
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.log("Session already ended");
      }
      conversationRef.current = null;
    }

    // IMPORTANT: Explicitly release microphone (Fix for Safari)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Audio track stopped:", track.label);
      });
      mediaStreamRef.current = null;
    }

    /**
     * Session end logic:
     * - auto_analyze=true -> Automatically analyze
     * - auto_analyze=false -> Show dialog (reminder of benefits)
     */
    if (profile?.auto_analyze) {
      // With analysis: automatically analyze
      endSession(true);
    } else {
      // Show dialog - User can decide per session
      // With "Mit Analyse" consent is permanently activated
      setShowEndDialog(true);
    }
  }, [profile?.auto_analyze, endSession]);

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisSessionId(null);
    setAnalysisError(null);
    resetSession();
  };

  /**
   * User chooses "Mit Analyse" in dialog
   * -> Permanently activate consent + analyze session
   */
  const handleDialogAnalyze = async () => {
    setShowEndDialog(false);

    // Permanently activate consent
    try {
      await updateProfile({
        memory_consent: true,
        memory_consent_at: new Date().toISOString(),
        auto_analyze: true,
      });
      console.log("Consent permanently enabled via dialog");
    } catch (err) {
      console.error("Failed to update consent:", err);
    }

    // Analyze session
    endSession(true);
  };

  /**
   * User chooses "Ohne Analyse" in dialog
   * -> End session without analysis
   */
  const handleDialogSkip = async () => {
    setShowEndDialog(false);
    await endSession(false);
    resetSession();
  };

  // ============ TEST MODE HELPERS ============
  const addFakeMessages = () => {
    const fakeMessages = [
      { role: "assistant", content: "Hallo! Schon, dass du da bist. Was beschaftigt dich heute?" },
      { role: "user", content: "Ich habe das Gefuhl, dass mein Partner und ich aneinander vorbeireden." },
      { role: "assistant", content: "Das klingt belastend. Kannst du mir ein konkretes Beispiel nennen?" },
      { role: "user", content: "Gestern wollte ich uber unsere Wochenendplane sprechen, aber er hat nur auf sein Handy geschaut." },
      { role: "assistant", content: "Ich verstehe. Wie hast du dich in dem Moment gefuhlt?" },
      { role: "user", content: "Ignoriert und unwichtig. Als ob meine Bedurfnisse keine Rolle spielen." },
    ];
    messagesRef.current = fakeMessages;
    setMessageCount(fakeMessages.length);
    setStarted(true);
    setSessionTime(180); // 3 minutes
  };

  useEffect(() => {
    return () => {
      // Cleanup when leaving the page
      if (conversationRef.current) {
        conversationRef.current.endSession();
        conversationRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Release microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (authLoading) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Laden...</p>
      </div>
    );
  }

  if (!user || !profile?.name || !profile?.partner_name) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
      </div>
    );
  }

  // ============================================================================
  // START SCREEN
  // ============================================================================
  if (!started && !isGeneratingAnalysis) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        paddingBottom: "100px",
      }}>
        <div style={{ maxWidth: "400px", textAlign: "center", width: "100%" }}>
          {/* User Header Bar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            padding: "8px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.md,
            boxShadow: tokens.shadows.soft,
          }}>
            <button
              onClick={() => router.push("/profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: tokens.radii.sm,
                fontSize: "15px",
                color: tokens.colors.text.primary,
              }}
            >
              <span style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: tokens.gradients.primary,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "600",
              }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span>{displayName}</span>
            </button>
            <button onClick={signOut} style={{
              ...tokens.buttons.ghost,
              color: tokens.colors.text.muted,
            }}>
              Abmelden
            </button>
          </div>

          {/* Heart Logo */}
          <div style={{
            width: "100px",
            height: "100px",
            background: tokens.gradients.speaking,
            borderRadius: tokens.radii.xxl,
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: tokens.shadows.glow(tokens.colors.aurora.lavender),
          }}><Heart size={50} color="white" fill="white" /></div>

          {/* Time-based greeting */}
          <p style={{
            ...tokens.typography.label,
            marginBottom: "4px",
          }}>{timeGreeting.toUpperCase()}</p>

          <h1 style={{
            ...tokens.typography.h1,
            fontSize: "36px",
          }}>{displayName}</h1>

          <p style={{
            ...tokens.typography.body,
            marginBottom: "24px",
          }}>Solo Session</p>

          <p style={{
            ...tokens.typography.body,
            marginBottom: "32px",
            lineHeight: "1.8",
          }}>
            Erzahl mir was dich beschaftigt -<br />
            uber dich und {partnerName}.
          </p>

          {/* Analysis Error Alert */}
          {analysisError && (
            <div style={{
              ...tokens.alerts.error,
              marginBottom: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              textAlign: "left",
              border: `1px solid ${tokens.colors.error}`,
            }}>
              <AlertTriangle size={20} color={tokens.colors.error} style={{ flexShrink: 0 }} />
              <p style={{
                color: tokens.colors.error,
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.5",
              }}>{analysisError}</p>
            </div>
          )}

          {/* Start Session Button */}
          <button onClick={startSession} style={tokens.buttons.primaryLarge}>
            Session starten
          </button>

          {/* Headphones hint */}
          <p style={{
            ...tokens.typography.small,
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}><Headphones size={16} /> Beste Erfahrung mit Kopfhorern</p>
        </div>

        {/* Bottom Navigation */}
        <div style={tokens.layout.navBar}>
          <button style={tokens.buttons.nav(true)}>
            <HomeIcon size={24} color={tokens.colors.aurora.lavender} />
            <span style={{ color: tokens.colors.aurora.lavender, fontWeight: "600" }}>Home</span>
          </button>
          <button onClick={() => router.push("/wir")} style={tokens.buttons.nav(false)}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Heart size={24} color={tokens.colors.text.muted} />
              {pendingSuggestionsCount > 0 && (
                <span style={tokens.badges.notification}>{pendingSuggestionsCount}</span>
              )}
            </div>
            <span>Wir</span>
          </button>
          <button onClick={() => router.push("/history")} style={tokens.buttons.nav(false)}>
            <ClipboardList size={24} color={tokens.colors.text.muted} />
            <span>Verlauf</span>
          </button>
          <button onClick={() => router.push("/profile")} style={tokens.buttons.nav(false)}>
            <User size={24} color={tokens.colors.text.muted} />
            <span>Profil</span>
          </button>
        </div>

        {showAnalysis && analysisSessionId && (
          <AnalysisView
            sessionId={analysisSessionId}
            onClose={handleCloseAnalysis}
          />
        )}

        {/* ============ DEBUG PANEL on START SCREEN ============ */}
        {isTestMode && (
          <>
            {/* Floating Debug Button */}
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{
                ...tokens.buttons.icon,
                position: "fixed",
                bottom: "100px",
                right: "20px",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: showDebugPanel ? tokens.colors.error : tokens.colors.aurora.lavender,
                color: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                zIndex: 9999,
              }}
            >
              {showDebugPanel ? <X size={24} /> : <Bug size={24} />}
            </button>

            {/* Debug Panel */}
            {showDebugPanel && (
              <div style={{
                ...tokens.cards.elevated,
                position: "fixed",
                bottom: "160px",
                right: "20px",
                width: "300px",
                zIndex: 9998,
                border: `1px solid ${tokens.colors.bg.soft}`,
              }}>
                <h4 style={{
                  ...tokens.typography.h3,
                  fontSize: "14px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <Bug size={16} /> Test-Modus (Start)
                </h4>

                {/* Profile Status */}
                <div style={{
                  ...tokens.cards.surface,
                  marginBottom: "12px",
                  fontSize: "12px",
                }}>
                  <div style={{ color: tokens.colors.text.muted, marginBottom: "4px" }}>
                    Profil-Status:
                  </div>
                  <div style={{ color: tokens.colors.text.secondary }}>
                    memory_consent: <span style={{ color: profile?.memory_consent ? tokens.colors.success : tokens.colors.error }}>
                      {profile?.memory_consent ? "true" : "false"}
                    </span>
                  </div>
                  <div style={{ color: tokens.colors.text.secondary }}>
                    auto_analyze: <span style={{ color: profile?.auto_analyze ? tokens.colors.success : tokens.colors.error }}>
                      {profile?.auto_analyze ? "true" : "false"}
                    </span>
                  </div>
                </div>

                {/* Test Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={addFakeMessages}
                    style={{
                      ...tokens.buttons.primarySmall,
                      background: tokens.colors.aurora.sky,
                    }}
                  >
                    Fake-Session starten
                  </button>
                  <button
                    onClick={() => setShowEndDialog(true)}
                    style={{
                      ...tokens.buttons.primarySmall,
                      background: tokens.colors.aurora.lavender,
                    }}
                  >
                    Ende-Dialog anzeigen
                  </button>
                </div>

                {/* Info */}
                <p style={{
                  ...tokens.typography.small,
                  marginTop: "12px",
                  marginBottom: 0,
                  lineHeight: "1.4",
                }}>
                  URL: ?testMode=true
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ============================================================================
  // ANALYSIS GENERATING SCREEN
  // ============================================================================
  if (isGeneratingAnalysis) {
    return (
      <div style={{
        ...tokens.layout.page,
        display: "flex",
        flexDirection: "column",
        padding: 0,
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}>
          <div style={tokens.loaders.spinner(60)} />
          <h2 style={{
            ...tokens.typography.h2,
            marginTop: "24px",
            marginBottom: "12px",
          }}>Analyse wird erstellt...</h2>
          <p style={{
            ...tokens.typography.body,
            textAlign: "center",
          }}>
            Amiya wertet euer Gesprach aus.<br />
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

  // ============================================================================
  // SESSION SCREEN
  // ============================================================================
  return (
    <div style={{
      ...tokens.layout.page,
      display: "flex",
      flexDirection: "column",
      padding: 0,
    }}>
      {/* Session Header */}
      <div style={tokens.layout.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: tokens.radii.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            ...getStateStyle(voiceState, tokens),
          }}>
            {voiceState === STATE.CONNECTING && <Loader2 size={22} color="white" style={{ animation: "spin 1s linear infinite" }} />}
            {voiceState === STATE.LISTENING && <Ear size={22} color="white" />}
            {voiceState === STATE.THINKING && <MessageCircle size={22} color="white" />}
            {voiceState === STATE.SPEAKING && <Volume2 size={22} color="white" />}
            {voiceState === STATE.IDLE && <Heart size={22} color="white" />}
          </div>
          <div>
            <div style={{
              fontWeight: "600",
              color: tokens.colors.text.primary,
              fontSize: "17px",
            }}>Solo Session</div>
            <div style={{
              fontSize: "13px",
              color: tokens.colors.text.secondary,
            }}>{formatTime(sessionTime)}</div>
          </div>
        </div>
        <button onClick={handleEndClick} style={tokens.buttons.danger}>Beenden</button>
      </div>

      {/* Session Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}>
        {/* Status Ring */}
        <div style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          border: `6px solid ${tokens.colors.bg.soft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          ...getStatusRingStyle(voiceState, tokens),
        }}>
          <div style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: tokens.colors.bg.elevated,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {voiceState === STATE.CONNECTING && (
              <div style={tokens.loaders.spinner(40)} />
            )}
            {voiceState === STATE.LISTENING && (
              <div style={tokens.loaders.pulse} />
            )}
            {voiceState === STATE.THINKING && (
              <div style={tokens.loaders.breathe} />
            )}
            {voiceState === STATE.SPEAKING && (
              <div style={{
                ...tokens.loaders.pulse,
                background: tokens.gradients.speaking,
                animation: "pulse 1s ease-in-out infinite",
              }} />
            )}
            {voiceState === STATE.IDLE && <Mic size={60} color={tokens.colors.text.muted} />}
          </div>
        </div>

        <p style={{
          ...tokens.typography.h3,
          marginTop: "32px",
          fontSize: "20px",
        }}>{getStatusText(voiceState)}</p>

        <p style={{
          ...tokens.typography.small,
          marginTop: "12px",
          minHeight: "20px",
        }}>
          {voiceState === STATE.LISTENING && "Sprich einfach..."}
          {voiceState === STATE.SPEAKING && "Unterbrechen? Einfach sprechen."}
          {voiceState === STATE.THINKING && "Einen Moment..."}
        </p>
      </div>

      {/* Session End Dialog with Analysis Recommendation */}
      {showEndDialog && (
        <div style={tokens.modals.overlay}>
          <div style={{
            ...tokens.modals.containerSmall,
            textAlign: "center",
            padding: "28px",
          }}>
            {/* Header */}
            <div style={{
              width: "56px",
              height: "56px",
              background: tokens.gradients.primary,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <BarChart2 size={28} color="white" />
            </div>

            <h3 style={{
              ...tokens.modals.title,
              marginBottom: "8px",
              fontSize: "20px",
            }}>Session beenden</h3>

            <p style={{
              ...tokens.typography.body,
              marginBottom: "20px",
            }}>
              Mochtest du eine Analyse dieser Session?
            </p>

            {/* Benefits Box */}
            <div style={{
              ...tokens.cards.surface,
              marginBottom: "20px",
              textAlign: "left",
            }}>
              <p style={{
                color: tokens.colors.text.primary,
                fontSize: "14px",
                fontWeight: "600",
                margin: "0 0 12px 0",
              }}>Mit Analyse kannst du:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>:</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Muster in eurer Kommunikation sehen
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>:</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Konkrete nachste Schritte erhalten
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>:</span>
                  <span style={{ color: tokens.colors.text.secondary, fontSize: "14px" }}>
                    Amiya lernt euch besser kennen
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={tokens.modals.buttonGroup}>
              <button
                onClick={handleDialogSkip}
                style={{
                  ...tokens.buttons.secondary,
                  flex: 1,
                }}
              >
                Ohne Analyse
              </button>
              <button
                onClick={handleDialogAnalyze}
                style={{
                  ...tokens.buttons.primary,
                  flex: 1,
                  position: "relative",
                }}
              >
                Mit Analyse
                <span style={{
                  ...tokens.badges.primary,
                  position: "absolute",
                  top: "-10px",
                  right: "-4px",
                  background: tokens.colors.aurora.mint,
                  boxShadow: `0 2px 8px ${tokens.colors.aurora.mint}66`,
                }}>
                  Empfohlen
                </span>
              </button>
            </div>

            {/* Hint */}
            <p style={{
              ...tokens.typography.small,
              marginTop: "16px",
              marginBottom: 0,
              lineHeight: "1.5",
            }}>
              Mit "Mit Analyse" aktivierst du das Memory-System dauerhaft.
              Du kannst das jederzeit in den Einstellungen andern.
            </p>
          </div>
        </div>
      )}

      {showAnalysis && analysisSessionId && (
        <AnalysisView
          sessionId={analysisSessionId}
          onClose={handleCloseAnalysis}
        />
      )}

      {/* Too Short Modal - Friendly message when session was too short */}
      {showTooShortModal && (
        <div style={tokens.modals.overlay}>
          <div style={{
            ...tokens.modals.containerSmall,
            textAlign: "center",
            padding: "32px",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              background: tokens.colors.bg.surface,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <MessageCircle size={32} color={tokens.colors.aurora.lavender} />
            </div>
            <h3 style={{
              ...tokens.modals.title,
              marginBottom: "12px",
              fontSize: "20px",
            }}>Session zu kurz</h3>
            <p style={{
              ...tokens.typography.body,
              marginBottom: "16px",
            }}>
              Fur eine hilfreiche Analyse brauche ich etwas mehr Kontext von dir.
            </p>
            <div style={{
              ...tokens.cards.surface,
              marginBottom: "24px",
              textAlign: "left",
            }}>
              <p style={{
                color: tokens.colors.text.muted,
                fontSize: "13px",
                margin: "0 0 8px 0",
                fontWeight: "600",
              }}>Tipp fur nachstes Mal:</p>
              <p style={{
                color: tokens.colors.text.secondary,
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.5",
              }}>
                Erzahl mir einfach, was dich beschaftigt - auch wenn es nur ein Gefuhl oder eine Situation ist.
              </p>
            </div>
            <p style={{
              ...tokens.typography.small,
              marginBottom: "20px",
            }}>
              Diese Session wurde nicht gespeichert.
            </p>
            <button
              onClick={() => {
                setShowTooShortModal(false);
                resetSession();
              }}
              style={{
                ...tokens.buttons.primary,
                width: "100%",
              }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* ============ DEBUG PANEL (only in test mode) ============ */}
      {isTestMode && (
        <>
          {/* Floating Debug Button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            style={{
              ...tokens.buttons.icon,
              position: "fixed",
              bottom: "20px",
              right: "20px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: showDebugPanel ? tokens.colors.error : tokens.colors.aurora.lavender,
              color: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              zIndex: 9999,
            }}
          >
            {showDebugPanel ? <X size={24} /> : <Bug size={24} />}
          </button>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div style={{
              ...tokens.cards.elevated,
              position: "fixed",
              bottom: "80px",
              right: "20px",
              width: "300px",
              zIndex: 9998,
              border: `1px solid ${tokens.colors.bg.soft}`,
            }}>
              <h4 style={{
                ...tokens.typography.h3,
                fontSize: "14px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Bug size={16} /> Test-Modus
              </h4>

              {/* Profile Status */}
              <div style={{
                ...tokens.cards.surface,
                marginBottom: "12px",
                fontSize: "12px",
              }}>
                <div style={{ color: tokens.colors.text.muted, marginBottom: "4px" }}>
                  Profil-Status:
                </div>
                <div style={{ color: tokens.colors.text.secondary }}>
                  memory_consent: <span style={{ color: profile?.memory_consent ? tokens.colors.success : tokens.colors.error }}>
                    {profile?.memory_consent ? "true" : "false"}
                  </span>
                </div>
                <div style={{ color: tokens.colors.text.secondary }}>
                  auto_analyze: <span style={{ color: profile?.auto_analyze ? tokens.colors.success : tokens.colors.error }}>
                    {profile?.auto_analyze ? "true" : "false"}
                  </span>
                </div>
                <div style={{ color: tokens.colors.text.secondary }}>
                  Messages: {messageCount}
                </div>
              </div>

              {/* Test Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={addFakeMessages}
                  style={{
                    ...tokens.buttons.primarySmall,
                    background: tokens.colors.aurora.sky,
                  }}
                >
                  Fake-Nachrichten hinzufugen
                </button>
                <button
                  onClick={() => setShowEndDialog(true)}
                  style={{
                    ...tokens.buttons.primarySmall,
                    background: tokens.colors.aurora.lavender,
                  }}
                >
                  Ende-Dialog anzeigen
                </button>
                <button
                  onClick={() => setShowTooShortModal(true)}
                  style={{
                    ...tokens.buttons.primarySmall,
                    background: tokens.colors.warning,
                  }}
                >
                  "Zu kurz" Modal anzeigen
                </button>
                <button
                  onClick={() => {
                    setIsGeneratingAnalysis(true);
                    setTimeout(() => setIsGeneratingAnalysis(false), 3000);
                  }}
                  style={{
                    ...tokens.buttons.primarySmall,
                    background: tokens.colors.aurora.mint,
                  }}
                >
                  Analyse-Ladescreen (3s)
                </button>
              </div>

              {/* Info */}
              <p style={{
                ...tokens.typography.small,
                marginTop: "12px",
                marginBottom: 0,
                lineHeight: "1.4",
              }}>
                URL: ?testMode=true
              </p>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS - Using Design System tokens
// ============================================================================

/**
 * Returns the background style for the state indicator
 */
function getStateStyle(state, tokens) {
  const styles = {
    [STATE.CONNECTING]: { background: tokens.gradients.connecting },
    [STATE.LISTENING]: { background: tokens.gradients.primary },
    [STATE.THINKING]: { background: tokens.gradients.thinking },
    [STATE.SPEAKING]: { background: tokens.gradients.speaking },
    [STATE.IDLE]: { background: tokens.gradients.connecting }
  };
  return styles[state] || styles[STATE.IDLE];
}

/**
 * Returns the status text for the current state
 */
function getStatusText(state) {
  const texts = {
    [STATE.CONNECTING]: "Verbinde...",
    [STATE.LISTENING]: "Ich hore zu",
    [STATE.THINKING]: "Ich denke nach",
    [STATE.SPEAKING]: "Amiya spricht",
    [STATE.IDLE]: "Bereit"
  };
  return texts[state] || "";
}

/**
 * Returns the ring style for the status indicator
 */
function getStatusRingStyle(state, tokens) {
  const ringStyles = {
    [STATE.CONNECTING]: { borderColor: "#6b7280" },
    [STATE.LISTENING]: {
      borderColor: tokens.colors.aurora.mint,
      boxShadow: tokens.shadows.glow(tokens.colors.aurora.mint),
    },
    [STATE.THINKING]: {
      borderColor: "#f59e0b",
      boxShadow: tokens.shadows.glow("#f59e0b"),
    },
    [STATE.SPEAKING]: {
      borderColor: tokens.colors.aurora.lavender,
      boxShadow: tokens.shadows.glow(tokens.colors.aurora.lavender),
    },
    [STATE.IDLE]: { borderColor: "#6b7280" }
  };
  return ringStyles[state] || ringStyles[STATE.IDLE];
}
