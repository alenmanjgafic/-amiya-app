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
 * Concept: Magnifying glass over message bubbles with pattern detection
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
        <linearGradient id={`analysis-lens-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.mint} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c.lavender} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Message bubbles in background */}
      <rect x="25" y="25" width="50" height="28" rx="14" fill={c.surface} opacity={opacity.med} />
      <rect x="30" y="30" width="40" height="18" rx="9" fill={c.lavender} opacity={opacity.low} />

      <rect x="125" y="65" width="55" height="28" rx="14" fill={c.surface} opacity={opacity.med} />
      <rect x="130" y="70" width="45" height="18" rx="9" fill={c.rose} opacity={opacity.low} />

      <rect x="35" y="70" width="45" height="24" rx="12" fill={c.surface} opacity={opacity.med} />
      <rect x="40" y="75" width="35" height="14" rx="7" fill={c.mint} opacity={opacity.low} />

      {/* Magnifying glass */}
      <circle cx="110" cy="50" r="32" fill={`url(#analysis-lens-${id})`} />
      <circle cx="110" cy="50" r="32" stroke={`url(#analysis-gradient-${id})`} strokeWidth="3" fill="none" opacity={opacity.high} />
      <circle cx="110" cy="50" r="28" stroke={c.lavender} strokeWidth="1" fill="none" opacity={opacity.med} />

      {/* Handle */}
      <path d="M132 72 L155 95" stroke={`url(#analysis-gradient-${id})`} strokeWidth="6" strokeLinecap="round" opacity={opacity.high} />
      <path d="M132 72 L155 95" stroke={c.sky} strokeWidth="3" strokeLinecap="round" opacity={opacity.med} />

      {/* Pattern lines inside lens */}
      <path d="M92 42 L128 42" stroke={c.mint} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />
      <path d="M95 50 L125 50" stroke={c.lavender} strokeWidth="2" strokeLinecap="round" opacity={opacity.high} />
      <path d="M98 58 L122 58" stroke={c.mint} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />

      {/* Insight sparkles */}
      <circle cx="90" cy="35" r="3" fill={c.mint} opacity={opacity.high} />
      <circle cx="130" cy="38" r="2" fill={c.lavender} opacity={opacity.med} />
      <circle cx="95" cy="65" r="2" fill={c.sky} opacity={opacity.med} />
    </svg>
  );
};

/**
 * NACHRICHTENWRITER (Message Writer / Worte finden)
 * Concept: Pen/pencil writing on a message with flowing creative energy
 */
export const MessageWriterIllustration = ({ isDarkMode = true }) => {
  const c = isDarkMode ? colors.dark : colors.light;
  const opacity = isDarkMode ? { high: 0.8, med: 0.5, low: 0.3 } : { high: 0.7, med: 0.4, low: 0.2 };
  const id = isDarkMode ? 'dark' : 'light';

  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`writer-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.rose} />
          <stop offset="100%" stopColor={c.lavender} />
        </linearGradient>
        <linearGradient id={`writer-paper-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDarkMode ? c.text : '#fff'} stopOpacity="0.1" />
          <stop offset="100%" stopColor={isDarkMode ? c.text : '#fff'} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Paper/message base */}
      <rect x="30" y="25" width="100" height="75" rx="12" fill={c.surface} opacity={opacity.med} />
      <rect x="35" y="30" width="90" height="65" rx="8" fill={`url(#writer-paper-${id})`} />

      {/* Text lines */}
      <path d="M45 45 L95 45" stroke={c.lavender} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />
      <path d="M45 55 L110 55" stroke={c.mint} strokeWidth="2" strokeLinecap="round" opacity={opacity.high} />
      <path d="M45 65 L85 65" stroke={c.lavender} strokeWidth="2" strokeLinecap="round" opacity={opacity.med} />
      <path d="M45 75 L100 75" stroke={c.rose} strokeWidth="2" strokeLinecap="round" opacity={opacity.low} />

      {/* Pen */}
      <path d="M140 30 L160 75" stroke={`url(#writer-gradient-${id})`} strokeWidth="8" strokeLinecap="round" opacity={opacity.high} />
      <path d="M140 30 L160 75" stroke={c.rose} strokeWidth="4" strokeLinecap="round" opacity={opacity.med} />
      <circle cx="160" cy="75" r="4" fill={c.rose} opacity={opacity.high} />

      {/* Creative flow / ink trail */}
      <path d="M155 70 Q165 60 160 50 T170 35" stroke={c.lavender} strokeWidth="2" fill="none" opacity={opacity.med} strokeLinecap="round" />
      <path d="M158 72 Q175 65 168 55" stroke={c.mint} strokeWidth="1.5" fill="none" opacity={opacity.low} strokeLinecap="round" />

      {/* Sparkles / creativity particles */}
      <circle cx="170" cy="30" r="4" fill={c.mint} opacity={opacity.high} />
      <circle cx="175" cy="45" r="3" fill={c.lavender} opacity={opacity.med} />
      <circle cx="180" cy="60" r="2" fill={c.rose} opacity={opacity.med} />
      <circle cx="150" cy="20" r="3" fill={c.sky} opacity={opacity.low} />

      {/* Message send indicator */}
      <circle cx="25" cy="100" r="8" fill={c.mint} opacity={opacity.low} />
      <path d="M22 100 L25 103 L30 97" stroke={isDarkMode ? c.text : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={opacity.high} />
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

export default {
  SoloSessionIllustration,
  CoupleSessionIllustration,
  MessageAnalysisIllustration,
  MessageWriterIllustration,
  CoupleAgreementsIllustration,
};
