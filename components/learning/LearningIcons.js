/**
 * LEARNING ICONS - components/learning/LearningIcons.js
 * Custom Aurora-style SVG icons for Entdecken learning module
 */

const COLORS = {
  rose: '#db2777',
  lavender: '#7c3aed',
  mint: '#0d9488',
  gray: '#9ca3af',
};

// =============================================================================
// SERIES ICONS - Large icons for series cards
// =============================================================================

/**
 * Gesunder Konflikt Series Icon
 * Design: Two overlapping speech bubbles with lightning bolt
 */
export const ConflictSeriesIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="conflict-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.lavender} />
        <stop offset="100%" stopColor={COLORS.rose} />
      </linearGradient>
    </defs>
    {/* First speech bubble */}
    <path
      d="M8 14 C8 10 12 8 16 8 L26 8 C30 8 34 10 34 14 L34 22 C34 26 30 28 26 28 L18 28 L12 34 L12 28 L10 28 C8 28 8 26 8 24 L8 14Z"
      stroke="url(#conflict-grad)"
      strokeWidth="2.5"
      fill="none"
    />
    {/* Second speech bubble (offset) */}
    <path
      d="M18 20 C18 17 21 15 24 15 L34 15 C38 15 40 17 40 20 L40 28 C40 31 38 33 34 33 L32 33 L32 38 L27 33 L24 33 C21 33 18 31 18 28 L18 20Z"
      stroke="url(#conflict-grad)"
      strokeWidth="2"
      fill="none"
      opacity="0.7"
    />
    {/* Lightning bolt in center */}
    <path
      d="M25 17 L22 24 L26 24 L23 31"
      stroke="url(#conflict-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/**
 * Verständliche Conversation Series Icon
 * Design: Two connected heads/minds with heart
 */
export const ConversationSeriesIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="conversation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.mint} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    {/* Left head profile */}
    <circle cx="14" cy="18" r="8" stroke="url(#conversation-grad)" strokeWidth="2.5" fill="none" />
    {/* Right head profile */}
    <circle cx="34" cy="18" r="8" stroke="url(#conversation-grad)" strokeWidth="2.5" fill="none" />
    {/* Connection wave */}
    <path
      d="M18 26 C20 32 28 32 30 26"
      stroke="url(#conversation-grad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Heart in center bottom */}
    <path
      d="M24 36 C24 36 20 32 20 30 C20 28 22 27 24 29 C26 27 28 28 28 30 C28 32 24 36 24 36Z"
      fill="url(#conversation-grad)"
      opacity="0.6"
    />
  </svg>
);

/**
 * Feel Closer Series Icon
 * Design: Two circles approaching each other with glow
 */
export const CloserSeriesIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="closer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.rose} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    {/* Left circle */}
    <circle cx="16" cy="24" r="10" stroke="url(#closer-grad)" strokeWidth="2.5" fill="none" />
    {/* Right circle */}
    <circle cx="32" cy="24" r="10" stroke="url(#closer-grad)" strokeWidth="2.5" fill="none" />
    {/* Overlap glow area */}
    <ellipse cx="24" cy="24" rx="4" ry="8" fill="url(#closer-grad)" opacity="0.3" />
    {/* Sparkle dots */}
    <circle cx="24" cy="14" r="1.5" fill={COLORS.rose} opacity="0.6" />
    <circle cx="24" cy="34" r="1.5" fill={COLORS.lavender} opacity="0.6" />
  </svg>
);

// =============================================================================
// NAVIGATION ICON - For bottom nav bar
// =============================================================================

/**
 * Entdecken Navigation Icon
 * Design: Compass with aurora gradient (active state) or gray (inactive)
 */
export const EntdeckenIcon = ({ size = 24, active = false }) => {
  const gradientId = `entdecken-nav-${active ? 'active' : 'inactive'}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? COLORS.lavender : COLORS.gray} />
          <stop offset="100%" stopColor={active ? COLORS.mint : COLORS.gray} />
        </linearGradient>
      </defs>
      {/* Outer compass circle */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
      />
      {/* Compass needle */}
      <path
        d="M12 5 L14 12 L12 19 L10 12 Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Center dot */}
      <circle
        cx="12"
        cy="12"
        r="2"
        fill={active ? COLORS.lavender : COLORS.gray}
      />
      {/* Direction markers */}
      <circle cx="12" cy="3" r="1" fill={active ? COLORS.mint : COLORS.gray} opacity="0.5" />
      <circle cx="21" cy="12" r="1" fill={active ? COLORS.mint : COLORS.gray} opacity="0.5" />
    </svg>
  );
};

// =============================================================================
// STATUS ICONS - For bite cards
// =============================================================================

/**
 * Lock Icon (Locked state)
 */
export const LockIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x="5" y="11" width="14" height="10" rx="2"
      stroke={COLORS.gray}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M8 11 L8 7 C8 4.5 9.5 3 12 3 C14.5 3 16 4.5 16 7 L16 11"
      stroke={COLORS.gray}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1.5" fill={COLORS.gray} />
  </svg>
);

/**
 * Unlock Icon (Available state) with gradient
 */
export const UnlockIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="unlock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.lavender} />
        <stop offset="100%" stopColor={COLORS.mint} />
      </linearGradient>
    </defs>
    <rect
      x="5" y="11" width="14" height="10" rx="2"
      stroke="url(#unlock-grad)"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M8 11 L8 7 C8 4.5 9.5 3 12 3 C14.5 3 16 4.5 16 7 L16 8"
      stroke="url(#unlock-grad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1.5" fill={COLORS.lavender} />
  </svg>
);

/**
 * Check Circle Icon (Completed state) with mint gradient
 */
export const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.mint} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    <circle
      cx="12" cy="12" r="9"
      stroke="url(#check-grad)"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M8 12 L11 15 L16 9"
      stroke="url(#check-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/**
 * Progress Circle Icon (In Progress state) - can be animated
 */
export const ProgressCircleIcon = ({ size = 20, progress = 0.5 }) => {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.lavender} />
          <stop offset="100%" stopColor={COLORS.rose} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle
        cx="12" cy="12" r={radius}
        stroke={COLORS.gray}
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      {/* Progress circle */}
      <circle
        cx="12" cy="12" r={radius}
        stroke="url(#progress-grad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 12 12)"
      />
      {/* Play icon in center */}
      <path
        d="M10 8 L16 12 L10 16 Z"
        fill="url(#progress-grad)"
      />
    </svg>
  );
};

// =============================================================================
// EXERCISE ICONS - For exercises within bites
// =============================================================================

/**
 * Sword Icon (Kritik/Attack pattern)
 */
export const SwordIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="sword-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.rose} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    <path
      d="M4 20 L8 16 M8 16 L6 14 L14 6 L18 4 L16 8 L8 16 Z"
      stroke="url(#sword-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

/**
 * Shield Icon (Verteidigung/Defense pattern)
 */
export const ShieldIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.lavender} />
        <stop offset="100%" stopColor={COLORS.mint} />
      </linearGradient>
    </defs>
    <path
      d="M12 3 L20 6 L20 12 C20 16 16 20 12 22 C8 20 4 16 4 12 L4 6 L12 3Z"
      stroke="url(#shield-grad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 8 L12 14 M9 11 L15 11"
      stroke="url(#shield-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

/**
 * Wall Icon (Mauern/Stonewalling pattern)
 */
export const WallIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="wall-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.gray} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    {/* Brick pattern */}
    <rect x="3" y="4" width="18" height="4" rx="1" stroke="url(#wall-grad)" strokeWidth="1.5" fill="none" />
    <rect x="3" y="10" width="8" height="4" rx="1" stroke="url(#wall-grad)" strokeWidth="1.5" fill="none" />
    <rect x="13" y="10" width="8" height="4" rx="1" stroke="url(#wall-grad)" strokeWidth="1.5" fill="none" />
    <rect x="3" y="16" width="18" height="4" rx="1" stroke="url(#wall-grad)" strokeWidth="1.5" fill="none" />
  </svg>
);

/**
 * Eye Roll Icon (Verachtung/Contempt pattern)
 */
export const EyeRollIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="eyeroll-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.rose} />
        <stop offset="100%" stopColor={COLORS.gray} />
      </linearGradient>
    </defs>
    {/* Eye shape */}
    <path
      d="M2 12 C2 12 6 6 12 6 C18 6 22 12 22 12 C22 12 18 18 12 18 C6 18 2 12 2 12Z"
      stroke="url(#eyeroll-grad)"
      strokeWidth="2"
      fill="none"
    />
    {/* Rolled up pupil */}
    <circle cx="12" cy="10" r="3" fill="url(#eyeroll-grad)" />
  </svg>
);

/**
 * Lightbulb Icon (Insight/Tip)
 */
export const LightbulbIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="bulb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.mint} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    <path
      d="M12 2 C8 2 5 5 5 9 C5 12 7 14 8 15 L8 18 L16 18 L16 15 C17 14 19 12 19 9 C19 5 16 2 12 2Z"
      stroke="url(#bulb-grad)"
      strokeWidth="2"
      fill="none"
    />
    <path d="M9 21 L15 21" stroke="url(#bulb-grad)" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 18 L10 15 M14 18 L14 15" stroke="url(#bulb-grad)" strokeWidth="1.5" opacity="0.5" />
  </svg>
);

/**
 * Heart Hand Icon (Empathy/Compassion)
 */
export const HeartHandIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="hearthand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.rose} />
        <stop offset="100%" stopColor={COLORS.mint} />
      </linearGradient>
    </defs>
    {/* Hand */}
    <path
      d="M4 14 L4 20 L8 20 L8 14"
      stroke="url(#hearthand-grad)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Heart above hand */}
    <path
      d="M12 16 C12 16 8 12 8 9 C8 6 10 5 12 7 C14 5 16 6 16 9 C16 12 12 16 12 16Z"
      stroke="url(#hearthand-grad)"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

// =============================================================================
// CHALLENGE ICON - For challenge section
// =============================================================================

/**
 * Challenge Icon (Flag/Target style for challenges)
 * Design: Flag with star - represents goal/challenge
 */
export const ChallengeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="challenge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.rose} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    {/* Flag pole */}
    <path
      d="M5 3 L5 21"
      stroke="url(#challenge-grad)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Flag */}
    <path
      d="M5 4 L19 7 L5 12 Z"
      stroke="url(#challenge-grad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Star on flag */}
    <path
      d="M11 7.5 L11.5 8.5 L12.5 8.5 L11.75 9.2 L12 10.2 L11 9.6 L10 10.2 L10.25 9.2 L9.5 8.5 L10.5 8.5 Z"
      fill="url(#challenge-grad)"
      opacity="0.8"
    />
  </svg>
);

/**
 * Trophy Icon (For completed challenges)
 */
export const TrophyIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={COLORS.mint} />
        <stop offset="100%" stopColor={COLORS.lavender} />
      </linearGradient>
    </defs>
    {/* Cup body */}
    <path
      d="M8 4 L16 4 L15 12 C15 14 13 16 12 16 C11 16 9 14 9 12 L8 4 Z"
      stroke="url(#trophy-grad)"
      strokeWidth="2"
      fill="none"
    />
    {/* Left handle */}
    <path
      d="M8 6 C6 6 5 7 5 8 C5 10 6 11 8 11"
      stroke="url(#trophy-grad)"
      strokeWidth="2"
      fill="none"
    />
    {/* Right handle */}
    <path
      d="M16 6 C18 6 19 7 19 8 C19 10 18 11 16 11"
      stroke="url(#trophy-grad)"
      strokeWidth="2"
      fill="none"
    />
    {/* Base */}
    <path
      d="M12 16 L12 18 M9 20 L15 20 L15 18 L9 18 L9 20 Z"
      stroke="url(#trophy-grad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// =============================================================================
// MAP ICON EXPORTS
// =============================================================================

export const SeriesIconMap = {
  'healthy-conflict': ConflictSeriesIcon,
  'conversation': ConversationSeriesIcon,
  'feel-closer': CloserSeriesIcon,
};

export const StatusIconMap = {
  locked: LockIcon,
  available: UnlockIcon,
  in_progress: ProgressCircleIcon,
  completed: CheckCircleIcon,
};

export const PatternIconMap = {
  kritik: SwordIcon,
  verteidigung: ShieldIcon,
  mauern: WallIcon,
  verachtung: EyeRollIcon,
};
