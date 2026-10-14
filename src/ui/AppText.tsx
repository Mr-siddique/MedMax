import { ReactNode } from 'react';
import { Text, TextProps } from 'react-native';
import { colors, typography } from './theme';

type Tone =
  | 'primary'
  | 'secondary'
  | 'inverse'
  | 'brand'
  | 'danger'
  | 'success';

const toneColor: Record<Tone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  inverse: colors.textInverse,
  brand: colors.brand,
  danger: colors.danger,
  success: colors.success,
};

interface Props extends TextProps {
  variant?: keyof typeof typography;
  tone?: Tone;
  children: ReactNode;
}

export function AppText({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: Props) {
  return (
    <Text
      style={[typography[variant], { color: toneColor[tone] }, style]}
      {...rest}
    />
  );
}
