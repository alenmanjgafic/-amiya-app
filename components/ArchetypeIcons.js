/**
 * ARCHETYPE ICONS - components/ArchetypeIcons.js
 * Custom Aurora-style SVG icons for relationship archetypes
 */

const COLORS = {
  rose: '#db2777',
  lavender: '#7c3aed',
  mint: '#0d9488',
};

export const ARCHETYPE_COLORS = {
  verbinder: { primary: COLORS.lavender, secondary: COLORS.rose },
  entdecker: { primary: COLORS.mint, secondary: COLORS.lavender },
  liebende: { primary: COLORS.rose, secondary: COLORS.lavender },
  beschuetzer: { primary: COLORS.lavender, secondary: COLORS.mint },
  weise: { primary: COLORS.mint, secondary: COLORS.rose },
  kuenstler: { primary: COLORS.rose, secondary: COLORS.mint },
  heiler: { primary: COLORS.mint, secondary: COLORS.lavender },
  rebell: { primary: COLORS.rose, secondary: COLORS.lavender },
  denker: { primary: COLORS.lavender, secondary: COLORS.mint },
  krieger: { primary: COLORS.rose, secondary: COLORS.mint },
  wanderer: { primary: COLORS.lavender, secondary: COLORS.rose },
};

export const VerbinderIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.verbinder;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="verbinder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <circle cx="18" cy="24" r="12" stroke="url(#verbinder-grad)" strokeWidth="2.5" fill="none" />
      <circle cx="30" cy="24" r="12" stroke="url(#verbinder-grad)" strokeWidth="2.5" fill="none" />
      <ellipse cx="24" cy="24" rx="4" ry="8" fill="url(#verbinder-grad)" opacity="0.3" />
    </svg>
  );
};

export const EntdeckerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.entdecker;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="entdecker-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="14" stroke="url(#entdecker-grad)" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="3" fill="url(#entdecker-grad)" />
      <path d="M24 10 L24 6 M24 6 L21 9 M24 6 L27 9" stroke="url(#entdecker-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 24 L42 24" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M6 24 L10 24" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};

export const LiebendeIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.liebende;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="liebende-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M24 40 C24 40 8 28 8 18 C8 12 13 8 19 8 C22 8 24 10 24 10 C24 10 26 8 29 8 C35 8 40 12 40 18 C40 28 24 40 24 40Z" stroke="url(#liebende-grad)" strokeWidth="2.5" fill="none" />
      <path d="M24 32 C24 32 19 26 19 22 C19 19 21 18 24 21 C27 18 29 19 29 22 C29 26 24 32 24 32Z" fill="url(#liebende-grad)" opacity="0.6" />
    </svg>
  );
};

export const BeschuetzerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.beschuetzer;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="beschuetzer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M24 6 L38 12 L38 24 C38 32 32 38 24 42 C16 38 10 32 10 24 L10 12 L24 6Z" stroke="url(#beschuetzer-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M17 22 C17 22 20 26 24 26 C28 26 31 22 31 22" stroke="url(#beschuetzer-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="18" r="3" fill="url(#beschuetzer-grad)" opacity="0.4" />
    </svg>
  );
};

export const WeiseIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.weise;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="weise-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M6 24 C6 24 14 12 24 12 C34 12 42 24 42 24 C42 24 34 36 24 36 C14 36 6 24 6 24Z" stroke="url(#weise-grad)" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="7" stroke="url(#weise-grad)" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="3" fill="url(#weise-grad)" />
      <path d="M24 4 L24 8" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M32 8 L30 11" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M16 8 L18 11" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
};

export const KuenstlerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.kuenstler;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="kuenstler-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M24 24 C24 24 24 20 28 20 C32 20 32 24 32 24 C32 28 28 32 24 32 C18 32 14 28 14 24 C14 18 18 12 24 12 C32 12 38 18 38 24 C38 32 32 40 24 40" stroke="url(#kuenstler-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2" fill="url(#kuenstler-grad)" />
    </svg>
  );
};

export const HeilerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.heiler;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="heiler-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M10 38 C10 38 8 28 14 20 C18 14 24 14 24 14" stroke="url(#heiler-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M38 38 C38 38 40 28 34 20 C30 14 24 14 24 14" stroke="url(#heiler-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M24 14 L24 8" stroke="url(#heiler-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="6" r="2" fill="url(#heiler-grad)" opacity="0.6" />
      <circle cx="24" cy="26" r="4" fill="url(#heiler-grad)" opacity="0.3" />
    </svg>
  );
};

export const RebellIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.rebell;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="rebell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M28 6 L18 22 L24 22 L20 42 L32 24 L26 24 L28 6Z" stroke="url(#rebell-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <circle cx="38" cy="14" r="2" fill={c.primary} opacity="0.6" />
      <circle cx="10" cy="20" r="1.5" fill={c.secondary} opacity="0.5" />
      <circle cx="36" cy="34" r="1.5" fill={c.primary} opacity="0.4" />
    </svg>
  );
};

export const DenkerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.denker;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="denker-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" stroke="url(#denker-grad)" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="9" stroke="url(#denker-grad)" strokeWidth="1.5" fill="none" opacity="0.5" />
      <circle cx="24" cy="24" r="4" fill="url(#denker-grad)" />
      <path d="M24 4 L24 6" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M24 42 L24 44" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M4 24 L6 24" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M42 24 L44 24" stroke={c.primary} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
};

export const KriegerIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.krieger;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="krieger-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      <path d="M24 6 L38 38 L24 32 L10 38 L24 6Z" stroke="url(#krieger-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M24 14 L24 26" stroke="url(#krieger-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="24" cy="32" r="2" fill="url(#krieger-grad)" opacity="0.6" />
    </svg>
  );
};

export const WandererIcon = ({ size = 48 }) => {
  const c = ARCHETYPE_COLORS.wanderer;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="wanderer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="50%" stopColor={c.secondary} />
          <stop offset="100%" stopColor={c.primary} />
        </linearGradient>
      </defs>
      <path d="M14 24 C14 18 8 18 8 24 C8 30 14 30 18 26 C22 22 26 22 30 26 C34 30 40 30 40 24 C40 18 34 18 30 22 C26 26 22 26 18 22 C14 18 14 24 14 24" stroke="url(#wanderer-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="24" r="2" fill={c.primary} opacity="0.5" />
      <circle cx="40" cy="24" r="2" fill={c.primary} opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill={c.secondary} opacity="0.7" />
    </svg>
  );
};

// Map archetype keys to icon components
export const ArchetypeIconMap = {
  verbinder: VerbinderIcon,
  entdecker: EntdeckerIcon,
  liebende: LiebendeIcon,
  beschuetzer: BeschuetzerIcon,
  weise: WeiseIcon,
  kuenstler: KuenstlerIcon,
  heiler: HeilerIcon,
  rebell: RebellIcon,
  denker: DenkerIcon,
  krieger: KriegerIcon,
  wanderer: WandererIcon,
};

// Helper to get icon component by archetype key
export function getArchetypeIcon(archetypeKey) {
  return ArchetypeIconMap[archetypeKey] || null;
}
