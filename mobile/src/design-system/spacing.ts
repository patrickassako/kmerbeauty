/**
 * Design System - Spacing
 * Basé sur l'analyse du design SIMONE
 */

export const spacing = {
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

// Aliases pour faciliter l'utilisation
export const space = {
  none: spacing['0'],
  xs: spacing['1'],   // 4px
  sm: spacing['2'],   // 8px
  md: spacing['3'],   // 12px
  lg: spacing['4'],   // 16px
  xl: spacing['5'],   // 20px
  '2xl': spacing['6'], // 24px
  '3xl': spacing['8'], // 32px
  '4xl': spacing['10'], // 40px
  '5xl': spacing['12'], // 48px
} as const;

export type Spacing = keyof typeof spacing;
export type Space = keyof typeof space;
