import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, radius, shadows, spacing, textStyles } from '@design-system';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const StyledButton = styled(TouchableOpacity)<{
  $disabled?: boolean;
  $fullWidth?: boolean;
}>`
  background-color: ${({ $disabled }) => ($disabled ? colors.gray400 : colors.charcoal)};
  height: 56px;
  border-radius: ${radius.pill}px;
  padding: 0 ${spacing['6']}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${shadows.sm}
  ${({ $fullWidth }) => $fullWidth && 'width: 100%;'}
  ${({ $disabled }) => $disabled && 'opacity: 0.5;'}
`;

const IconWrapper = styled(View)`
  width: 32px;
  height: 32px;
  border-radius: ${radius.full}px;
  background-color: ${colors.whiteAlpha20};
  align-items: center;
  justify-content: center;
  margin-right: ${spacing['3']}px;
`;

const ButtonText = styled(Text)`
  color: ${colors.white};
  font-size: ${textStyles.button.fontSize}px;
  font-weight: ${textStyles.button.fontWeight};
  font-family: ${textStyles.button.fontFamily};
`;

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      onPress={onPress}
      disabled={disabled || loading}
      $disabled={disabled || loading}
      $fullWidth={fullWidth}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {icon && <IconWrapper>{icon}</IconWrapper>}
          <ButtonText>{title}</ButtonText>
        </>
      )}
    </StyledButton>
  );
};
