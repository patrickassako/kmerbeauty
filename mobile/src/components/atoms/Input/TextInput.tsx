import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import styled from 'styled-components/native';
import { colors, radius, spacing, textStyles } from '@design-system';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

const Container = styled(View)`
  margin-bottom: ${spacing['4']}px;
`;

const Label = styled(Text)`
  font-family: ${textStyles.label.fontFamily};
  font-size: ${textStyles.labelSmall.fontSize}px;
  font-weight: ${textStyles.label.fontWeight};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing['2']}px;
`;

const InputContainer = styled(View)<{ $hasError?: boolean }>`
  background-color: ${colors.gray50};
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ $hasError }) => ($hasError ? colors.error : 'transparent')};
  flex-direction: row;
  align-items: center;
  padding: 0 ${spacing['4']}px;
  height: 56px;
`;

const StyledInput = styled(RNTextInput)`
  flex: 1;
  font-family: ${textStyles.body.fontFamily};
  font-size: ${textStyles.body.fontSize}px;
  color: ${colors.textPrimary};
  padding: 0 ${spacing['2']}px;
`;

const ErrorText = styled(Text)`
  font-family: ${textStyles.caption.fontFamily};
  font-size: ${textStyles.caption.fontSize}px;
  color: ${colors.error};
  margin-top: ${spacing['1']}px;
`;

const IconContainer = styled(View)`
  margin-right: ${spacing['2']}px;
`;

const RightIconButton = styled(TouchableOpacity)`
  padding: ${spacing['2']}px;
`;

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <InputContainer $hasError={!!error}>
        {icon && <IconContainer>{icon}</IconContainer>}
        <StyledInput
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <RightIconButton onPress={onRightIconPress} disabled={!onRightIconPress}>
            {rightIcon}
          </RightIconButton>
        )}
      </InputContainer>
      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};
