// ============================================
// CoupleSpace - Modern Love Ping Button
// ============================================

import { BorderRadius, FontSizes, FontWeights, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
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
    scale.value = withSpring(0.94, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const triggerHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleQuickPing = async () => {
    heartScale.value = withSequence(
      withSpring(1.4),
      withSpring(0.85),
      withSpring(1.15),
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
        <AnimatedTouchable
          onPress={handleQuickPing}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={() => setShowModal(true)}
          delayLongPress={500}
          activeOpacity={0.85}
          style={[styles.pingButton, animatedStyle]}
        >
          <Animated.View style={heartAnimatedStyle}>
            <Image
              source={require('@/assets/images/LovePing.png')}
              style={styles.lovePingImage}
              resizeMode="contain"
            />
          </Animated.View>
        </AnimatedTouchable>

        <Text style={[styles.hint, { color: themeColors.textSecondary }]}>
          Not eklemek için basılı tut
        </Text>

        {showSuccess && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[styles.successBubble, { backgroundColor: themeColors.success }]}
          >
            <Text style={styles.successText}>
              {partnerName}'e kalp yolladın! 💕
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Note Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }, Shadows.large]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>💌 Özel Not Ekle</Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {partnerName}'e kısa bir mesaj gönder
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Seni düşünüyorum..."
              placeholderTextColor={themeColors.textTertiary}
              multiline
              maxLength={100}
              style={[styles.noteInput, { color: themeColors.text, backgroundColor: themeColors.borderLight, borderColor: themeColors.border }]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.modalButton, { backgroundColor: themeColors.borderLight }]}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendWithNote}
                style={[styles.modalButton, { backgroundColor: themeColors.heart }, Shadows.colored(themeColors.heart)]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Gönder 💕</Text>
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
    marginVertical: Spacing.sm,
  },
  pingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  lovePingImage: {
    width: 200,
    height: 50,
    borderRadius: 30,
  },
  hint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    fontWeight: FontWeights.medium,
  },
  successBubble: {
    position: 'absolute',
    top: -40,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  noteInput: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: FontSizes.md,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
