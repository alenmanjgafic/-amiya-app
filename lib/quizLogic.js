/**
 * BEZIEHUNGSKOMPASS QUIZ LOGIC
 * lib/quizLogic.js
 *
 * 24 questions measuring 4 dimensions:
 * - Nähe (N): Need for emotional connection
 * - Autonomie (A): Need for independence
 * - Intensität (I): Need for passion and excitement
 * - Sicherheit (S): Need for stability
 */

// ════════════════════════════════════════════════════════════
// QUESTIONS
// ════════════════════════════════════════════════════════════

export const QUIZ_QUESTIONS = [
  // Nähe (N) - 6 questions
  { id: "N1", dimension: "naehe", inverted: false,
    text: "Tiefe Gespräche über Gefühle und Gedanken sind für mich das Herzstück einer guten Beziehung." },
  { id: "N2", dimension: "naehe", inverted: false,
    text: "Ich fühle mich am wohlsten, wenn ich meinem Partner / meiner Partnerin alles erzählen kann – auch die schwierigen Dinge." },
  { id: "N3", dimension: "naehe", inverted: false,
    text: "Wenn mein Partner / meine Partnerin emotional verschlossen wirkt, beschäftigt mich das stark." },
  { id: "N4", dimension: "naehe", inverted: true,
    text: "Ich brauche nicht ständig emotionale Gespräche – mir reicht es zu wissen, dass wir füreinander da sind." },
  { id: "N5", dimension: "naehe", inverted: false,
    text: "Ich wünsche mir, dass mein Partner / meine Partnerin meine innersten Gedanken und Ängste kennt." },
  { id: "N6", dimension: "naehe", inverted: false,
    text: "Körperliche Nähe wie Umarmungen und Berührungen sind mir im Alltag sehr wichtig." },

  // Autonomie (A) - 6 questions
  { id: "A1", dimension: "autonomie", inverted: false,
    text: "Auch in einer glücklichen Beziehung brauche ich regelmässig Zeit nur für mich." },
  { id: "A2", dimension: "autonomie", inverted: false,
    text: "Ich finde es wichtig, dass beide Partner eigene Freundschaften und Hobbys pflegen." },
  { id: "A3", dimension: "autonomie", inverted: false,
    text: "Wenn mein Partner / meine Partnerin viel Nähe einfordert, fühle ich mich manchmal eingeengt." },
  { id: "A4", dimension: "autonomie", inverted: true,
    text: "Am liebsten würde ich fast alles gemeinsam mit meinem Partner / meiner Partnerin machen." },
  { id: "A5", dimension: "autonomie", inverted: false,
    text: "Ich brauche meinen eigenen Raum – physisch und mental – um mich wohlzufühlen." },
  { id: "A6", dimension: "autonomie", inverted: false,
    text: "Es ist mir wichtig, auch in der Beziehung meine eigene Identität zu bewahren." },

  // Intensität (I) - 6 questions
  { id: "I1", dimension: "intensitaet", inverted: false,
    text: "Leidenschaft und Knistern sind für mich unverzichtbar in einer Beziehung." },
  { id: "I2", dimension: "intensitaet", inverted: false,
    text: "Ich liebe Überraschungen, spontane Dates und Momente, die sich besonders anfühlen." },
  { id: "I3", dimension: "intensitaet", inverted: true,
    text: "Mir ist ein ruhiger, harmonischer Alltag wichtiger als aufregende Höhepunkte." },
  { id: "I4", dimension: "intensitaet", inverted: false,
    text: "Wenn in der Beziehung zu lange nichts Aufregendes passiert, werde ich unruhig." },
  { id: "I5", dimension: "intensitaet", inverted: false,
    text: "Ich diskutiere lieber leidenschaftlich als dass wir Konflikte unter den Teppich kehren." },
  { id: "I6", dimension: "intensitaet", inverted: false,
    text: "Ich finde es wichtig, dass die romantische Spannung auch nach Jahren erhalten bleibt." },

  // Sicherheit (S) - 6 questions
  { id: "S1", dimension: "sicherheit", inverted: false,
    text: "Ich fühle mich am wohlsten, wenn ich genau weiss, woran ich bei meinem Partner / meiner Partnerin bin." },
  { id: "S2", dimension: "sicherheit", inverted: false,
    text: "Verlässlichkeit und Beständigkeit sind mir wichtiger als Aufregung." },
  { id: "S3", dimension: "sicherheit", inverted: false,
    text: "Wenn Pläne kurzfristig geändert werden, stresst mich das." },
  { id: "S4", dimension: "sicherheit", inverted: false,
    text: "Rituale und Routinen geben unserer Beziehung Halt." },
  { id: "S5", dimension: "sicherheit", inverted: true,
    text: "Ich bin spontan und kann mich schnell auf neue Situationen einstellen." },
  { id: "S6", dimension: "sicherheit", inverted: false,
    text: "Unausgesprochene Dinge oder Unklarheiten in der Beziehung belasten mich stark." },
];

// Randomized order for quiz (alternating dimensions)
export const QUESTION_ORDER = [
  "N1", "A1", "I1", "S1",
  "N2", "A2", "I2", "S2",
  "N3", "A3", "I3", "S3",
  "N4", "A4", "I4", "S4",
  "N5", "A5", "I5", "S5",
  "N6", "A6", "I6", "S6",
];

// Get questions in quiz order
export function getOrderedQuestions() {
  return QUESTION_ORDER.map(id => QUIZ_QUESTIONS.find(q => q.id === id));
}

// ════════════════════════════════════════════════════════════
// SCORING
// ════════════════════════════════════════════════════════════

/**
 * Calculate quiz scores from answers
 * @param {Object} answers - Object with question IDs as keys, values 1-7
 * @returns {Object} - Raw scores, normalized scores, and types
 */
export function calculateScores(answers) {
  // Invert negative items (8 - answer)
  const processedAnswers = {};
  QUIZ_QUESTIONS.forEach(q => {
    processedAnswers[q.id] = q.inverted ? (8 - answers[q.id]) : answers[q.id];
  });

  // Calculate raw scores (sum per dimension)
  const rawScores = {
    naehe: processedAnswers.N1 + processedAnswers.N2 + processedAnswers.N3 +
           processedAnswers.N4 + processedAnswers.N5 + processedAnswers.N6,
    autonomie: processedAnswers.A1 + processedAnswers.A2 + processedAnswers.A3 +
               processedAnswers.A4 + processedAnswers.A5 + processedAnswers.A6,
    intensitaet: processedAnswers.I1 + processedAnswers.I2 + processedAnswers.I3 +
                 processedAnswers.I4 + processedAnswers.I5 + processedAnswers.I6,
    sicherheit: processedAnswers.S1 + processedAnswers.S2 + processedAnswers.S3 +
                processedAnswers.S4 + processedAnswers.S5 + processedAnswers.S6,
  };

  // Normalize to 0-100 scale
  // Min per dimension: 6 (6×1), Max: 42 (6×7)
  const normalize = (score) => Math.round(((score - 6) / 36) * 100);

  const normalizedScores = {
    naehe: normalize(rawScores.naehe),
    autonomie: normalize(rawScores.autonomie),
    intensitaet: normalize(rawScores.intensitaet),
    sicherheit: normalize(rawScores.sicherheit),
  };

  const primaryType = determinePrimaryType(normalizedScores);
  const secondaryType = determineSecondaryType(normalizedScores, primaryType);

  return {
    raw: rawScores,
    normalized: normalizedScores,
    primaryType,
    secondaryType,
  };
}

/**
 * Determine primary relationship type from scores
 */
function determinePrimaryType(scores) {
  const { naehe, autonomie, intensitaet, sicherheit } = scores;

  // Sort dimensions by score
  const sorted = [
    { dim: "naehe", score: naehe },
    { dim: "autonomie", score: autonomie },
    { dim: "intensitaet", score: intensitaet },
    { dim: "sicherheit", score: sicherheit },
  ].sort((a, b) => b.score - a.score);

  const top1 = sorted[0].dim;
  const top2 = sorted[1].dim;
  const top1Score = sorted[0].score;
  const top2Score = sorted[1].score;

  // If all relatively balanced (range < 20)
  const range = sorted[0].score - sorted[3].score;
  if (range < 20) {
    return "wanderer"; // Balanced
  }

  // If top 2 very close (< 10 difference) → combination type
  if (top1Score - top2Score < 10) {
    return getComboType(top1, top2);
  }

  // Otherwise: dominant single type
  return getSingleType(top1);
}

function getSingleType(dimension) {
  const types = {
    naehe: "verbinder",
    autonomie: "entdecker",
    intensitaet: "liebende",
    sicherheit: "beschuetzer",
  };
  return types[dimension];
}

function getComboType(dim1, dim2) {
  // Sort alphabetically for consistent mapping
  const combo = [dim1, dim2].sort().join("_");

  const comboTypes = {
    autonomie_naehe: "weise",           // Closeness AND space → wisdom
    intensitaet_naehe: "kuenstler",     // Emotionally intense → creative expression
    naehe_sicherheit: "heiler",         // Secure connection → nurturing
    autonomie_intensitaet: "rebell",    // Free-spirited & passionate
    autonomie_sicherheit: "denker",     // Stable & independent → reflective
    intensitaet_sicherheit: "krieger",  // Steady passion → strength
  };

  return comboTypes[combo] || "wanderer";
}

function determineSecondaryType(scores, primaryType) {
  const sorted = [
    { dim: "naehe", score: scores.naehe },
    { dim: "autonomie", score: scores.autonomie },
    { dim: "intensitaet", score: scores.intensitaet },
    { dim: "sicherheit", score: scores.sicherheit },
  ].sort((a, b) => b.score - a.score);

  // If primary is a combo/balanced type, no secondary
  const comboTypes = ["weise", "kuenstler", "heiler", "rebell", "denker", "krieger", "wanderer"];
  if (comboTypes.includes(primaryType)) {
    return null;
  }

  // Otherwise, secondary is the second highest single type
  return getSingleType(sorted[1].dim);
}

// ════════════════════════════════════════════════════════════
// DIMENSION DEFINITIONS
// ════════════════════════════════════════════════════════════

export const DIMENSIONS = {
  naehe: {
    key: "naehe",
    icon: "Heart",
    name: "Nähe",
    color: "lavender",
    description: "Dein Bedürfnis nach emotionaler Verbundenheit, tiefen Gesprächen und dem Gefühl, wirklich gekannt zu werden.",
    highDescription: "Du sehnst dich nach tiefer emotionaler Verbindung. Gespräche über Gefühle, gemeinsame Verletzlichkeit und das Teilen von Innerem sind dir sehr wichtig.",
    lowDescription: "Du brauchst weniger emotionale Intensität im Alltag. Das bedeutet nicht, dass du keine Nähe willst – du drückst Verbundenheit vielleicht anders aus.",
    midDescription: "Du schätzt emotionale Nähe, aber in einem ausgewogenen Mass. Du kannst sowohl tiefe Gespräche als auch entspannte Distanz geniessen.",
  },
  autonomie: {
    key: "autonomie",
    icon: "Wind",
    name: "Autonomie",
    color: "sky",
    description: "Dein Bedürfnis nach eigenem Raum, Unabhängigkeit und einer eigenen Identität innerhalb der Beziehung.",
    highDescription: "Eigenständigkeit ist dir heilig. Du brauchst Zeit für dich, eigene Projekte und die Freiheit, du selbst zu sein – auch in einer engen Beziehung.",
    lowDescription: "Du fühlst dich in enger Verbundenheit wohl und brauchst weniger alleine-Zeit. Gemeinsame Aktivitäten geben dir Energie statt sie zu rauben.",
    midDescription: "Du findest eine gute Balance zwischen Zweisamkeit und Eigenzeit. Beides hat seinen Platz in deinem Leben.",
  },
  intensitaet: {
    key: "intensitaet",
    icon: "Flame",
    name: "Intensität",
    color: "rose",
    description: "Dein Bedürfnis nach Leidenschaft, Aufregung und emotionaler Lebendigkeit in der Beziehung.",
    highDescription: "Du liebst das Knistern! Leidenschaft, Überraschungen und emotionale Höhepunkte halten für dich die Beziehung lebendig.",
    lowDescription: "Du bevorzugst ruhige Beständigkeit. Für dich liegt die Schönheit in den leisen Momenten und der verlässlichen Alltäglichkeit.",
    midDescription: "Du geniesst sowohl aufregende Momente als auch ruhige Phasen. Abwechslung ist schön, aber kein Muss.",
  },
  sicherheit: {
    key: "sicherheit",
    icon: "Shield",
    name: "Sicherheit",
    color: "mint",
    description: "Dein Bedürfnis nach Stabilität, Verlässlichkeit und dem Gefühl zu wissen, woran du bist.",
    highDescription: "Vorhersehbarkeit gibt dir Halt. Du fühlst dich am wohlsten, wenn du weisst was kommt und dich auf Absprachen verlassen kannst.",
    lowDescription: "Du bist flexibel und spontan. Ungewissheit stresst dich weniger als andere – du nimmst Dinge wie sie kommen.",
    midDescription: "Du schätzt eine gewisse Struktur, bist aber auch offen für Spontaneität. Beides hat seinen Platz.",
  },
};

/**
 * Get score interpretation based on value
 */
export function getScoreLevel(score) {
  if (score <= 30) return { level: "low", label: "Weniger ausgeprägt" };
  if (score <= 60) return { level: "mid", label: "Moderat" };
  return { level: "high", label: "Stark ausgeprägt" };
}

/**
 * Get dimension info by key
 */
export function getDimensionInfo(dimensionKey) {
  return DIMENSIONS[dimensionKey] || null;
}

// ════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════

export const RELATIONSHIP_TYPES = {
  verbinder: {
    name: "Der Verbinder",
    shortFormula: "Lass mich ganz nah ran",
    color: "lavender",
    description: "Du sehnst dich nach tiefer emotionaler Verbindung. Für dich ist eine Beziehung dann erfüllend, wenn ihr wirklich füreinander da seid – nicht nur physisch, sondern emotional.",
    coreNeed: "Emotionale Intimität und das Gefühl, wirklich gekannt zu werden.",
    strengths: [
      "Du schaffst echte emotionale Tiefe",
      "Du bist aufmerksam für die Gefühle deines Partners",
      "Du bist bereit, dich verletzlich zu zeigen",
      "Du merkst schnell, wenn etwas nicht stimmt",
    ],
    challenges: [
      "Du kannst dich zurückgewiesen fühlen, wenn dein Partner Raum braucht",
      "Du interpretierst Distanz manchmal als Zeichen fehlender Liebe",
      "Du hast hohe Erwartungen an emotionale Verfügbarkeit",
    ],
    conflictNeeds: [
      "Bestätigung, dass die Beziehung nicht in Gefahr ist",
      "Emotionale Präsenz, nicht nur Lösungen",
      "Das Gefühl, gehört und verstanden zu werden",
    ],
    partnerNote: "Wenn ich viel rede oder nachfrage, ist das keine Kritik – ich will einfach verbunden bleiben. Sag mir, dass du da bist, auch wenn du gerade Raum brauchst.",
    tips: [
      "Übe Selbstberuhigung, bevor du Nähe einforderst",
      "Kommuniziere Bedürfnisse statt Vorwürfe",
      "Respektiere unterschiedliche Nähe-Bedürfnisse",
    ],
  },

  entdecker: {
    name: "Der Entdecker",
    shortFormula: "Liebe mich, aber lass mich fliegen",
    color: "mint",
    description: "Du liebst tief, aber du brauchst auch deinen Freiraum. Für dich bedeutet eine gute Beziehung, dass ihr euch gegenseitig bereichert, ohne euch einzuengen.",
    coreNeed: "Autonomie und das Vertrauen, dass Liebe nicht bedeutet, sich selbst aufzugeben.",
    strengths: [
      "Du bringst Leichtigkeit und Unabhängigkeit ein",
      "Du erstickst deinen Partner nicht mit Erwartungen",
      "Du hast ein eigenes Leben, das die Beziehung bereichert",
      "Du bist selbstreflektiert und eigenverantwortlich",
    ],
    challenges: [
      "Du kannst distanziert oder desinteressiert wirken",
      "Du ziehst dich bei Stress zurück statt dich anzunähern",
      "Du hast Mühe, Verletzlichkeit zu zeigen",
    ],
    conflictNeeds: [
      "Zeit zum Nachdenken bevor du reagierst",
      "Keine Verfolgung oder Druck",
      "Die Sicherheit, dass dein Raum-Bedürfnis akzeptiert wird",
    ],
    partnerNote: "Wenn ich mich zurückziehe, heisst das nicht, dass ich dich nicht liebe. Ich brauche manchmal Zeit für mich, um dann wieder ganz für uns da sein zu können.",
    tips: [
      "Kommuniziere deinen Rückzug aktiv",
      "Plane bewusste Nähe-Momente ein",
      "Übe kleine Verletzlichkeiten zu zeigen",
    ],
  },

  liebende: {
    name: "Die Liebende",
    shortFormula: "Halt die Flamme am Brennen",
    color: "rose",
    description: "Du brauchst Leidenschaft und Intensität. Eine Beziehung ohne Feuer fühlt sich für dich leblos an. Du liebst es, wenn es knistert und Emotionen spürbar sind.",
    coreNeed: "Lebendigkeit – das Gefühl, dass eure Liebe lebt und nicht nur existiert.",
    strengths: [
      "Du bringst Energie, Aufregung und Leidenschaft ein",
      "Du kämpfst für die Beziehung statt aufzugeben",
      "Du überraschst und hältst die Dinge interessant",
      "Du sprichst Probleme an statt sie zu ignorieren",
    ],
    challenges: [
      "Du verwechselst Ruhe manchmal mit Stillstand",
      "Du kannst Drama erzeugen, um dich lebendig zu fühlen",
      "Deine Intensität kann deinen Partner überfordern",
    ],
    conflictNeeds: [
      "Engagement – zeig mir, dass es dir wichtig ist",
      "Emotionale Ehrlichkeit, auch wenn es weh tut",
      "Das Gefühl, dass wir zusammen kämpfen",
    ],
    partnerNote: "Wenn ich intensiv reagiere, heisst das, dass mir die Sache wichtig ist. Ich brauche keine Perfektion, aber ich brauche das Gefühl, dass du emotional investiert bist.",
    tips: [
      "Unterscheide Intensität von Intimität",
      "Plane positive Intensität statt auf Konflikte zu warten",
      "Lerne die Schönheit von Ruhe schätzen",
    ],
  },

  beschuetzer: {
    name: "Der Beschützer",
    shortFormula: "Gib mir Boden unter den Füssen",
    color: "lavender",
    description: "Du brauchst Stabilität und Verlässlichkeit. Das Gefühl zu wissen, woran du bist, ist für dich die Basis von allem. Du liebst Rituale und Beständigkeit.",
    coreNeed: "Sicherheit – die Gewissheit, dass eure Beziehung auf solidem Fundament steht.",
    strengths: [
      "Du bist verlässlich wie ein Fels",
      "Du gibst Stabilität und Geborgenheit",
      "Du hältst Versprechen und Absprachen",
      "Du überstehst Stürme ohne die Nerven zu verlieren",
    ],
    challenges: [
      "Veränderungen verunsichern dich",
      "Du kannst Spontaneität als Bedrohung empfinden",
      "Du hältst manchmal an Routinen fest, die nicht mehr dienen",
    ],
    conflictNeeds: [
      "Die Versicherung, dass die Beziehung sicher ist",
      "Struktur im Gespräch – eines nach dem anderen",
      "Klare nächste Schritte und Lösungen",
    ],
    partnerNote: "Mein Bedürfnis nach Klarheit ist kein Kontrollzwang – ich fühle mich einfach besser, wenn ich weiss, woran ich bin. Kleine Verlässlichkeiten bedeuten mir mehr als grosse Gesten.",
    tips: [
      "Übe bewusste Spontaneität",
      "Kommuniziere Unsicherheiten offen",
      "Vertraue auf eure gemeinsame Geschichte",
    ],
  },

  weise: {
    name: "Der Weise",
    shortFormula: "Verbunden, aber eigenständig",
    color: "mint",
    dimensions: ["naehe", "autonomie"],
    description: "Du hast das seltene Talent, tiefe Nähe und gesunde Eigenständigkeit gleichzeitig zu leben. Du strahlst Wärme aus und bist ein sicherer Hafen, aber du stehst auch fest auf deinem eigenen Fundament.",
    coreNeed: "Balance zwischen tiefer Verbundenheit und persönlichem Raum.",
    strengths: [
      "Du verstehst, dass Liebe nicht Verschmelzung bedeutet",
      "Du kannst Raum geben ohne dich abzuwenden",
      "Du suchst Nähe ohne zu klammern",
      "Du balancierst Bedürfnisse intuitiv",
    ],
    challenges: [
      "Du wirkst manchmal widersprüchlich",
      "Partner können verwirrt sein über das, was du brauchst",
      "Du hast hohe Ansprüche: Du willst beides richtig",
    ],
    conflictNeeds: [
      "Emotionale Verbindung UND Raum zum Nachdenken",
      "Keine Ultimaten – lass mir Zeit zu verarbeiten",
      "Bestätigung dass Raum-Nehmen nicht Ablehnung bedeutet",
    ],
    partnerNote: "Ich brauche beides: Nähe und Raum. Das ist kein Widerspruch, sondern mein Rhythmus. Wenn ich mich zurückziehe, komme ich auch wieder.",
    tips: [
      "Kommuniziere deinen Rhythmus offen",
      "Plane sowohl Nähe-Rituale als auch Eigenzeit ein",
      "Sei geduldig mit Partnern, die anders ticken",
    ],
  },

  kuenstler: {
    name: "Der Künstler",
    shortFormula: "Alles oder nichts",
    color: "rose",
    dimensions: ["naehe", "intensitaet"],
    description: "Du liebst mit vollem Einsatz. Deine Gefühle sind stark, deine Bindungen tief. Du willst nicht nur dabei sein – du willst alles fühlen, alles teilen, alles erleben.",
    coreNeed: "Tiefe emotionale Verbindung mit voller Intensität.",
    strengths: [
      "Du schaffst unvergessliche emotionale Erlebnisse",
      "Wer dich liebt, fühlt sich zutiefst gesehen",
      "Du gibst alles in der Beziehung",
      "Du bist leidenschaftlich und engagiert",
    ],
    challenges: [
      "Deine Intensität kann Partner überwältigen",
      "Du nimmst Dinge sehr persönlich",
      "Konflikte eskalieren schnell",
    ],
    conflictNeeds: [
      "Volle emotionale Präsenz – zeig mir dass es dir wichtig ist",
      "Keine Ablenkungen oder Verharmlosungen",
      "Ehrlichkeit, auch wenn es weh tut",
    ],
    partnerNote: "Meine Intensität ist Ausdruck meiner Liebe. Wenn ich laut werde, kämpfe ich FÜR uns, nicht gegen dich. Bleib bei mir, auch wenn es stürmisch wird.",
    tips: [
      "Lerne Selbstregulation – atme bevor du reagierst",
      "Suche Partner die Tiefe als Geschenk sehen",
      "Kanalisiere Intensität positiv",
    ],
  },

  heiler: {
    name: "Der Heiler",
    shortFormula: "Sicher geborgen, tief verbunden",
    color: "mint",
    dimensions: ["naehe", "sicherheit"],
    description: "Du sehnst dich nach einer Liebe, die sich wie Heimkommen anfühlt. Du willst deinen Partner wirklich kennen und von ihm gekannt werden – in einem stabilen, verlässlichen Rahmen.",
    coreNeed: "Tiefe Verbundenheit auf einem sicheren Fundament.",
    strengths: [
      "Du baust tiefe, beständige Verbindungen",
      "Partner fühlen sich bei dir sicher und geliebt",
      "Du bist loyal und gibst nicht schnell auf",
      "Du schaffst emotionale Geborgenheit",
    ],
    challenges: [
      "Du kannst zu abhängig von der Beziehung werden",
      "Veränderungen oder Distanz verunsichern dich stark",
      "Du vermeidest manchmal Konflikte für die Harmonie",
    ],
    conflictNeeds: [
      "Beruhigung dass die Beziehung nicht in Gefahr ist",
      "Körperliche Nähe während schwieriger Gespräche",
      "Klare Aussagen statt vager Andeutungen",
    ],
    partnerNote: "Mein Bedürfnis nach Sicherheit bedeutet nicht, dass ich dir nicht vertraue. Ich brauche einfach ab und zu die Bestätigung, dass wir okay sind.",
    tips: [
      "Baue eigene Sicherheitsquellen auf",
      "Sprich über Ängste statt still zu hoffen",
      "Akzeptiere Veränderung als Teil von Wachstum",
    ],
  },

  rebell: {
    name: "Der Rebell",
    shortFormula: "Frei und leidenschaftlich",
    color: "rose",
    dimensions: ["autonomie", "intensitaet"],
    description: "Du bist ein Freigeist mit Feuer. Du brauchst sowohl deinen Raum als auch intensive Erlebnisse. Du willst die Welt entdecken – am liebsten mit einem Partner, der das teilt.",
    coreNeed: "Freiheit UND Leidenschaft – beides ohne Kompromisse.",
    strengths: [
      "Du bringst Abenteuer und Aufregung ein",
      "Du bist unabhängig und leidenschaftlich zugleich",
      "Du inspirierst andere mit deiner Energie",
      "Du hältst die Beziehung spannend",
    ],
    challenges: [
      "Du wirkst manchmal ungreifbar",
      "Routine langweilt dich schnell",
      "Du brauchst einen Partner der mithalten kann",
    ],
    conflictNeeds: [
      "Freiheit während des Konflikts – kein Festhalten",
      "Kurze intensive Klärung statt langer Diskussionen",
      "Danach wieder Leichtigkeit – nicht ewig nachtragen",
    ],
    partnerNote: "Ich brauche Luft zum Atmen, auch in Konflikten. Lass mich kurz gehen und ich komme wieder. Dann können wir mit frischer Energie klären.",
    tips: [
      "Finde einen Partner der Freiheit schätzt",
      "Teile deine Abenteuer – Intensität verbindet",
      "Lerne dass Stabilität kein Gefängnis ist",
    ],
  },

  denker: {
    name: "Der Denker",
    shortFormula: "Stabil und eigenständig",
    color: "lavender",
    dimensions: ["autonomie", "sicherheit"],
    description: "Du bist wie ein Berg: Fest, verlässlich und standhaft. Du brauchst deinen eigenen Raum, aber du gibst auch Sicherheit. Deine Ruhe ist deine Stärke.",
    coreNeed: "Stabilität ohne Einengung – Sicherheit mit Freiraum.",
    strengths: [
      "Du bist extrem verlässlich",
      "Du behältst in Krisen einen kühlen Kopf",
      "Du gibst Sicherheit ohne zu klammern",
      "Du bist selbstständig und stabil",
    ],
    challenges: [
      "Du wirkst manchmal emotional unnahbar",
      "Du zeigst Gefühle nicht leicht",
      "Partner wünschen sich manchmal mehr Wärme",
    ],
    conflictNeeds: [
      "Zeit zum Nachdenken bevor du antwortest",
      "Sachliche Struktur – eines nach dem anderen",
      "Keine emotionalen Überwältigungen",
    ],
    partnerNote: "Meine Ruhe ist keine Gleichgültigkeit. Ich verarbeite intern und brauche Zeit. Gib mir Raum und ich komme mit einer durchdachten Antwort zurück.",
    tips: [
      "Zeige aktiv dass du da bist",
      "Teile auch mal deine Gefühle",
      "Balance Stabilität mit Wärme",
    ],
  },

  krieger: {
    name: "Der Krieger",
    shortFormula: "Beständige Leidenschaft",
    color: "rose",
    dimensions: ["intensitaet", "sicherheit"],
    description: "Du brennst – aber mit einer stabilen, tiefen Flamme. Du willst Leidenschaft, aber in einem sicheren Rahmen. Dein Feuer ist beständig, nicht flackernd.",
    coreNeed: "Leidenschaft die bleibt – Intensität mit Verlässlichkeit.",
    strengths: [
      "Du hältst die Flamme dauerhaft am Brennen",
      "Du bist leidenschaftlich UND verlässlich",
      "Du baust tiefe, beständige Intimität",
      "Du gibst Sicherheit ohne langweilig zu sein",
    ],
    challenges: [
      "Du erwartest viel – Feuer UND Stabilität",
      "Nicht jeder kann beides bieten",
      "Du wirst ungeduldig wenn eines fehlt",
    ],
    conflictNeeds: [
      "Engagement und Leidenschaft – zeig dass es dir wichtig ist",
      "Aber auch: klare nächste Schritte und Lösungen",
      "Versöhnung mit Intensität – nicht nur sachlich abhaken",
    ],
    partnerNote: "Ich brauche beides: Das Feuer des Moments UND die Sicherheit, dass wir es lösen werden. Zeig mir Leidenschaft beim Klären, nicht nur kühle Logik.",
    tips: [
      "Erkenne dass Intensität sich wandeln darf",
      "Schätze ruhige Glut genauso wie Flammen",
      "Kommuniziere beide Bedürfnisse klar",
    ],
  },

  wanderer: {
    name: "Der Wanderer",
    shortFormula: "Flexibel und ausgewogen",
    color: "lavender",
    description: "Du hast eine bemerkenswerte Balance. Du kannst Nähe geniessen ohne zu klammern, Freiraum geben ohne dich abzuwenden, Intensität erleben ohne Drama zu brauchen.",
    coreNeed: "Harmonie und Ausgewogenheit in allen Bereichen.",
    strengths: [
      "Du kannst mit fast jedem Typ gut umgehen",
      "Du verstehst verschiedene Perspektiven",
      "Du findest Kompromisse wo andere scheitern",
      "Du bist anpassungsfähig und flexibel",
    ],
    challenges: [
      "Du kannst deine eigenen Bedürfnisse vernachlässigen",
      "Partner wissen manchmal nicht was du brauchst",
      "Du übernimmst zu viel emotionale Arbeit",
    ],
    conflictNeeds: [
      "Fairness – beide Seiten sollten gehört werden",
      "Keine Extreme – weder totale Distanz noch Überflutung",
      "Raum um deine eigene Position zu finden",
    ],
    partnerNote: "Ich bin gut im Vermitteln, aber vergiss nicht nach mir zu fragen. Manchmal weiss ich selbst nicht sofort, was ich brauche – gib mir Zeit es herauszufinden.",
    tips: [
      "Finde deine nicht-verhandelbaren Bedürfnisse",
      "Kommuniziere proaktiv was du brauchst",
      "Achte auf Erschöpfung durch zu viel Anpassung",
    ],
  },
};

// ════════════════════════════════════════════════════════════
// PAIR DYNAMICS
// ════════════════════════════════════════════════════════════

/**
 * Analyze dynamics between two partners
 */
export function analyzePairDynamic(partner1Scores, partner2Scores) {
  const dynamics = [];

  // Nähe difference
  const naeheDiff = Math.abs(partner1Scores.naehe - partner2Scores.naehe);
  if (naeheDiff > 30) {
    dynamics.push({
      type: "tension",
      area: "naehe",
      title: "Unterschiedliche Nähe-Bedürfnisse",
      description: `Einer von euch sucht mehr emotionale Nähe als der andere.`,
      tip: "Plant bewusst Nähe-Rituale UND Raum-Zeiten ein.",
    });
  }

  // Autonomie difference
  const autonomieDiff = Math.abs(partner1Scores.autonomie - partner2Scores.autonomie);
  if (autonomieDiff > 30) {
    dynamics.push({
      type: "tension",
      area: "autonomie",
      title: "Unterschiedliche Raum-Bedürfnisse",
      description: "Unterschiedliche Bedürfnisse nach Eigenständigkeit können zu Verfolger-Distanzierer-Dynamiken führen.",
      tip: "Sprecht offen: Wieviel gemeinsame vs. eigene Zeit braucht jeder?",
    });
  }

  // Intensität difference
  const intensitaetDiff = Math.abs(partner1Scores.intensitaet - partner2Scores.intensitaet);
  if (intensitaetDiff > 30) {
    dynamics.push({
      type: "tension",
      area: "intensitaet",
      title: "Unterschiedliche Intensitäts-Level",
      description: "Einer von euch braucht mehr Aufregung und Leidenschaft.",
      tip: "Findet Aktivitäten die für beide stimulierend sind.",
    });
  }

  // Sicherheit difference
  const sicherheitDiff = Math.abs(partner1Scores.sicherheit - partner2Scores.sicherheit);
  if (sicherheitDiff > 30) {
    dynamics.push({
      type: "tension",
      area: "sicherheit",
      title: "Unterschiedliche Stabilitäts-Bedürfnisse",
      description: "Einer braucht mehr Vorhersehbarkeit und Struktur.",
      tip: "Findet Kompromisse zwischen Routine und Spontaneität.",
    });
  }

  // Complementary strengths
  if (dynamics.length === 0) {
    dynamics.push({
      type: "strength",
      area: "balance",
      title: "Gut ausbalanciert",
      description: "Eure Bedürfnisse sind relativ ähnlich – das kann Harmonie fördern.",
      tip: "Nutzt eure Ähnlichkeit als Basis und wagt auch mal Unterschiede.",
    });
  }

  return dynamics;
}

// ════════════════════════════════════════════════════════════
// TYPE AFFINITY
// ════════════════════════════════════════════════════════════

/**
 * Calculate how well a user's scores match each relationship type
 * Returns array sorted by affinity (highest first)
 */
export function calculateTypeAffinities(normalizedScores) {
  const { naehe, autonomie, intensitaet, sicherheit } = normalizedScores;

  // Define ideal profiles for each type (which dimensions should be high)
  const typeProfiles = {
    verbinder: { naehe: 1, autonomie: 0, intensitaet: 0.3, sicherheit: 0.3 },
    entdecker: { naehe: 0, autonomie: 1, intensitaet: 0.3, sicherheit: 0.3 },
    liebende: { naehe: 0.3, autonomie: 0.3, intensitaet: 1, sicherheit: 0 },
    beschuetzer: { naehe: 0.3, autonomie: 0, intensitaet: 0, sicherheit: 1 },
    weise: { naehe: 0.8, autonomie: 0.8, intensitaet: 0.2, sicherheit: 0.2 },
    kuenstler: { naehe: 0.8, autonomie: 0.2, intensitaet: 0.8, sicherheit: 0.2 },
    heiler: { naehe: 0.8, autonomie: 0.2, intensitaet: 0.2, sicherheit: 0.8 },
    rebell: { naehe: 0.2, autonomie: 0.8, intensitaet: 0.8, sicherheit: 0.2 },
    denker: { naehe: 0.2, autonomie: 0.8, intensitaet: 0.2, sicherheit: 0.8 },
    krieger: { naehe: 0.2, autonomie: 0.2, intensitaet: 0.8, sicherheit: 0.8 },
    wanderer: { naehe: 0.5, autonomie: 0.5, intensitaet: 0.5, sicherheit: 0.5 },
  };

  const affinities = Object.entries(typeProfiles).map(([typeKey, profile]) => {
    // Calculate weighted match score
    const userProfile = {
      naehe: naehe / 100,
      autonomie: autonomie / 100,
      intensitaet: intensitaet / 100,
      sicherheit: sicherheit / 100,
    };

    // Calculate similarity (inverse of distance)
    let similarity = 0;
    let totalWeight = 0;

    Object.keys(profile).forEach(dim => {
      const weight = profile[dim] > 0.5 ? 2 : 1; // Weight high-priority dimensions more
      const diff = Math.abs(userProfile[dim] - profile[dim]);
      similarity += (1 - diff) * weight;
      totalWeight += weight;
    });

    const affinity = Math.round((similarity / totalWeight) * 100);

    return {
      typeKey,
      affinity,
      typeInfo: RELATIONSHIP_TYPES[typeKey],
    };
  });

  // Sort by affinity descending
  return affinities.sort((a, b) => b.affinity - a.affinity);
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

/**
 * Get type info by type key
 */
export function getTypeInfo(typeKey) {
  return RELATIONSHIP_TYPES[typeKey] || null;
}

/**
 * Validate answers object
 */
export function validateAnswers(answers) {
  const requiredIds = QUIZ_QUESTIONS.map(q => q.id);

  for (const id of requiredIds) {
    if (answers[id] === undefined || answers[id] === null) {
      return { valid: false, missing: id };
    }
    if (answers[id] < 1 || answers[id] > 7) {
      return { valid: false, invalid: id };
    }
  }

  return { valid: true };
}

/**
 * Format results for storage
 */
export function formatResultsForStorage(answers) {
  const validation = validateAnswers(answers);
  if (!validation.valid) {
    throw new Error(`Invalid answers: ${JSON.stringify(validation)}`);
  }

  const scores = calculateScores(answers);

  return {
    version: "1.0",
    completedAt: new Date().toISOString(),
    answers,
    scores: {
      raw: scores.raw,
      normalized: scores.normalized,
    },
    primaryType: scores.primaryType,
    secondaryType: scores.secondaryType,
  };
}
