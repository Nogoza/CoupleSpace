// ============================================
// CoupleSpace - Chat Screen
// ============================================

import { PartnerAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { Message, QuickMessages, QuickMessageType } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn
} from 'react-native-reanimated';

export default function ChatScreen() {
  const {
    user,
    partner,
    themeColors,
    messages,
    sendMessage,
    addReaction,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    await sendMessage(inputText.trim());
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQuickMessage = async (type: QuickMessageType) => {
    await sendMessage(QuickMessages[type], 'quickMessage');
    setShowQuickMessages(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const showDate =
      index === 0 ||
      format(new Date(item.createdAt), 'yyyy-MM-dd') !==
      format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd');

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {format(new Date(item.createdAt), 'd MMMM yyyy', { locale: tr })}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          <TouchableOpacity
            onLongPress={() => handleReaction(item.id, '❤️')}
            style={[
              styles.messageBubble,
              isMe
                ? [styles.messageBubbleMe, { backgroundColor: themeColors.primary }]
                : [styles.messageBubbleOther, { backgroundColor: themeColors.surface }],
              Shadows.small,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isMe ? '#FFFFFF' : themeColors.text },
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  { color: isMe ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary },
                ]}
              >
                {format(new Date(item.createdAt), 'HH:mm')}
              </Text>
              {isMe && (
                <Text style={styles.readStatus}>
                  {item.isRead ? '✓✓' : '✓'}
                </Text>
              )}
            </View>

            {/* Reactions */}
            {item.reactions.length > 0 && (
              <View
                style={[
                  styles.reactions,
                  { backgroundColor: themeColors.surface },
                ]}
              >
                {item.reactions.map((r, i) => (
                  <Text key={i} style={styles.reactionEmoji}>
                    {r.emoji}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Mesajları ters çevir (inverted FlatList için)
  const reversedMessages = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <PartnerAvatar user={partner} size={40} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: themeColors.text }]}>
              {partner?.displayName || 'Sevgilim'}
            </Text>
            {isTyping && (
              <Text style={[styles.typingText, { color: themeColors.primary }]}>
                yazıyor...
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Messages List - Inverted */}
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        inverted
        ListEmptyComponent={
          <View style={[styles.emptyState, { transform: [{ scaleY: -1 }] }]}>
            <Text style={styles.emptyEmoji}>💌</Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Henüz mesaj yok.{'\n'}İlk mesajı sen gönder! 💕
            </Text>
          </View>
        }
      />

      {/* Quick Messages */}
      {showQuickMessages && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.quickMessagesPanel, { backgroundColor: themeColors.surface }]}
        >
          <Text style={[styles.quickMessagesTitle, { color: themeColors.text }]}>
            Hızlı Mesajlar 💬
          </Text>
          <View style={styles.quickMessagesGrid}>
            {(Object.keys(QuickMessages) as QuickMessageType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleQuickMessage(type)}
                style={[
                  styles.quickMessageButton,
                  { backgroundColor: themeColors.primaryLight },
                ]}
              >
                <Text style={[styles.quickMessageText, { color: themeColors.primaryDark }]}>
                  {QuickMessages[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Input Area */}
      <View style={[styles.inputArea, { backgroundColor: themeColors.surface }]}>
        <TouchableOpacity
          onPress={() => setShowQuickMessages(!showQuickMessages)}
          style={[
            styles.quickButton,
            showQuickMessages && { backgroundColor: themeColors.primary },
          ]}
        >
          <Text style={styles.quickButtonEmoji}>⚡</Text>
        </TouchableOpacity>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={themeColors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: themeColors.background,
              color: themeColors.text,
            },
          ]}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim()
                ? themeColors.primary
                : themeColors.border,
            },
          ]}
        >
          <Text style={styles.sendEmoji}>💕</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  headerName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  typingText: {
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  messageRow: {
    marginVertical: Spacing.xs,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  messageTime: {
    fontSize: FontSizes.xs,
  },
  readStatus: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  reactions: {
    position: 'absolute',
    bottom: -10,
    right: 10,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  quickMessagesPanel: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quickMessagesTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  quickMessagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickMessageButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  quickMessageText: {
    fontSize: FontSizes.sm,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quickButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  quickButtonEmoji: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    fontSize: FontSizes.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  sendEmoji: {
    fontSize: 20,
  },
});