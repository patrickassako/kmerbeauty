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
import * as WebBrowser from 'expo-web-browser';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import { DEFAULT_COUNTRY } from '../components/CountryPicker';

interface SignUpScreenProps {
  onSignUp: (data: SignUpData) => void;
  onSignIn: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export interface SignUpData {
  email?: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'provider';
  businessName?: string;
  bio?: string;
  experience?: string;
  isMobile?: boolean;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onSignIn }) => {
  const { t } = useI18n();
  const { width, height, normalizeFontSize, spacing, isSmallDevice } = useResponsive();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpData, string>>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof SignUpData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SignUpData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t.errors.required;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t.errors.required;
    }

    if (mode === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = t.errors.required;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t.errors.invalidEmail;
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t.errors.required;
    } else if (!/^[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro invalide (9 chiffres requis)';
    }

    if (!formData.password) {
      newErrors.password = t.errors.required;
    } else if (formData.password.length < 8) {
      newErrors.password = t.errors.passwordTooShort;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.errors.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!acceptTerms) {
      showToast(t.auth.acceptTerms, 'warning');
      return;
    }

    setLoading(true);

    // Combine country code with phone number
    const fullPhone = `${selectedCountry.dialCode}${formData.phone}`;

    // Prepare data for backend
    const signupData = {
      ...formData,
      email: mode === 'email' ? formData.email : undefined, // Send undefined if phone mode
      phone: fullPhone,
      role: formData.role.toUpperCase() as any, // Convert to CLIENT or PROVIDER
      city: 'Douala', // Default city
      region: 'Littoral', // Default region
    };

    try {
      await onSignUp(signupData);
    } catch (error: any) {
      console.log('Signup error handled by parent:', error);
      const msg = error.response?.data?.message || 'Une erreur est survenue';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.background, { width, height }]}>

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
            <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(isSmallDevice ? 24 : 28), marginBottom: spacing(1) }]}>
              {t.auth.createAccount}
            </Text>
            <Text style={[styles.cardSubtitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), color: '#c9a092' }]}>
              Rejoignez la communauté beauté n°1 au Cameroun
            </Text>

            {/* Auth Mode Tabs */}
            <View style={[styles.tabContainer, { marginBottom: spacing(3) }]}>
              <TouchableOpacity
                style={[styles.tab, mode === 'phone' && styles.activeTab]}
                onPress={() => setMode('phone')}
              >
                <Text style={[styles.tabText, mode === 'phone' && styles.activeTabText]}>{t.auth.phone || 'Téléphone'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'email' && styles.activeTab]}
                onPress={() => setMode('email')}
              >
                <Text style={[styles.tabText, mode === 'email' && styles.activeTabText]}>Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Input
                label={t.auth.firstName}
                placeholder={t.auth.firstName}
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                error={errors.firstName}
                autoCapitalize="words"
              />

              <Input
                label={t.auth.lastName}
                placeholder={t.auth.lastName}
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                error={errors.lastName}
                autoCapitalize="words"
              />

              {mode === 'email' && (
                <Input
                  label={t.auth.email}
                  placeholder={t.auth.emailPlaceholder}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}

              <Input
                label={t.auth.phone}
                placeholder="6XXXXXXXX"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                error={errors.phone}
                keyboardType="phone-pad"
                isPhone
                country={selectedCountry}
                onCountryChange={setSelectedCountry}
              />

              <Input
                label={t.auth.password}
                placeholder={t.auth.passwordPlaceholder}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                error={errors.password}
                isPassword
              />

              <Input
                label={t.auth.confirmPassword}
                placeholder={t.auth.passwordPlaceholder}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                error={errors.confirmPassword}
                isPassword
              />

              <View style={[styles.accountTypeContainer, { marginBottom: spacing(2.5) }]}>
                <Text style={[styles.accountTypeLabel, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                  {t.auth.accountType}
                </Text>
                <View style={styles.accountTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.accountTypeButton,
                      { paddingVertical: spacing(1.5), borderRadius: spacing(1.5) },
                      formData.role === 'client' && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => updateField('role', 'client')}
                  >
                    <Text
                      style={[
                        styles.accountTypeButtonText,
                        { fontSize: normalizeFontSize(14) },
                        formData.role === 'client' &&
                        styles.accountTypeButtonTextActive,
                      ]}
                    >
                      {t.auth.client}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.accountTypeButton,
                      { paddingVertical: spacing(1.5), borderRadius: spacing(1.5) },
                      formData.role === 'provider' && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => updateField('role', 'provider')}
                  >
                    <Text
                      style={[
                        styles.accountTypeButtonText,
                        { fontSize: normalizeFontSize(14) },
                        formData.role === 'provider' &&
                        styles.accountTypeButtonTextActive,
                      ]}
                    >
                      {t.auth.provider}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Provider-specific fields removed - moved to profile completion */}

              <TouchableOpacity
                style={[styles.termsContainer, { marginBottom: spacing(1.5) }]}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, { width: spacing(2.5), height: spacing(2.5) }, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={[styles.checkmark, { fontSize: normalizeFontSize(12) }]}>✓</Text>}
                </View>
                <Text style={[styles.termsText, { fontSize: normalizeFontSize(13) }]}>{t.auth.acceptTerms}</Text>
              </TouchableOpacity>

              {/* Privacy Policy Link */}
              <TouchableOpacity
                style={{ marginBottom: spacing(3), alignItems: 'center' }}
                onPress={() => WebBrowser.openBrowserAsync('https://sites.google.com/view/kmerbeauty-policy/accueil')}
              >
                <Text style={{ fontSize: normalizeFontSize(12), color: '#666', textDecorationLine: 'underline' }}>
                  📋 Politique de confidentialité
                </Text>
              </TouchableOpacity>

              <Button
                title={t.auth.signUp}
                onPress={handleSubmit}
                loading={loading}
                icon="arrow"
              />

              <View style={[styles.footer, { marginTop: spacing(3) }]}>
                <Text style={[styles.footerText, { fontSize: normalizeFontSize(14) }]}>{t.auth.haveAccount} </Text>
                <TouchableOpacity onPress={onSignIn}>
                  <Text style={[styles.footerLink, { fontSize: normalizeFontSize(14) }]}>{t.auth.signInLink}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1A1A1A',
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
  sectionTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontWeight: '400',
    color: '#c9a092',
  },
  accountTypeContainer: {
  },
  accountTypeLabel: {
    fontWeight: '500',
    color: '#FFFFFF',
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#2A1D18',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountTypeButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  accountTypeButtonText: {
    fontWeight: '600',
    color: '#c9a092',
  },
  accountTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#2A1D18',
    marginRight: 10,
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
  termsText: {
    color: '#c9a092',
    flex: 1,
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
