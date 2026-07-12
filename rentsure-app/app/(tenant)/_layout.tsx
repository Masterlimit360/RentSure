import { Stack } from 'expo-router';

export default function TenantStackLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }} />;
}
