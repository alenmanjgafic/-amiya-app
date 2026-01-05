/**
 * WIR PAGE - app/wir/page.js
 * Übersichtsseite für Paar-Features mit Agreements Integration
 * Migrated to Design System tokens
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
  AlertTriangle,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function WirPage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [pendingDissolution, setPendingDissolution] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pending agreement suggestions
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Stats for header
  const [sessionCount, setSessionCount] = useState(0);
  const [memberSince, setMemberSince] = useState("");

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

  // Load session stats
  useEffect(() => {
    if (user && profile) {
      loadStats();
    }
  }, [user, profile]);

  const loadStats = async () => {
    try {
      // Calculate member since
      if (profile?.created_at) {
        const created = new Date(profile.created_at);
        const now = new Date();
        const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());

        if (diffMonths < 1) {
          setMemberSince("Neu bei Amiya");
        } else if (diffMonths < 12) {
          setMemberSince(`Seit ${diffMonths} ${diffMonths === 1 ? 'Monat' : 'Monaten'} bei Amiya`);
        } else {
          const years = Math.floor(diffMonths / 12);
          setMemberSince(`Seit ${years} ${years === 1 ? 'Jahr' : 'Jahren'} bei Amiya`);
        }
      }

      // Count sessions (couple sessions)
      if (profile?.couple_id) {
        const { supabase } = await import("../../lib/supabase");
        const { count } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("couple_id", profile.couple_id)
          .eq("type", "couple");

        setSessionCount(count || 0);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadPendingSuggestions = async () => {
    if (!profile?.couple_id || !user?.id) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/agreements/suggestions?coupleId=${profile.couple_id}&userId=${user.id}`
      );
      const data = await response.json();

      // Combine suggestions and pending agreements for display
      const allPending = [
        ...(data.suggestions || []).map(s => ({ ...s, type: 'suggestion' })),
        ...(data.pendingAgreements || []).map(a => ({ ...a, type: 'agreement' }))
      ];
      setPendingSuggestions(allPending);
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
        ...tokens.layout.pageCentered,
        padding: 0,
      }}>
        <div style={tokens.loaders.spinner(40)} />
      </div>
    );
  }

  const partnerName = profile?.partner_name || "Partner";
  const userName = profile?.name || "du";
  const isConnected = !!profile?.couple_id;

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.colors.bg.deep,
      paddingBottom: "100px",
      transition: "background 0.3s ease",
    }}>
      {/* Header - ZUSAMMEN Style */}
      <div style={{
        padding: "24px 20px 16px",
        textAlign: "center",
      }}>
        <p style={{
          ...tokens.typography.label,
          letterSpacing: "2px",
          marginBottom: "4px",
        }}>ZUSAMMEN</p>
        <h1 style={{
          ...tokens.typography.h1,
          fontSize: "26px",
          marginBottom: "4px",
        }}>{userName} & {partnerName}</h1>
        {memberSince && (
          <p style={{
            fontSize: "14px",
            color: tokens.colors.aurora.mint,
            margin: "0 0 16px 0",
            fontWeight: "500",
          }}>{memberSince}</p>
        )}

        {/* Stats */}
        {isConnected && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "8px",
          }}>
            <div style={{
              ...tokens.cards.elevated,
              padding: "12px 24px",
              minWidth: "100px",
              borderRadius: tokens.radii.lg,
            }}>
              <p style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: tokens.colors.aurora.mint,
                margin: 0,
              }}>{sessionCount}</p>
              <p style={{
                ...tokens.typography.label,
                letterSpacing: "0.5px",
              }}>SESSIONS</p>
            </div>
            <div style={{
              ...tokens.cards.elevated,
              padding: "12px 24px",
              minWidth: "100px",
              borderRadius: tokens.radii.lg,
            }}>
              <p style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: tokens.colors.aurora.lavender,
                margin: 0,
              }}>{pendingSuggestions.length || 0}</p>
              <p style={{
                ...tokens.typography.label,
                letterSpacing: "0.5px",
              }}>VORSCHLAGE</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Pending Dissolution Banner */}
        {pendingDissolution && (
          <div style={{
            ...tokens.alerts.warning,
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
                ...tokens.alerts.warningText,
                fontSize: "15px",
              }}>
                {pendingDissolution.initiatedBy} hat die Verbindung aufgelöst
              </p>
              <p style={{
                ...tokens.typography.small,
                color: tokens.colors.text.secondary,
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
              Bestatigen
            </button>
          </div>
        )}

        {/* Pending Items Section - Suggestions + Pending Approval Agreements */}
        {isConnected && pendingSuggestions.length > 0 && (
          <div style={{
            ...tokens.cards.interactive,
            padding: "16px 20px",
            marginBottom: "16px",
            borderLeft: `4px solid ${tokens.colors.aurora.lavender}`,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: pendingSuggestions.length > 0 ? "16px" : 0,
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: tokens.radii.lg,
                background: tokens.colors.aurora.lavender,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Clock size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  ...tokens.typography.h3,
                  fontSize: "16px",
                  marginBottom: "4px",
                }}>
                  {pendingSuggestions.length === 1
                    ? "1 Vereinbarung wartet"
                    : `${pendingSuggestions.length} Vereinbarungen warten`}
                </h3>
                <p style={{
                  ...tokens.typography.small,
                  margin: 0,
                }}>Deine Bestatigung notig</p>
              </div>
            </div>

            {pendingSuggestions.map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'agreement') {
                    setSelectedAgreementId(item.id);
                  } else {
                    router.push(`/history?session=${item.session_id}`);
                  }
                }}
                style={{
                  ...tokens.cards.surface,
                  marginBottom: index < pendingSuggestions.length - 1 ? "8px" : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: tokens.colors.text.primary,
                    margin: 0,
                  }}>"{item.title}"</p>
                  {item.underlying_need && (
                    <p style={{
                      ...tokens.typography.small,
                      color: tokens.colors.text.muted,
                      margin: "4px 0 0 0",
                      fontStyle: "italic",
                    }}>
                      {item.underlying_need}
                    </p>
                  )}
                </div>
                <ChevronRight size={20} color={tokens.colors.aurora.lavender} />
              </div>
            ))}
          </div>
        )}

        {/* Agreements Section - Only if connected */}
        {isConnected && (
          <div style={{
            ...tokens.cards.elevated,
            padding: "20px",
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
            ...tokens.cards.elevated,
            padding: "32px 24px",
            textAlign: "center",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#x1F491;</div>
            <h2 style={tokens.typography.h2}>Mehr gemeinsam erleben</h2>
            <p style={{
              fontSize: "16px",
              color: tokens.colors.aurora.lavender,
              fontWeight: "500",
              margin: "0 0 16px 0",
            }}>
              Naher. Tiefer. Muhelos.
            </p>
            <p style={{
              ...tokens.typography.body,
              marginBottom: "24px",
            }}>
              Ein Abo, zwei Accounts. Füge {partnerName} zu deinem Abo hinzu –
              oder tritt ihrem bei, ohne zusätzliche Kosten.
            </p>
            <button
              onClick={() => router.push("/wir/connect")}
              style={tokens.buttons.primaryLarge}
            >
              Verbinden
            </button>
          </div>
        )}

      </div>

      {/* Bottom Navigation - 3 tabs (Profile is in header on each page) */}
      <div style={tokens.layout.navBar}>
        <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
          <HomeIcon size={24} />
          <span style={{ fontSize: "12px" }}>Home</span>
        </button>
        <button style={tokens.buttons.nav(true)}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Heart size={24} />
            {pendingSuggestions.length > 0 && (
              <span style={tokens.badges.notification}>{pendingSuggestions.length}</span>
            )}
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>Wir</span>
        </button>
        <button onClick={() => router.push("/history")} style={tokens.buttons.nav(false)}>
          <ClipboardList size={24} />
          <span style={{ fontSize: "12px" }}>Verlauf</span>
        </button>
      </div>

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
