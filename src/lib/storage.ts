import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../types';
//storage.ts
const TOKEN_KEY = 'tk2do_token';
const USER_KEY = 'tk2do_user';

export const storage = {
  getToken:    ()              => SecureStore.getItemAsync(TOKEN_KEY),
  setToken:    (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  deleteToken: ()              => SecureStore.deleteItemAsync(TOKEN_KEY),

    getUser: () => SecureStore.getItemAsync(USER_KEY),
  setUser: (user:   UserProfile) =>
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  deleteUser: () => SecureStore.deleteItemAsync(USER_KEY),
};
