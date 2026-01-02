/**
 * WIR PAGE - app/wir/page.js
 * Übersichtsseite für Paar-Features mit Agreements Integration
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import AgreementsList from "../../components/AgreementsList";
import AgreementDetail from "../../components/AgreementDetail";
import CreateAgreement from "../../components/CreateAgreement";
import DisconnectDialog from "../../components/DisconnectDialog";
import {
  Home as HomeIcon,
  Heart,
  ClipboardList,
  User,
  Users,
  AlertTriangle,
  Settings,
  Clock,
  ChevronRight,
  Timer,
  BellOff,
  Sofa,
  Headphones
} from "lucide-react";

export default function WirPage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [pendingDissolution, setPendingDissolution] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pending agreement suggestions
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && profile && (!profile.name || !profile.partner_name)) {
      router.push("/onboarding");
    }
  }, [user, profile, loading, router]);

  // Check for pending dissolution (partner initiated disconnect)
  useEffect(() => {
    if (user && !profile?.couple_id) {
      checkPendingDissolution();
    }
  }, [user, profile?.couple_id]);

  // Load pending agreement suggestions
  useEffect(() => {
    if (user && profile?.couple_id) {
      loadPendingSuggestions();
    }
  }, [user, profile?.couple_id, refreshKey]);

  const loadPendingSuggestions = async () => {
    if (!profile?.couple_id) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/agreements/suggestions?coupleId=${profile.couple_id}`
      );
      const data = await response.json();

      if (data.suggestions) {
        // Filter to only show suggestions where current user can act
        // or needs to be notified
        setPendingSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const checkPendingDissolution = async () => {
    try {
      const response = await fetch(`/api/couple/disconnect?userId=${user.id}`);
      const data = await response.json();
      if (data.pendingDissolution) {
        setPendingDissolution(data);
      }
    } catch (error) {
      console.error("Failed to check dissolution:", error);
    }
  };

  const handleRefreshAgreements = () => {
    setRefreshKey(k => k + 1);
  };

  const handleDisconnectComplete = async () => {
    setShowDisconnect(false);
    setPendingDissolution(null);
    await fetchProfile(user.id);
  };

  if (loading || !profile) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: tokens.colors.bg.deep,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${tokens.colors.bg.soft}`,
          borderTopColor: tokens.colors.aurora.lavender,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";
  const userName = profile?.name || "du";
  const isConnected = !!profile?.couple_id;

  const handleStartCoupleSession = () => {
    setShowPrepModal(true);
  };

  const handleConfirmStart = () => {
    setShowPrepModal(false);
    router.push("/session/couple");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.colors.bg.deep,
      paddingBottom: "100px",
      transition: "background 0.3s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "24px 20px 16px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: tokens.colors.text.primary,
          margin: "0 0 4px 0",
          fontFamily: tokens.fonts.display,
        }}>Wir</h1>
        <p style={{
          fontSize: "15px",
          color: tokens.colors.aurora.lavender,
          margin: 0,
          fontWeight: "500",
        }}>{userName} & {partnerName}</p>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Pending Dissolution Banner */}
        {pendingDissolution && (
          <div style={{
            background: isDarkMode ? "rgba(251, 191, 36, 0.2)" : "#fef3c7",
            borderRadius: tokens.radii.lg,
            padding: "16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <AlertTriangle size={24} color={tokens.colors.warning} />
            <div style={{ flex: 1 }}>
              <p style={{
                margin: "0 0 4px 0",
                fontWeight: "600",
                color: tokens.colors.warning,
                fontSize: "15px",
              }}>
                {pendingDissolution.initiatedBy} hat die Verbindung aufgelöst
              </p>
              <p style={{
                margin: 0,
                color: tokens.colors.text.secondary,
                fontSize: "13px",
              }}>
                Du kannst wählen, ob du anonymisierte Learnings behalten möchtest.
              </p>
            </div>
            <button
              onClick={() => setShowDisconnect(true)}
              style={{
                padding: "8px 16px",
                background: tokens.colors.warning,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.sm,
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Bestätigen
            </button>
          </div>
        )}

        {/* Couple Session Card - Only if connected */}
        {isConnected && (
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: tokens.shadows.medium,
            marginBottom: "16px",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}><Users size={40} color="white" /></div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              margin: "0 0 8px 0",
              fontFamily: tokens.fonts.display,
            }}>Gemeinsame Session</h2>
            <p style={{
              fontSize: "15px",
              color: tokens.colors.text.secondary,
              lineHeight: "1.6",
              margin: "0 0 24px 0",
            }}>
              Sprecht zusammen mit Amiya über eure Beziehung.
              Sie moderiert und hilft euch, einander besser zu verstehen.
            </p>
            <button
              onClick={handleStartCoupleSession}
              style={{
                padding: "16px 32px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: isDarkMode
                  ? tokens.shadows.glow(tokens.colors.aurora.lavender)
                  : "0 4px 15px rgba(139, 92, 246, 0.3)",
                width: "100%",
              }}
            >
              Session starten
            </button>
          </div>
        )}

        {/* Pending Suggestions Section - Only if connected and has suggestions */}
        {isConnected && pendingSuggestions.length > 0 && (
          <div style={{
            background: isDarkMode
              ? `linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(253, 230, 138, 0.1))`
              : "linear-gradient(135deg, #fef3c7, #fde68a)",
            borderRadius: tokens.radii.xl,
            padding: "20px",
            marginBottom: "16px",
            border: `1px solid ${tokens.colors.warning}`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <span style={{ fontSize: "28px" }}>⏳</span>
              <p style={{
                margin: 0,
                fontWeight: "600",
                color: tokens.colors.warning,
                fontSize: "16px",
              }}>
                {pendingSuggestions.length === 1
                  ? "1 Vereinbarung wartet auf Bestätigung"
                  : `${pendingSuggestions.length} Vereinbarungen warten auf Bestätigung`}
              </p>
            </div>

            {pendingSuggestions.map((suggestion) => (
              <div key={suggestion.id} style={{
                background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)",
                borderRadius: tokens.radii.md,
                padding: "16px",
                marginBottom: "12px",
              }}>
                <p style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  color: tokens.colors.text.primary,
                  margin: "0 0 8px 0",
                }}>"{suggestion.title}"</p>
                {suggestion.underlying_need && (
                  <p style={{
                    fontSize: "13px",
                    color: tokens.colors.text.secondary,
                    margin: "0 0 12px 0",
                    fontStyle: "italic",
                  }}>
                    Dahinter: {suggestion.underlying_need}
                  </p>
                )}
                <button
                  onClick={() => router.push(`/history?session=${suggestion.session_id}`)}
                  style={{
                    padding: "10px 20px",
                    background: tokens.colors.warning,
                    color: "white",
                    border: "none",
                    borderRadius: tokens.radii.sm,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Ansehen & Bestätigen
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agreements Section - Only if connected */}
        {isConnected && (
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "20px",
            boxShadow: tokens.shadows.medium,
            marginBottom: "16px",
          }}>
            <AgreementsList
              key={refreshKey}
              onSelectAgreement={(id) => setSelectedAgreementId(id)}
              onCreateNew={() => setShowCreateAgreement(true)}
            />
          </div>
        )}

        {/* Connect Card - Only if not connected */}
        {!isConnected && !pendingDissolution && (
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: tokens.shadows.medium,
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💑</div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              margin: "0 0 8px 0",
              fontFamily: tokens.fonts.display,
            }}>Mehr gemeinsam erleben</h2>
            <p style={{
              fontSize: "16px",
              color: tokens.colors.aurora.lavender,
              fontWeight: "500",
              margin: "0 0 16px 0",
            }}>
              Näher. Tiefer. Mühelos.
            </p>
            <p style={{
              fontSize: "15px",
              color: tokens.colors.text.secondary,
              lineHeight: "1.6",
              margin: "0 0 24px 0",
            }}>
              Ein Abo, zwei Accounts. Füge {partnerName} zu deinem Abo hinzu –
              oder tritt ihrem bei, ohne zusätzliche Kosten.
            </p>
            <button
              onClick={() => router.push("/wir/connect")}
              style={{
                padding: "16px 32px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.md,
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: isDarkMode
                  ? tokens.shadows.glow(tokens.colors.aurora.lavender)
                  : "0 4px 15px rgba(139, 92, 246, 0.3)",
              }}
            >
              Verbinden
            </button>
          </div>
        )}

        {/* History Preview Card */}
        <div
          style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.lg,
            padding: "20px",
            boxShadow: tokens.shadows.soft,
            marginBottom: "16px",
            cursor: "pointer",
          }}
          onClick={() => router.push("/history")}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            <ClipboardList size={32} color={tokens.colors.aurora.lavender} />
            <div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: "0 0 4px 0",
              }}>Session-Verlauf</h3>
              <p style={{
                fontSize: "13px",
                color: tokens.colors.text.secondary,
                margin: 0,
              }}>
                Alle Solo- und Couple-Sessions ansehen
              </p>
            </div>
            <ChevronRight size={20} color={tokens.colors.text.muted} style={{ marginLeft: "auto" }} />
          </div>
        </div>

        {/* Settings Card - Only if connected */}
        {isConnected && (
          <div
            style={{
              background: tokens.colors.bg.elevated,
              borderRadius: tokens.radii.lg,
              padding: "20px",
              boxShadow: tokens.shadows.soft,
              marginBottom: "16px",
              cursor: "pointer",
            }}
            onClick={() => setShowDisconnect(true)}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              <Settings size={32} color={tokens.colors.text.muted} />
              <div>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: tokens.colors.text.primary,
                  margin: "0 0 4px 0",
                }}>Verbindung verwalten</h3>
                <p style={{
                  fontSize: "13px",
                  color: tokens.colors.text.secondary,
                  margin: 0,
                }}>
                  Paar-Einstellungen und Trennung
                </p>
              </div>
              <ChevronRight size={20} color={tokens.colors.text.muted} style={{ marginLeft: "auto" }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: tokens.colors.bg.elevated,
        borderTop: `1px solid ${tokens.colors.bg.soft}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0 24px 0",
      }}>
        <button onClick={() => router.push("/")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <HomeIcon size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Home</span>
        </button>
        <button style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Heart size={24} color={tokens.colors.aurora.lavender} />
            {pendingSuggestions.length > 0 && (
              <span style={{
                position: "absolute",
                top: "-6px",
                right: "-10px",
                background: tokens.colors.error,
                color: "white",
                fontSize: "11px",
                fontWeight: "bold",
                minWidth: "18px",
                height: "18px",
                borderRadius: "9px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}>{pendingSuggestions.length}</span>
            )}
          </div>
          <span style={{
            fontSize: "12px",
            color: tokens.colors.aurora.lavender,
            fontWeight: "600",
          }}>Wir</span>
        </button>
        <button onClick={() => router.push("/history")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <ClipboardList size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Verlauf</span>
        </button>
        <button onClick={() => router.push("/profile")} style={{
          background: "none",
          border: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
        }}>
          <User size={24} color={tokens.colors.text.muted} />
          <span style={{ fontSize: "12px", color: tokens.colors.text.muted }}>Profil</span>
        </button>
      </div>

      {/* Preparation Modal */}
      {showPrepModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 1000,
        }}>
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "32px 24px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💜</div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: tokens.colors.text.primary,
              margin: "0 0 24px 0",
              fontFamily: tokens.fonts.display,
            }}>Bereit für eure Session?</h2>

            <div style={{ textAlign: "left", marginBottom: "24px" }}>
              {[
                { icon: "⏱️", title: "Max. 1 Stunde", text: "Plant genug Zeit ein, ohne Zeitdruck." },
                { icon: "🔕", title: "Nicht stören", text: "Handys auf lautlos, voller Fokus auf euch." },
                { icon: "🛋️", title: "Gemütlicher Ort", text: "Setzt euch bequem hin, nebeneinander." },
                { icon: "🎧", title: "Lautsprecher nutzen", text: "Damit ihr beide Amiya gut hört." },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "16px",
                  marginBottom: "20px",
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "24px", marginTop: "2px" }}>{item.icon}</span>
                  <div>
                    <strong style={{ color: tokens.colors.text.primary }}>{item.title}</strong>
                    <p style={{
                      fontSize: "13px",
                      color: tokens.colors.text.secondary,
                      margin: "4px 0 0 0",
                    }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmStart}
              style={{
                width: "100%",
                padding: "18px",
                background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}, ${tokens.colors.aurora.rose})`,
                color: "white",
                border: "none",
                borderRadius: tokens.radii.lg,
                fontSize: "17px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: isDarkMode
                  ? tokens.shadows.glow(tokens.colors.aurora.lavender)
                  : "0 4px 15px rgba(139, 92, 246, 0.3)",
                marginBottom: "12px",
              }}
            >
              Session starten
            </button>

            <button
              onClick={() => setShowPrepModal(false)}
              style={{
                background: "none",
                border: "none",
                color: tokens.colors.text.secondary,
                fontSize: "15px",
                cursor: "pointer",
                padding: "8px",
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Agreement Detail Modal */}
      {selectedAgreementId && (
        <AgreementDetail
          agreementId={selectedAgreementId}
          onClose={() => setSelectedAgreementId(null)}
          onUpdate={handleRefreshAgreements}
        />
      )}

      {/* Create Agreement Modal */}
      {showCreateAgreement && (
        <CreateAgreement
          onClose={() => setShowCreateAgreement(false)}
          onCreated={handleRefreshAgreements}
        />
      )}

      {/* Disconnect Dialog */}
      {showDisconnect && (
        <DisconnectDialog
          pendingDissolution={pendingDissolution}
          onClose={() => setShowDisconnect(false)}
          onComplete={handleDisconnectComplete}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// All styles now use theme tokens inline
