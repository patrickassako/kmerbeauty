
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const { t } = useI18n();
  const { width, height, normalizeFontSize, spacing, isSmallDevice } = useResponsive();

  return (
    <ImageBackground
      source={require('../../assets/splash-bg.jpg')}
      style={[styles.container, { width, height }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={[styles.content, { paddingTop: spacing(10), paddingBottom: spacing(6), paddingHorizontal: spacing(4) }]}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo_nobg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { fontSize: normalizeFontSize(isSmallDevice ? 24 : 28), letterSpacing: isSmallDevice ? 3 : 4, marginBottom: spacing(0.75) }]}>
            KMR-BEAUTY
          </Text>
          <Text style={[styles.subtitle, { fontSize: normalizeFontSize(isSmallDevice ? 9 : 11), letterSpacing: 2 }]}>
            {t.onboarding.subtitle.toUpperCase()}
          </Text>
        </View>

        <View style={styles.bottom}>
          <Text style={[styles.tagline, { fontSize: normalizeFontSize(isSmallDevice ? 22 : 28), lineHeight: normalizeFontSize(isSmallDevice ? 28 : 36), marginBottom: spacing(4) }]}>
            Your Beauty, Your Way.{'\n'}On Demand
          </Text>

          <TouchableOpacity
            style={[styles.button, { paddingVertical: spacing(2), paddingHorizontal: spacing(3), borderRadius: spacing(5), maxWidth: isSmallDevice ? width * 0.85 : 340 }]}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonIconContainer, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}>
              <Text style={[styles.buttonIcon, { fontSize: normalizeFontSize(20) }]}>→</Text>
            </View>
            <Text style={[styles.buttonText, { fontSize: normalizeFontSize(isSmallDevice ? 14 : 16) }]}>
              {t.onboarding.getStarted.replace('Commencer', 'Découvrir KMR-BEAUTY').replace('Get Started', 'Discover KMR-BEAUTY')}
            </Text>
          </TouchableOpacity>

          <View style={[styles.indicator, { width: spacing(15), height: spacing(0.5), marginTop: spacing(4) }]} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20, // Optional for rounded icon look
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontWeight: '400',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bottom: {
    alignItems: 'center',
  },
  tagline: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingLeft: 6,
    width: '100%',
  },
  buttonIconContainer: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonText: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
    textAlign: 'center',
  },
  indicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
});
