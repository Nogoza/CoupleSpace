// ============================================
// CoupleSpace - Chat Screen with Media Support
// ============================================

import { PartnerAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, Shadows, Spacing } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { Message, QuickMessages, QuickMessageType, Stickers, StickerType } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Audio } from 'expo-av';
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
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

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

  const [inputText, setInputText] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Message>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mesajları en yeniden en eskiye sırala
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Kayıt temizleme
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Mesaj gönderme
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

  // Görsel seçme
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

  // Kamera
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

  // Dosya seçme
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

  // Ses kaydı başlat
  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Mikrofon erişimi için izin vermeniz gerekiyor');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Süreyi takip et
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Kayıt başlatılamadı:', error);
      Alert.alert('Hata', 'Ses kaydı başlatılamadı');
    }
  }, []);

  // Ses kaydı durdur ve gönder
  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri && recordingDuration >= 1) {
        setIsUploading(true);
        await sendMediaMessage('audio', uri, { duration: recordingDuration });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsUploading(false);
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Kayıt durdurulamadı:', error);
      setIsRecording(false);
    }
  }, [recordingDuration, sendMediaMessage]);

  // Sticker gönder
  const handleSendSticker = useCallback(async (sticker: StickerType) => {
    setShowStickerPicker(false);
    try {
      await sendMessage(sticker, 'sticker');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Sticker gönderilemedi:', error);
    }
  }, [sendMessage]);

  // Hızlı mesaj gönderme
  const handleQuickMessage = useCallback(async (type: QuickMessageType) => {
    try {
      await sendMessage(QuickMessages[type], 'quickMessage');
      setShowQuickMessages(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Hızlı mesaj gönderilemedi:', error);
    }
  }, [sendMessage]);

  // Mesaja reaksiyon ekleme
  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Reaksiyon eklenemedi:', error);
    }
  }, [addReaction]);

  // Süreyi formatlama
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Dosya boyutunu formatlama
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Mesaj içeriği render
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
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
            <View style={styles.audioWave}>
              <View style={[styles.waveBar, { height: 12 }]} />
              <View style={[styles.waveBar, { height: 20 }]} />
              <View style={[styles.waveBar, { height: 8 }]} />
              <View style={[styles.waveBar, { height: 16 }]} />
              <View style={[styles.waveBar, { height: 24 }]} />
              <View style={[styles.waveBar, { height: 12 }]} />
              <View style={[styles.waveBar, { height: 18 }]} />
            </View>
            <Text style={[styles.audioDuration, { color: isMe ? '#fff' : themeColors.textSecondary }]}>
              {formatDuration(item.mediaDuration || 0)}
            </Text>
          </View>
        );

      case 'file':
        return (
          <TouchableOpacity style={styles.fileMessage}>
            <Text style={styles.fileIcon}>📄</Text>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: isMe ? '#fff' : themeColors.text }]} numberOfLines={1}>
                {item.fileName || 'Dosya'}
              </Text>
              <Text style={[styles.fileSize, { color: isMe ? 'rgba(255,255,255,0.7)' : themeColors.textSecondary }]}>
                {formatFileSize(item.fileSize)}
              </Text>
            </View>
          </TouchableOpacity>
        );

      case 'sticker':
        return (
          <Text style={styles.stickerText}>{item.content}</Text>
        );

      default:
        return (
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : themeColors.text }]}>
            {item.content}
          </Text>
        );
    }
  }, [themeColors]);

  // Mesaj bubble render fonksiyonu
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const isSticker = item.messageType === 'sticker';
    const isImage = item.messageType === 'image';

    const nextMessage = sortedMessages[index + 1];
    const showDate = !nextMessage ||
      format(new Date(item.createdAt), 'yyyy-MM-dd') !==
      format(new Date(nextMessage.createdAt), 'yyyy-MM-dd');

    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          <TouchableOpacity
            onLongPress={() => handleReaction(item.id, '❤️')}
            activeOpacity={0.8}
            style={[
              isSticker ? styles.stickerBubble : isImage ? styles.imageBubble : styles.messageBubble,
              !isSticker && (isMe
                ? [styles.messageBubbleMe, { backgroundColor: themeColors.primary }]
                : [styles.messageBubbleOther, { backgroundColor: themeColors.surface }]),
              !isSticker && Shadows.small,
            ]}
          >
            {renderMessageContent(item, isMe)}

            {!isSticker && (
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
            )}

            {item.reactions && item.reactions.length > 0 && (
              <View style={[styles.reactions, { backgroundColor: themeColors.surface }]}>
                {item.reactions.map((r, i) => (
                  <Text key={i} style={styles.reactionEmoji}>{r.emoji}</Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateText, { color: themeColors.textSecondary }]}>
              {format(new Date(item.createdAt), 'd MMMM yyyy', { locale: tr })}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }, [user?.id, themeColors, handleReaction, sortedMessages, renderMessageContent]);

  // Boş liste komponenti
  const ListEmptyComponent = useCallback(() => (
    <View style={[styles.emptyState, { transform: [{ scaleY: -1 }] }]}>
      <Text style={styles.emptyEmoji}>💌</Text>
      <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
        Henüz mesaj yok.{'\n'}İlk mesajı sen gönder! 💕
      </Text>
    </View>
  ), [themeColors.textSecondary]);

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

      {/* Messages List */}
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
        <View style={[styles.uploadingBar, { backgroundColor: themeColors.surface }]}>
          <ActivityIndicator size="small" color={themeColors.primary} />
          <Text style={[styles.uploadingText, { color: themeColors.text }]}>Yükleniyor...</Text>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={[styles.recordingBar, { backgroundColor: themeColors.surface }]}>
          <View style={styles.recordingDot} />
          <Text style={[styles.recordingText, { color: themeColors.text }]}>
            Kayıt yapılıyor... {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
            <Text style={styles.stopIcon}>⏹️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Messages */}
      {showQuickMessages && (
        <Animated.View
          entering={FadeInDown.duration(200)}
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

      {/* Sticker Picker Modal */}
      <Modal
        visible={showStickerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStickerPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStickerPicker(false)}>
          <View style={[styles.stickerPicker, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.stickerTitle, { color: themeColors.text }]}>Sticker Seç 💝</Text>
            <View style={styles.stickerGrid}>
              {Stickers.map((sticker) => (
                <TouchableOpacity
                  key={sticker}
                  onPress={() => handleSendSticker(sticker)}
                  style={styles.stickerItem}
                >
                  <Text style={styles.stickerItemText}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentMenu(false)}>
          <View style={[styles.attachmentMenu, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
              <Text style={styles.attachmentIcon}>🖼️</Text>
              <Text style={[styles.attachmentText, { color: themeColors.text }]}>Galeri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleTakePhoto}>
              <Text style={styles.attachmentIcon}>📸</Text>
              <Text style={[styles.attachmentText, { color: themeColors.text }]}>Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handlePickFile}>
              <Text style={styles.attachmentIcon}>📁</Text>
              <Text style={[styles.attachmentText, { color: themeColors.text }]}>Dosya</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Fullscreen Image Viewer */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={styles.imageViewerOverlay}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.imageViewerCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* Input Area - WhatsApp Style */}
      <View style={[styles.inputArea, { backgroundColor: themeColors.background }]}>
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surface }]}>
          {/* Emoji/Sticker Button */}
          <TouchableOpacity
            onPress={() => setShowStickerPicker(true)}
            style={styles.inputIconButton}
          >
            <Text style={styles.inputIcon}>😊</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesaj"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text }]}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          {/* Attachment Button */}
          <TouchableOpacity
            style={styles.inputIconButton}
            onPress={() => setShowAttachmentMenu(true)}
          >
            <Text style={styles.inputIcon}>📎</Text>
          </TouchableOpacity>

          {/* Camera Button */}
          <TouchableOpacity style={styles.inputIconButton} onPress={handleTakePhoto}>
            <Text style={styles.inputIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Send/Mic Button */}
        {inputText.trim() ? (
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
          >
            <Text style={styles.sendEmoji}>➤</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
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
  stickerBubble: {
    padding: Spacing.sm,
  },
  imageBubble: {
    maxWidth: '80%',
    padding: 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  stickerText: {
    fontSize: 64,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: FontSizes.xs,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: FontSizes.xs,
    marginTop: 2,
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
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  uploadingText: {
    fontSize: FontSizes.sm,
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
    backgroundColor: '#FF0000',
  },
  recordingText: {
    flex: 1,
    fontSize: FontSizes.md,
  },
  stopButton: {
    padding: Spacing.sm,
  },
  stopIcon: {
    fontSize: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  stickerPicker: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  stickerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  stickerItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerItemText: {
    fontSize: 36,
  },
  attachmentMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  attachmentOption: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachmentIcon: {
    fontSize: 40,
  },
  attachmentText: {
    fontSize: FontSizes.sm,
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
    borderRadius: 25,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    minHeight: 48,
  },
  inputIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIcon: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
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
    fontSize: 22,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});