// import { useAuthContext } from '@/src/context/AuthContext';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';

export default function Index() {
  const { token, loading } = useAuthContext();
  if (loading) return <View className="flex-1 bg-background" />;
  console.log('Auth token on index:', token);
  return <Redirect href={token ? '/(tabs)/today': '/(auth)/login'  } />;
}
