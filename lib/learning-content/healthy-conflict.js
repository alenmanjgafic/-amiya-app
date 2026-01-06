/**
 * GESUNDER KONFLIKT - Learning Content
 * Series: Healthy Conflict - 5 Bites
 *
 * TONFALL: Therapeutisch, hoffnungsvoll, normalisierend
 * - Hoffnung zuerst
 * - "Das ist menschlich" statt "Das ist gefährlich"
 * - Weiche Sprache, keine Anklagen
 * - Fokus auf was ihr TUN könnt
 */

export const HEALTHY_CONFLICT_SERIES = {
  id: "healthy-conflict",
  title: "Gesunder Konflikt",
  subtitle: "Näher kommen durch schwierige Gespräche",
  description: "Konflikte gehören dazu. Hier lernst du, wie ihr sie nutzen könnt, um euch besser zu verstehen.",
  icon: "conflict", // Maps to ConflictSeriesIcon
  color: "#8b5cf6",
  totalDurationMin: 20,
  bites: [
    // =========================================================================
    // BITE 1: Typische Stolperfallen
    // =========================================================================
    {
      id: "what-poisons-conflict",
      order: 1,
      title: "Typische Stolperfallen",
      subtitle: "Was fast jedes Paar kennt",
      durationMin: 4,
      screens: [
        // --- THEORY SCREENS ---
        {
          id: "1-T1",
          type: "theory",
          emoji: "💑",
          text: "Jedes Paar streitet.\n\nDas ist nicht das Problem – es zeigt, dass euch etwas wichtig ist.",
        },
        {
          id: "1-T2",
          type: "theory",
          emoji: "🌱",
          text: "Die gute Nachricht:\n\nWie ihr miteinander streitet, könnt ihr verändern. Und genau darum geht es hier.",
        },
        {
          id: "1-T3",
          type: "theory",
          emoji: "👀",
          text: "Es gibt vier typische Muster, in die fast alle Paare manchmal rutschen.\n\nSie zu erkennen ist der erste Schritt.",
        },
        {
          id: "1-T4",
          type: "theory",
          emoji: "⚔️",
          text: "Muster 1: KRITIK\n\n\"Du räumst nie auf!\"\n\"Dir ist alles egal!\"\n\nWenn Frust sich anfühlt wie ein Vorwurf an die ganze Person.",
        },
        {
          id: "1-T5",
          type: "theory",
          emoji: "🛡️",
          text: "Muster 2: VERTEIDIGUNG\n\n\"Das stimmt doch gar nicht!\"\n\"Aber du hast doch auch...\"\n\nWenn wir uns angegriffen fühlen und sofort erklären wollen.",
        },
        {
          id: "1-T6",
          type: "theory",
          emoji: "🙄",
          text: "Muster 3: VERACHTUNG\n\nAugenrollen. Sarkasmus.\n\nWenn sich Frust über längere Zeit aufgestaut hat und rauskommt.",
        },
        {
          id: "1-T7",
          type: "theory",
          emoji: "🧱",
          text: "Muster 4: MAUERN\n\nAbschalten. Schweigen. Innerlich weggehen.\n\nOft ein Zeichen, dass alles gerade zu viel ist.",
        },
        {
          id: "1-T8",
          type: "theory",
          emoji: "💚",
          text: "Wichtig: Diese Muster sind menschlich.\n\nJeder rutscht mal rein. Es geht nicht um Schuld – sondern darum, es zu bemerken.",
        },
        // --- EXERCISE SCREENS ---
        {
          id: "1-E1",
          type: "exercise",
          exerciseType: "single_select",
          question: "In welches Muster rutschst du manchmal, wenn es schwierig wird?",
          responseKey: "my_pattern",
          options: [
            {
              id: "kritik",
              emoji: "⚔️",
              label: "Kritik",
              description: "Mir rutschen Sätze raus wie \"Du immer...\" oder \"Du nie...\"",
            },
            {
              id: "verteidigung",
              emoji: "🛡️",
              label: "Verteidigung",
              description: "Ich will sofort erklären, dass es nicht so ist",
            },
            {
              id: "mauern",
              emoji: "🧱",
              label: "Mauern",
              description: "Ich ziehe mich zurück oder schalte ab",
            },
            {
              id: "verachtung",
              emoji: "🙄",
              label: "Verachtung",
              description: "Ich werde sarkastisch oder rolle mit den Augen",
            },
          ],
        },
        {
          id: "1-E2",
          type: "exercise",
          exerciseType: "single_select",
          question: "Und welches Muster erkennst du manchmal bei deinem Partner?",
          responseKey: "partner_pattern",
          options: [
            {
              id: "kritik",
              emoji: "⚔️",
              label: "Kritik",
              description: "Macht manchmal Vorwürfe",
            },
            {
              id: "verteidigung",
              emoji: "🛡️",
              label: "Verteidigung",
              description: "Geht schnell in die Erklärung",
            },
            {
              id: "mauern",
              emoji: "🧱",
              label: "Mauern",
              description: "Zieht sich manchmal zurück",
            },
            {
              id: "verachtung",
              emoji: "🙄",
              label: "Verachtung",
              description: "Reagiert manchmal abwertend",
            },
          ],
        },
        {
          id: "1-E3",
          type: "exercise",
          exerciseType: "reflection",
          title: "Eure Muster",
          showResponses: ["my_pattern", "partner_pattern"],
          text: "Diese Muster zu kennen ist wertvoll.\n\nNicht um Schuld zu verteilen – sondern um bewusster miteinander umzugehen.",
        },
        {
          id: "1-E4",
          type: "exercise",
          exerciseType: "challenge_offer",
          challenge: {
            type: "reiter-beobachten",
            title: "Bewusst beobachten",
            description: "Achte in den nächsten Tagen liebevoll darauf, wann du selbst in ein Muster rutschst. Ohne Selbstkritik – nur beobachten.",
            duration: "3 Tage",
            followUpQuestion: "Was hast du über dich bemerkt?",
          },
        },
      ],
    },
    // =========================================================================
    // BITE 2: Sanft einsteigen
    // =========================================================================
    {
      id: "soft-startup",
      order: 2,
      title: "Sanft einsteigen",
      subtitle: "Wie der Anfang den Ton setzt",
      durationMin: 4,
      screens: [
        {
          id: "2-T1",
          type: "theory",
          emoji: "💬",
          text: "Wie ein Gespräch beginnt, beeinflusst oft, wie es endet.\n\nDas ist eigentlich eine gute Nachricht – denn den Anfang haben wir in der Hand.",
        },
        {
          id: "2-T2",
          type: "theory",
          emoji: "🌊",
          text: "Wenn wir frustriert sind, starten wir oft mit einem Vorwurf.\n\nDas ist verständlich – aber es macht es dem anderen schwer, offen zuzuhören.",
        },
        {
          id: "2-T3",
          type: "theory",
          emoji: "🌸",
          text: "Es gibt eine andere Möglichkeit:\n\nStatt Vorwurf → Ich + Gefühl + Wunsch.\n\nDas öffnet ein Gespräch, statt es zu blockieren.",
        },
        {
          id: "2-T4",
          type: "theory",
          emoji: "💭",
          text: "Ein Beispiel:\n\nStatt: \"Du hilfst nie im Haushalt!\"\n\nVielleicht: \"Ich fühle mich manchmal allein damit. Können wir zusammen schauen, wie wir das aufteilen?\"",
        },
        {
          id: "2-T5",
          type: "theory",
          emoji: "💚",
          text: "Das bedeutet nicht, dass dein Frust nicht berechtigt ist.\n\nEs bedeutet nur: Du gibst eurem Gespräch eine bessere Chance.",
        },
        {
          id: "2-T6",
          type: "theory",
          emoji: "✨",
          text: "Eine einfache Struktur:\n\n\"Ich fühle mich [GEFÜHL],\nwenn [SITUATION passiert].\nIch wünsche mir [WUNSCH].\"",
        },
        {
          id: "2-T7",
          type: "theory",
          emoji: "🤝",
          text: "Das braucht Übung – und das ist okay.\n\nManchmal klappt es, manchmal nicht. Jeder Versuch zählt.",
        },
        {
          id: "2-E1",
          type: "exercise",
          exerciseType: "free_text",
          question: "Gibt es ein Thema, das du gerne ansprechen möchtest?",
          responseKey: "topic_to_address",
          placeholder: "z.B. Mehr Zeit zusammen, Aufgabenteilung...",
          minLength: 3,
        },
        {
          id: "2-E2",
          type: "exercise",
          exerciseType: "free_text",
          question: "Wie fühlst du dich dabei?",
          responseKey: "feeling",
          placeholder: "z.B. unsicher, traurig, überfordert...",
          hint: "Echte Gefühle: traurig, ängstlich, einsam, überfordert, unsicher...",
        },
        {
          id: "2-E3",
          type: "exercise",
          exerciseType: "free_text",
          question: "Was wünschst du dir?",
          responseKey: "wish",
          placeholder: "z.B. Dass wir öfter zusammen...",
        },
        {
          id: "2-E4",
          type: "exercise",
          exerciseType: "summary",
          title: "Dein sanfter Einstieg",
          template: "\"Ich fühle mich {feeling}, wenn es um {topic_to_address} geht. Ich wünsche mir {wish}.\"",
          text: "Das ist dein Satz.\n\nProbier ihn aus – in einem ruhigen Moment, nicht mitten im Streit.",
        },
        {
          id: "2-E5",
          type: "exercise",
          exerciseType: "challenge_offer",
          challenge: {
            type: "weicher-einstieg",
            title: "Ein Gespräch beginnen",
            description: "Sprich das Thema mit deinem sanften Einstieg an – wähle einen entspannten Moment dafür.",
            duration: "Diese Woche",
            followUpQuestion: "Wie war das Gespräch für dich?",
          },
        },
      ],
    },
    // =========================================================================
    // BITE 3: Gehört werden
    // =========================================================================
    {
      id: "being-heard",
      order: 3,
      title: "Wirklich zuhören",
      subtitle: "Was es bedeutet, da zu sein",
      durationMin: 4,
      screens: [
        {
          id: "3-T1",
          type: "theory",
          emoji: "💙",
          text: "Oft geht es gar nicht um die Lösung.\n\nSondern darum, sich verstanden zu fühlen.",
        },
        {
          id: "3-T2",
          type: "theory",
          emoji: "👂",
          text: "Wirklich zuhören heisst:\n\nNicht schon die Antwort im Kopf formulieren, während der andere noch spricht.",
        },
        {
          id: "3-T3",
          type: "theory",
          emoji: "🪞",
          text: "Manchmal hilft es, zu spiegeln:\n\n\"Wenn ich dich richtig verstehe, fühlst du dich...\"\n\nDas zeigt: Ich höre dich.",
        },
        {
          id: "3-T4",
          type: "theory",
          emoji: "💚",
          text: "Und manchmal reicht ein einfaches:\n\n\"Das kann ich verstehen.\"\n\"Das klingt schwer für dich.\"\n\nDu musst nicht zustimmen – nur anerkennen.",
        },
        {
          id: "3-T5",
          type: "theory",
          emoji: "✨",
          text: "Echtes Interesse zeigen:\n\n\"Erzähl mir mehr davon.\"\n\"Was beschäftigt dich am meisten dabei?\"\n\nFragen, die öffnen statt lenken.",
        },
        {
          id: "3-T6",
          type: "theory",
          emoji: "🤝",
          text: "Das Schwierige daran:\n\nWir wollen helfen, erklären, verteidigen.\n\nAber manchmal ist das Beste, einfach da zu sein.",
        },
        {
          id: "3-E1",
          type: "exercise",
          exerciseType: "single_select",
          question: "Was fällt dir beim Zuhören manchmal schwer?",
          responseKey: "listening_challenge",
          options: [
            {
              id: "not_defending",
              emoji: "🛡️",
              label: "Nicht sofort reagieren",
              description: "Ich möchte mich erklären oder verteidigen",
            },
            {
              id: "not_solving",
              emoji: "🔧",
              label: "Keine Lösung anbieten",
              description: "Ich möchte das Problem direkt lösen",
            },
            {
              id: "staying_present",
              emoji: "🧠",
              label: "Ganz da sein",
              description: "Meine Gedanken wandern schon zur Antwort",
            },
            {
              id: "validating",
              emoji: "💚",
              label: "Verständnis zeigen",
              description: "Es fällt mir schwer, das Gefühl anzuerkennen",
            },
          ],
        },
        {
          id: "3-E2",
          type: "exercise",
          exerciseType: "reflection",
          title: "Dein Zuhör-Thema",
          showResponses: ["listening_challenge"],
          text: "Das ist ganz normal – wir alle haben unsere Muster.\n\nSchon das Bewusstsein dafür kann etwas verändern.",
        },
        {
          id: "3-E3",
          type: "exercise",
          exerciseType: "challenge_offer",
          challenge: {
            type: "zuhoeren-ueben",
            title: "Einfach da sein",
            description: "Frag deinen Partner, was ihn/sie gerade beschäftigt. Hör einfach zu – ohne zu lösen oder zu bewerten. Nur da sein.",
            duration: "Die nächsten Tage",
            followUpQuestion: "Wie hat sich das angefühlt?",
          },
        },
      ],
    },
    // =========================================================================
    // BITE 4: Reparieren
    // =========================================================================
    {
      id: "repair-attempts",
      order: 4,
      title: "Wieder zueinander finden",
      subtitle: "Nach einem Streit",
      durationMin: 4,
      screens: [
        {
          id: "4-T1",
          type: "theory",
          emoji: "🌈",
          text: "Jeder Streit kann eine Chance sein.\n\nNicht weil er schön ist – sondern weil das \"Danach\" euch näher bringen kann.",
        },
        {
          id: "4-T2",
          type: "theory",
          emoji: "🌉",
          text: "Es gibt kleine Gesten, die Brücken bauen:\n\n\"Das kam falsch raus.\"\n\"Können wir nochmal anfangen?\"\n\"Ich bin immer noch auf deiner Seite.\"",
        },
        {
          id: "4-T3",
          type: "theory",
          emoji: "💚",
          text: "Diese kleinen Signale sind wichtiger als man denkt.\n\nSie sagen: Wir sind wichtiger als dieser Streit.",
        },
        {
          id: "4-T4",
          type: "theory",
          emoji: "⏸️",
          text: "Manchmal braucht es eine Pause:\n\n\"Ich brauche kurz Luft, aber ich komme zurück.\"\n\nDas ist kein Weglaufen – sondern Selbstfürsorge.",
        },
        {
          id: "4-T5",
          type: "theory",
          emoji: "🤗",
          text: "Manchmal hilft auch Leichtigkeit:\n\n\"Okay, wir drehen uns im Kreis. Sollen wir einen Tee machen?\"\n\nNicht das Problem kleinreden – aber den Moment entschärfen.",
        },
        {
          id: "4-T6",
          type: "theory",
          emoji: "✨",
          text: "Und manchmal reicht ein ehrliches:\n\n\"Ich hab mich im Ton vergriffen.\"\n\"Da war ich unfair.\"\n\nKlein, aber es öffnet viel.",
        },
        {
          id: "4-E1",
          type: "exercise",
          exerciseType: "multi_select",
          question: "Welche dieser Sätze könntest du dir vorstellen?",
          responseKey: "repair_sentences",
          options: [
            { id: "pause", label: "\"Ich brauche kurz eine Pause.\"" },
            { id: "restart", label: "\"Können wir nochmal von vorne anfangen?\"" },
            { id: "sorry_tone", label: "\"Sorry, das kam falsch raus.\"" },
            { id: "love_you", label: "\"Ich hab dich lieb, auch wenn wir streiten.\"" },
            { id: "my_part", label: "\"Ich seh meinen Anteil.\"" },
            { id: "hug", label: "\"Können wir uns kurz in den Arm nehmen?\"" },
          ],
          minSelections: 1,
        },
        {
          id: "4-E2",
          type: "exercise",
          exerciseType: "reflection",
          title: "Deine Brücken-Sätze",
          showResponses: ["repair_sentences"],
          text: "Das sind deine Werkzeuge.\n\nManchmal reicht ein einziger Satz, um aus einem Streit wieder ein Gespräch zu machen.",
        },
        {
          id: "4-E3",
          type: "exercise",
          exerciseType: "challenge_offer",
          challenge: {
            type: "reparatur-versuchen",
            title: "Eine Brücke bauen",
            description: "Achte diese Woche darauf, wenn dein Partner eine Brücke baut – und geh drüber. Oder bau selbst eine.",
            duration: "Diese Woche",
            followUpQuestion: "Wie war das für euch?",
          },
        },
      ],
    },
    // =========================================================================
    // BITE 5: Euer Weg
    // =========================================================================
    {
      id: "your-conflict-style",
      order: 5,
      title: "Euer Weg",
      subtitle: "Was ihr mitnehmt",
      durationMin: 4,
      screens: [
        {
          id: "5-T1",
          type: "theory",
          emoji: "💫",
          text: "Du hast jetzt einige Werkzeuge:\n\n• Muster erkennen\n• Sanft einsteigen\n• Wirklich zuhören\n• Brücken bauen",
        },
        {
          id: "5-T2",
          type: "theory",
          emoji: "🌱",
          text: "Es geht nicht darum, perfekt zu sein.\n\nSondern darum, es immer wieder zu versuchen. Jedes Mal ein bisschen bewusster.",
        },
        {
          id: "5-T3",
          type: "theory",
          emoji: "☀️",
          text: "Etwas, das viele Paare vergessen:\n\nDie kleinen positiven Momente im Alltag sind genauso wichtig wie die grossen Gespräche.",
        },
        {
          id: "5-T4",
          type: "theory",
          emoji: "💚",
          text: "Ein ehrliches \"Danke\".\nEine kleine Berührung im Vorbeigehen.\nEin \"Ich hab an dich gedacht.\"\n\nDiese Momente bauen etwas auf.",
        },
        {
          id: "5-E1",
          type: "exercise",
          exerciseType: "single_select",
          question: "Was nimmst du am meisten aus dieser Serie mit?",
          responseKey: "key_insight",
          options: [
            {
              id: "riders",
              emoji: "👀",
              label: "Muster erkennen",
              description: "Ich verstehe jetzt besser, was bei uns passiert",
            },
            {
              id: "soft_start",
              emoji: "🌸",
              label: "Sanfter Einstieg",
              description: "Wie ich ein Gespräch beginne, macht viel aus",
            },
            {
              id: "listening",
              emoji: "💙",
              label: "Wirklich zuhören",
              description: "Manchmal reicht es, einfach da zu sein",
            },
            {
              id: "repair",
              emoji: "🌈",
              label: "Brücken bauen",
              description: "Wir können immer wieder zueinander finden",
            },
          ],
        },
        {
          id: "5-E2",
          type: "exercise",
          exerciseType: "free_text",
          question: "Was möchtest du beim nächsten schwierigen Gespräch versuchen?",
          responseKey: "personal_commitment",
          placeholder: "z.B. Erst zuhören, bevor ich reagiere...",
        },
        {
          id: "5-E3",
          type: "exercise",
          exerciseType: "summary",
          title: "Deine Erkenntnisse",
          showAllResponses: true,
          sections: [
            {
              title: "Mein Muster",
              responseKey: "my_pattern",
              fromBite: "what-poisons-conflict",
            },
            {
              title: "Partner's Muster",
              responseKey: "partner_pattern",
              fromBite: "what-poisons-conflict",
            },
            {
              title: "Was ich mitnehme",
              responseKey: "key_insight",
              fromBite: "your-conflict-style",
            },
            {
              title: "Was ich versuchen möchte",
              responseKey: "personal_commitment",
              fromBite: "your-conflict-style",
            },
          ],
          text: "Das sind deine Erkenntnisse.\n\nDu kannst jederzeit hierher zurückkommen.",
        },
        {
          id: "5-E4",
          type: "exercise",
          exerciseType: "completion",
          title: "Geschafft!",
          emoji: "💚",
          text: "Du hast diese Serie abgeschlossen.\n\nDas zeigt, dass dir eure Beziehung wichtig ist. Das allein ist schon viel wert.\n\nUnd wenn es mal nicht klappt: Das gehört dazu. Was zählt ist, dass ihr es immer wieder versucht.",
          showBadge: true,
        },
      ],
    },
  ],
};

// Helper to get bite by ID
export function getBiteById(biteId) {
  return HEALTHY_CONFLICT_SERIES.bites.find(b => b.id === biteId);
}

// Helper to get next bite
export function getNextBite(currentBiteId) {
  const currentBite = getBiteById(currentBiteId);
  if (!currentBite) return null;
  return HEALTHY_CONFLICT_SERIES.bites.find(b => b.order === currentBite.order + 1);
}

// Helper to count screens in a bite
export function getScreenCount(biteId) {
  const bite = getBiteById(biteId);
  return bite ? bite.screens.length : 0;
}

// Export for index
export default HEALTHY_CONFLICT_SERIES;
