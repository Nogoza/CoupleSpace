// ============================================
// CoupleSpace - Modern Tabs Layout
// ============================================

import { FontSizes, Shadows } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { themeColors } = useApp();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.text,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopWidth: 0,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          ...Platform.select({
            android: {
              elevation: 12,
            },
            ios: {
              shadowColor: '#1A1A2E',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
          }),
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: themeColors.surface,
          ...Shadows.small,
        },
        headerTintColor: themeColors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: FontSizes.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Günlük',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'create' : 'create-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Anılar',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'images' : 'images-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Mesajlar',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
