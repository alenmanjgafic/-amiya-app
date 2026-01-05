/**
 * KOMPASS COMPARISON PAGE - app/wir/kompass/page.js
 * Detailed comparison of both partners' quiz results
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { getTypeInfo, analyzePairDynamic } from "../../../lib/quizLogic";
import { ChevronLeft, Sparkles, AlertTriangle, Heart } from "lucide-react";

export default function KompassPage() {
  const { user, profile, loading } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Load partner profile
  useEffect(() => {
    const loadPartner = async () => {
      if (!profile?.partner_id) {
        setLoadingPartner(false);
        return;
      }

      try {
        const { supabase } = await import("../../../lib/supabase");
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, quiz_completed_at, quiz_shared_at, quiz_results")
          .eq("id", profile.partner_id)
          .single();

        if (!error && data) {
          setPartnerProfile(data);
        }
      } catch (error) {
        console.error("Failed to load partner:", error);
      } finally {
        setLoadingPartner(false);
      }
    };

    if (profile) {
      loadPartner();
    }
  }, [profile]);

  if (loading || loadingPartner) {
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

  // Check if both shared
  const userShared = !!profile?.quiz_shared_at;
  const partnerShared = !!partnerProfile?.quiz_shared_at;
  const bothShared = userShared && partnerShared;

  if (!bothShared) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
        padding: "20px",
        textAlign: "center",
      }}>
        <p style={tokens.typography.body}>
          Beide müssen ihr Ergebnis teilen, um den Vergleich zu sehen.
        </p>
        <button
          onClick={() => router.push("/wir")}
          style={tokens.buttons.primary}
        >
          Zurück
        </button>
      </div>
    );
  }

  const userName = profile?.name || "Du";
  const partnerName = partnerProfile?.name || "Partner";

  const userType = getTypeInfo(profile?.quiz_results?.primaryType);
  const partnerType = getTypeInfo(partnerProfile?.quiz_results?.primaryType);

  const userScores = profile?.quiz_results?.scores?.normalized || {};
  const partnerScores = partnerProfile?.quiz_results?.scores?.normalized || {};

  const dynamics = analyzePairDynamic(userScores, partnerScores);
  const tensions = dynamics.filter(d => d.type === "tension");
  const strengths = dynamics.filter(d => d.type === "strength");

  const dimensions = [
    { key: "naehe", label: "Nähe", color: tokens.colors.aurora.lavender },
    { key: "autonomie", label: "Autonomie", color: tokens.colors.aurora.sky },
    { key: "intensitaet", label: "Intensität", color: tokens.colors.aurora.rose },
    { key: "sicherheit", label: "Sicherheit", color: tokens.colors.aurora.mint },
  ];

  return (
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      paddingBottom: "40px",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <button
          onClick={() => router.push("/wir")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            color: tokens.colors.text.muted,
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{
          ...tokens.typography.h2,
          margin: 0,
        }}>
          Eure Bindungsstile
        </h1>
      </div>

      {/* Both Types */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "24px 20px",
        background: tokens.colors.bg.elevated,
        margin: "0 20px",
        borderRadius: tokens.radii.xl,
        marginBottom: "24px",
      }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "8px" }}>
            {userType?.emoji}
          </span>
          <p style={{
            ...tokens.typography.body,
            fontWeight: "600",
            marginBottom: "4px",
          }}>
            {userType?.name}
          </p>
          <p style={tokens.typography.small}>{userName}</p>
        </div>

        <Sparkles size={24} color={tokens.colors.aurora.lavender} />

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "8px" }}>
            {partnerType?.emoji}
          </span>
          <p style={{
            ...tokens.typography.body,
            fontWeight: "600",
            marginBottom: "4px",
          }}>
            {partnerType?.name}
          </p>
          <p style={tokens.typography.small}>{partnerName}</p>
        </div>
      </div>

      {/* Formulas */}
      <div style={{
        padding: "0 20px",
        marginBottom: "24px",
      }}>
        <div style={{
          display: "flex",
          gap: "12px",
        }}>
          <div style={{
            flex: 1,
            padding: "16px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.lg,
            textAlign: "center",
          }}>
            <p style={{
              ...tokens.typography.small,
              fontStyle: "italic",
              margin: 0,
            }}>
              „{userType?.shortFormula}"
            </p>
          </div>
          <div style={{
            flex: 1,
            padding: "16px",
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.lg,
            textAlign: "center",
          }}>
            <p style={{
              ...tokens.typography.small,
              fontStyle: "italic",
              margin: 0,
            }}>
              „{partnerType?.shortFormula}"
            </p>
          </div>
        </div>
      </div>

      {/* Dimension Comparison */}
      <div style={{
        padding: "20px",
        margin: "0 20px",
        background: tokens.colors.bg.elevated,
        borderRadius: tokens.radii.xl,
        marginBottom: "24px",
      }}>
        <h3 style={{
          ...tokens.typography.label,
          marginBottom: "20px",
        }}>
          EURE DIMENSIONEN IM VERGLEICH
        </h3>

        {dimensions.map((dim) => {
          const userScore = userScores[dim.key] || 0;
          const partnerScore = partnerScores[dim.key] || 0;
          const diff = Math.abs(userScore - partnerScore);
          const hasTension = diff > 30;

          return (
            <div key={dim.key} style={{ marginBottom: "20px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}>
                <span style={{
                  ...tokens.typography.body,
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  {dim.label}
                  {hasTension && (
                    <AlertTriangle size={14} color={tokens.colors.aurora.rose} />
                  )}
                </span>
              </div>

              {/* Dual Progress Bar */}
              <div style={{
                position: "relative",
                height: "24px",
                background: isDarkMode ? "#2a2a2a" : "#e5e5e5",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                {/* User bar (from left) */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "50%",
                  width: `${userScore}%`,
                  background: dim.color,
                  borderRadius: "12px 0 0 0",
                }} />
                {/* Partner bar (from left, bottom half) */}
                <div style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: "50%",
                  width: `${partnerScore}%`,
                  background: `${dim.color}80`,
                  borderRadius: "0 0 0 12px",
                }} />
              </div>

              {/* Labels */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px",
              }}>
                <span style={{
                  ...tokens.typography.small,
                  color: dim.color,
                }}>
                  {userName}: {userScore}%
                </span>
                <span style={{
                  ...tokens.typography.small,
                  color: `${dim.color}`,
                  opacity: 0.7,
                }}>
                  {partnerName}: {partnerScore}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamics Section */}
      <div style={{ padding: "0 20px" }}>
        {/* Tensions */}
        {tensions.length > 0 && (
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "20px",
            marginBottom: "16px",
            borderLeft: `4px solid ${tokens.colors.aurora.rose}`,
          }}>
            <h3 style={{
              ...tokens.typography.label,
              color: tokens.colors.aurora.rose,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <AlertTriangle size={16} />
              SPANNUNGSFELDER
            </h3>

            {tensions.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  borderRadius: tokens.radii.md,
                  marginBottom: index < tensions.length - 1 ? "12px" : 0,
                }}
              >
                <p style={{
                  ...tokens.typography.body,
                  fontWeight: "600",
                  marginBottom: "8px",
                }}>
                  {item.title}
                </p>
                <p style={{
                  ...tokens.typography.small,
                  marginBottom: "12px",
                  lineHeight: "1.5",
                }}>
                  {item.description}
                </p>
                <div style={{
                  padding: "12px",
                  background: `${tokens.colors.aurora.mint}15`,
                  borderRadius: tokens.radii.sm,
                }}>
                  <p style={{
                    ...tokens.typography.small,
                    color: tokens.colors.aurora.mint,
                    fontWeight: "500",
                    margin: 0,
                  }}>
                    💡 {item.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div style={{
            background: tokens.colors.bg.elevated,
            borderRadius: tokens.radii.xl,
            padding: "20px",
            marginBottom: "16px",
            borderLeft: `4px solid ${tokens.colors.aurora.mint}`,
          }}>
            <h3 style={{
              ...tokens.typography.label,
              color: tokens.colors.aurora.mint,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <Heart size={16} />
              EURE STÄRKEN
            </h3>

            {strengths.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  borderRadius: tokens.radii.md,
                  marginBottom: index < strengths.length - 1 ? "12px" : 0,
                }}
              >
                <p style={{
                  ...tokens.typography.body,
                  fontWeight: "600",
                  marginBottom: "8px",
                }}>
                  {item.title}
                </p>
                <p style={{
                  ...tokens.typography.small,
                  marginBottom: "12px",
                  lineHeight: "1.5",
                }}>
                  {item.description}
                </p>
                <p style={{
                  ...tokens.typography.small,
                  color: tokens.colors.aurora.mint,
                  fontWeight: "500",
                  margin: 0,
                }}>
                  💡 {item.tip}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* What each needs in conflicts */}
        <div style={{
          background: tokens.colors.bg.elevated,
          borderRadius: tokens.radii.xl,
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h3 style={{
            ...tokens.typography.label,
            marginBottom: "20px",
          }}>
            WAS IHR IN KONFLIKTEN BRAUCHT
          </h3>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            {/* User's needs */}
            {userType?.conflictNeeds && (
              <div style={{
                padding: "16px",
                background: tokens.colors.bg.surface,
                borderRadius: tokens.radii.md,
              }}>
                <p style={{
                  ...tokens.typography.small,
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: tokens.colors.aurora.lavender,
                }}>
                  {userType.emoji} {userName}
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: "20px",
                }}>
                  {userType.conflictNeeds.map((need, i) => (
                    <li key={i} style={{
                      ...tokens.typography.small,
                      marginBottom: "4px",
                      lineHeight: "1.5",
                    }}>
                      {need}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Partner's needs */}
            {partnerType?.conflictNeeds && (
              <div style={{
                padding: "16px",
                background: tokens.colors.bg.surface,
                borderRadius: tokens.radii.md,
              }}>
                <p style={{
                  ...tokens.typography.small,
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: tokens.colors.aurora.rose,
                }}>
                  {partnerType.emoji} {partnerName}
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: "20px",
                }}>
                  {partnerType.conflictNeeds.map((need, i) => (
                    <li key={i} style={{
                      ...tokens.typography.small,
                      marginBottom: "4px",
                      lineHeight: "1.5",
                    }}>
                      {need}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
