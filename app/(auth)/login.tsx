import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { toast } from 'burnt';

import { ApiError } from '../../src/lib/api';
import { useAuthContext } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup } = useAuthContext();

  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [busy, setBusy]         = useState(false);

  async function submit() {
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Email and password required', preset: 'error' });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else                  await signup(email.trim(), password, name.trim() || undefined);
      router.replace('/(tabs)/today');
    } catch (err) {
      // const msg = err instanceof ApiError ? err.message : 'Something went wrong';
      console.log('Login/signup error:', err);
      // toast({ title: msg, preset: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          <Text className="text-foreground text-3xl font-semibold mb-2">TK2DO</Text>
          <Text className="text-muted-foreground mb-8">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </Text>

          {mode === 'signup' && (
            <View className="mb-4">
              <Text className="text-muted-foreground text-sm mb-2">Name (optional)</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#737373"
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          )}

          <View className="mb-4">
            <Text className="text-muted-foreground text-sm mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#737373"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-6">
            <Text className="text-muted-foreground text-sm mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#737373"
              secureTextEntry
              autoCapitalize="none"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [{ opacity: pressed || busy ? 0.7 : 1 }]}
            className="bg-primary rounded-lg py-3 items-center"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')}
            className="mt-4 items-center"
          >
            <Text className="text-muted-foreground">
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
