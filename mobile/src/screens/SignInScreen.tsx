import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient
      colors={['#221510', '#1A1A1A']}
      style={[styles.background, { width, height }]}
    >

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={[styles.formContent, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: spacing(6), paddingBottom: spacing(3) }]}>
            <Image
              source={require('../../assets/logo-kmr.png')}
              style={[styles.logo, { width: 200, height: 65 }]}
              resizeMode="contain"
            />
          </View>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 16,
    tintColor: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
  },
  card: {
    backgroundColor: 'rgba(45, 45, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontWeight: '400',
    color: '#c9a092',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#2A1D18',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rememberMeText: {
    color: '#c9a092',
  },
  forgotPasswordText: {
    fontWeight: '500',
    color: '#FF6B6B',
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
    color: '#c9a092',
  },
  footerLink: {
    fontWeight: '600',
    color: '#FF6B6B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A1D18',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontWeight: '600',
    color: '#c9a092',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
