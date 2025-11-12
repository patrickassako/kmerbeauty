import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const { width, height } = Dimensions.get('window');

interface SignUpScreenProps {
  onSignUp: (data: SignUpData) => void;
  onSignIn: () => void;
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
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client',
  });
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
    } else if (!/^\+237[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = t.errors.invalidPhone;
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
    onSignUp(formData);
  };

  return (
    <ImageBackground
      source={require('../../assets/auth-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>KMERSERVICES</Text>
          <Text style={styles.subtitle}>
            {t.onboarding.subtitle.toUpperCase()}
          </Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.auth.createAccount}</Text>
            <Text style={styles.cardSubtitle}>{t.auth.createAccountSubtitle}</Text>

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
                placeholder={t.auth.phonePlaceholder}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                error={errors.phone}
                keyboardType="phone-pad"
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

              <View style={styles.accountTypeContainer}>
                <Text style={styles.accountTypeLabel}>{t.auth.accountType}</Text>
                <View style={styles.accountTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.accountTypeButton,
                      formData.role === 'client' && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => updateField('role', 'client')}
                  >
                    <Text
                      style={[
                        styles.accountTypeButtonText,
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
                      formData.role === 'provider' && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => updateField('role', 'provider')}
                  >
                    <Text
                      style={[
                        styles.accountTypeButtonText,
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
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>{t.auth.acceptTerms}</Text>
              </TouchableOpacity>

              <Button
                title={t.auth.signUp}
                onPress={handleSubmit}
                loading={loading}
                icon="arrow"
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t.auth.or}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.socialTitle}>{t.auth.continueWith}</Text>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}></Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t.auth.haveAccount} </Text>
                <TouchableOpacity onPress={onSignIn}>
                  <Text style={styles.footerLink}>{t.auth.signInLink}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.indicator} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  accountTypeContainer: {
    marginBottom: 20,
  },
  accountTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#2D2D2D',
  },
  accountTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  accountTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
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
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  socialTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  indicator: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
});
