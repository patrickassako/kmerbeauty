/**
 * Design System - Border Radius
 * Basé sur l'analyse du design SIMONE
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  pill: 9999,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;
