/**
 * Design System - Colors
 * Basé sur l'analyse du design SIMONE
 */

export const colors = {
  // Primary
  black: '#2D2D2D',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',

  // Accent
  coral: '#FF6B6B',
  coralLight: '#FF8B8B',
  coralDark: '#FF4B4B',

  // Neutrals
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Functional
  gold: '#FFB800',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#FAFAFA',

  // Text
  textPrimary: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  borderDark: '#BDBDBD',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Badge & Status
  badgeOrange: '#FFB800',
  badgeGreen: '#10B981',
  badgeRed: '#EF4444',
  badgeGray: '#9E9E9E',

  // Transparent variants (pour backgrounds)
  blackAlpha10: 'rgba(45, 45, 45, 0.1)',
  blackAlpha20: 'rgba(45, 45, 45, 0.2)',
  whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
  whiteAlpha20: 'rgba(255, 255, 255, 0.2)',
  whiteAlpha90: 'rgba(255, 255, 255, 0.9)',
} as const;

export type Color = keyof typeof colors;
