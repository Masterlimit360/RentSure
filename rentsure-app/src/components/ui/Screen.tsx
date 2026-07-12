/**
 * Standard screen wrapper for RentSure.
 *
 * Ensures consistent background color and respects device safe areas
 * (notches, home indicators) so content is never obscured.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** If true, removes horizontal padding for edge-to-edge content like maps. */
  noPadding?: boolean;
  /** Override safe area edges. Default avoids double-padding when navigation headers are present. */
  safeAreaEdges?: Edge[];
}

export function Screen({ children, style, noPadding = false, safeAreaEdges = ['bottom', 'left', 'right'] }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      <View style={[styles.container, !noPadding && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
});
