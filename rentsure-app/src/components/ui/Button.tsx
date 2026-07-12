/**
 * Reusable Button component.
 *
 * Supports primary/secondary variants and an integrated loading spinner.
 * Standardizes touch feedback and interaction styling across the app.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const containerStyle = [
    styles.container,
    isPrimary && styles.primaryContainer,
    variant === 'secondary' && styles.secondaryContainer,
    isOutline && styles.outlineContainer,
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    isPrimary && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    isOutline && styles.outlineText,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? colors.surface : colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  primaryContainer: {
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: shadows.sm,
      android: shadows.sm,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } as any,
    }),
  },
  secondaryContainer: {
    backgroundColor: colors.accent,
    ...Platform.select({
      ios: shadows.sm,
      android: shadows.sm,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } as any,
    }),
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
});
