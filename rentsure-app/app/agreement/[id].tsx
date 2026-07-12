import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAgreement } from '@/hooks/useAgreements';
import { useMyBookings } from '@/hooks/useBookings';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { Screen } from '@/components/ui/Screen';

export default function AgreementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: bookingsData } = useMyBookings(user?.id ?? '', user?.role as 'TENANT' | 'LANDLORD');
  const booking = bookingsData?.data?.find((b) => b.id === id);

  const { data: agreementData } = useAgreement(id as string);
  const agreement = agreementData?.data;

  if (!booking || !agreement) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.loadingText}>Loading agreement details...</Text>
      </Screen>
    );
  }

  const startDate = new Date(booking.createdAt);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + booking.durationMonths);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Rental Agreement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.paper}>
          <Text style={styles.title}>Tenancy Agreement</Text>
          <Text style={styles.date}>Dated: {startDate.toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. The Parties</Text>
            <Text style={styles.paragraph}>
              This Agreement is made between <Text style={styles.bold}>{booking.landlordName}</Text> (hereinafter referred to as the "Landlord") and <Text style={styles.bold}>{booking.tenantName}</Text> (hereinafter referred to as the "Tenant").
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. The Property</Text>
            <Text style={styles.paragraph}>
              The Landlord agrees to let and the Tenant agrees to take the property known as <Text style={styles.bold}>{booking.propertyTitle}</Text> for residential purposes only.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Term of Tenancy</Text>
            <Text style={styles.paragraph}>
              The tenancy shall be for a fixed term of <Text style={styles.bold}>{booking.durationMonths} months</Text>, commencing on {startDate.toLocaleDateString()} and expiring on {endDate.toLocaleDateString()}.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Rent & Payments</Text>
            <Text style={styles.paragraph}>
              The total rent for the term is <Text style={styles.bold}>{formatCurrency(booking.totalAmount)}</Text>. All payments are securely held in escrow by RentSure until the Tenant confirms move-in, after which funds are released to the Landlord.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Use of Property</Text>
            <Text style={styles.paragraph}>
              The Tenant shall not use the property for any illegal or commercial purpose, nor cause any nuisance or annoyance to neighbors. The Tenant shall maintain the property in good condition.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Signatures</Text>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureRow}>
                <Text style={styles.sigRole}>Landlord:</Text>
                {agreement.landlordSignedAt ? (
                  <View style={styles.signedState}>
                    <Ionicons name="checkmark-done" size={16} color={colors.success} />
                    <Text style={styles.signedText}>Digitally Signed ({new Date(agreement.landlordSignedAt).toLocaleDateString()})</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>Pending Signature</Text>
                )}
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.sigRole}>Tenant:</Text>
                {agreement.tenantSignedAt ? (
                  <View style={styles.signedState}>
                    <Ionicons name="checkmark-done" size={16} color={colors.success} />
                    <Text style={styles.signedText}>Digitally Signed ({new Date(agreement.tenantSignedAt).toLocaleDateString()})</Text>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>Pending Signature</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.footerText}>Secured by RentSure Digital Escrow</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.md,
  },
  paper: {
    backgroundColor: '#FFF',
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    color: '#111827',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#111827',
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.sizes.md,
    color: '#374151',
    lineHeight: 24,
  },
  bold: {
    fontWeight: typography.weights.bold,
    color: '#111827',
  },
  signatureBlock: {
    backgroundColor: '#F9FAFB',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigRole: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  signedState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signedText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
  pendingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
