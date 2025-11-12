import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const useResponsive = () => {
  const isSmallDevice = SCREEN_WIDTH < 375;
  const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
  const isLargeDevice = SCREEN_WIDTH >= 414;
  const isTablet = SCREEN_WIDTH >= 768;

  // Sur tablette, on limite la largeur du contenu pour une meilleure lisibilité
  const maxContentWidth = isTablet ? 700 : SCREEN_WIDTH;
  const containerPaddingHorizontal = isTablet ? (SCREEN_WIDTH - maxContentWidth) / 2 : 0;

  // Scale factor based on width - limité sur tablette pour éviter des éléments trop grands
  const scale = isTablet ? Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.5) : SCREEN_WIDTH / BASE_WIDTH;
  const verticalScale = SCREEN_HEIGHT / BASE_HEIGHT;

  /**
   * Scale size based on screen width
   */
  const normalize = (size: number, based: 'width' | 'height' = 'width') => {
    const newSize = based === 'height' ? size * verticalScale : size * scale;
    return Math.round(newSize);
  };

  /**
   * Scale font size with moderate factor to prevent too large fonts
   */
  const normalizeFontSize = (size: number) => {
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
      return Math.round(newSize);
    }
    return Math.round(newSize) - 1;
  };

  /**
   * Get responsive spacing
   */
  const spacing = (multiplier: number = 1) => {
    const baseSpacing = 8;
    return normalize(baseSpacing * multiplier);
  };

  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    maxContentWidth,
    containerPaddingHorizontal,
    normalize,
    normalizeFontSize,
    spacing,
    scale,
    verticalScale,
  };
};
