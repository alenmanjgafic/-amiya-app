/**
 * THEME CONTEXT - lib/ThemeContext.js
 * Global theme management with Light/Dark mode support
 * Design System: Amiya Aurora
 */
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

// DESIGN TOKENS - Aurora Light Theme
const lightTokens = {
  colors: {
    bg: {
      deep: '#fafaf9',        // Warm white
      elevated: '#ffffff',     // Pure white cards
      surface: '#f5f5f4',      // Subtle gray
      soft: '#e7e5e4',         // Borders
    },
    aurora: {
      mint: '#0d9488',         // Darker for contrast
      lavender: '#7c3aed',     // Deeper purple
      rose: '#db2777',         // Richer pink
      sky: '#0284c7',          // Deeper blue
    },
    text: {
      primary: '#1c1917',      // Near black
      secondary: '#57534e',    // Warm gray
      muted: '#a8a29e',        // Light gray
      accent: '#0d9488',       // Mint accent
    },
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  shadows: {
    soft: '0 4px 24px rgba(0,0,0,0.06)',
    medium: '0 8px 32px rgba(0,0,0,0.08)',
    large: '0 12px 48px rgba(0,0,0,0.12)',
    glow: (color) => `0 0 60px ${color}15`,
  },
};

// DESIGN TOKENS - Aurora Dark Theme
const darkTokens = {
  colors: {
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
  },
  shadows: {
    soft: '0 4px 24px rgba(0,0,0,0.3)',
    medium: '0 8px 32px rgba(0,0,0,0.4)',
    large: '0 12px 48px rgba(0,0,0,0.5)',
    glow: (color) => `0 0 40px ${color}20, 0 0 80px ${color}10`,
  },
};

// Shared tokens (same for both themes)
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
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("amiya-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      // Check system preference
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

  // Build the complete tokens object
  const tokens = {
    ...sharedTokens,
    colors: isDarkMode ? darkTokens.colors : lightTokens.colors,
    shadows: isDarkMode ? darkTokens.shadows : lightTokens.shadows,
    isDarkMode,
  };

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
      lightTokens,
      darkTokens,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Export tokens for static usage (e.g., in non-React files)
export { lightTokens, darkTokens, sharedTokens };
