import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: 'arrow' | 'google' | 'facebook' | 'apple';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  icon,
  style,
  disabled,
  ...props
}) => {
  const getIconComponent = () => {
    if (!icon) return null;

    switch (icon) {
      case 'arrow':
        return (
          <View style={styles.iconContainer}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        );
      case 'google':
        return <Text style={styles.socialIcon}>G</Text>;
      case 'facebook':
        return <Text style={styles.socialIcon}>f</Text>;
      case 'apple':
        return <Text style={styles.socialIcon}></Text>;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : '#2D2D2D'}
        />
      ) : (
        <>
          {icon && getIconComponent()}
          <Text
            style={[
              styles.buttonText,
              variant === 'primary' && styles.primaryButtonText,
              variant === 'secondary' && styles.secondaryButtonText,
              variant === 'outline' && styles.outlineButtonText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#2D2D2D',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2D2D2D',
  },
  outlineButtonText: {
    color: '#2D2D2D',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
});
