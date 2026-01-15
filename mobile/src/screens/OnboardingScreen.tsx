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
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Slide {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  image: any;
  cta: string;
  showLoginLink?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const slides: Slide[] = [
    {
      title: "La beauté à\nvotre porte",
      titleHighlight: "votre porte",
      subtitle: "Découvrez les meilleurs experts beauté de Douala et Yaoundé directement chez vous.",
      image: require('../../assets/onboarding-bg-1.jpg'),
      cta: "Suivant"
    },
    {
      title: "Votre Marketplace\nBeauté",
      titleHighlight: "Beauté",
      subtitle: "Achetez vos produits préférés et faites-vous livrer en un clin d'œil.",
      image: require('../../assets/onboarding-bg-2.jpg'),
      cta: "Suivant"
    },
    {
      title: "Votre Sécurité,\nNotre Priorité",
      subtitle: "Tous nos prestataires sont vérifiés manuellement pour vous garantir une expérience sereine et sécurisée.",
      image: require('../../assets/onboarding-bg-3.jpg'),
      cta: "Commencer l'aventure",
      showLoginLink: true
    }
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleButtonPress = () => {
    animateButtonPress();
    setTimeout(handleNext, 150);
  };

  const renderTitle = (title: string, highlight?: string) => {
    if (!highlight) {
      return <Text style={styles.slideTitle}>{title}</Text>;
    }

    const parts = title.split(highlight);
    return (
      <Text style={styles.slideTitle}>
        {parts[0]}
        <Text style={styles.titleHighlight}>{highlight}</Text>
        {parts[1]}
      </Text>
    );
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
          <View key={index} style={[styles.slide, { width: screenWidth, height: screenHeight }]}>
            {/* Background Image */}
            <ImageBackground
              source={slide.image}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* Top Gradient */}
              <LinearGradient
                colors={['rgba(35, 15, 15, 0.3)', 'transparent']}
                style={styles.topGradient}
              />

              {/* Bottom Gradient */}
              <LinearGradient
                colors={['transparent', 'rgba(35, 15, 15, 0.9)', '#230f0f']}
                locations={[0, 0.35, 1]}
                style={styles.bottomGradient}
              />

              {/* Content */}
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <Image
                    source={require('../../assets/logo-kmr.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Passer</Text>
                  </TouchableOpacity>
                </View>

                {/* Phone Mockup (Slide 3 only) */}
                {index === 2 && (
                  <View style={styles.phoneMockupContainer}>
                    <Image
                      source={require('../../assets/onboarding-phone-verified.png')}
                      style={styles.phoneMockup}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                  {/* Text Block */}
                  <View style={styles.textBlock}>
                    {renderTitle(slide.title, slide.titleHighlight)}
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                  </View>

                  {/* Navigation Controls */}
                  <View style={styles.controls}>
                    {/* Dot Indicators */}
                    <View style={styles.pagination}>
                      {slides.map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            idx === currentIndex ? styles.dotActive : styles.dotInactive,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Primary Button */}
                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleButtonPress}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.buttonText}>{slide.cta}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Login Link (Slide 3 only) */}
                    {slide.showLoginLink && (
                      <TouchableOpacity onPress={onComplete}>
                        <Text style={styles.loginLink}>
                          Déjà un compte ?{' '}
                          <Text style={styles.loginLinkHighlight}>Se connecter</Text>
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#230f0f',
  },
  slide: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 65,
    tintColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneMockupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  phoneMockup: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.5,
  },
  bottomSection: {
    gap: 32,
  },
  textBlock: {
    gap: 12,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: '#FF6B6B',
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  controls: {
    alignItems: 'center',
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: '#FF6B6B',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: screenWidth - 48,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loginLink: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  loginLinkHighlight: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
