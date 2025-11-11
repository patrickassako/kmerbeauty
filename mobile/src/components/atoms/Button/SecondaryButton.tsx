import React from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, radius, spacing, textStyles } from '@design-system';

interface SecondaryButtonProps extends TouchableOpacityProps {
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
  background-color: ${colors.white};
  height: 56px;
  border-radius: ${radius.md}px;
  border-width: 1.5px;
  border-color: ${({ $disabled }) => ($disabled ? colors.gray300 : colors.charcoal)};
  padding: 0 ${spacing['6']}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${({ $fullWidth }) => $fullWidth && 'width: 100%;'}
  ${({ $disabled }) => $disabled && 'opacity: 0.5;'}
`;

const ButtonText = styled(Text)<{ $disabled?: boolean }>`
  color: ${({ $disabled }) => ($disabled ? colors.gray400 : colors.charcoal)};
  font-size: ${textStyles.button.fontSize}px;
  font-weight: ${textStyles.button.fontWeight};
  font-family: ${textStyles.button.fontFamily};
  ${({ $disabled }) => !$disabled && `margin-left: ${spacing['2']}px;`}
`;

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  icon,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      onPress={onPress}
      disabled={disabled}
      $disabled={disabled}
      $fullWidth={fullWidth}
      activeOpacity={0.7}
      {...props}
    >
      {icon}
      <ButtonText $disabled={disabled}>{title}</ButtonText>
    </StyledButton>
  );
};
