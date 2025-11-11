/**
 * Design System - Typography
 * Basé sur l'analyse du design SIMONE
 */

import { Platform } from 'react-native';

export const typography = {
  // Font Family (System fonts pour un rendu optimal)
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },

  // Font Sizes (en pixels)
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

// Preset text styles (composants réutilisables)
export const textStyles = {
  // Headers
  h1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
  },
  h2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
  },
  h3: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  h4: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.snug * typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  h5: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.snug * typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  h6: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.snug * typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Body
  bodyLarge: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.normal * typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },

  // Labels
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  labelSmall: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Captions
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },

  // Buttons
  button: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonSmall: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // Price
  priceLarge: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight.tight * typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
  },
  price: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.tight * typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  priceSmall: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.tight * typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
} as const;

export type TextStyle = keyof typeof textStyles;
