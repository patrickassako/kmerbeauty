import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { CountryPicker, DEFAULT_COUNTRY } from './CountryPicker';
import { useResponsive } from '../hooks/useResponsive';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  isPhone?: boolean;
  country?: Country;
  onCountryChange?: (country: Country) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isPassword = false,
  isPhone = false,
  country = DEFAULT_COUNTRY,
  onCountryChange,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { normalizeFontSize, spacing, isSmallDevice } = useResponsive();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize: normalizeFontSize(14) }]}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {isPhone && onCountryChange && (
          <CountryPicker selectedCountry={country} onSelect={onCountryChange} />
        )}
        <TextInput
          style={[
            styles.input,
            { fontSize: normalizeFontSize(16), paddingLeft: isPhone ? spacing(1) : 0 }
          ]}
          placeholderTextColor="#8a6a5e"
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={[styles.eyeIconText, { fontSize: normalizeFontSize(18) }]}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { fontSize: normalizeFontSize(12) }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e0d0cb',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1D18',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#674032',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 8,
  },
  eyeIconText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});
