import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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
        
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              {isEditing ? (
                <TextInput
                  style={[styles.name, styles.inlineInput]}
                  value={editForm.fullName}
                  onChangeText={(t) => setEditForm({ ...editForm, fullName: t })}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                  textAlign="center"
                />
              ) : (
                <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
              )}
              
              {isEditing ? (
                <View style={styles.actionIconRow}>
                  <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}>
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSavePress} style={styles.iconBtn}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handleEditPress} style={styles.editBtn}>
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <TextInput
                style={[styles.phone, styles.inlineInput, { marginTop: 4 }]}
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                placeholder="Phone Number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                textAlign="center"
              />
            ) : (
              <Text style={styles.phone} numberOfLines={1}>{user?.phone || 'No phone set'}</Text>
            )}
            
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: -30,
    width: '100%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'center',
  },
  phone: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 9999,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    letterSpacing: 1.5,
  },
  inlineInput: {
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: colors.text,
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    padding: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  editBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginLeft: 8,
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
