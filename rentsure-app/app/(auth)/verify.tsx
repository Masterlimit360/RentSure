/**
 * Email Verification Screen (OTP).
 *
 * Mocks the OTP verification flow. The backend normally emails a code,
 * but in development/mocks, any 6-digit code (e.g. "123456") is accepted.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVerifyEmail } from '@/hooks/useAuth';
import { useToastStore } from '@/store/toast.store';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/constants/theme';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const verifyMutation = useVerifyEmail();
  const showToast = useToastStore((state) => state.showToast);

  const handleVerify = () => {
    if (otp.length !== 6) {
      showToast('OTP must be exactly 6 digits', 'error');
      return;
    }

    verifyMutation.mutate(
      { email: email || '', otp },
      {
        onSuccess: (res) => {
          if (res.success) {
            showToast('Email verified successfully! You can now log in.');
            router.replace('/(auth)/login');
          } else {
            showToast(res.error?.message || 'Verification failed', 'error');
          }
        },
        onError: () => {
          showToast('Network error occurred. Please try again.', 'error');
        },
      }
    );
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {email || 'your email address'}.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="One-Time Password"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
              style={styles.otpInput}
            />

            <Button
              title="Verify Account"
              onPress={handleVerify}
              isLoading={verifyMutation.isPending}
              disabled={otp.length !== 6}
            />
            
            {__DEV__ && (
              <View style={styles.hints}>
                <Text style={styles.hintText}>Mock mode: Any 6 digits will work.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  otpInput: {
    fontSize: typography.sizes.xl,
    letterSpacing: 8,
    fontWeight: typography.weights.bold,
  },
  hints: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
