// ============================================
// CoupleSpace - Modern Chat Screen
// ============================================

import { PartnerAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, FontWeights, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { Message, QuickMessages, QuickMessageType, Stickers, StickerType } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const {
    user,
    couple,
    partner,
    themeColors,
    messages,
    sendMessage,
    sendMediaMessage,
    addReaction,
  } = useApp();

  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isRecording = recorderState.isRecording;
  const recordingDuration = Math.round(recorderState.durationMillis / 1000);

  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (status.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    })();
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    const messageText = inputText.trim();
    setInputText('');
    try {
      await sendMessage(messageText);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    }
  }, [inputText, sendMessage]);

  const handlePickImage = useCallback(async () => {
    setShowAttachmentMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      try {
        await sendMediaMessage('image', result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.error('Görsel gönderilemedi:', error);
        Alert.alert('Hata', 'Görsel gönderilemedi');
      }
      setIsUploading(false);
    }
  }, [sendMediaMessage]);

  const handleTakePhoto = useCallback(async () => {
    setShowAttachmentMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      try {
        await sendMediaMessage('image', result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.error('Fotoğraf gönderilemedi:', error);
        Alert.alert('Hata', 'Fotoğraf gönderilemedi');
      }
      setIsUploading(false);
    }
  }, [sendMediaMessage]);

  const handlePickFile = useCallback(async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setIsUploading(true);
        try {
          await sendMediaMessage('file', file.uri, {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.mimeType,
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          console.error('Dosya gönderilemedi:', error);
          Alert.alert('Hata', 'Dosya gönderilemedi');
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Dosya seçilemedi:', error);
    }
  }, [sendMediaMessage]);

  const startRecording = useCallback(async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('İzin Gerekli', 'Mikrofon erişimi için izin vermeniz gerekiyor');
        return;
      }
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Kayıt başlatılamadı:', error);
      Alert.alert('Hata', 'Ses kaydı başlatılamadı');
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri && recordingDuration >= 1) {
        setIsUploading(true);
        await sendMediaMessage('audio', uri, { duration: recordingDuration });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Kayıt durdurulamadı:', error);
    }
  }, [audioRecorder, isRecording, recordingDuration, sendMediaMessage]);

  const handleSendSticker = useCallback(async (sticker: StickerType) => {
    setShowStickerPicker(false);
    try {
      await sendMessage(sticker, 'sticker');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Sticker gönderilemedi:', error);
    }
  }, [sendMessage]);

  const handleQuickMessage = useCallback(async (type: QuickMessageType) => {
    try {
      await sendMessage(QuickMessages[type], 'quickMessage');
      setShowQuickMessages(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Hızlı mesaj gönderilemedi:', error);
    }
  }, [sendMessage]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Reaksiyon eklenemedi:', error);
    }
  }, [addReaction]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMessageContent = useCallback((item: Message, isMe: boolean) => {
    switch (item.messageType) {
      case 'image':
        return (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(item.mediaUrl || null)}>
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      case 'audio':
        return (
          <View style={styles.audioMessage}>
            <TouchableOpacity style={[styles.playButton, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : themeColors.primary + '15' }]}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
            <View style={styles.audioWave}>
              {[12, 20, 8, 16, 24, 12, 18].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: h,
                      backgroundColor: isMe ? 'rgba(255,255,255,0.4)' : themeColors.primary + '40',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.audioDuration, { color: isMe ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }]}>
              {formatDuration(item.mediaDuration || 0)}
            </Text>
          </View>
        );
      case 'file':
        return (
          <TouchableOpacity style={styles.fileMessage}>
            <View style={[styles.fileIconBg, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : themeColors.primary + '10' }]}>
              <Text style={styles.fileIcon}>📄</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: isMe ? '#fff' : themeColors.text }]} numberOfLines={1}>
                {item.fileName || 'Dosya'}
              </Text>
              <Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.6)' : themeColors.textSecondary }]}>
                {formatFileSize(item.fileSize)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      case 'sticker':
        return <Text style={styles.stickerText}>{item.content}</Text>;
      default:
        return (
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : themeColors.text }]}>
            {item.content}
          </Text>
        );
    }
  }, [themeColors]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const isSticker = item.messageType === 'sticker';
    const isImage = item.messageType === 'image';

    const nextMessage = sortedMessages[index + 1];
    const showDate = !nextMessage ||
      format(new Date(item.createdAt), 'yyyy-MM-dd') !==
      format(new Date(nextMessage.createdAt), 'yyyy-MM-dd');

    return (
      <Animated.View entering={FadeIn.duration(250)}>
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          <TouchableOpacity
            onLongPress={() => handleReaction(item.id, '❤️')}
            activeOpacity={0.8}
            style={[
              isSticker ? styles.stickerBubble : isImage ? styles.imageBubble : styles.messageBubble,
              !isSticker && (isMe
                ? [styles.messageBubbleMe, { backgroundColor: themeColors.primary }]
                : [styles.messageBubbleOther, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight, borderWidth: 1 }]),
            ]}
          >
            {renderMessageContent(item, isMe)}

            {!isSticker && (
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    { color: isMe ? 'rgba(255,255,255,0.6)' : themeColors.textTertiary },
                  ]}
                >
                  {format(new Date(item.createdAt), 'HH:mm')}
                </Text>
                {isMe && (
                  <Text style={[styles.readStatus, { color: item.isRead ? '#A7F3D0' : 'rgba(255,255,255,0.5)' }]}>
                    {item.isRead ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            )}

            {item.reactions && item.reactions.length > 0 && (
              <View style={[styles.reactions, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight }]}>
                {item.reactions.map((r, i) => (
                  <Text key={i} style={styles.reactionEmoji}>{r.emoji}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showDate && (
          <View style={styles.dateHeader}>
            <View style={[styles.datePill, { backgroundColor: themeColors.borderLight }]}>
              <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
                {format(new Date(item.createdAt), 'd MMMM yyyy', { locale: tr })}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [user?.id, themeColors, handleReaction, sortedMessages, renderMessageContent]);

  const ListEmptyComponent = useCallback(() => (
    <View style={[styles.emptyState, { transform: [{ scaleY: -1 }] }]}>
      <View style={[styles.emptyIconBg, { backgroundColor: themeColors.primaryLight }]}>
        <Text style={styles.emptyEmoji}>💌</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        Henüz mesaj yok
      </Text>
      <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
        İlk mesajı sen gönder! 💕
      </Text>
    </View>
  ), [themeColors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={{ backgroundColor: themeColors.surface, paddingTop: insets.top }}>
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <PartnerAvatar user={partner} size={42} />
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
          <TouchableOpacity
            onPress={() => setShowQuickMessages(!showQuickMessages)}
            style={[styles.headerAction, { backgroundColor: themeColors.primaryLight }]}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={sortedMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        inverted
        removeClippedSubviews={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={ListEmptyComponent}
      />

      {/* Upload Loading */}
      {isUploading && (
        <View style={[styles.uploadingBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.borderLight }]}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={[styles.uploadingText, { color: themeColors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={[styles.recordingBar, { backgroundColor: themeColors.surface }]}>
          <View style={styles.recordingDot} />
          <Text style={[styles.recordingText, { color: themeColors.text }]}>
            Kayıt yapılıyor... {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity onPress={stopRecording} style={[styles.stopButton, { backgroundColor: themeColors.error + '15' }]}>
            <Text style={styles.stopIcon}>⏹️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Messages */}
      {showQuickMessages && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[styles.quickMessagesPanel, { backgroundColor: themeColors.surface, borderTopColor: themeColors.borderLight }]}
        >
          <Text style={[styles.quickMessagesTitle, { color: themeColors.text }]}>
            Hızlı Mesajlar
          </Text>
          <View style={styles.quickMessagesGrid}>
            {(Object.keys(QuickMessages) as QuickMessageType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleQuickMessage(type)}
                style={[styles.quickMessageButton, { backgroundColor: themeColors.primaryLight }]}
              >
                <Text style={[styles.quickMessageText, { color: themeColors.primaryDark }]}>
                  {QuickMessages[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Sticker Picker */}
      <Modal
        visible={showStickerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStickerPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStickerPicker(false)}>
          <View style={[styles.stickerPicker, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.stickerTitle, { color: themeColors.text }]}>Sticker Seç</Text>
            <View style={styles.stickerGrid}>
              {Stickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker}
                  onPress={() => handleSendSticker(sticker)}
                  style={[styles.stickerItem, { backgroundColor: themeColors.borderLight }]}
                >
                  <Text style={styles.stickerItemText}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Attachment Menu */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentMenu(false)}>
          <View style={[styles.attachmentMenu, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: themeColors.border }]} />
            {[
              { icon: '🖼️', label: 'Galeri', onPress: handlePickImage, color: '#818CF8' },
              { icon: '📸', label: 'Kamera', onPress: handleTakePhoto, color: '#F472B6' },
              { icon: '📁', label: 'Dosya', onPress: handlePickFile, color: '#FB923C' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.attachmentOption} onPress={item.onPress}>
                <View style={[styles.attachmentIconBg, { backgroundColor: item.color + '15' }]}>
                  <Text style={styles.attachmentIcon}>{item.icon}</Text>
                </View>
                <Text style={[styles.attachmentText, { color: themeColors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Fullscreen Image */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable style={styles.imageViewerOverlay} onPress={() => setSelectedImage(null)}>
          <TouchableOpacity style={styles.imageViewerCloseButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>

      {/* Input Area */}
      <View style={[styles.inputArea, { backgroundColor: themeColors.background }]}>
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight }]}>
          <TouchableOpacity onPress={() => setShowStickerPicker(true)} style={styles.inputIconButton}>
            <Text style={styles.inputIcon}>😊</Text>
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesaj yaz..."
            placeholderTextColor={themeColors.textTertiary}
            style={[styles.input, { color: themeColors.text }]}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity style={styles.inputIconButton} onPress={() => setShowAttachmentMenu(true)}>
            <Text style={styles.inputIcon}>📎</Text>
          </TouchableOpacity>
        </View>

        {inputText.trim() ? (
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: themeColors.primary }, Shadows.colored(themeColors.primary)]}
          >
            <Text style={styles.sendEmoji}>➤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={[styles.sendButton, { backgroundColor: isRecording ? themeColors.error : themeColors.primary }, Shadows.colored(themeColors.primary)]}
          >
            <Text style={styles.sendEmoji}>{isRecording ? '⏹️' : '🎤'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm + 2,
    borderBottomWidth: 0,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.2,
  },
  typingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  datePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  dateText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  messageRow: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
  },
  messageBubbleMe: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  stickerBubble: {
    padding: Spacing.sm,
  },
  imageBubble: {
    maxWidth: '78%',
    padding: 3,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  stickerText: {
    fontSize: 60,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minWidth: 150,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
  },
  audioWave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginHorizontal: Spacing.sm,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  fileIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  fileSize: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
  },
  readStatus: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
  },
  reactions: {
    position: 'absolute',
    bottom: -10,
    right: 10,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    ...Shadows.small,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  uploadingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  stopButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  stopIcon: {
    fontSize: 20,
  },
  quickMessagesPanel: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  quickMessagesTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
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
    fontWeight: FontWeights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  stickerPicker: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  stickerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  stickerItem: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  stickerItemText: {
    fontSize: 32,
  },
  attachmentMenu: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  attachmentOption: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    minWidth: 80,
  },
  attachmentIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIcon: {
    fontSize: 26,
  },
  attachmentText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    minHeight: 48,
  },
  inputIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 4,
    maxHeight: 120,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendEmoji: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: FontWeights.bold,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
