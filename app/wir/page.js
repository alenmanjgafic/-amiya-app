/**
 * WIR PAGE - app/wir/page.js
 * Übersichtsseite für Paar-Features mit Agreements Integration
 * Redesigned with Hero images and Feature banners/cards
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import AgreementsList from "../../components/AgreementsList";
import AgreementDetail from "../../components/AgreementDetail";
import CreateAgreement from "../../components/CreateAgreement";
import DisconnectDialog from "../../components/DisconnectDialog";
import QuizComparisonCard from "../../components/QuizComparisonCard";
import ConnectInfoModal from "../../components/ConnectInfoModal";
import {
  Home as HomeIcon,
  Heart,
  AlertTriangle,
  Clock,
  ChevronRight,
  Link2,
  FileText,
  MessageCircle,
  Sparkles,
  Users,
  BarChart3,
} from "lucide-react";
import { EntdeckenIcon } from "../../components/learning/LearningIcons";

export default function WirPage() {
  const { user, profile, loading, fetchProfile } = useAuth();
  const { tokens } = useTheme();
  const router = useRouter();
  const [selectedAgreementId, setSelectedAgreementId] = useState(null);
  const [showCreateAgreement, setShowCreateAgreement] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [pendingDissolution, setPendingDissolution] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pending agreement suggestions
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Stats for header
  const [sessionCount, setSessionCount] = useState(0);
  const [agreementCount, setAgreementCount] = useState(0);
  const [memberSince, setMemberSince] = useState("");

  // Partner profile for quiz comparison
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [isQuizSharing, setIsQuizSharing] = useState(false);

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

  // Load partner profile for quiz comparison
  useEffect(() => {
    if (user && profile?.partner_id) {
      loadPartnerProfile();
    }
  }, [user, profile?.partner_id, refreshKey]);

  const loadPartnerProfile = async () => {
    if (!profile?.partner_id) return;

    try {
      const { supabase } = await import("../../lib/supabase");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, quiz_completed_at, quiz_shared_at, quiz_results")
        .eq("id", profile.partner_id)
        .single();

      if (!error && data) {
        setPartnerProfile(data);
      }
    } catch (error) {
      console.error("Failed to load partner profile:", error);
    }
  };

  const handleShareQuiz = async () => {
    if (!user?.id) return;

    setIsQuizSharing(true);

    try {
      const { supabase } = await import("../../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Nicht authentifiziert. Bitte neu einloggen.");
        return;
      }

      const response = await fetch("/api/quiz/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          accessToken: session.access_token,
        }),
      });

      if (response.ok) {
        await fetchProfile(user.id);
        await loadPartnerProfile();
      } else {
        const data = await response.json();
        console.error("Share failed:", data.error);
        alert("Teilen fehlgeschlagen: " + (data.details || data.error));
      }
    } catch (error) {
      console.error("Failed to share quiz:", error);
      alert("Fehler beim Teilen: " + error.message);
    } finally {
      setIsQuizSharing(false);
    }
  };

  const handleUnshareQuiz = async () => {
    if (!user?.id) return;

    try {
      const { supabase } = await import("../../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/quiz/unshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          accessToken: session.access_token,
        }),
      });

      if (response.ok) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error("Failed to unshare quiz:", error);
    }
  };

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

  // Feature banner component for not connected state
  const FeatureBanner = ({ icon: Icon, title, description, onClick, comingSoon = false }) => (
    <button
      onClick={comingSoon ? undefined : onClick}
      style={{
        width: "100%",
        padding: "28px 20px",
        background: tokens.colors.bg.elevated,
        border: "none",
        borderRadius: "16px",
        cursor: comingSoon ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        textAlign: "left",
        marginBottom: "12px",
        opacity: comingSoon ? 0.7 : 1,
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: comingSoon ? tokens.colors.bg.surface : tokens.gradients.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={28} color={comingSoon ? tokens.colors.text.muted : tokens.colors.aurora.lavender} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: tokens.colors.text.primary,
              margin: 0,
            }}
          >
            {title}
          </h3>
          {comingSoon && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                color: tokens.colors.aurora.lavender,
                background: `${tokens.colors.aurora.lavender}15`,
                padding: "2px 6px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              Soon
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "13px",
            color: tokens.colors.text.muted,
            margin: "4px 0 0 0",
          }}
        >
          {description}
        </p>
      </div>
      {!comingSoon && (
        <ChevronRight size={20} color={tokens.colors.text.muted} />
      )}
    </button>
  );

  // Image Feature card for connected state (like mini carousel slides)
  const ImageFeatureCard = ({ image, title, subtitle, onClick, comingSoon = false }) => (
    <button
      onClick={comingSoon ? undefined : onClick}
      style={{
        position: "relative",
        height: "140px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "none",
        cursor: comingSoon ? "default" : "pointer",
        opacity: comingSoon ? 0.7 : 1,
        width: "100%",
      }}
    >
      {/* Background Image or Gradient for Coming Soon */}
      <div style={{ position: "absolute", inset: 0 }}>
        {image ? (
          <>
            <Image
              src={image}
              alt={title}
              fill
              style={{ objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.75) 100%)",
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: tokens.colors.bg.elevated,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "12px",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: image ? "#fff" : tokens.colors.text.primary,
              margin: 0,
              textShadow: image ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {title}
          </h3>
          {comingSoon && (
            <span
              style={{
                fontSize: "9px",
                fontWeight: "600",
                color: image ? "#fff" : tokens.colors.aurora.lavender,
                background: image ? "rgba(255,255,255,0.2)" : `${tokens.colors.aurora.lavender}15`,
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              SOON
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "12px",
            color: image ? "rgba(255,255,255,0.85)" : tokens.colors.text.muted,
            margin: 0,
            textShadow: image ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          }}
        >
          {subtitle}
        </p>
      </div>
    </button>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.colors.bg.deep,
      paddingBottom: "100px",
      transition: "background 0.3s ease",
    }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 20px 20px",
        }}
      >
        <h1
          style={{
            ...tokens.typography.h1,
            margin: 0,
            marginBottom: "4px",
            fontSize: "28px",
          }}
        >
          {isConnected ? `${userName} & ${partnerName}` : "Wir"}
        </h1>
        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.muted,
            margin: 0,
            fontSize: "15px",
          }}
        >
          {isConnected ? memberSince || "Gemeinsam wachsen" : "Verbinde dich mit deinem Partner"}
        </p>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* NOT CONNECTED STATE */}
        {!isConnected && !pendingDissolution && (
          <>
            {/* Feature Banners */}
            <FeatureBanner
              icon={Link2}
              title="Teile deinen Archetypen"
              description="Entdeckt eure Beziehungsmuster gemeinsam"
              onClick={() => setShowConnectModal(true)}
            />
            <FeatureBanner
              icon={FileText}
              title="Eure Vereinbarungen"
              description="Haltet fest, was euch wichtig ist"
              onClick={() => setShowConnectModal(true)}
            />
            <FeatureBanner
              icon={MessageCircle}
              title="Couple Session History"
              description="Teilt eure gemeinsamen Gespräche"
              onClick={() => setShowConnectModal(true)}
            />
            <FeatureBanner
              icon={Sparkles}
              title="Liebesfunken"
              description="Sendet euch täglich positive Nachrichten"
              comingSoon
            />
          </>
        )}

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
              Bestätigen
            </button>
          </div>
        )}

        {/* CONNECTED STATE */}
        {isConnected && (
          <>
            {/* Quiz Comparison Card */}
            <div style={{ marginBottom: "16px" }}>
              <QuizComparisonCard
                user={user}
                profile={profile}
                partnerProfile={partnerProfile}
                onShare={handleShareQuiz}
                onUnshare={handleUnshareQuiz}
                isSharing={isQuizSharing}
              />
            </div>

            {/* Pending Items Section */}
            {pendingSuggestions.length > 0 && (
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
                  marginBottom: "16px",
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
                    }}>Deine Bestätigung nötig</p>
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

            {/* Agreements Section */}
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
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={tokens.layout.navBar}>
        <button onClick={() => router.push("/")} style={tokens.buttons.nav(false)}>
          <HomeIcon size={24} color={tokens.colors.text.muted} />
          <span>Home</span>
        </button>
        <button style={tokens.buttons.nav(true)}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Heart size={24} color={tokens.colors.aurora.lavender} />
            {pendingSuggestions.length > 0 && (
              <span style={tokens.badges.notification}>{pendingSuggestions.length}</span>
            )}
          </div>
          <span style={{ color: tokens.colors.aurora.lavender, fontWeight: "600" }}>Wir</span>
        </button>
        <button onClick={() => router.push("/entdecken")} style={tokens.buttons.nav(false)}>
          <EntdeckenIcon size={24} active={false} />
          <span>Entdecken</span>
        </button>
      </div>

      {/* Connect Info Modal */}
      {showConnectModal && (
        <ConnectInfoModal
          partnerName={partnerName}
          onClose={() => setShowConnectModal(false)}
        />
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
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
