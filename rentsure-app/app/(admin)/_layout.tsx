import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right' }} />;
}
