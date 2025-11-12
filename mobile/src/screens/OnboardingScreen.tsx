import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useI18n();
  const { width, height, normalizeFontSize, spacing, isSmallDevice } = useResponsive();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      title: t.onboarding.slide1Title,
      subtitle: t.onboarding.slide1Subtitle,
      image: require('../../assets/onboarding-1.jpg'),
    },
    {
      title: t.onboarding.slide2Title,
      subtitle: t.onboarding.slide2Subtitle,
      image: require('../../assets/onboarding-2.avif'),
    },
    {
      title: t.onboarding.slide3Title,
      subtitle: t.onboarding.slide3Subtitle,
      image: require('../../assets/onboarding-3.jpg'),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <ImageBackground
            key={index}
            source={slide.image}
            style={[styles.slide, { width, height }]}
            resizeMode="cover"
          >
            <View style={styles.overlay} />

            <View style={[styles.content, {
              paddingTop: spacing(10),
              paddingBottom: spacing(25),
              paddingHorizontal: spacing(4)
            }]}>
              <View style={styles.header}>
                <Text style={[styles.title, {
                  fontSize: normalizeFontSize(isSmallDevice ? 28 : 32),
                  letterSpacing: isSmallDevice ? 4 : 6
                }]}>
                  KMERSERVICES
                </Text>
                <Text style={[styles.subtitle, {
                  fontSize: normalizeFontSize(isSmallDevice ? 10 : 12),
                  letterSpacing: 2
                }]}>
                  {t.onboarding.subtitle.toUpperCase()}
                </Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.slideTitle, {
                  fontSize: normalizeFontSize(isSmallDevice ? 22 : 28),
                  marginBottom: spacing(1)
                }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.slideSubtitle, {
                  fontSize: normalizeFontSize(isSmallDevice ? 22 : 28)
                }]}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      <View style={[styles.footer, {
        bottom: spacing(10),
        paddingHorizontal: spacing(4)
      }]}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { fontSize: normalizeFontSize(16) }]}>
            {t.onboarding.skip}
          </Text>
        </TouchableOpacity>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { height: spacing(1) },
                index === currentIndex
                  ? [styles.dotActive, { width: spacing(3) }]
                  : [styles.dotInactive, { width: spacing(1) }],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={[styles.nextText, { fontSize: normalizeFontSize(16) }]}>
            {currentIndex === slides.length - 1
              ? t.onboarding.getStarted
              : t.onboarding.next}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.indicator, {
        bottom: spacing(5),
        width: spacing(15),
        height: spacing(0.5)
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
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
  header: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '400',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  slideSubtitle: {
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontWeight: '500',
    color: '#FFFFFF',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  nextButton: {
    padding: 10,
  },
  nextText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  indicator: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
});
