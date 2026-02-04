// ============================================
// CoupleSpace - Love Ping Button Component
// ============================================

import { BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface LovePingButtonProps {
  partnerName?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function LovePingButton({ partnerName = 'Sevgilin' }: LovePingButtonProps) {
  const { themeColors, sendLovePing } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const triggerHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleQuickPing = async () => {
    heartScale.value = withSequence(
      withSpring(1.3),
      withSpring(0.9),
      withSpring(1.1),
      withTiming(1, { duration: 200 }, () => {
        runOnJS(triggerHaptic)();
      })
    );

    await sendLovePing();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSendWithNote = async () => {
    await sendLovePing(note.trim() || undefined);
    setNote('');
    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Quick Ping Button */}
        <AnimatedTouchable
          onPress={handleQuickPing}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={() => setShowModal(true)}
          delayLongPress={500}
          style={[
            styles.pingButton,
            { backgroundColor: themeColors.heart },
            Shadows.medium,
            animatedStyle,
          ]}
        >
          <Animated.Text style={[styles.heartEmoji, heartAnimatedStyle]}>
            💕
          </Animated.Text>
          <Text style={styles.pingText}>Love Ping</Text>
        </AnimatedTouchable>

        <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
          Basılı tut → not ekle
        </Text>

        {/* Success Message */}
        {showSuccess && (
          <Animated.View
            style={[
              styles.successBubble,
              { backgroundColor: themeColors.success },
            ]}
          >
            <Text style={styles.successText}>
              {partnerName}'e kalp yolladın! 💕
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Note Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.surface },
              Shadows.large,
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              💌 Özel Not Ekle
            </Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {partnerName}'e kısa bir mesaj gönder
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Seni düşünüyorum..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              maxLength={100}
              style={[
                styles.noteInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.border },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>
                  İptal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendWithNote}
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.heart },
                ]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Gönder 💕
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  pingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  heartEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  pingText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  hint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
  },
  successBubble: {
    position: 'absolute',
    top: -40,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  noteInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: FontSizes.md,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
