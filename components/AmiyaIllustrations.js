/**
 * AMIYA AURORA ILLUSTRATIONS
 * components/AmiyaIllustrations.js
 *
 * Banner illustrations for features in both Dark and Light mode
 * Style: Abstract, geometric, gradient-based
 *
 * Features:
 * 1. Solo Session - Personal reflection, single person journey
 * 2. Couple Session - Two people connecting, dialogue
 * 3. Nachrichtenanalyse - Message analysis, magnifying glass, patterns
 * 4. NachrichtenWriter - Writing, composing, pen/message
 * 5. Couple Agreements - Handshake, contract, commitment
 */

import React from 'react';

// Color tokens for both themes
const colors = {
  dark: {
    mint: '#7dd3c0',
    lavender: '#a78bfa',
    rose: '#f9a8d4',
    sky: '#7dd3fc',
    surface: '#2d323b',
    text: '#f4f4f5',
  },
  light: {
    mint: '#0d9488',
    lavender: '#7c3aed',
    rose: '#db2777',
    sky: '#0284c7',
    surface: '#f5f5f4',
    text: '#1c1917',
  },
};

/**
 * SOLO SESSION
 * Concept: Single glowing orb with radiating waves - personal journey, self-reflection
 */
export const SoloSessionIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`solo-gradient-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.mint} />
          <stop offset="100%" stopColor={c.lavender} />
        </linearGradient>
        <radialGradient id={`solo-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.mint} stopOpacity={opacity.med} />
          <stop offset="100%" stopColor={c.mint} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="60" r="55" fill={`url(#solo-glow-${id})`} />

      {/* Radiating rings */}
      <circle cx="100" cy="60" r="45" stroke={c.mint} strokeWidth="1" fill="none" opacity={opacity.low} />
      <circle cx="100" cy="60" r="35" stroke={c.mint} strokeWidth="1.5" fill="none" opacity={opacity.med} />
      <circle cx="100" cy="60" r="25" stroke={c.lavender} strokeWidth="2" fill="none" opacity={opacity.med} />

      {/* Central orb */}
      <circle cx="100" cy="60" r="16" fill={`url(#solo-gradient-${id})`} opacity={opacity.high} />
      <circle cx="100" cy="60" r="8" fill={isDarkMode ? c.text : '#fff'} opacity="0.9" />

      {/* Floating particles */}
      <circle cx="65" cy="40" r="4" fill={c.lavender} opacity={opacity.med} />
      <circle cx="140" cy="45" r="3" fill={c.mint} opacity={opacity.med} />
      <circle cx="130" cy="85" r="5" fill={c.rose} opacity={opacity.low} />
      <circle cx="60" cy="80" r="3" fill={c.sky} opacity={opacity.low} />

      {/* Sound waves / breathing lines */}
      <path d="M55 60 Q60 50 65 60 T75 60" stroke={c.mint} strokeWidth="2" fill="none" opacity={opacity.med} strokeLinecap="round" />
      <path d="M125 60 Q130 70 135 60 T145 60" stroke={c.lavender} strokeWidth="2" fill="none" opacity={opacity.med} strokeLinecap="round" />
    </svg>
  );
};

/**
 * COUPLE SESSION
 * Concept: Two orbs merging/connecting with shared energy between them
 */
export const CoupleSessionIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`couple-left-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.mint} />
          <stop offset="100%" stopColor={c.sky} />
        </linearGradient>
        <linearGradient id={`couple-right-${id}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c.rose} />
          <stop offset="100%" stopColor={c.lavender} />
        </linearGradient>
        <linearGradient id={`couple-center-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.mint} stopOpacity={opacity.med} />
          <stop offset="50%" stopColor={c.lavender} stopOpacity={opacity.high} />
          <stop offset="100%" stopColor={c.rose} stopOpacity={opacity.med} />
        </linearGradient>
      </defs>

      {/* Connection beam */}
      <ellipse cx="100" cy="60" rx="35" ry="12" fill={`url(#couple-center-${id})`} opacity={opacity.med} />

      {/* Left person orb */}
      <circle cx="55" cy="60" r="28" fill={`url(#couple-left-${id})`} opacity={opacity.low} />
      <circle cx="55" cy="60" r="20" fill={`url(#couple-left-${id})`} opacity={opacity.med} />
      <circle cx="55" cy="60" r="12" fill={`url(#couple-left-${id})`} opacity={opacity.high} />

      {/* Right person orb */}
      <circle cx="145" cy="60" r="28" fill={`url(#couple-right-${id})`} opacity={opacity.low} />
      <circle cx="145" cy="60" r="20" fill={`url(#couple-right-${id})`} opacity={opacity.med} />
      <circle cx="145" cy="60" r="12" fill={`url(#couple-right-${id})`} opacity={opacity.high} />

      {/* Center heart/connection point */}
      <circle cx="100" cy="60" r="8" fill={c.lavender} opacity={opacity.high} />
      <circle cx="100" cy="60" r="4" fill={isDarkMode ? c.text : '#fff'} opacity="0.9" />

      {/* Energy particles between */}
      <circle cx="75" cy="55" r="3" fill={c.mint} opacity={opacity.med} />
      <circle cx="85" cy="65" r="2" fill={c.lavender} opacity={opacity.med} />
      <circle cx="115" cy="55" r="2" fill={c.lavender} opacity={opacity.med} />
      <circle cx="125" cy="65" r="3" fill={c.rose} opacity={opacity.med} />

      {/* Outer decorative elements */}
      <circle cx="30" cy="40" r="4" fill={c.sky} opacity={opacity.low} />
      <circle cx="170" cy="40" r="4" fill={c.rose} opacity={opacity.low} />
      <circle cx="35" cy="85" r="3" fill={c.mint} opacity={opacity.low} />
      <circle cx="165" cy="85" r="3" fill={c.lavender} opacity={opacity.low} />
    </svg>
  );
};

/**
 * NACHRICHTENANALYSE (Message Analysis)
 * Concept: Abstract - two message shapes with insight rays between them
 * Minimal style matching Solo/Couple
 */
export const MessageAnalysisIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`analysis-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.lavender} />
          <stop offset="100%" stopColor={c.sky} />
        </linearGradient>
        <radialGradient id={`analysis-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.lavender} stopOpacity={opacity.med} />
          <stop offset="100%" stopColor={c.lavender} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central glow */}
      <circle cx="100" cy="60" r="50" fill={`url(#analysis-glow-${id})`} />

      {/* Left message bubble - abstract rounded shape */}
      <ellipse cx="60" cy="55" rx="28" ry="22" fill={c.lavender} opacity={opacity.low} />
      <ellipse cx="60" cy="55" rx="20" ry="16" fill={c.lavender} opacity={opacity.med} />
      <ellipse cx="60" cy="55" rx="10" ry="8" fill={c.lavender} opacity={opacity.high} />

      {/* Right message bubble */}
      <ellipse cx="140" cy="65" rx="28" ry="22" fill={c.sky} opacity={opacity.low} />
      <ellipse cx="140" cy="65" rx="20" ry="16" fill={c.sky} opacity={opacity.med} />
      <ellipse cx="140" cy="65" rx="10" ry="8" fill={c.sky} opacity={opacity.high} />

      {/* Insight connection - the "analysis" happening */}
      <circle cx="100" cy="60" r="12" fill={`url(#analysis-gradient-${id})`} opacity={opacity.high} />
      <circle cx="100" cy="60" r="6" fill={isDarkMode ? c.text : '#fff'} opacity="0.9" />

      {/* Connection lines */}
      <path d="M75 55 L88 58" stroke={c.lavender} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />
      <path d="M112 62 L125 65" stroke={c.sky} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />

      {/* Floating insight particles */}
      <circle cx="100" cy="35" r="4" fill={c.mint} opacity={opacity.med} />
      <circle cx="85" cy="85" r="3" fill={c.lavender} opacity={opacity.low} />
      <circle cx="115" cy="40" r="3" fill={c.rose} opacity={opacity.low} />
    </svg>
  );
};

/**
 * NACHRICHTENWRITER (Message Writer / Worte finden)
 * Concept: Abstract - flowing energy forming into a message shape
 * Minimal style matching Solo/Couple
 */
export const MessageWriterIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`writer-gradient-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.rose} />
          <stop offset="100%" stopColor={c.lavender} />
        </linearGradient>
        <radialGradient id={`writer-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.rose} stopOpacity={opacity.med} />
          <stop offset="100%" stopColor={c.rose} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central glow */}
      <circle cx="100" cy="60" r="50" fill={`url(#writer-glow-${id})`} />

      {/* Forming message - abstract rounded rectangle emerging */}
      <rect x="65" y="40" width="70" height="45" rx="22" fill={c.rose} opacity={opacity.low} />
      <rect x="75" y="48" width="50" height="30" rx="15" fill={c.rose} opacity={opacity.med} />

      {/* Core / origin point - where words come from */}
      <circle cx="100" cy="63" r="14" fill={`url(#writer-gradient-${id})`} opacity={opacity.high} />
      <circle cx="100" cy="63" r="7" fill={isDarkMode ? c.text : '#fff'} opacity="0.9" />

      {/* Creative flow lines - energy becoming words */}
      <path d="M55 60 Q65 45 80 55" stroke={c.lavender} strokeWidth="2" fill="none" opacity={opacity.med} strokeLinecap="round" />
      <path d="M145 60 Q135 75 120 65" stroke={c.lavender} strokeWidth="2" fill="none" opacity={opacity.med} strokeLinecap="round" />

      {/* Floating particles - inspiration */}
      <circle cx="50" cy="45" r="4" fill={c.lavender} opacity={opacity.med} />
      <circle cx="150" cy="50" r="4" fill={c.mint} opacity={opacity.med} />
      <circle cx="60" cy="85" r="3" fill={c.sky} opacity={opacity.low} />
      <circle cx="140" cy="80" r="3" fill={c.rose} opacity={opacity.low} />
    </svg>
  );
};

/**
 * COUPLE AGREEMENTS
 * Concept: Two hands meeting / interlinked rings / contract with heart seal
 */
export const CoupleAgreementsIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`agree-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.mint} />
          <stop offset="50%" stopColor={c.lavender} />
          <stop offset="100%" stopColor={c.rose} />
        </linearGradient>
        <linearGradient id={`agree-ring1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.mint} />
          <stop offset="100%" stopColor={c.sky} />
        </linearGradient>
        <linearGradient id={`agree-ring2-${id}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c.rose} />
          <stop offset="100%" stopColor={c.lavender} />
        </linearGradient>
      </defs>

      {/* Document/contract base */}
      <rect x="55" y="20" width="90" height="85" rx="8" fill={c.surface} opacity={opacity.med} />
      <rect x="60" y="25" width="80" height="75" rx="6" fill={isDarkMode ? c.text : '#fff'} opacity="0.05" />

      {/* Contract lines */}
      <path d="M70 40 L130 40" stroke={c.lavender} strokeWidth="1.5" strokeLinecap="round" opacity={opacity.low} />
      <path d="M70 50 L125 50" stroke={c.lavender} strokeWidth="1.5" strokeLinecap="round" opacity={opacity.low} />
      <path d="M70 60 L120 60" stroke={c.lavender} strokeWidth="1.5" strokeLinecap="round" opacity={opacity.low} />

      {/* Interlinked rings - symbol of agreement */}
      <circle cx="85" cy="80" r="16" stroke={`url(#agree-ring1-${id})`} strokeWidth="3" fill="none" opacity={opacity.high} />
      <circle cx="115" cy="80" r="16" stroke={`url(#agree-ring2-${id})`} strokeWidth="3" fill="none" opacity={opacity.high} />

      {/* Overlap highlight */}
      <ellipse cx="100" cy="80" rx="8" ry="12" fill={c.lavender} opacity={opacity.low} />

      {/* Heart seal at top */}
      <circle cx="100" cy="25" r="12" fill={`url(#agree-gradient-${id})`} opacity={opacity.med} />
      <path d="M95 23 Q95 19 100 23 Q105 19 105 23 Q105 28 100 32 Q95 28 95 23Z" fill={isDarkMode ? c.text : '#fff'} opacity={opacity.high} />

      {/* Decorative elements */}
      <circle cx="35" cy="35" r="5" fill={c.mint} opacity={opacity.low} />
      <circle cx="165" cy="35" r="5" fill={c.rose} opacity={opacity.low} />
      <circle cx="30" cy="90" r="4" fill={c.lavender} opacity={opacity.low} />
      <circle cx="170" cy="90" r="4" fill={c.sky} opacity={opacity.low} />

      {/* Checkmarks for completed agreements */}
      <circle cx="150" cy="42" r="6" fill={c.mint} opacity={opacity.med} />
      <path d="M147 42 L149 44 L153 40" stroke={isDarkMode ? c.text : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="150" cy="55" r="6" fill={c.mint} opacity={opacity.med} />
      <path d="M147 55 L149 57 L153 53" stroke={isDarkMode ? c.text : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * BEZIEHUNGSKOMPASS (Relationship Compass)
 * Concept: 4 dimension orbs arranged in compass pattern
 * - Top: Nähe (Lavender)
 * - Right: Intensität (Rose)
 * - Bottom: Sicherheit (Mint)
 * - Left: Autonomie (Sky)
 * - Center: User core with radiating connections
 */
export const CompassIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`compass-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.lavender} />
          <stop offset="50%" stopColor={c.rose} />
          <stop offset="100%" stopColor={c.mint} />
        </linearGradient>
        <radialGradient id={`compass-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.lavender} stopOpacity={opacity.med} />
          <stop offset="100%" stopColor={c.lavender} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Central glow */}
      <circle cx="100" cy="60" r="50" fill={`url(#compass-glow-${id})`} />

      {/* Connection lines between dimensions */}
      <path d="M100 25 L100 95" stroke={c.lavender} strokeWidth="1" opacity={opacity.low} />
      <path d="M55 60 L145 60" stroke={c.sky} strokeWidth="1" opacity={opacity.low} />
      <path d="M70 35 L130 85" stroke={c.rose} strokeWidth="1" opacity={opacity.low} />
      <path d="M130 35 L70 85" stroke={c.mint} strokeWidth="1" opacity={opacity.low} />

      {/* Top: Nähe (Lavender) */}
      <circle cx="100" cy="22" r="16" fill={c.lavender} opacity={opacity.low} />
      <circle cx="100" cy="22" r="11" fill={c.lavender} opacity={opacity.med} />
      <circle cx="100" cy="22" r="6" fill={c.lavender} opacity={opacity.high} />

      {/* Right: Intensität (Rose) */}
      <circle cx="148" cy="60" r="16" fill={c.rose} opacity={opacity.low} />
      <circle cx="148" cy="60" r="11" fill={c.rose} opacity={opacity.med} />
      <circle cx="148" cy="60" r="6" fill={c.rose} opacity={opacity.high} />

      {/* Bottom: Sicherheit (Mint) */}
      <circle cx="100" cy="98" r="16" fill={c.mint} opacity={opacity.low} />
      <circle cx="100" cy="98" r="11" fill={c.mint} opacity={opacity.med} />
      <circle cx="100" cy="98" r="6" fill={c.mint} opacity={opacity.high} />

      {/* Left: Autonomie (Sky) */}
      <circle cx="52" cy="60" r="16" fill={c.sky} opacity={opacity.low} />
      <circle cx="52" cy="60" r="11" fill={c.sky} opacity={opacity.med} />
      <circle cx="52" cy="60" r="6" fill={c.sky} opacity={opacity.high} />

      {/* Center: User core */}
      <circle cx="100" cy="60" r="14" fill={`url(#compass-gradient-${id})`} opacity={opacity.high} />
      <circle cx="100" cy="60" r="7" fill={isDarkMode ? c.text : '#fff'} opacity="0.9" />

      {/* Floating particles - representing balance */}
      <circle cx="75" cy="40" r="3" fill={c.lavender} opacity={opacity.med} />
      <circle cx="125" cy="40" r="3" fill={c.rose} opacity={opacity.med} />
      <circle cx="75" cy="80" r="3" fill={c.sky} opacity={opacity.med} />
      <circle cx="125" cy="80" r="3" fill={c.mint} opacity={opacity.med} />
    </svg>
  );
};

export default {
  SoloSessionIllustration,
  CoupleSessionIllustration,
  MessageAnalysisIllustration,
  MessageWriterIllustration,
  CoupleAgreementsIllustration,
  CompassIllustration,
};
