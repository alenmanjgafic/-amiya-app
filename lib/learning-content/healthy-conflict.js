/**
 * GESUNDER KONFLIKT - Learning Content
 * Series: Healthy Conflict - 7 Chapters
 *
 * STRUKTUR: Content + Activity pro Chapter (basierend auf Gottman-Methode)
 * TONFALL: Therapeutisch, hoffnungsvoll, normalisierend
 *
 * Wissenschaftliche Basis:
 * - Gottman Institute (Seven Principles, Four Horsemen)
 * - PREP Program (Speaker-Listener Technique)
 * - Microlearning (5-10 Min pro Chapter)
 */

export const HEALTHY_CONFLICT_SERIES = {
  id: "healthy-conflict",
  title: "Gesunder Konflikt",
  subtitle: "Näher kommen durch schwierige Gespräche",
  description: "7 Kapitel basierend auf Beziehungsforschung. Lerne, wie ihr Konflikte nutzen könnt, um euch besser zu verstehen.",
  icon: "conflict",
  color: "#8b5cf6",
  totalDurationMin: 35,
  chapterCount: 7,

  chapters: [
    // =========================================================================
    // CHAPTER 1: Sanft anfangen (Soft Startup)
    // Activity: CHAT PRACTICE
    // =========================================================================
    {
      id: "soft-startup",
      number: 1,
      title: "Sanft anfangen",
      subtitle: "Ein guter Start macht den Unterschied",
      durationMin: 5,

      content: {
        id: "soft-startup-content",
        title: "Die ersten Minuten entscheiden",
        screens: [
          {
            id: "1-C1",
            type: "theory",
            emoji: "💬",
            text: "Wie ein Gespräch beginnt, beeinflusst oft, wie es endet.\n\nDas ist eigentlich eine gute Nachricht – denn den Anfang haben wir in der Hand.",
          },
          {
            id: "1-C2",
            type: "theory",
            emoji: "🌊",
            text: "Wenn wir frustriert sind, starten wir oft mit einem Vorwurf.\n\n\"Du räumst nie auf!\"\n\"Dir ist alles egal!\"\n\nDas ist verständlich – aber es macht es dem anderen schwer, offen zuzuhören.",
          },
          {
            id: "1-C3",
            type: "theory",
            emoji: "🌸",
            text: "Es gibt eine andere Möglichkeit:\n\nStatt Vorwurf → Ich + Gefühl + Wunsch.\n\nDas öffnet ein Gespräch, statt es zu blockieren.",
          },
          {
            id: "1-C4",
            type: "theory",
            emoji: "💭",
            text: "Ein Beispiel:\n\nStatt: \"Du hilfst nie im Haushalt!\"\n\nVielleicht: \"Ich fühle mich manchmal allein damit. Können wir zusammen schauen, wie wir das aufteilen?\"",
          },
          {
            id: "1-C5",
            type: "theory",
            emoji: "✨",
            text: "Eine einfache Struktur:\n\n\"Ich fühle mich [GEFÜHL],\nwenn [SITUATION passiert].\nIch wünsche mir [WUNSCH].\"",
          },
        ],
      },

      activity: {
        id: "soft-startup-activity",
        type: "chat_practice",
        title: "Übe einen sanften Einstieg",
        subtitle: "Formuliere mit Amiya",
        config: {
          exerciseType: "soft-startup",
          scenario: {
            situation: "Du möchtest ein schwieriges Thema mit deinem Partner ansprechen. Zum Beispiel: Er/sie ist oft am Handy, ihr verbringt zu wenig Zeit zusammen, oder du fühlst dich mit dem Haushalt allein.",
            initialMessage: "Stell dir vor, du möchtest ein schwieriges Thema ansprechen. Wie würdest du das Gespräch beginnen? Versuch es mit der Struktur: 'Ich fühle mich... wenn... Ich wünsche mir...'",
            inputPlaceholder: "Dein Gesprächseinstieg...",
            context: "Der User übt einen sanften Gesprächseinstieg nach der Ich-Botschaft Struktur.",
          },
          maxTurns: 4,
        },
      },
    },

    // =========================================================================
    // CHAPTER 2: Die vier Stolperfallen (Four Horsemen)
    // Activity: QUIZ/GAME
    // =========================================================================
    {
      id: "four-horsemen",
      number: 2,
      title: "Die vier Stolperfallen",
      subtitle: "Muster die fast jedes Paar kennt",
      durationMin: 5,

      content: {
        id: "four-horsemen-content",
        title: "Typische Muster erkennen",
        screens: [
          {
            id: "2-C1",
            type: "theory",
            emoji: "💑",
            text: "Jedes Paar streitet.\n\nDas ist nicht das Problem – es zeigt, dass euch etwas wichtig ist.",
          },
          {
            id: "2-C2",
            type: "theory",
            emoji: "👀",
            text: "Es gibt vier typische Muster, in die fast alle Paare manchmal rutschen.\n\nSie zu erkennen ist der erste Schritt.",
          },
          {
            id: "2-C3",
            type: "theory",
            emoji: "⚔️",
            text: "Muster 1: KRITIK\n\n\"Du räumst nie auf!\"\n\"Dir ist alles egal!\"\n\nWenn Frust sich anfühlt wie ein Vorwurf an die ganze Person.",
          },
          {
            id: "2-C4",
            type: "theory",
            emoji: "🛡️",
            text: "Muster 2: VERTEIDIGUNG\n\n\"Das stimmt doch gar nicht!\"\n\"Aber du hast doch auch...\"\n\nWenn wir uns angegriffen fühlen und sofort erklären wollen.",
          },
          {
            id: "2-C5",
            type: "theory",
            emoji: "🙄",
            text: "Muster 3: VERACHTUNG\n\nAugenrollen. Sarkasmus.\n\nWenn sich Frust über längere Zeit aufgestaut hat und rauskommt.",
          },
          {
            id: "2-C6",
            type: "theory",
            emoji: "🧱",
            text: "Muster 4: MAUERN\n\nAbschalten. Schweigen. Innerlich weggehen.\n\nOft ein Zeichen, dass alles gerade zu viel ist.",
          },
          {
            id: "2-C7",
            type: "theory",
            emoji: "💚",
            text: "Wichtig: Diese Muster sind menschlich.\n\nJeder rutscht mal rein. Es geht nicht um Schuld – sondern darum, es zu bemerken.",
          },
        ],
      },

      activity: {
        id: "four-horsemen-activity",
        type: "quiz",
        title: "Erkenne die Stolperfalle",
        subtitle: "Teste dein Wissen",
        config: {
          questions: [
            {
              statement: "Du hörst mir nie zu! Du bist immer nur mit dir selbst beschäftigt!",
              question: "Welche Stolperfalle ist das?",
              options: ["Kritik", "Verteidigung", "Verachtung", "Mauern"],
              correctIndex: 0,
              explanation: "Das ist Kritik – \"nie\" und \"immer\" sind typische Anzeichen für einen Vorwurf an die ganze Person statt an ein konkretes Verhalten.",
            },
            {
              statement: "Das stimmt überhaupt nicht! Du vergisst, dass ich letzte Woche schon...",
              question: "Welche Stolperfalle ist das?",
              options: ["Kritik", "Verteidigung", "Verachtung", "Mauern"],
              correctIndex: 1,
              explanation: "Das ist Verteidigung – die Person wehrt sich sofort und erklärt, statt erst zuzuhören.",
            },
            {
              statement: "*Augenrollen* Na klar, du bist ja auch sooo perfekt...",
              question: "Welche Stolperfalle ist das?",
              options: ["Kritik", "Verteidigung", "Verachtung", "Mauern"],
              correctIndex: 2,
              explanation: "Das ist Verachtung – Augenrollen und Sarkasmus zeigen aufgestauten Frust und Geringschätzung.",
            },
            {
              statement: "*Schweigen. Blick abwenden. Innerlich abschalten.*",
              question: "Welche Stolperfalle ist das?",
              options: ["Kritik", "Verteidigung", "Verachtung", "Mauern"],
              correctIndex: 3,
              explanation: "Das ist Mauern – sich zurückziehen und abschalten, oft ein Zeichen dass alles zu viel ist.",
            },
            {
              statement: "Typisch! Du machst das absichtlich um mich zu ärgern.",
              question: "Welche Stolperfalle ist das?",
              options: ["Kritik", "Verteidigung", "Verachtung", "Mauern"],
              correctIndex: 0,
              explanation: "Das ist Kritik – \"Typisch\" und Unterstellungen zur Absicht greifen die Person an, nicht das Verhalten.",
            },
          ],
        },
      },
    },

    // =========================================================================
    // CHAPTER 3: Wenn's zu viel wird (Emotional Flooding)
    // Activity: PICK
    // =========================================================================
    {
      id: "emotional-flooding",
      number: 3,
      title: "Wenn's zu viel wird",
      subtitle: "Warum Pausen Stärke zeigen",
      durationMin: 5,

      content: {
        id: "emotional-flooding-content",
        title: "Die Kunst der Pause",
        screens: [
          {
            id: "3-C1",
            type: "theory",
            emoji: "🌊",
            text: "Manchmal ist alles zu viel.\n\nDer Puls steigt, die Gedanken rasen, wir können nicht mehr klar denken.",
          },
          {
            id: "3-C2",
            type: "theory",
            emoji: "🧠",
            text: "Das ist \"Flooding\" – unser Körper schaltet in den Kampf-oder-Flucht-Modus.\n\nIn diesem Zustand können wir nicht gut zuhören oder reden.",
          },
          {
            id: "3-C3",
            type: "theory",
            emoji: "⏸️",
            text: "Die Lösung: Eine Pause.\n\nNicht weglaufen – sondern sich regulieren. Mindestens 20 Minuten, sagt die Forschung.",
          },
          {
            id: "3-C4",
            type: "theory",
            emoji: "💚",
            text: "Eine Pause zu nehmen ist kein Zeichen von Schwäche.\n\nEs ist ein Zeichen von Selbstkenntnis und Verantwortung.",
          },
          {
            id: "3-C5",
            type: "theory",
            emoji: "🔑",
            text: "Der Schlüssel:\n\n\"Ich brauche eine Pause, aber ich komme zurück.\"\n\nDas gibt eurem Partner Sicherheit.",
          },
        ],
      },

      activity: {
        id: "emotional-flooding-activity",
        type: "pick",
        title: "Gestalte deine Pause-Routine",
        subtitle: "Was funktioniert für dich?",
        config: {
          sections: [
            {
              id: "signal",
              title: "Mein Signal für \"Ich brauche eine Pause\"",
              type: "single_select",
              options: [
                { id: "hand", label: "✋ Handzeichen", description: "Stille Geste" },
                { id: "word", label: "💬 Ein Codewort", description: "z.B. \"Timeout\"" },
                { id: "sentence", label: "📝 Ein ganzer Satz", description: "\"Ich brauche kurz Luft\"" },
              ],
            },
            {
              id: "duration",
              title: "Wie lange brauchst du meistens?",
              type: "single_select",
              options: [
                { id: "15", label: "15 Minuten" },
                { id: "20", label: "20 Minuten" },
                { id: "30", label: "30 Minuten" },
                { id: "60", label: "1 Stunde" },
              ],
            },
            {
              id: "activity",
              title: "Was hilft dir, dich zu beruhigen?",
              type: "multi_select",
              options: [
                { id: "walk", label: "🚶 Spazieren gehen" },
                { id: "music", label: "🎵 Musik hören" },
                { id: "breathe", label: "🧘 Atmen / Meditation" },
                { id: "water", label: "💧 Wasser trinken, frische Luft" },
                { id: "alone", label: "🛋️ Einfach allein sein" },
              ],
            },
            {
              id: "return",
              title: "Wie möchtest du zurückkommen?",
              type: "single_select",
              options: [
                { id: "touch", label: "🤗 Mit einer Umarmung" },
                { id: "check", label: "💬 \"Bist du bereit weiterzureden?\"" },
                { id: "tea", label: "☕ Mit einem Tee/Kaffee" },
                { id: "sit", label: "🛋️ Einfach wieder hinsetzen" },
              ],
            },
          ],
          saveAsAgreement: false,
        },
      },
    },

    // =========================================================================
    // CHAPTER 4: Euer Beziehungskonto (Emotional Bank Account)
    // Activity: NUDGE + REFLECTION
    // =========================================================================
    {
      id: "emotional-bank-account",
      number: 4,
      title: "Euer Beziehungskonto",
      subtitle: "Warum kleine Momente zählen",
      durationMin: 5,

      content: {
        id: "emotional-bank-account-content",
        title: "Das 5:1 Prinzip",
        screens: [
          {
            id: "4-C1",
            type: "theory",
            emoji: "🏦",
            text: "Stell dir eure Beziehung wie ein Konto vor.\n\nJede positive Interaktion ist eine Einzahlung.\nJeder Konflikt ist eine Abhebung.",
          },
          {
            id: "4-C2",
            type: "theory",
            emoji: "⚖️",
            text: "Die Forschung zeigt:\n\nGlückliche Paare haben etwa 5 positive Interaktionen für jede negative.\n\n5:1 – Das ist das magische Verhältnis.",
          },
          {
            id: "4-C3",
            type: "theory",
            emoji: "💡",
            text: "Das erklärt, warum manchmal kleine Konflikte so gross wirken:\n\nWenn das Konto niedrig ist, wiegt jede Abhebung schwerer.",
          },
          {
            id: "4-C4",
            type: "theory",
            emoji: "✨",
            text: "Einzahlungen müssen nicht gross sein:\n\n• Ein ehrliches \"Danke\"\n• Eine Berührung im Vorbeigehen\n• Ein \"Ich hab an dich gedacht\"\n• Interesse zeigen an seinem/ihrem Tag",
          },
          {
            id: "4-C5",
            type: "theory",
            emoji: "💚",
            text: "Diese kleinen Momente bauen einen Puffer auf.\n\nWenn dann ein Konflikt kommt, habt ihr Reserven.",
          },
        ],
      },

      activity: {
        id: "emotional-bank-account-activity",
        type: "nudge",
        title: "Mach eine Einzahlung",
        subtitle: "Heute noch",
        config: {
          reflection: {
            question: "Wann hast du das letzte Mal bewusst eine \"Einzahlung\" gemacht?",
            type: "single_select",
            options: [
              { id: "today", label: "Heute" },
              { id: "yesterday", label: "Gestern" },
              { id: "this_week", label: "Diese Woche" },
              { id: "dont_remember", label: "Weiss nicht mehr" },
            ],
          },
          nudge: {
            title: "Deine Aufgabe für heute",
            description: "Mach eine bewusste kleine Einzahlung. Nicht weil du musst – sondern weil du möchtest.",
            ideas: [
              "💬 Sag deinem Partner etwas, das du an ihm/ihr schätzt",
              "☕ Bring ihm/ihr ungefragt einen Kaffee oder Tee",
              "🤗 Eine 6-Sekunden-Umarmung (länger als normal!)",
              "📱 Eine liebevolle Nachricht zwischendurch",
              "👂 Frag nach seinem/ihrem Tag – und hör wirklich zu",
            ],
          },
          followUp: {
            question: "Wie hat dein Partner reagiert?",
            showAfterHours: 24,
          },
        },
      },
    },

    // =========================================================================
    // CHAPTER 5: Wirklich zuhören (Validation)
    // Activity: CHAT PRACTICE
    // =========================================================================
    {
      id: "validation",
      number: 5,
      title: "Wirklich zuhören",
      subtitle: "Verstehen vor Lösen",
      durationMin: 5,

      content: {
        id: "validation-content",
        title: "Was Validation bedeutet",
        screens: [
          {
            id: "5-C1",
            type: "theory",
            emoji: "💙",
            text: "Oft geht es gar nicht um die Lösung.\n\nSondern darum, sich verstanden zu fühlen.",
          },
          {
            id: "5-C2",
            type: "theory",
            emoji: "👂",
            text: "Wirklich zuhören heisst:\n\nNicht schon die Antwort im Kopf formulieren, während der andere noch spricht.",
          },
          {
            id: "5-C3",
            type: "theory",
            emoji: "💚",
            text: "Validation bedeutet nicht Zustimmung.\n\nEs bedeutet: \"Ich sehe, dass das für dich so ist. Deine Gefühle sind berechtigt.\"",
          },
          {
            id: "5-C4",
            type: "theory",
            emoji: "🪞",
            text: "Validierende Sätze:\n\n\"Das kann ich verstehen.\"\n\"Das klingt wirklich schwer für dich.\"\n\"Kein Wunder, dass du so fühlst.\"",
          },
          {
            id: "5-C5",
            type: "theory",
            emoji: "✨",
            text: "Und manchmal reicht ein einfaches:\n\n\"Erzähl mir mehr davon.\"\n\nDas zeigt: Ich bin hier. Ich höre dich.",
          },
        ],
      },

      activity: {
        id: "validation-activity",
        type: "chat_practice",
        title: "Übe Validation",
        subtitle: "Verstehen statt lösen",
        config: {
          systemPrompt: "validation",
          scenario: "Dein Partner teilt etwas mit dir. Übe, validierend zu antworten – ohne zu lösen oder zu bewerten.",
          maxTurns: 4,
          partnerStatements: [
            "Ich hatte heute so einen stressigen Tag. Mein Chef hat wieder alles auf mich abgeladen.",
            "Ich fühle mich so erschöpft in letzter Zeit. Irgendwie reicht meine Energie nicht.",
            "Ich mache mir Sorgen wegen dem Geld. Ich weiss nicht, wie wir das schaffen sollen.",
          ],
        },
      },
    },

    // =========================================================================
    // CHAPTER 6: Nach dem Sturm (Repair Attempts)
    // Activity: REFLECTION + QUIZ
    // =========================================================================
    {
      id: "repair-attempts",
      number: 6,
      title: "Nach dem Sturm",
      subtitle: "Wieder zueinander finden",
      durationMin: 5,

      content: {
        id: "repair-attempts-content",
        title: "Die Kunst der Reparatur",
        screens: [
          {
            id: "6-C1",
            type: "theory",
            emoji: "🌈",
            text: "Nicht wie oft ihr streitet entscheidet.\n\nSondern wie ihr danach wieder zueinander findet.",
          },
          {
            id: "6-C2",
            type: "theory",
            emoji: "🌉",
            text: "\"Repair Attempts\" – kleine Gesten die Brücken bauen:\n\n\"Das kam falsch raus.\"\n\"Können wir nochmal anfangen?\"\n\"Ich bin immer noch auf deiner Seite.\"",
          },
          {
            id: "6-C3",
            type: "theory",
            emoji: "💚",
            text: "Diese kleinen Signale sagen:\n\nWir sind wichtiger als dieser Streit.\nIch will nicht gegen dich kämpfen.",
          },
          {
            id: "6-C4",
            type: "theory",
            emoji: "🤗",
            text: "Manchmal hilft auch Leichtigkeit:\n\n\"Okay, wir drehen uns im Kreis. Tee?\"\n\nNicht das Problem kleinreden – aber den Moment entschärfen.",
          },
          {
            id: "6-C5",
            type: "theory",
            emoji: "✨",
            text: "Und genauso wichtig:\n\nDie Brücken deines Partners erkennen und annehmen.\n\nEin Repair funktioniert nur, wenn beide mitmachen.",
          },
        ],
      },

      activity: {
        id: "repair-attempts-activity",
        type: "reflection",
        title: "Eure Brücken",
        subtitle: "Was bei euch funktioniert",
        config: {
          sections: [
            {
              id: "my_repairs",
              title: "Welche Sätze könntest du dir vorstellen?",
              type: "multi_select",
              options: [
                { id: "pause", label: "\"Ich brauche kurz eine Pause.\"" },
                { id: "restart", label: "\"Können wir nochmal anfangen?\"" },
                { id: "sorry_tone", label: "\"Sorry, das kam falsch raus.\"" },
                { id: "love_you", label: "\"Ich hab dich lieb, auch wenn wir streiten.\"" },
                { id: "my_part", label: "\"Ich seh meinen Anteil.\"" },
                { id: "hug", label: "\"Können wir uns kurz umarmen?\"" },
              ],
            },
            {
              id: "partner_repairs",
              title: "Was macht dein Partner manchmal, das hilft?",
              type: "free_text",
              placeholder: "z.B. Kommt nach einer Weile und umarmt mich...",
            },
            {
              id: "best_repair",
              title: "Euer bester Repair-Move?",
              type: "free_text",
              placeholder: "Was hat schon mal funktioniert bei euch?",
            },
          ],
          closing: {
            text: "Diese Brücken zu kennen ist wertvoll.\n\nNächstes Mal wenn es schwierig wird – bau eine oder erkenne sie.",
          },
        },
      },
    },

    // =========================================================================
    // CHAPTER 7: Eure Spielregeln (Ground Rules)
    // Activity: COMMITMENT (Agreement-Integration)
    // =========================================================================
    {
      id: "ground-rules",
      number: 7,
      title: "Eure Spielregeln",
      subtitle: "Sicherheit durch Struktur",
      durationMin: 5,

      content: {
        id: "ground-rules-content",
        title: "Regeln die Freiheit geben",
        screens: [
          {
            id: "7-C1",
            type: "theory",
            emoji: "📜",
            text: "Klingt komisch, aber:\n\nKlare Regeln für Konflikte können euch freier machen.",
          },
          {
            id: "7-C2",
            type: "theory",
            emoji: "🤝",
            text: "Wenn ihr wisst, was erlaubt ist und was nicht, fühlt sich Streiten sicherer an.\n\nIhr könnt ehrlich sein, ohne Angst vor Eskalation.",
          },
          {
            id: "7-C3",
            type: "theory",
            emoji: "✅",
            text: "Beispiele für Spielregeln:\n\n• Keine Beleidigungen – nie\n• Pausen sind immer erlaubt\n• Wir bleiben beim Thema\n• Einer spricht, der andere hört",
          },
          {
            id: "7-C4",
            type: "theory",
            emoji: "💬",
            text: "Die \"Speaker-Listener\" Technik:\n\n1. Der Speaker hält einen Gegenstand\n2. Nur der Speaker spricht\n3. Der Listener fasst zusammen\n4. Dann Wechsel\n\nKlingt simpel – wirkt stark.",
          },
          {
            id: "7-C5",
            type: "theory",
            emoji: "💚",
            text: "Das Wichtigste:\n\nDiese Regeln gelten für beide.\nSie sind kein Werkzeug um zu gewinnen – sondern um gemeinsam besser zu werden.",
          },
        ],
      },

      activity: {
        id: "ground-rules-activity",
        type: "commitment",
        title: "Wähle eure Regeln",
        subtitle: "Als Vereinbarung speichern",
        config: {
          intro: "Welche Spielregeln möchtet ihr für eure Konflikte vereinbaren?",
          options: [
            {
              id: "no_insults",
              label: "Keine Beleidigungen",
              description: "Auch wenn wir wütend sind – persönliche Angriffe sind tabu.",
            },
            {
              id: "pauses_allowed",
              label: "Pausen sind erlaubt",
              description: "Jeder darf eine Pause nehmen, wenn es zu viel wird.",
            },
            {
              id: "no_bedtime",
              label: "Nicht vor dem Schlafen",
              description: "Grosse Themen nicht kurz vor dem Schlafengehen.",
            },
            {
              id: "one_speaks",
              label: "Einer spricht, einer hört",
              description: "Nicht unterbrechen – erst zuhören, dann antworten.",
            },
            {
              id: "stay_on_topic",
              label: "Beim Thema bleiben",
              description: "Keine alten Geschichten aufwärmen.",
            },
            {
              id: "no_threats",
              label: "Keine Trennungsdrohungen",
              description: "Im Streit nicht mit Trennung drohen.",
            },
          ],
          minSelections: 2,
          customOption: {
            enabled: true,
            label: "Eigene Regel hinzufügen",
            placeholder: "z.B. Nach dem Streit immer versöhnen...",
          },
          saveAsAgreement: true,
          agreementConfig: {
            type: "commitment",
            title: "Unsere Konflikt-Spielregeln",
            checkInDays: 14,
          },
        },
      },
    },
  ],
};

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Get a chapter by its ID
 */
export function getChapterById(chapterId) {
  return HEALTHY_CONFLICT_SERIES.chapters.find(c => c.id === chapterId);
}

/**
 * Get the next chapter after the given one
 */
export function getNextChapter(currentChapterId) {
  const currentChapter = getChapterById(currentChapterId);
  if (!currentChapter) return null;
  return HEALTHY_CONFLICT_SERIES.chapters.find(c => c.number === currentChapter.number + 1);
}

/**
 * Get content screen count for a chapter
 */
export function getContentScreenCount(chapterId) {
  const chapter = getChapterById(chapterId);
  return chapter ? chapter.content.screens.length : 0;
}

/**
 * Check if chapter has specific activity type
 */
export function hasActivityType(chapterId, type) {
  const chapter = getChapterById(chapterId);
  return chapter ? chapter.activity.type === type : false;
}

/**
 * Get all chapters with a specific activity type
 */
export function getChaptersByActivityType(type) {
  return HEALTHY_CONFLICT_SERIES.chapters.filter(c => c.activity.type === type);
}

// Export for index
export default HEALTHY_CONFLICT_SERIES;
