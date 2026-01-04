/**
 * THEME CONTEXT - lib/ThemeContext.js
 * Global theme management with Light/Dark mode support
 * Design System: Amiya Aurora
 *
 * USAGE:
 * const { tokens } = useTheme();
 * <button style={tokens.buttons.primary}>Click me</button>
 * <input style={tokens.inputs.text} />
 * <div style={tokens.cards.elevated}>Content</div>
 */
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

// ============================================================================
// BASE COLOR DEFINITIONS
// ============================================================================

const lightColors = {
  bg: {
    deep: '#fafaf9',
    elevated: '#ffffff',
    surface: '#f5f5f4',
    soft: '#e7e5e4',
  },
  aurora: {
    mint: '#0d9488',
    lavender: '#7c3aed',
    rose: '#db2777',
    sky: '#0284c7',
  },
  text: {
    primary: '#1c1917',
    secondary: '#57534e',
    muted: '#a8a29e',
    accent: '#0d9488',
  },
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
};

const darkColors = {
  bg: {
    deep: '#1a1d23',
    elevated: '#252931',
    surface: '#2d323b',
    soft: '#363c47',
  },
  aurora: {
    mint: '#7dd3c0',
    lavender: '#a78bfa',
    rose: '#f9a8d4',
    sky: '#7dd3fc',
  },
  text: {
    primary: '#f4f4f5',
    secondary: '#a1a1aa',
    muted: '#71717a',
    accent: '#7dd3c0',
  },
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};

// ============================================================================
// SHARED TOKENS (same for both themes)
// ============================================================================

const sharedTokens = {
  fonts: {
    display: "'DM Serif Display', Georgia, serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    pill: '100px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};

// ============================================================================
// BUILD THEME-SPECIFIC TOKENS
// ============================================================================

function buildTokens(colors, isDark) {
  // Gradients
  const gradients = {
    primary: `linear-gradient(135deg, ${colors.aurora.mint}, ${colors.aurora.lavender})`,
    primaryHorizontal: `linear-gradient(90deg, ${colors.aurora.mint}, ${colors.aurora.lavender})`,
    speaking: `linear-gradient(135deg, ${colors.aurora.lavender}, ${colors.aurora.rose})`,
    thinking: `linear-gradient(135deg, #f59e0b, #d97706)`,
    connecting: `linear-gradient(135deg, #6b7280, #4b5563)`,
    success: `linear-gradient(135deg, ${colors.success}, #059669)`,
  };

  // Shadows
  const shadows = {
    soft: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
    medium: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
    large: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.12)',
    glow: (color) => isDark
      ? `0 0 40px ${color}30, 0 0 80px ${color}15`
      : `0 0 60px ${color}15`,
    button: isDark
      ? `0 0 30px ${colors.aurora.mint}30`
      : `0 4px 20px ${colors.aurora.mint}20`,
  };

  // Button Styles
  const buttons = {
    // Primary CTA Button (mint → lavender gradient)
    primary: {
      padding: '16px 24px',
      background: gradients.primary,
      color: 'white',
      border: 'none',
      borderRadius: sharedTokens.radii.md,
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `transform ${sharedTokens.transitions.normal}, box-shadow ${sharedTokens.transitions.normal}`,
      boxShadow: shadows.button,
    },
    primarySmall: {
      padding: '10px 16px',
      background: gradients.primary,
      color: 'white',
      border: 'none',
      borderRadius: sharedTokens.radii.sm,
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `all ${sharedTokens.transitions.normal}`,
    },
    primaryLarge: {
      padding: '18px 32px',
      background: gradients.primary,
      color: 'white',
      border: 'none',
      borderRadius: sharedTokens.radii.lg,
      fontSize: '18px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `transform ${sharedTokens.transitions.normal}, box-shadow ${sharedTokens.transitions.normal}`,
      boxShadow: shadows.button,
    },

    // Secondary Button (surface background)
    secondary: {
      padding: '14px 20px',
      background: colors.bg.surface,
      color: colors.text.primary,
      border: 'none',
      borderRadius: sharedTokens.radii.md,
      fontSize: '15px',
      fontWeight: '500',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `all ${sharedTokens.transitions.normal}`,
    },
    secondaryOutline: {
      padding: '14px 20px',
      background: colors.bg.surface,
      color: colors.text.primary,
      border: `2px solid ${colors.bg.soft}`,
      borderRadius: sharedTokens.radii.md,
      fontSize: '15px',
      fontWeight: '500',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `all ${sharedTokens.transitions.normal}`,
    },

    // Ghost Button (transparent, text only)
    ghost: {
      padding: '8px 12px',
      background: 'none',
      color: colors.text.secondary,
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `opacity ${sharedTokens.transitions.fast}`,
    },
    ghostAccent: {
      padding: '8px 12px',
      background: 'none',
      color: colors.aurora.lavender,
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `opacity ${sharedTokens.transitions.fast}`,
    },

    // Danger Button
    danger: {
      padding: '16px 24px',
      background: isDark ? 'rgba(248, 113, 113, 0.15)' : '#fee2e2',
      color: colors.error,
      border: 'none',
      borderRadius: sharedTokens.radii.md,
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `all ${sharedTokens.transitions.normal}`,
    },

    // Toggle Button (for settings)
    toggle: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: isActive ? gradients.primary : colors.bg.surface,
      border: isActive ? 'none' : `2px solid ${colors.bg.soft}`,
      borderRadius: sharedTokens.radii.pill,
      cursor: 'pointer',
      transition: `all ${sharedTokens.transitions.slow}`,
      color: isActive ? '#fff' : colors.text.secondary,
      fontSize: '14px',
      fontWeight: '500',
    }),

    // Tab/Filter Button
    tab: (isActive) => ({
      padding: '8px 16px',
      background: isActive ? colors.text.primary : colors.bg.surface,
      color: isActive ? (isDark ? '#1a1d23' : 'white') : colors.text.muted,
      border: 'none',
      borderRadius: sharedTokens.radii.pill,
      fontSize: '13px',
      cursor: 'pointer',
      fontFamily: sharedTokens.fonts.body,
      transition: `all ${sharedTokens.transitions.normal}`,
    }),

    // Icon Button (close, menu, etc.)
    icon: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: colors.text.muted,
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Navigation Button
    nav: (isActive) => ({
      background: 'none',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
      padding: '8px 16px',
      color: isActive ? colors.aurora.lavender : colors.text.muted,
      fontFamily: sharedTokens.fonts.body,
      fontSize: '11px',
      fontWeight: '500',
    }),
  };

  // Input Styles
  const inputs = {
    text: {
      padding: '14px 16px',
      borderRadius: sharedTokens.radii.md,
      border: `2px solid ${colors.bg.soft}`,
      fontSize: '16px',
      outline: 'none',
      transition: `border-color ${sharedTokens.transitions.normal}`,
      background: colors.bg.surface,
      color: colors.text.primary,
      fontFamily: sharedTokens.fonts.body,
      width: '100%',
      boxSizing: 'border-box',
    },
    textarea: {
      padding: '14px 16px',
      borderRadius: sharedTokens.radii.md,
      border: `2px solid ${colors.bg.soft}`,
      fontSize: '16px',
      minHeight: '100px',
      resize: 'vertical',
      outline: 'none',
      transition: `border-color ${sharedTokens.transitions.normal}`,
      background: colors.bg.surface,
      color: colors.text.primary,
      fontFamily: sharedTokens.fonts.body,
      width: '100%',
      boxSizing: 'border-box',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: '8px',
    },
    hint: {
      fontSize: '13px',
      color: colors.text.muted,
      marginTop: '8px',
    },
    // Selection button (for multi-choice)
    selection: (isSelected) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px',
      background: isSelected
        ? (isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff')
        : colors.bg.surface,
      border: `2px solid ${isSelected ? colors.aurora.lavender : colors.bg.soft}`,
      borderRadius: sharedTokens.radii.md,
      cursor: 'pointer',
      textAlign: 'left',
    }),
  };

  // Card Styles
  const cards = {
    elevated: {
      background: colors.bg.elevated,
      borderRadius: sharedTokens.radii.xl,
      padding: '24px',
      boxShadow: shadows.medium,
      transition: `all ${sharedTokens.transitions.slow}`,
    },
    elevatedLarge: {
      background: colors.bg.elevated,
      borderRadius: sharedTokens.radii.xl,
      padding: '32px',
      boxShadow: shadows.large,
      transition: `all ${sharedTokens.transitions.slow}`,
    },
    surface: {
      background: colors.bg.surface,
      borderRadius: sharedTokens.radii.md,
      padding: '16px',
    },
    interactive: {
      background: colors.bg.elevated,
      borderRadius: sharedTokens.radii.lg,
      padding: '16px',
      boxShadow: shadows.soft,
      cursor: 'pointer',
      transition: `transform ${sharedTokens.transitions.normal}, box-shadow ${sharedTokens.transitions.normal}`,
    },
  };

  // Alert Styles
  const alerts = {
    error: {
      color: colors.error,
      fontSize: '14px',
      background: isDark ? 'rgba(248, 113, 113, 0.1)' : '#fef2f2',
      padding: '12px',
      borderRadius: sharedTokens.radii.sm,
      margin: 0,
    },
    success: {
      color: colors.success,
      fontSize: '14px',
      background: isDark ? 'rgba(52, 211, 153, 0.1)' : '#f0fdf4',
      padding: '12px',
      borderRadius: sharedTokens.radii.sm,
      margin: 0,
    },
    warning: {
      background: isDark ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7',
      borderRadius: sharedTokens.radii.md,
      padding: '16px',
      border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : '#fcd34d'}`,
    },
    warningText: {
      color: isDark ? '#fbbf24' : '#92400e',
    },
    info: {
      background: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
      borderRadius: sharedTokens.radii.md,
      padding: '16px',
    },
    infoText: {
      color: isDark ? colors.aurora.lavender : '#4c1d95',
    },
  };

  // Modal Styles
  const modals = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000,
      overflowY: 'auto',
    },
    container: {
      background: colors.bg.elevated,
      borderRadius: sharedTokens.radii.xl,
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: shadows.large,
      position: 'relative',
    },
    containerSmall: {
      background: colors.bg.elevated,
      borderRadius: sharedTokens.radii.xl,
      padding: '24px',
      maxWidth: '400px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: shadows.large,
      position: 'relative',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    title: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: colors.text.primary,
      margin: 0,
      fontFamily: sharedTokens.fonts.display,
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
  };

  // Badge Styles
  const badges = {
    primary: {
      background: gradients.primary,
      color: 'white',
      fontSize: '11px',
      fontWeight: '600',
      padding: '4px 10px',
      borderRadius: sharedTokens.radii.sm,
    },
    success: {
      color: colors.success,
      background: isDark ? 'rgba(52, 211, 153, 0.15)' : '#d1fae5',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 10px',
      borderRadius: '12px',
    },
    warning: {
      color: isDark ? '#fbbf24' : '#f59e0b',
      background: isDark ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 10px',
      borderRadius: '12px',
    },
    muted: {
      color: colors.text.muted,
      background: colors.bg.surface,
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 10px',
      borderRadius: '12px',
    },
    accent: {
      color: colors.aurora.lavender,
      background: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 10px',
      borderRadius: '12px',
    },
    notification: {
      position: 'absolute',
      top: '-6px',
      right: '-10px',
      background: colors.error,
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold',
      minWidth: '18px',
      height: '18px',
      borderRadius: '9px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px',
    },
    theme: {
      background: isDark
        ? 'rgba(139, 92, 246, 0.2)'
        : 'linear-gradient(135deg, #f3e8ff, #fae8ff)',
      color: colors.aurora.lavender,
      padding: '6px 12px',
      borderRadius: sharedTokens.radii.pill,
      fontSize: '13px',
      fontWeight: '500',
    },
  };

  // Layout Styles
  const layout = {
    page: {
      minHeight: '100vh',
      padding: '20px',
      background: colors.bg.deep,
      transition: `background ${sharedTokens.transitions.slow}`,
    },
    pageCentered: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: colors.bg.deep,
      transition: `background ${sharedTokens.transitions.slow}`,
    },
    container: {
      maxWidth: '500px',
      margin: '0 auto',
    },
    navBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: colors.bg.elevated,
      borderTop: `1px solid ${colors.bg.soft}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0 24px 0',
    },
    header: {
      background: isDark ? 'rgba(37, 41, 49, 0.9)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${colors.bg.soft}`,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    section: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: `1px solid ${colors.bg.soft}`,
    },
    divider: {
      height: '1px',
      background: colors.bg.soft,
      margin: '24px 0',
    },
  };

  // Typography Styles
  const typography = {
    h1: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: colors.text.primary,
      margin: '0 0 8px 0',
      fontFamily: sharedTokens.fonts.display,
    },
    h2: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: colors.text.primary,
      margin: '0 0 12px 0',
      fontFamily: sharedTokens.fonts.display,
    },
    h3: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.text.primary,
      margin: '0 0 8px 0',
      fontFamily: sharedTokens.fonts.display,
    },
    body: {
      fontSize: '15px',
      color: colors.text.secondary,
      lineHeight: '1.6',
      margin: 0,
    },
    small: {
      fontSize: '13px',
      color: colors.text.muted,
      margin: 0,
    },
    label: {
      fontSize: '11px',
      fontWeight: '600',
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      margin: 0,
    },
    accent: {
      color: colors.aurora.lavender,
      fontWeight: '600',
    },
  };

  // Loading/Animation Styles
  const loaders = {
    spinner: (size = 40) => ({
      width: `${size}px`,
      height: `${size}px`,
      border: `4px solid ${colors.bg.soft}`,
      borderTopColor: colors.aurora.lavender,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }),
    pulse: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: gradients.primary,
      animation: 'pulse 2s ease-in-out infinite',
    },
    breathe: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: gradients.thinking,
      animation: 'breathe 1.5s ease-in-out infinite',
    },
  };

  // State indicator styles (for voice sessions)
  const states = {
    listening: {
      background: gradients.primary,
      boxShadow: shadows.glow(colors.aurora.mint),
    },
    speaking: {
      background: gradients.speaking,
      boxShadow: shadows.glow(colors.aurora.lavender),
    },
    thinking: {
      background: gradients.thinking,
      boxShadow: shadows.glow('#f59e0b'),
    },
    connecting: {
      background: gradients.connecting,
      boxShadow: 'none',
    },
    idle: {
      background: gradients.primary,
      boxShadow: 'none',
    },
  };

  // CSS Keyframes (to be injected)
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.7; }
    }
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
  `;

  // Progress bar style
  const progress = {
    track: {
      height: '4px',
      background: colors.bg.soft,
    },
    bar: (percent) => ({
      height: '100%',
      background: gradients.primaryHorizontal,
      width: `${percent}%`,
      transition: `width ${sharedTokens.transitions.slow}`,
    }),
  };

  return {
    // Base
    ...sharedTokens,
    colors,
    shadows,
    gradients,
    isDarkMode: isDark,

    // Components
    buttons,
    inputs,
    cards,
    alerts,
    modals,
    badges,
    layout,
    typography,
    loaders,
    states,
    progress,

    // CSS
    keyframes,
  };
}

// ============================================================================
// LEGACY TOKENS (for backwards compatibility during migration)
// ============================================================================

const lightTokens = {
  colors: lightColors,
  shadows: {
    soft: '0 4px 24px rgba(0,0,0,0.06)',
    medium: '0 8px 32px rgba(0,0,0,0.08)',
    large: '0 12px 48px rgba(0,0,0,0.12)',
    glow: (color) => `0 0 60px ${color}15`,
  },
};

const darkTokens = {
  colors: darkColors,
  shadows: {
    soft: '0 4px 24px rgba(0,0,0,0.3)',
    medium: '0 8px 32px rgba(0,0,0,0.4)',
    large: '0 12px 48px rgba(0,0,0,0.5)',
    glow: (color) => `0 0 40px ${color}20, 0 0 80px ${color}10`,
  },
};

// ============================================================================
// THEME PROVIDER
// ============================================================================

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("amiya-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
    }
    setIsLoaded(true);
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("amiya-theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, isLoaded]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setTheme = (mode) => {
    setIsDarkMode(mode === "dark");
  };

  // Build complete tokens
  const colors = isDarkMode ? darkColors : lightColors;
  const tokens = buildTokens(colors, isDarkMode);

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{
      tokens,
      isDarkMode,
      toggleTheme,
      setTheme,
      // Legacy exports for backwards compatibility
      lightTokens,
      darkTokens,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Export for static usage
export { lightTokens, darkTokens, sharedTokens };
