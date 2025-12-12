/**
 * Design System - Spacing
 * Basé sur l'analyse du design SIMONE
 */

const rawSpacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

export const spacing = {
  ...rawSpacing,
  none: rawSpacing['0'],
  xs: rawSpacing['1'],   // 4px
  sm: rawSpacing['2'],   // 8px
  md: rawSpacing['3'],   // 12px
  lg: rawSpacing['4'],   // 16px
  xl: rawSpacing['5'],   // 20px
  '2xl': rawSpacing['6'], // 24px
  '3xl': rawSpacing['8'], // 32px
  '4xl': rawSpacing['10'], // 40px
  '5xl': rawSpacing['12'], // 48px
} as const;

// Legacy alias support if needed
export const space = spacing;

export type Spacing = keyof typeof spacing;
export type Space = keyof typeof space;
