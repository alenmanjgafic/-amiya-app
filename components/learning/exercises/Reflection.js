/**
 * REFLECTION EXERCISE - Card-based insights display
 */
"use client";

import { useTheme } from "../../../lib/ThemeContext";
import { PatternIconMap } from "../LearningIcons";

// Pattern insights - therapeutisch, hoffnungsvoll formuliert
const PATTERN_INSIGHTS = {
  kritik: {
    title: "Kritik",
    whatItMeans: "Wenn der Frust gross ist, rutschen uns manchmal Verallgemeinerungen raus. \"Du immer...\" statt \"Das hat mich verletzt.\"",
    forYou: "Ein kleiner Shift kann viel ändern: Statt \"Du...\" mit \"Ich fühle mich...\" beginnen. Das öffnet mehr.",
    forPartner: "Hinter Kritik steckt oft ein unerfülltes Bedürfnis. Was braucht dein Partner vielleicht gerade?",
    color: "#ef4444",
  },
  verteidigung: {
    title: "Verteidigung",
    whatItMeans: "Es ist menschlich, sich erklären zu wollen, wenn wir uns angegriffen fühlen. Aber manchmal überhört der andere so, was wir eigentlich sagen.",
    forYou: "Manchmal hilft es, erst kurz zuzuhören, bevor du reagierst. Einfach fragen: \"Was brauchst du gerade?\"",
    forPartner: "Wenn dein Partner sich verteidigt, fühlt er/sie sich vielleicht angegriffen. Ein sanfterer Einstieg kann helfen.",
    color: "#f59e0b",
  },
  mauern: {
    title: "Mauern",
    whatItMeans: "Manchmal ist alles zu viel und wir ziehen uns zurück. Das ist ein Schutzmechanismus – aber der andere fühlt sich dann allein.",
    forYou: "Sag kurz, dass du eine Pause brauchst und wiederkommst. Das gibt euch beiden Sicherheit.",
    forPartner: "Wenn dein Partner sich zurückzieht, braucht er/sie wahrscheinlich Raum. Gib Zeit, aber zeig, dass du da bist.",
    color: "#6b7280",
  },
  verachtung: {
    title: "Verachtung",
    whatItMeans: "Sarkasmus oder Augenrollen kommen oft, wenn sich Frust über längere Zeit aufgestaut hat.",
    forYou: "Was steckt dahinter? Was frustriert dich wirklich? Sprich es lieber direkt an – das ist fairer für euch beide.",
    forPartner: "Wenn dein Partner abwertend reagiert, steckt oft tiefe Frustration dahinter. Vielleicht braucht es ein offenes Gespräch.",
    color: "#8b5cf6",
  },
};

export default function Reflection({
  exercise,
  allResponses = {},
  onContinue,
}) {
  const { tokens } = useTheme();

  const responsesToShow = exercise.showResponses || [];

  const getDisplayValue = (responseKey) => {
    const response = allResponses[responseKey];
    if (!response) return null;

    if (response.option) {
      return {
        label: response.option.label,
        id: response.option.id,
      };
    }
    if (response.text) return { text: response.text };
    if (response.options) return { options: response.options };
    return null;
  };

  const showPatternInsights = responsesToShow.includes("my_pattern") || responsesToShow.includes("partner_pattern");
  const myPattern = allResponses["my_pattern"]?.option?.id;
  const partnerPattern = allResponses["partner_pattern"]?.option?.id;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "24px 20px",
      }}
    >
      {/* Main Card Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: tokens.colors.bg.elevated,
          borderRadius: "20px",
          padding: "24px 20px",
          boxShadow: `0 4px 24px ${tokens.colors.aurora.lavender}10`,
          overflowY: "auto",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            textAlign: "center",
            marginBottom: "20px",
            color: tokens.colors.text.primary,
          }}
        >
          {exercise.title}
        </h2>

        {/* Pattern Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {responsesToShow.map((responseKey) => {
            const value = getDisplayValue(responseKey);
            if (!value) return null;

            const IconComponent = value.id ? PatternIconMap[value.id] : null;
            const insight = value.id ? PATTERN_INSIGHTS[value.id] : null;
            const isMyPattern = responseKey === "my_pattern";

            return (
              <div
                key={responseKey}
                style={{
                  padding: "16px",
                  background: tokens.colors.bg.surface,
                  borderRadius: "14px",
                  borderLeft: insight ? `3px solid ${insight.color}` : "none",
                }}
              >
                {/* Header */}
                <p
                  style={{
                    color: tokens.colors.text.muted,
                    fontWeight: "500",
                    marginBottom: "10px",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {isMyPattern ? "Dein Muster" : "Partner's Muster"}
                </p>

                {/* Pattern with Icon */}
                {value.label && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: insight ? "14px" : 0,
                    }}
                  >
                    {IconComponent && (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `${insight?.color || tokens.colors.aurora.lavender}15`,
                          borderRadius: "10px",
                        }}
                      >
                        <IconComponent size={22} />
                      </div>
                    )}
                    <p
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: "600",
                        color: tokens.colors.text.primary,
                      }}
                    >
                      {value.label}
                    </p>
                  </div>
                )}

                {/* Insight */}
                {insight && (
                  <div
                    style={{
                      background: tokens.colors.bg.primary,
                      borderRadius: "10px",
                      padding: "14px",
                    }}
                  >
                    <p
                      style={{
                        color: tokens.colors.text.secondary,
                        margin: 0,
                        marginBottom: "12px",
                        lineHeight: "1.5",
                        fontSize: "13px",
                      }}
                    >
                      {insight.whatItMeans}
                    </p>

                    <div
                      style={{
                        padding: "10px 12px",
                        background: `${insight.color}10`,
                        borderRadius: "8px",
                        borderLeft: `2px solid ${insight.color}50`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          lineHeight: "1.5",
                          color: tokens.colors.text.primary,
                          fontSize: "13px",
                        }}
                      >
                        {isMyPattern ? insight.forYou : insight.forPartner}
                      </p>
                    </div>
                  </div>
                )}

                {value.text && (
                  <p
                    style={{
                      margin: 0,
                      fontStyle: "italic",
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    "{value.text}"
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Interaction */}
        {showPatternInsights && myPattern && partnerPattern && (
          <div
            style={{
              padding: "16px",
              background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender}10 0%, ${tokens.colors.aurora.rose}10 100%)`,
              borderRadius: "14px",
              marginBottom: "12px",
            }}
          >
            <p
              style={{
                color: tokens.colors.aurora.lavender,
                fontWeight: "600",
                marginBottom: "8px",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Eure Dynamik
            </p>
            <p
              style={{
                margin: 0,
                lineHeight: "1.6",
                color: tokens.colors.text.secondary,
                fontSize: "14px",
              }}
            >
              {myPattern === "kritik" && partnerPattern === "verteidigung"
                ? "Ein bekanntes Muster: Der eine spricht Frust aus, der andere erklärt sich. Beide fühlen sich nicht gehört. Ein sanfterer Einstieg kann hier viel verändern."
                : myPattern === "kritik" && partnerPattern === "mauern"
                  ? "Du möchtest reden, dein Partner zieht sich zurück. Das kann frustrierend sein. Manchmal hilft es, weniger Druck zu machen und Raum zu lassen."
                  : myPattern === "mauern" && partnerPattern === "kritik"
                    ? "Du brauchst manchmal Abstand, dein Partner möchte reden. Wenn du sagst, dass du eine Pause brauchst und wiederkommst, gibt das Sicherheit."
                    : myPattern === "verteidigung" && partnerPattern === "kritik"
                      ? "Wenn einer kritisiert und der andere sich erklärt, fühlen sich beide nicht gehört. Erst zuhören, dann antworten – das kann helfen."
                      : "Jedes Paar hat seine Muster. Das Wertvolle ist: Jetzt kennt ihr eure. Und das ist der erste Schritt, um bewusster miteinander umzugehen."
              }
            </p>
          </div>
        )}

        {/* Original Text */}
        {exercise.text && (
          <p
            style={{
              textAlign: "center",
              color: tokens.colors.text.muted,
              lineHeight: "1.6",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {exercise.text}
          </p>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        style={{
          ...tokens.buttons.primary,
          marginTop: "20px",
          flexShrink: 0,
        }}
      >
        Weiter
      </button>
    </div>
  );
}
