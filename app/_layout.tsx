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

// ── OfflineFlush must live INSIDE QueryProvider in the tree ──────────────────
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

export default function RootLayout() {
  return (
    <QueryProvider>              {/* ← your wrapper, not raw QueryClientProvider */}
      <AuthProvider>
        <SafeAreaProvider>
          <OfflineFlush />       {/* ← inside QueryProvider so useQueryClient works */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f0f0f' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryProvider>
  );
}