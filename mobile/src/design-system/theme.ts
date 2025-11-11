/**
 * Design System - Theme
 * Exporte tous les design tokens
 */

import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, space } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  space,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

// Export individual modules
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
