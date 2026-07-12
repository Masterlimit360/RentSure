import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { typography, colors, spacing } from '@/constants/theme';
import { DevMenu } from '@/components/DevMenu';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  
  const [devClicks, setDevClicks] = useState(0);
  const [showDevMenu, setShowDevMenu] = useState(false);

  const handleVersionClick = () => {
    const newCount = devClicks + 1;
    setDevClicks(newCount);
    if (newCount >= 5) {
      setDevClicks(0);
      setShowDevMenu(true);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{user?.fullName}</Text>
        <Text style={styles.info}>{user?.email}</Text>
        <Text style={styles.info}>Role: {user?.role}</Text>
        
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
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  info: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flexShrink: 1,
    flexWrap: 'wrap',
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
