import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuthContext } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  function confirmLogout() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-5 border-b border-border bg-card">
        <Text className="text-foreground text-2xl font-semibold">Settings</Text>
      </View>

      <View className="p-4 gap-4">
        <View className="bg-card border border-border rounded-lg p-4">
          <Text className="text-muted-foreground text-xs uppercase mb-1">Account</Text>
          <Text className="text-foreground text-base">{user?.name ?? 'Signed in'}</Text>
          <Text className="text-muted-foreground text-sm">{user?.email ?? ''}</Text>
        </View>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="bg-card border border-border rounded-lg p-4 flex-row items-center justify-between"
        >
          <Text className="text-destructive text-base">Sign out</Text>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
