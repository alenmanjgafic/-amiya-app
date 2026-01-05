/**
 * QUIZ RESULT PAGE - app/quiz/result/page.js
 * Display relationship type results
 */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { getTypeInfo, RELATIONSHIP_TYPES, calculateTypeAffinities, getDimensionInfo, getScoreLevel } from "../../../lib/quizLogic";
import { ArchetypeIconMap, ARCHETYPE_COLORS } from "../../../components/ArchetypeIcons";
import {
  Home,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  Heart,
  X,
  ChevronRight,
  Wind,
  Flame,
  Shield,
} from "lucide-react";

// Map dimension icon names to components
const DimensionIcons = {
  Heart,
  Wind,
  Flame,
  Shield,
};

// Helper to get archetype icon component
function getArchetypeIcon(typeKey, size = 48) {
  const IconComponent = ArchetypeIconMap[typeKey];
  if (IconComponent) {
    return <IconComponent size={size} />;
  }
  return null;
}

export default function QuizResultPage() {
  const { user, profile, loading } = useAuth();
  const { tokens, isDarkMode } = useTheme();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // If not completed, redirect to quiz
  useEffect(() => {
    if (!loading && profile && !profile.quiz_completed_at) {
      router.push("/quiz");
    }
  }, [profile, loading, router]);

  if (loading || !user || !profile?.quiz_results) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={tokens.loaders.spinner(40)} />
        <p style={tokens.typography.body}>Ergebnis wird geladen...</p>
      </div>
    );
  }

  const results = profile.quiz_results;
  const primaryType = getTypeInfo(results.primaryType);
  const secondaryType = results.secondaryType ? getTypeInfo(results.secondaryType) : null;
  const scores = results.scores?.normalized || {};

  // Calculate affinities to all types
  const typeAffinities = calculateTypeAffinities(scores);

  if (!primaryType) {
    return (
      <div style={{
        ...tokens.layout.pageCentered,
        flexDirection: "column",
        gap: "16px",
        padding: "20px",
        textAlign: "center",
      }}>
        <AlertCircle size={48} color={tokens.colors.aurora.rose} />
        <p style={tokens.typography.body}>Ergebnis konnte nicht geladen werden.</p>
        <button
          onClick={() => router.push("/quiz")}
          style={tokens.buttons.primaryLarge}
        >
          Quiz wiederholen
        </button>
      </div>
    );
  }

  const typeColor = getTypeColor(primaryType.color, tokens);

  const sections = [
    {
      id: "strengths",
      title: "Deine Stärken",
      icon: Lightbulb,
      items: primaryType.strengths,
      color: tokens.colors.aurora.mint,
    },
    {
      id: "challenges",
      title: "Deine Herausforderungen",
      icon: AlertCircle,
      items: primaryType.challenges,
      color: tokens.colors.aurora.rose,
    },
    {
      id: "conflict",
      title: "Was du in Konflikten brauchst",
      icon: Heart,
      items: primaryType.conflictNeeds,
      color: tokens.colors.aurora.lavender,
    },
  ];

  return (
    <div style={{
      ...tokens.layout.page,
      padding: 0,
      paddingBottom: "100px",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: tokens.colors.text.muted,
          }}
        >
          <Home size={20} />
        </button>
        <span style={{
          ...tokens.typography.label,
          textTransform: "uppercase",
        }}>
          Dein Beziehungstyp
        </span>
        <div style={{ width: "40px" }} />
      </div>

      {/* Type Header */}
      <div style={{
        textAlign: "center",
        padding: "20px",
        paddingTop: "0",
      }}>
        {/* Archetype Icon */}
        <div style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "center",
        }}>
          {getArchetypeIcon(results.primaryType, 80)}
        </div>

        {/* Type Name */}
        <h1 style={{
          ...tokens.typography.h1,
          fontSize: "32px",
          marginBottom: "8px",
        }}>
          {primaryType.name}
        </h1>

        {/* Formula */}
        <p style={{
          ...tokens.typography.body,
          color: typeColor,
          fontWeight: "500",
          fontStyle: "italic",
          marginBottom: "16px",
        }}>
          „{primaryType.shortFormula}"
        </p>

        {/* Secondary Type Badge */}
        {secondaryType && results.secondaryType && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: tokens.colors.bg.surface,
            borderRadius: "20px",
            marginBottom: "8px",
          }}>
            {getArchetypeIcon(results.secondaryType, 24)}
            <span style={tokens.typography.small}>
              mit Tendenz zu {secondaryType.name}
            </span>
          </div>
        )}
      </div>

      {/* Dimension Scores - Clickable */}
      <div style={{
        padding: "20px",
        margin: "0 20px",
        background: tokens.colors.bg.surface,
        borderRadius: "16px",
        marginBottom: "24px",
      }}>
        <h3 style={{
          ...tokens.typography.label,
          marginBottom: "16px",
          textTransform: "uppercase",
        }}>
          Deine 4 Dimensionen
        </h3>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          {[
            { key: "naehe", label: "Nähe", color: tokens.colors.aurora.lavender },
            { key: "autonomie", label: "Autonomie", color: tokens.colors.aurora.sky },
            { key: "intensitaet", label: "Intensität", color: tokens.colors.aurora.rose },
            { key: "sicherheit", label: "Sicherheit", color: tokens.colors.aurora.mint },
          ].map((dim) => {
            const dimInfo = getDimensionInfo(dim.key);
            const score = scores[dim.key] || 0;

            return (
              <button
                key={dim.key}
                onClick={() => setSelectedDimension({ ...dimInfo, score })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: tokens.colors.bg.elevated,
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: `${dim.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {dimInfo?.icon && DimensionIcons[dimInfo.icon] &&
                    (() => {
                      const IconComponent = DimensionIcons[dimInfo.icon];
                      return <IconComponent size={18} color={dim.color} />;
                    })()
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}>
                    <span style={{
                      ...tokens.typography.small,
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                    }}>
                      {dim.label}
                    </span>
                    <span style={{
                      ...tokens.typography.small,
                      fontWeight: "600",
                      color: dim.color,
                    }}>
                      {score}%
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "6px",
                    background: isDarkMode ? "#2a2a2a" : "#e5e5e5",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${score}%`,
                      height: "100%",
                      background: dim.color,
                      borderRadius: "3px",
                    }} />
                  </div>
                </div>
                <ChevronRight size={18} color={tokens.colors.text.muted} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div style={{
        padding: "0 20px",
        marginBottom: "24px",
      }}>
        <p style={{
          ...tokens.typography.body,
          lineHeight: "1.7",
          textAlign: "center",
        }}>
          {primaryType.description}
        </p>
      </div>

      {/* Core Need */}
      <div style={{
        padding: "20px",
        margin: "0 20px",
        background: `linear-gradient(135deg, ${typeColor}15, ${typeColor}05)`,
        borderRadius: "16px",
        borderLeft: `4px solid ${typeColor}`,
        marginBottom: "24px",
      }}>
        <h3 style={{
          ...tokens.typography.label,
          color: typeColor,
          marginBottom: "8px",
        }}>
          DEIN KERNBEDÜRFNIS
        </h3>
        <p style={{
          ...tokens.typography.body,
          margin: 0,
        }}>
          {primaryType.coreNeed}
        </p>
      </div>

      {/* Sections - Always Open */}
      <div style={{
        padding: "0 20px",
        marginBottom: "24px",
      }}>
        {sections.filter(s => s.items && s.items.length > 0).map((section) => (
          <div
            key={section.id}
            style={{
              marginBottom: "12px",
              background: tokens.colors.bg.surface,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <section.icon size={20} color={section.color} />
              <span style={{
                ...tokens.typography.body,
                fontWeight: "600",
              }}>
                {section.title}
              </span>
            </div>

            <div style={{
              padding: "0 16px 16px",
            }}>
              <ul style={{
                margin: 0,
                paddingLeft: "20px",
              }}>
                {section.items.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      ...tokens.typography.body,
                      lineHeight: "1.6",
                      marginBottom: "8px",
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Partner Note */}
      {primaryType.partnerNote && (
        <div style={{
          padding: "20px",
          margin: "0 20px",
          background: tokens.colors.bg.surface,
          borderRadius: "16px",
          marginBottom: "24px",
        }}>
          <h3 style={{
            ...tokens.typography.label,
            marginBottom: "12px",
            textTransform: "uppercase",
          }}>
            Was dein Partner wissen sollte
          </h3>
          <p style={{
            ...tokens.typography.body,
            lineHeight: "1.6",
            fontStyle: "italic",
            margin: 0,
          }}>
            „{primaryType.partnerNote}"
          </p>
        </div>
      )}

      {/* Tips */}
      {primaryType.tips && primaryType.tips.length > 0 && (
        <div style={{
          padding: "20px",
          margin: "0 20px",
          background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}15, ${tokens.colors.aurora.mint}05)`,
          borderRadius: "16px",
          marginBottom: "24px",
        }}>
          <h3 style={{
            ...tokens.typography.label,
            color: tokens.colors.aurora.mint,
            marginBottom: "12px",
          }}>
            TIPPS FÜR DICH
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: "20px",
          }}>
            {primaryType.tips.map((tip, index) => (
              <li
                key={index}
                style={{
                  ...tokens.typography.body,
                  lineHeight: "1.6",
                  marginBottom: "8px",
                }}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Types - Top 4 excluding primary */}
      <div style={{
        padding: "20px",
        margin: "0 20px",
        background: tokens.colors.bg.surface,
        borderRadius: "16px",
        marginBottom: "24px",
      }}>
        <h3 style={{
          ...tokens.typography.label,
          marginBottom: "8px",
          textTransform: "uppercase",
        }}>
          Deine Facetten
        </h3>
        <p style={{
          ...tokens.typography.small,
          color: tokens.colors.text.muted,
          marginBottom: "16px",
          lineHeight: "1.5",
        }}>
          Dein Archetyp ist einzigartig – kein Typ beschreibt dich zu 100%. Diese Anteile zeigen, wie die restlichen Archetypen in dir mitschwingen. Je höher der Wert, desto stärker prägt dich dieser Stil.
        </p>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}>
          {typeAffinities
            .filter(({ typeKey }) => typeKey !== results.primaryType)
            .map(({ typeKey, affinity, typeInfo }) => {
              const itemColor = getTypeColor(typeInfo.color, tokens);

              return (
                <button
                  key={typeKey}
                  onClick={() => setSelectedType({ ...typeInfo, typeKey })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: tokens.colors.bg.elevated,
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {getArchetypeIcon(typeKey, 36)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      ...tokens.typography.body,
                      fontWeight: "600",
                      color: tokens.colors.text.primary,
                      display: "block",
                      marginBottom: "4px",
                    }}>
                      {typeInfo.name}
                    </span>
                    {/* Affinity Bar */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <div style={{
                        flex: 1,
                        height: "6px",
                        background: isDarkMode ? "#2a2a2a" : "#e5e5e5",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${affinity}%`,
                          height: "100%",
                          background: itemColor,
                          borderRadius: "3px",
                        }} />
                      </div>
                      <span style={{
                        ...tokens.typography.small,
                        color: itemColor,
                        fontWeight: "600",
                        minWidth: "36px",
                      }}>
                        {affinity}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} color={tokens.colors.text.muted} />
                </button>
              );
            })}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            ...tokens.buttons.primaryLarge,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Home size={20} />
          Zurück zur Übersicht
        </button>

        <button
          onClick={() => router.push("/quiz?retake=true")}
          style={{
            ...tokens.buttons.secondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <RefreshCw size={20} />
          Quiz wiederholen
        </button>
      </div>

      {/* Type Detail Modal */}
      {selectedType && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "500px",
            maxHeight: "90vh",
            background: isDarkMode ? "#1a1a1a" : "#ffffff",
            borderRadius: "24px 24px 0 0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${tokens.colors.bg.soft}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                {getArchetypeIcon(selectedType.typeKey, 40)}
                <h2 style={{
                  ...tokens.typography.h2,
                  margin: 0,
                }}>
                  {selectedType.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedType(null)}
                style={{
                  background: tokens.colors.bg.surface,
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={20} color={tokens.colors.text.primary} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "20px",
            }}>
              {/* Formula */}
              <p style={{
                ...tokens.typography.body,
                color: getTypeColor(selectedType.color, tokens),
                fontWeight: "500",
                fontStyle: "italic",
                textAlign: "center",
                marginBottom: "20px",
              }}>
                „{selectedType.shortFormula}"
              </p>

              {/* Description */}
              <p style={{
                ...tokens.typography.body,
                lineHeight: "1.7",
                marginBottom: "24px",
              }}>
                {selectedType.description}
              </p>

              {/* Core Need */}
              <div style={{
                padding: "16px",
                background: `${getTypeColor(selectedType.color, tokens)}15`,
                borderRadius: "12px",
                borderLeft: `4px solid ${getTypeColor(selectedType.color, tokens)}`,
                marginBottom: "20px",
              }}>
                <h4 style={{
                  ...tokens.typography.label,
                  color: getTypeColor(selectedType.color, tokens),
                  marginBottom: "8px",
                }}>
                  KERNBEDÜRFNIS
                </h4>
                <p style={{
                  ...tokens.typography.body,
                  margin: 0,
                }}>
                  {selectedType.coreNeed}
                </p>
              </div>

              {/* Strengths */}
              {selectedType.strengths && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{
                    ...tokens.typography.label,
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <Lightbulb size={16} color={tokens.colors.aurora.mint} />
                    STÄRKEN
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: "20px",
                  }}>
                    {selectedType.strengths.map((item, i) => (
                      <li key={i} style={{
                        ...tokens.typography.body,
                        lineHeight: "1.6",
                        marginBottom: "6px",
                      }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Challenges */}
              {selectedType.challenges && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{
                    ...tokens.typography.label,
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <AlertCircle size={16} color={tokens.colors.aurora.rose} />
                    HERAUSFORDERUNGEN
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: "20px",
                  }}>
                    {selectedType.challenges.map((item, i) => (
                      <li key={i} style={{
                        ...tokens.typography.body,
                        lineHeight: "1.6",
                        marginBottom: "6px",
                      }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Partner Note */}
              {selectedType.partnerNote && (
                <div style={{
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}>
                  <h4 style={{
                    ...tokens.typography.label,
                    marginBottom: "8px",
                  }}>
                    WAS DER PARTNER WISSEN SOLLTE
                  </h4>
                  <p style={{
                    ...tokens.typography.body,
                    fontStyle: "italic",
                    margin: 0,
                    lineHeight: "1.6",
                  }}>
                    „{selectedType.partnerNote}"
                  </p>
                </div>
              )}

              {/* Tips */}
              {selectedType.tips && (
                <div style={{
                  padding: "16px",
                  background: `${tokens.colors.aurora.mint}10`,
                  borderRadius: "12px",
                }}>
                  <h4 style={{
                    ...tokens.typography.label,
                    color: tokens.colors.aurora.mint,
                    marginBottom: "12px",
                  }}>
                    TIPPS
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: "20px",
                  }}>
                    {selectedType.tips.map((tip, i) => (
                      <li key={i} style={{
                        ...tokens.typography.body,
                        lineHeight: "1.6",
                        marginBottom: "6px",
                      }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 20px",
              paddingBottom: "32px",
              borderTop: `1px solid ${tokens.colors.bg.soft}`,
            }}>
              <button
                onClick={() => setSelectedType(null)}
                style={{
                  ...tokens.buttons.primaryLarge,
                  width: "100%",
                }}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dimension Detail Modal */}
      {selectedDimension && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "500px",
            maxHeight: "85vh",
            background: isDarkMode ? "#1a1a1a" : "#ffffff",
            borderRadius: "24px 24px 0 0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${tokens.colors.bg.soft}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${getTypeColor(selectedDimension.color, tokens)}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {selectedDimension.icon && DimensionIcons[selectedDimension.icon] &&
                    (() => {
                      const IconComponent = DimensionIcons[selectedDimension.icon];
                      return <IconComponent size={22} color={getTypeColor(selectedDimension.color, tokens)} />;
                    })()
                  }
                </div>
                <h2 style={{
                  ...tokens.typography.h2,
                  margin: 0,
                }}>
                  {selectedDimension.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDimension(null)}
                style={{
                  background: tokens.colors.bg.surface,
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={20} color={tokens.colors.text.primary} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: "auto",
              padding: "20px",
            }}>
              {/* Score Display */}
              {(() => {
                const scoreLevel = getScoreLevel(selectedDimension.score);
                const dimColor = getTypeColor(selectedDimension.color, tokens);

                return (
                  <>
                    <div style={{
                      textAlign: "center",
                      marginBottom: "24px",
                    }}>
                      <div style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: dimColor,
                        marginBottom: "4px",
                      }}>
                        {selectedDimension.score}%
                      </div>
                      <div style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: `${dimColor}20`,
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: dimColor,
                      }}>
                        {scoreLevel.label}
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div style={{
                      marginBottom: "24px",
                    }}>
                      <div style={{
                        width: "100%",
                        height: "10px",
                        background: isDarkMode ? "#2a2a2a" : "#e5e5e5",
                        borderRadius: "5px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${selectedDimension.score}%`,
                          height: "100%",
                          background: dimColor,
                          borderRadius: "5px",
                        }} />
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "6px",
                      }}>
                        <span style={{ ...tokens.typography.small, color: tokens.colors.text.muted }}>0%</span>
                        <span style={{ ...tokens.typography.small, color: tokens.colors.text.muted }}>100%</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{
                      padding: "16px",
                      background: tokens.colors.bg.surface,
                      borderRadius: "12px",
                      marginBottom: "20px",
                    }}>
                      <h4 style={{
                        ...tokens.typography.label,
                        marginBottom: "8px",
                      }}>
                        WAS BEDEUTET DAS?
                      </h4>
                      <p style={{
                        ...tokens.typography.body,
                        margin: 0,
                        lineHeight: "1.6",
                      }}>
                        {selectedDimension.description}
                      </p>
                    </div>

                    {/* Personal Interpretation */}
                    <div style={{
                      padding: "16px",
                      background: `${dimColor}15`,
                      borderRadius: "12px",
                      borderLeft: `4px solid ${dimColor}`,
                    }}>
                      <h4 style={{
                        ...tokens.typography.label,
                        color: dimColor,
                        marginBottom: "8px",
                      }}>
                        DEINE AUSPRÄGUNG
                      </h4>
                      <p style={{
                        ...tokens.typography.body,
                        margin: 0,
                        lineHeight: "1.6",
                      }}>
                        {scoreLevel.level === "high" && selectedDimension.highDescription}
                        {scoreLevel.level === "mid" && selectedDimension.midDescription}
                        {scoreLevel.level === "low" && selectedDimension.lowDescription}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 20px",
              paddingBottom: "32px",
              borderTop: `1px solid ${tokens.colors.bg.soft}`,
            }}>
              <button
                onClick={() => setSelectedDimension(null)}
                style={{
                  ...tokens.buttons.primaryLarge,
                  width: "100%",
                }}
              >
                Schliessen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function getTypeColor(colorName, tokens) {
  const colors = {
    lavender: tokens.colors.aurora.lavender,
    sky: tokens.colors.aurora.sky,
    rose: tokens.colors.aurora.rose,
    mint: tokens.colors.aurora.mint,
  };
  return colors[colorName] || tokens.colors.aurora.lavender;
}
