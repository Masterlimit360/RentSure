/**
 * Landlord Payout Accounts Screen.
 *
 * Allows landlords to manage their payout methods — bank accounts
 * and mobile money numbers where escrow funds are released to.
 * Data is stored in the mock DB (persisted via AsyncStorage + CSV).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { db, flushDb } from '@/mocks/store';
import { generateId } from '@/utils/format';

interface PayoutMethod {
  id: string;
  type: 'BANK' | 'MOMO';
  label: string;
  accountName: string;
  accountNumber: string;
  provider: string;
  isDefault: boolean;
}

export default function PayoutAccountsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);

  // Form state
  const [formType, setFormType] = useState<'BANK' | 'MOMO'>('MOMO');
  const [formProvider, setFormProvider] = useState('');
  const [formAccountName, setFormAccountName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = () => {
    // Load from the mock DB's payoutMethods array (stored per landlord)
    if (!db.payoutMethods) {
      (db as any).payoutMethods = [];
    }
    const myMethods = (db as any).payoutMethods.filter(
      (m: any) => m.landlordId === user?.id
    );
    setMethods(myMethods);
  };

  const resetForm = () => {
    setFormType('MOMO');
    setFormProvider('');
    setFormAccountName('');
    setFormAccountNumber('');
    setEditingMethod(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (method: PayoutMethod) => {
    setEditingMethod(method);
    setFormType(method.type);
    setFormProvider(method.provider);
    setFormAccountName(method.accountName);
    setFormAccountNumber(method.accountNumber);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formProvider || !formAccountName || !formAccountNumber) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    if (!db.payoutMethods) {
      (db as any).payoutMethods = [];
    }

    if (editingMethod) {
      // Update existing
      const idx = (db as any).payoutMethods.findIndex((m: any) => m.id === editingMethod.id);
      if (idx >= 0) {
        (db as any).payoutMethods[idx] = {
          ...(db as any).payoutMethods[idx],
          type: formType,
          provider: formProvider,
          accountName: formAccountName,
          accountNumber: formAccountNumber,
          label: `${formProvider} - ${formAccountNumber.slice(-4)}`,
        };
      }
    } else {
      // Add new
      const isFirst = (db as any).payoutMethods.filter((m: any) => m.landlordId === user?.id).length === 0;
      (db as any).payoutMethods.push({
        id: generateId(),
        landlordId: user?.id,
        type: formType,
        provider: formProvider,
        accountName: formAccountName,
        accountNumber: formAccountNumber,
        label: `${formProvider} - ${formAccountNumber.slice(-4)}`,
        isDefault: isFirst,
      });
    }

    await flushDb();
    loadMethods();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (method: PayoutMethod) => {
    Alert.alert('Remove Payout Method', `Delete ${method.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          (db as any).payoutMethods = (db as any).payoutMethods.filter(
            (m: any) => m.id !== method.id
          );
          await flushDb();
          loadMethods();
        },
      },
    ]);
  };

  const handleSetDefault = async (method: PayoutMethod) => {
    (db as any).payoutMethods.forEach((m: any) => {
      if (m.landlordId === user?.id) {
        m.isDefault = m.id === method.id;
      }
    });
    await flushDb();
    loadMethods();
  };

  const BANK_PROVIDERS = ['GCB Bank', 'Ecobank', 'Fidelity Bank', 'Stanbic Bank', 'Absa Bank'];
  const MOMO_PROVIDERS = ['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money'];

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {methods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Payout Accounts</Text>
            <Text style={styles.emptySub}>
              Add a bank account or mobile money number to receive rent from escrow.
            </Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {methods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodIcon}>
                    <Ionicons
                      name={method.type === 'BANK' ? 'business-outline' : 'phone-portrait-outline'}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodProvider}>{method.provider}</Text>
                    <Text style={styles.methodAccount}>{method.accountName}</Text>
                    <Text style={styles.methodNumber}>
                      ••••{method.accountNumber.slice(-4)}
                    </Text>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>

                <View style={styles.methodActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      style={styles.methodActionBtn}
                      onPress={() => handleSetDefault(method)}
                    >
                      <Ionicons name="star-outline" size={16} color={colors.primary} />
                      <Text style={[styles.methodActionText, { color: colors.primary }]}>
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.methodActionBtn}
                    onPress={() => openEdit(method)}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.text} />
                    <Text style={styles.methodActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.methodActionBtn}
                    onPress={() => handleDelete(method)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.methodActionText, { color: colors.error }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Button title="Add Payout Method" onPress={openAdd} style={styles.addBtn} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMethod ? 'Edit Payout Method' : 'Add Payout Method'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type selector */}
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, formType === 'MOMO' && styles.typeBtnActive]}
                  onPress={() => {
                    setFormType('MOMO');
                    setFormProvider('');
                  }}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={18}
                    color={formType === 'MOMO' ? '#FFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      formType === 'MOMO' && styles.typeBtnTextActive,
                    ]}
                  >
                    Mobile Money
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, formType === 'BANK' && styles.typeBtnActive]}
                  onPress={() => {
                    setFormType('BANK');
                    setFormProvider('');
                  }}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={formType === 'BANK' ? '#FFF' : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      formType === 'BANK' && styles.typeBtnTextActive,
                    ]}
                  >
                    Bank Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Provider */}
              <Text style={styles.fieldLabel}>
                {formType === 'BANK' ? 'Bank' : 'Network'}
              </Text>
              <View style={styles.providerList}>
                {(formType === 'BANK' ? BANK_PROVIDERS : MOMO_PROVIDERS).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.providerChip,
                      formProvider === p && styles.providerChipActive,
                    ]}
                    onPress={() => setFormProvider(p)}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        formProvider === p && styles.providerChipTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Account Name */}
              <Text style={styles.fieldLabel}>Account Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kwame Mensah"
                  value={formAccountName}
                  onChangeText={setFormAccountName}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Account/Phone Number */}
              <Text style={styles.fieldLabel}>
                {formType === 'BANK' ? 'Account Number' : 'Phone Number'}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={formType === 'BANK' ? '1234567890' : '0241234567'}
                  value={formAccountNumber}
                  onChangeText={setFormAccountNumber}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={styles.inputDoneButton} onPress={Keyboard.dismiss}>
                  <Text style={styles.inputDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={editingMethod ? 'Save Changes' : 'Add Method'}
                onPress={handleSave}
                style={styles.saveBtn}
              />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
</Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySub: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  addBtn: {
    marginTop: spacing.xl,
  },
  // Method cards
  methodsList: {
    gap: spacing.md,
  },
  methodCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodProvider: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  methodAccount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  methodNumber: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#166534',
    letterSpacing: 0.5,
  },
  methodActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  methodActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  methodActionText: {
    fontSize: 12,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalBody: {
    padding: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  providerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  providerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  providerChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  providerChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  providerChipTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputDoneButton: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    height: '100%',
  },
  inputDoneText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  saveBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
