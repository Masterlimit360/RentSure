/**
 * Registration Screen.
 *
 * Captures user details with strict validation (Zod).
 * - Phone numbers must be valid Ghana format (+233 or 0).
 * - Passwords require minimum 8 chars, 1 uppercase, 1 number.
 * - Role selection restricts to Tenant or Landlord (Admins cannot self-register).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuth';
import { useToastStore } from '@/store/toast.store';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { UserRole } from '@/types';

// Regex for Ghana phone numbers: starts with +233 or 0, followed by 9 digits.
const ghanaPhoneRegex = /^(?:\+233|0)[2-9]\d{8}$/;
// Password must contain at least 1 uppercase and 1 number
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(ghanaPhoneRegex, 'Must be a valid Ghana phone number (e.g. 055... or +233...)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter and one number'),
  role: z.enum(['TENANT', 'LANDLORD'] as const),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const registerMutation = useRegister();
  const showToast = useToastStore((state) => state.showToast);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'TENANT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: (res) => {
        if (res.success) {
          showToast('Registration successful! Please verify your email.');
          // Pass email to verify screen so it can pre-fill or use it for the API call
          router.push({ pathname: '/(auth)/verify', params: { email: data.email } });
        } else {
          showToast(res.error?.message || 'Registration failed', 'error');
        }
      },
      onError: () => {
        showToast('Network error occurred. Please try again.', 'error');
      },
    });
  };

  return (
    <View style={styles.screen}>
      {/* Vibrant abstract background */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>Join RentSure today.</Text>
          </View>

          <View style={styles.glassCard}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Full Name"
                    placeholder="Kwame Mensah"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.fullName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Email"
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Phone Number"
                    placeholder="055 123 4567"
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    rightAccessory={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <Ionicons 
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              <Text style={styles.roleLabel}>I am a...</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, selectedRole === 'TENANT' && styles.roleButtonActive]}
                  onPress={() => setValue('role', 'TENANT')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleText, selectedRole === 'TENANT' && styles.roleTextActive]}>
                    Tenant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, selectedRole === 'LANDLORD' && styles.roleButtonActive]}
                  onPress={() => setValue('role', 'LANDLORD')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleText, selectedRole === 'LANDLORD' && styles.roleTextActive]}>
                    Landlord
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}

              <Button
                title="Register"
                onPress={handleSubmit(onSubmit)}
                isLoading={registerMutation.isPending}
                style={styles.registerBtn}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" style={styles.link}>
                  Sign In
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bgCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#3B82F6',
    opacity: 0.15,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#10B981',
    opacity: 0.1,
  },
  bgCircle3: {
    position: 'absolute',
    top: 300,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8B5CF6',
    opacity: 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: '#64748B',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  form: {
    gap: spacing.md,
  },
  roleLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#64748B',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  roleButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
  },
  roleText: {
    color: '#64748B',
    fontWeight: typography.weights.medium,
  },
  roleTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  registerBtn: {
    marginTop: spacing.md,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});
