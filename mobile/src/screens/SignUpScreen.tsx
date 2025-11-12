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
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useResponsive } from '../hooks/useResponsive';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
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
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'provider';
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onSignIn }) => {
  const { t } = useI18n();
  const { width, height, normalizeFontSize, spacing, isSmallDevice } = useResponsive();
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

    if (!formData.email.trim()) {
      newErrors.email = t.errors.required;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.errors.invalidEmail;
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

  const handleSubmit = () => {
    if (!validate()) return;
    if (!acceptTerms) {
      alert(t.auth.acceptTerms);
      return;
    }

    setLoading(true);
    // Combine country code with phone number
    const fullPhone = `${selectedCountry.dialCode}${formData.phone}`;
    onSignUp({ ...formData, phone: fullPhone });
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
          <Text style={[styles.title, {
            fontSize: normalizeFontSize(isSmallDevice ? 24 : 28),
            letterSpacing: isSmallDevice ? 3 : 4
          }]}>
            KMERSERVICES
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
            <Text style={[styles.cardTitle, { fontSize: normalizeFontSize(isSmallDevice ? 20 : 24), marginBottom: spacing(1) }]}>
              {t.auth.createAccount}
            </Text>
            <Text style={[styles.cardSubtitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(4) }]}>
              {t.auth.createAccountSubtitle}
            </Text>

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

              <Input
                label={t.auth.email}
                placeholder={t.auth.emailPlaceholder}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

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

              <TouchableOpacity
                style={[styles.termsContainer, { marginBottom: spacing(3) }]}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, { width: spacing(2.5), height: spacing(2.5) }, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={[styles.checkmark, { fontSize: normalizeFontSize(12) }]}>✓</Text>}
                </View>
                <Text style={[styles.termsText, { fontSize: normalizeFontSize(13) }]}>{t.auth.acceptTerms}</Text>
              </TouchableOpacity>

              <Button
                title={t.auth.signUp}
                onPress={handleSubmit}
                loading={loading}
                icon="arrow"
              />

              <View style={[styles.divider, { marginVertical: spacing(3) }]}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { fontSize: normalizeFontSize(14), paddingHorizontal: spacing(2) }]}>
                  {t.auth.or}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={[styles.socialTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                {t.auth.continueWith}
              </Text>

              <View style={[styles.socialButtons, { marginBottom: spacing(3) }]}>
                <TouchableOpacity style={[styles.socialButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}>
                  <Text style={[styles.socialButtonText, { fontSize: normalizeFontSize(20) }]}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}>
                  <Text style={[styles.socialButtonText, { fontSize: normalizeFontSize(20) }]}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}>
                  <Text style={[styles.socialButtonText, { fontSize: normalizeFontSize(20) }]}></Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { fontSize: normalizeFontSize(14) }]}>{t.auth.haveAccount} </Text>
                <TouchableOpacity onPress={onSignIn}>
                  <Text style={[styles.footerLink, { fontSize: normalizeFontSize(14) }]}>{t.auth.signInLink}</Text>
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
  accountTypeContainer: {
  },
  accountTypeLabel: {
    fontWeight: '500',
    color: '#2D2D2D',
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#2D2D2D',
  },
  accountTypeButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  accountTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 10,
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
  termsText: {
    color: '#666',
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
    color: '#666',
  },
  footerLink: {
    fontWeight: '600',
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
