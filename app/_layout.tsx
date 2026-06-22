import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue } from '../src/lib/offlineQueue';
import { api } from '../src/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '../src/lib/queryKeys';
import { useAuthContext } from '../src/context/AuthContext';

function OfflineFlush() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushQueue({
          CREATE_TASK: async (payload: any) => {
            await api.tasks.create(payload);
            queryClient.invalidateQueries({ queryKey: taskKeys.all() });
          },
          UPDATE_TASK: async (payload: any) => {
            await api.tasks.update(payload.id, { completed: payload.completed });
            queryClient.invalidateQueries({ queryKey: taskKeys.all() });
          },
          DELETE_TASK: async (payload: any) => {
            await api.tasks.delete(payload.id);
            queryClient.invalidateQueries({ queryKey: taskKeys.all() });
          },
        });
        queryClient.resumePausedMutations();
      }
    });
    return unsub;
  }, [queryClient]);

  return null;
}

// ── separate component so it lives inside AuthProvider ───────────────────────
function Navigation() {
  const { token } = useAuthContext();  // ← inside a component ✅

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f0f' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Protected guard={!!token}>  {/* ← !! converts string|null to boolean */}
        <Stack.Screen name="(tabs)" />
    </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>           {/* ← AuthProvider must wrap Navigation */}
        <SafeAreaProvider>
          <OfflineFlush />
          <Navigation />       {/* ← useAuthContext works here — inside AuthProvider */}
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryProvider>
  );
}