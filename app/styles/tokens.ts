// Design tokens centralizing Cryptrac's new visual system
// These tokens should be the single source of truth for colours, spacing, radii and typography
// Components should import from this file instead of hard-coding values.
// Design System Documentation: Use these tokens for all colors, spacing, etc. to maintain consistency. Primary purple for CTAs only, neutrals for bases.

export const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#7f5efd',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    50: '#f1fdf6',
    100: '#e3f9ec',
    200: '#c4f1d5',
    300: '#9be8b7',
    400: '#70d68c',
    500: '#41c064',
    600: '#2fa154',
    700: '#28834a',
    800: '#24663d',
    900: '#1e4c32',
  },
  warning: {
    400: '#f6cf6a',
    500: '#e9b949',
  },
  error: {
    400: '#f18f8f',
    500: '#e35c5c',
  },
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const fonts = {
  sans: 'Inter, sans-serif',
  mono: 'Menlo, monospace',
} as const;

export const shadows = {
  soft: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
  medium: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Fonts = typeof fonts;
export type Shadows = typeof shadows;
