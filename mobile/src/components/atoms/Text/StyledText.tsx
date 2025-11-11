import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import styled from 'styled-components/native';
import { colors, TextStyle, textStyles } from '@design-system';

export interface StyledTextProps extends RNTextProps {
  variant?: TextStyle;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

const BaseText = styled(RNText)<{
  $variant: TextStyle;
  $color?: string;
  $align?: string;
}>`
  font-family: ${({ $variant }) => textStyles[$variant].fontFamily};
  font-size: ${({ $variant }) => textStyles[$variant].fontSize}px;
  line-height: ${({ $variant }) => textStyles[$variant].lineHeight}px;
  font-weight: ${({ $variant }) => textStyles[$variant].fontWeight};
  color: ${({ $color }) => $color || colors.textPrimary};
  ${({ $align }) => $align && `text-align: ${$align};`}
`;

export const StyledText: React.FC<StyledTextProps> = ({
  variant = 'body',
  color,
  align,
  children,
  ...props
}) => {
  return (
    <BaseText $variant={variant} $color={color} $align={align} {...props}>
      {children}
    </BaseText>
  );
};
