// ============================================
// CoupleSpace - Supabase Configuration
// ============================================

import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Supabase URL ve Anon Key - bunları .env'den almalısınız
// Supabase Dashboard > Settings > API bölümünden alabilirsiniz
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Web için localStorage, native için AsyncStorage kullan
const getStorage = () => {
  if (Platform.OS === 'web') {
    // Web ortamında window kontrolü yap (SSR için)
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      };
    }
    // SSR sırasında boş storage döndür
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  // Native platformlar için AsyncStorage
  return AsyncStorage;
};

// Supabase client - singleton pattern
let _supabase: SupabaseClient<Database> | null = null;

const getClient = (): SupabaseClient<Database> => {
  if (!_supabase) {
    _supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
};

// Export - her zaman çalışan client döndürür
export const supabase = getClient();
export const getSupabase = getClient;

// Auth helper functions
export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await getSupabase().auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await getSupabase().auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await getSupabase().auth.getSession();
  return { session, error };
};
