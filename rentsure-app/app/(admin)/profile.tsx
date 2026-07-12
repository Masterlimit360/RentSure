import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { typography, colors, spacing } from '@/constants/theme';
import { DevMenu } from '@/components/DevMenu';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  
  const [devClicks, setDevClicks] = useState(0);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '' });

  const handleVersionClick = () => {
    const newCount = devClicks + 1;
    setDevClicks(newCount);
    if (newCount >= 5) {
      setDevClicks(0);
      setShowDevMenu(true);
    }
  };

  const handleEditPress = () => setIsEditing(true);
  const handleSavePress = () => {
    // update mutation logic here
    setIsEditing(false);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileCard}>
          <View style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                {isEditing ? (
                  <TextInput
                    style={[styles.name, styles.inlineInput]}
                    value={editForm.fullName}
                    onChangeText={(t) => setEditForm({ ...editForm, fullName: t })}
                    placeholder="Full Name"
                    autoFocus
                  />
                ) : (
                  <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
                )}
                
                {isEditing ? (
                  <View style={styles.actionIconRow}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSavePress} style={styles.iconBtn}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleEditPress} style={styles.editBtn}>
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <TextInput
                  style={[styles.phone, styles.inlineInput]}
                  value={editForm.phone}
                  onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.phone} numberOfLines={1}>{user?.phone || 'No phone set'}</Text>
              )}
              
              <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
              
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        <View style={styles.spacer} />
        
        <Button 
          title="Logout" 
          onPress={() => logoutMutation.mutate()} 
          variant="outline"
        />

        <TouchableOpacity onPress={handleVersionClick} style={styles.versionContainer} activeOpacity={1}>
          <Text style={styles.versionText}>RentSure App v1.0.0 (Demo)</Text>
        </TouchableOpacity>
      </View>

      {showDevMenu && (
        <DevMenu visible={showDevMenu} onClose={() => setShowDevMenu(false)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
  },
  phone: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    letterSpacing: 1,
  },
  inlineInput: {
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flex: 1,
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 2,
  },
  editBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  spacer: {
    flex: 1,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
