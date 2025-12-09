import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { DEFAULT_COUNTRY } from '../components/CountryPicker';

interface SignInScreenProps {
  onSignIn: (data: SignInData) => Promise<void>;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export interface SignInData {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  onSignUp,
  onForgotPassword,
}) => {
  const { t } = useI18n();
  const { width, height, normalizeFontSize, spacing, isSmallDevice } = useResponsive();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [formData, setFormData] = useState<SignInData>({
    emailOrPhone: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignInData, string>>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof SignInData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SignInData, string>> = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = t.errors.required;
    } else if (mode === 'email' && !/\S+@\S+\.\S+/.test(formData.emailOrPhone)) {
      newErrors.emailOrPhone = t.errors.invalidEmail;
    } else if (mode === 'phone' && !/^[0-9]+$/.test(formData.emailOrPhone)) {
      newErrors.emailOrPhone = t.errors.invalidPhone;
    }

    if (!formData.password) {
      newErrors.password = t.errors.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      let submitData = { ...formData };

      // Format phone number if in phone mode
      if (mode === 'phone') {
        const cleanPhone = formData.emailOrPhone.replace(/\D/g, ''); // Remove non-digits
        const countryCodeDigits = selectedCountry.dialCode.replace('+', '');

        if (cleanPhone.startsWith(countryCodeDigits)) {
          submitData.emailOrPhone = `+${cleanPhone}`;
        } else {
          submitData.emailOrPhone = `${selectedCountry.dialCode}${cleanPhone}`;
        }
        console.log('Formatted phone for login:', submitData.emailOrPhone);
      }

      await onSignIn(submitData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/auth-bg.jpg')}
      style={[styles.background, { width, height }]}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: spacing(8), paddingBottom: spacing(2.5) }]}>
          <Image
            source={require('../../assets/logo_nobg.png')}
            style={[styles.logo, { width: spacing(10), height: spacing(10) }]}
            resizeMode="contain"
          />
          <Text style={[styles.title, {
            fontSize: normalizeFontSize(isSmallDevice ? 24 : 28),
            letterSpacing: isSmallDevice ? 3 : 4
          }]}>
            KMR-BEAUTY
          </Text>
          <Text style={[styles.subtitle, {
            fontSize: normalizeFontSize(isSmallDevice ? 9 : 11),
            letterSpacing: 2
          }]}>
            {t.onboarding.subtitle.toUpperCase()}
          </Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={[styles.formContent, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, {
            borderRadius: spacing(4),
            padding: isSmallDevice ? spacing(3) : spacing(4),
            paddingTop: isSmallDevice ? spacing(4) : spacing(5)
          }]}>
            <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(isSmallDevice ? 20 : 24), marginBottom: spacing(3) }]}>
              {t.auth.signIn}
            </Text>

            {/* Auth Mode Tabs */}
            <View style={[styles.tabContainer, { marginBottom: spacing(3) }]}>
              <TouchableOpacity
                style={[styles.tab, mode === 'email' && styles.activeTab]}
                onPress={() => {
                  setMode('email');
                  setErrors({});
                  setFormData(prev => ({ ...prev, emailOrPhone: '' }));
                }}
              >
                <Text style={[styles.tabText, mode === 'email' && styles.activeTabText]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'phone' && styles.activeTab]}
                onPress={() => {
                  setMode('phone');
                  setErrors({});
                  setFormData(prev => ({ ...prev, emailOrPhone: '' }));
                }}
              >
                <Text style={[styles.tabText, mode === 'phone' && styles.activeTabText]}>{t.auth.phone || 'Téléphone'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {mode === 'email' ? (
                <Input
                  label={t.auth.email}
                  placeholder={t.auth.emailPlaceholder}
                  value={formData.emailOrPhone}
                  onChangeText={(value) => updateField('emailOrPhone', value)}
                  error={errors.emailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Input
                  label={t.auth.phone || 'Téléphone'}
                  placeholder="6XXXXXXXX"
                  value={formData.emailOrPhone}
                  onChangeText={(value) => updateField('emailOrPhone', value)}
                  error={errors.emailOrPhone}
                  keyboardType="phone-pad"
                  isPhone
                  country={selectedCountry}
                  onCountryChange={setSelectedCountry}
                />
              )}

              <Input
                label={t.auth.password}
                placeholder={t.auth.passwordPlaceholder}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                error={errors.password}
                isPassword
              />

              <View style={[styles.optionsRow, { marginBottom: spacing(3) }]}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => updateField('rememberMe', !formData.rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { width: spacing(2.5), height: spacing(2.5) },
                      formData.rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {formData.rememberMe && <Text style={[styles.checkmark, { fontSize: normalizeFontSize(12) }]}>✓</Text>}
                  </View>
                  <Text style={[styles.rememberMeText, { fontSize: normalizeFontSize(13) }]}>Remember Me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onForgotPassword}>
                  <Text style={[styles.forgotPasswordText, { fontSize: normalizeFontSize(13) }]}>
                    {t.auth.forgotPassword}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={t.auth.signInButton}
                onPress={handleSubmit}
                loading={loading}
                icon="arrow"
              />

              <View style={[styles.footer, { marginTop: spacing(3) }]}>
                <Text style={[styles.footerText, { fontSize: normalizeFontSize(14) }]}>{t.auth.noAccount} </Text>
                <TouchableOpacity onPress={onSignUp}>
                  <Text style={[styles.footerLink, { fontSize: normalizeFontSize(14) }]}>{t.auth.signUpLink}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.indicator, { bottom: spacing(5), width: spacing(15), height: spacing(0.5) }]} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 10,
    borderRadius: 12,
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontWeight: '400',
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rememberMeText: {
    color: '#666',
  },
  forgotPasswordText: {
    fontWeight: '500',
    color: '#2D2D2D',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999',
  },
  socialTitle: {
    color: '#666',
    textAlign: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2D2D2D',
  },
  indicator: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
});
