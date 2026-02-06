// ============================================
// CoupleSpace - Settings Screen
// ============================================

import { Card } from '@/components/ui/Card';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, Spacing, Themes } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { ThemeType } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const ThemePreview = {
  softPink: { name: 'Pembe Rüya', emoji: '🌸' },
  lavender: { name: 'Lavanta', emoji: '💜' },
  nightBlue: { name: 'Gece Mavisi', emoji: '🌙' },
  mintGreen: { name: 'Nane Yeşili', emoji: '🌿' },
  peach: { name: 'Şeftali', emoji: '🍑' },
};

export default function SettingsScreen() {
  const router = useRouter();
  const {
    themeColors,
    user,
    couple,
    partner,
    settings,
    theme,
    changeTheme,
    updateSettings,
    logout,
    disconnectCouple,
    createCouple,
    joinCouple,
    updateNickname,
    updateProfilePhoto,
    removeProfilePhoto,
  } = useApp();

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [nickname, setNickname] = useState(couple?.nicknames?.[user?.id || ''] || '');
  const [pairingCode, setPairingCode] = useState(couple?.pairingCode || '');
  const [joinCode, setJoinCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleThemeChange = async (newTheme: ThemeType) => {
    await Haptics.selectionAsync();
    await changeTheme(newTheme);
    setShowThemePicker(false);
  };

  // Profil fotoğrafı seçme
  const handlePickImage = async (useCamera: boolean = false) => {
    setShowPhotoOptions(false);

    try {
      let result: ImagePicker.ImagePickerResult;

      if (useCamera) {
        // Kamera izni iste
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // Galeri izni iste
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        const { error } = await updateProfilePhoto(result.assets[0].uri);
        setIsUploadingPhoto(false);

        if (error) {
          Alert.alert('Hata', error);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('✅ Başarılı', 'Profil fotoğrafınız güncellendi!');
        }
      }
    } catch (error) {
      setIsUploadingPhoto(false);
      console.error('Image picker error:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  // Profil fotoğrafını kaldır
  const handleRemovePhoto = async () => {
    setShowPhotoOptions(false);

    Alert.alert(
      'Fotoğrafı Kaldır',
      'Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);
            const { error } = await removeProfilePhoto();
            setIsUploadingPhoto(false);

            if (error) {
              Alert.alert('Hata', error);
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Başarılı', 'Profil fotoğrafınız kaldırıldı!');
            }
          },
        },
      ]
    );
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    await Haptics.selectionAsync();
    await updateSettings({ [key]: value });
  };

  // Eşleşme kodu oluştur
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      console.log('Starting code generation...');
      const code = await createCouple();
      console.log('Code generated:', code);
      setPairingCode(code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Code generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      Alert.alert('Hata', `Kod oluşturulurken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Kodu kopyala
  const handleCopyCode = async () => {
    if (pairingCode) {
      await Clipboard.setStringAsync(pairingCode);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Kopyalandı', 'Kod panoya kopyalandı!');
    }
  };

  // Kodu paylaş
  const handleShareCode = async () => {
    if (pairingCode) {
      try {
        await Share.share({
          message: `💕 CoupleSpace'te benimle bağlan!\n\nEşleşme kodum: ${pairingCode}\n\nUygulamayı indir ve bu kodu gir!`,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  // Koda katıl
  const handleJoinWithCode = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli geçerli bir kod girin.');
      return;
    }

    setIsJoining(true);
    try {
      const success = await joinCouple(joinCode.toUpperCase());
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎉 Başarılı!', 'Partnerinizle başarıyla eşleştiniz!');
        setShowJoinModal(false);
        setJoinCode('');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Hata', 'Kendi kodunuza katılamazsınız veya bu kod zaten kullanılmış.');
      }
    } catch (error) {
      console.error('Join error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Bağlanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      '💔 Bağlantıyı Kes',
      'Partnerinizle bağlantınızı kesmek istediğinize emin misiniz?\n\nVerileriniz silinmeyecek, sadece bağlantı kesilecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Bağlantıyı Kes',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectCouple(false);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Bağlantı Kesildi', 'Partnerinizle bağlantınız kesildi.');
            } catch (error) {
              console.error('Disconnect error:', error);
              Alert.alert('Hata', 'Bağlantı kesilirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(onboarding)');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const relationshipDays = couple?.createdAt
    ? differenceInDays(new Date(), new Date(couple.createdAt))
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={() => setShowPhotoOptions(true)}
                disabled={isUploadingPhoto}
                style={styles.avatarContainer}
              >
                {isUploadingPhoto ? (
                  <View style={[styles.avatar, { backgroundColor: themeColors.primaryLight }]}>
                    <ActivityIndicator color={themeColors.primary} />
                  </View>
                ) : (
                  <ProfileAvatar user={user} size={60} />
                )}
                <View style={[styles.editBadge, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.editBadgeText}>📷</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: themeColors.text }]}>
                  {user?.displayName || user?.name || 'Kullanıcı'}
                </Text>
                {partner && (
                  <Text style={[styles.partnerName, { color: themeColors.textSecondary }]}>
                    ❤️ {partner.displayName || partner.name} ile
                  </Text>
                )}
              </View>
            </View>
            {couple && (
              <View style={[styles.statsRow, { backgroundColor: themeColors.primaryLight }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: themeColors.primaryDark }]}>
                    {relationshipDays}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.primary }]}>gün</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: themeColors.primaryDark }]}>
                    {format(new Date(couple.createdAt), 'd MMM', { locale: tr })}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.primary }]}>başlangıç</Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Pairing Section - Eşleşme Kodu */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🔗 Eşleşme</Text>
          <Card>
            {!partner ? (
              <>
                {/* Kod oluştur veya mevcut kodu göster */}
                {pairingCode || couple?.pairingCode ? (
                  <View style={styles.codeSection}>
                    <Text style={[styles.codeSectionTitle, { color: themeColors.text }]}>
                      Eşleşme Kodunuz
                    </Text>
                    <Text style={[styles.codeSectionHint, { color: themeColors.textSecondary }]}>
                      Bu kodu partnerinizle paylaşın
                    </Text>
                    <View style={[styles.codeDisplay, { backgroundColor: themeColors.primaryLight }]}>
                      <Text style={[styles.codeText, { color: themeColors.primaryDark }]}>
                        {pairingCode || couple?.pairingCode}
                      </Text>
                    </View>
                    <View style={styles.codeActions}>
                      <TouchableOpacity
                        style={[styles.codeButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleCopyCode}
                      >
                        <Text style={styles.codeButtonText}>📋 Kopyala</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.codeButton, { backgroundColor: themeColors.accent }]}
                        onPress={handleShareCode}
                      >
                        <Text style={styles.codeButtonText}>📤 Paylaş</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.settingRow}
                    onPress={handleGenerateCode}
                    disabled={isGenerating}
                  >
                    <View style={styles.settingLeft}>
                      <Text style={styles.settingIcon}>🔑</Text>
                      <View>
                        <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                          {isGenerating ? 'Oluşturuluyor...' : 'Kod Oluştur'}
                        </Text>
                        <Text style={[styles.settingHint, { color: themeColors.textSecondary }]}>
                          Partnerinizin size bağlanması için kod oluşturun
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                )}

                {/* Koda katıl */}
                <TouchableOpacity
                  style={[styles.settingRow, styles.settingRowBorder]}
                  onPress={() => setShowJoinModal(true)}
                >
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>💕</Text>
                    <View>
                      <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                        Koda Katıl
                      </Text>
                      <Text style={[styles.settingHint, { color: themeColors.textSecondary }]}>
                        Partnerinizin kodunu girerek bağlanın
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.connectedSection}>
                {/* Profil Fotoğrafları ve Kalp */}
                <View style={styles.coupledAvatars}>
                  <ProfileAvatar user={user} size={60} showBorder borderColor={themeColors.primary} />
                  <View style={styles.heartContainer}>
                    <Text style={styles.heartEmoji}>💕</Text>
                  </View>
                  <ProfileAvatar user={partner} size={60} showBorder borderColor={themeColors.primary} />
                </View>
                <Text style={[styles.connectedTitle, { color: themeColors.text }]}>
                  Bağlısınız!
                </Text>
                <Text style={[styles.connectedHint, { color: themeColors.textSecondary }]}>
                  {partner.displayName || partner.name} ile eşleşmiş durumdasınız
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Theme Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🎨 Görünüm</Text>
          <Card>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowThemePicker(true)}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{ThemePreview[theme].emoji}</Text>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Tema</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>
                  {ThemePreview[theme].name}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Notifications Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🔔 Bildirimler</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💌</Text>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Mesaj Bildirimleri</Text>
              </View>
              <Switch
                value={settings?.notifications ?? true}
                onValueChange={(v) => handleToggleSetting('notifications', v)}
                trackColor={{ false: '#ddd', true: themeColors.primaryLight }}
                thumbColor={settings?.notifications ? themeColors.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💕</Text>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Love Ping Bildirimleri</Text>
              </View>
              <Switch
                value={settings?.lovePingNotifications ?? true}
                onValueChange={(v) => handleToggleSetting('lovePingNotifications', v)}
                trackColor={{ false: '#ddd', true: themeColors.primaryLight }}
                thumbColor={settings?.lovePingNotifications ? themeColors.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📅</Text>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Randevu Hatırlatmaları</Text>
              </View>
              <Switch
                value={settings?.dateReminders ?? true}
                onValueChange={(v) => handleToggleSetting('dateReminders', v)}
                trackColor={{ false: '#ddd', true: themeColors.primaryLight }}
                thumbColor={settings?.dateReminders ? themeColors.primary : '#f4f3f4'}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Privacy Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🔒 Gizlilik</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔐</Text>
                <View>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    Kilit Ekranı Önizleme
                  </Text>
                  <Text style={[styles.settingHint, { color: themeColors.textSecondary }]}>
                    Mesaj içeriğini gizle
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.lockScreenPrivacy ?? false}
                onValueChange={(v) => handleToggleSetting('lockScreenPrivacy', v)}
                trackColor={{ false: '#ddd', true: themeColors.primaryLight }}
                thumbColor={settings?.lockScreenPrivacy ? themeColors.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>👀</Text>
                <View>
                  <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                    Okundu Bilgisi
                  </Text>
                  <Text style={[styles.settingHint, { color: themeColors.textSecondary }]}>
                    Mesajları okuduğunu göster
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.readReceipts ?? true}
                onValueChange={(v) => handleToggleSetting('readReceipts', v)}
                trackColor={{ false: '#ddd', true: themeColors.primaryLight }}
                thumbColor={settings?.readReceipts ? themeColors.primary : '#f4f3f4'}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>👤 Hesap</Text>
          <Card>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowNicknameModal(true)}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💝</Text>
                <Text style={[styles.settingLabel, { color: themeColors.text }]}>Takma Adım</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>
                  {nickname || 'Belirle'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>

            {partner && (
              <TouchableOpacity
                style={[styles.settingRow, styles.settingRowBorder]}
                onPress={handleDisconnect}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>💔</Text>
                  <Text style={[styles.settingLabel, { color: '#E57373' }]}>
                    Bağlantıyı Kes
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.settingRow, styles.settingRowBorder]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🚪</Text>
                <Text style={[styles.settingLabel, { color: '#E57373' }]}>Çıkış Yap</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.appInfo}
        >
          <Text style={[styles.appName, { color: themeColors.primary }]}>CoupleSpace</Text>
          <Text style={[styles.appVersion, { color: themeColors.textSecondary }]}>
            v1.0.0 • Made with ❤️
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowThemePicker(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>Kapat</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Tema Seç 🎨</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {(Object.keys(ThemePreview) as ThemeType[]).map((themeKey, index) => {
              const themeData = Themes[themeKey];
              const preview = ThemePreview[themeKey];
              const isSelected = theme === themeKey;

              return (
                <Animated.View
                  key={themeKey}
                  entering={FadeInRight.delay(index * 100).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => handleThemeChange(themeKey)}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: themeData.surface,
                        borderColor: isSelected ? themeData.primary : 'transparent',
                        borderWidth: isSelected ? 3 : 0,
                      },
                    ]}
                  >
                    <View style={styles.themePreview}>
                      <View
                        style={[styles.colorDot, { backgroundColor: themeData.primary }]}
                      />
                      <View
                        style={[styles.colorDot, { backgroundColor: themeData.secondary }]}
                      />
                      <View
                        style={[styles.colorDot, { backgroundColor: themeData.accent }]}
                      />
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, { color: themeData.text }]}>
                        {preview.emoji} {preview.name}
                      </Text>
                      {isSelected && (
                        <Text style={[styles.themeSelected, { color: themeData.primary }]}>
                          ✓ Seçili
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Nickname Modal */}
      <Modal
        visible={showNicknameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNicknameModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowNicknameModal(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Takma Adın 💝</Text>
            <TouchableOpacity onPress={async () => {
              if (nickname.trim()) {
                await updateNickname(nickname.trim());
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('✅ Kaydedildi', 'Takma adın güncellendi!');
              }
              setShowNicknameModal(false);
            }}>
              <Text style={[styles.modalSave, { color: themeColors.primary }]}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={[styles.nicknameHint, { color: themeColors.textSecondary }]}>
              Partnerinin sana seslenirken kullanacağı sevimli bir isim belirle
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Örn: Aşkım, Tatlım, Canım..."
              placeholderTextColor={themeColors.textSecondary}
              style={[
                styles.nicknameInput,
                {
                  backgroundColor: themeColors.surface,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
            />
            <View style={styles.nicknameSuggestions}>
              {['Aşkım', 'Tatlım', 'Canım', 'Bebeğim', 'Güzelim', 'Hayatım'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  onPress={() => setNickname(suggestion)}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: themeColors.primaryLight },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: themeColors.primaryDark }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Join Code Modal - Koda Katıl */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Koda Katıl 💕</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.modalContent}>
            <Text style={[styles.joinHint, { color: themeColors.textSecondary }]}>
              Partnerinizin size verdiği 6 haneli kodu girin
            </Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="XXXXXX"
              placeholderTextColor={themeColors.textSecondary}
              maxLength={6}
              autoCapitalize="characters"
              style={[
                styles.joinCodeInput,
                {
                  backgroundColor: themeColors.surface,
                  color: themeColors.primaryDark,
                  borderColor: themeColors.primary,
                },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.joinButton,
                {
                  backgroundColor: joinCode.length === 6 ? themeColors.primary : themeColors.border,
                  opacity: joinCode.length === 6 && !isJoining ? 1 : 0.6,
                },
              ]}
              onPress={handleJoinWithCode}
              disabled={joinCode.length !== 6 || isJoining}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Bağlanılıyor...' : '💑 Bağlan'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.joinNote, { color: themeColors.textSecondary }]}>
              Partneriniz önce kod oluşturmuş olmalıdır
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <SafeAreaView style={[styles.photoModalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.photoModalHeader, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.photoModalTitle, { color: themeColors.text }]}>📷 Profil Fotoğrafı</Text>
          </View>
          <View style={styles.photoModalContent}>
            <TouchableOpacity
              style={[styles.photoOption, { backgroundColor: themeColors.surface }]}
              onPress={() => handlePickImage(false)}
            >
              <Text style={styles.photoOptionIcon}>🖼️</Text>
              <Text style={[styles.photoOptionText, { color: themeColors.text }]}>Galeriden Seç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoOption, { backgroundColor: themeColors.surface }]}
              onPress={() => handlePickImage(true)}
            >
              <Text style={styles.photoOptionIcon}>📸</Text>
              <Text style={[styles.photoOptionText, { color: themeColors.text }]}>Kamera ile Çek</Text>
            </TouchableOpacity>

            {user?.avatarUrl && (
              <TouchableOpacity
                style={[styles.photoOption, { backgroundColor: themeColors.surface }]}
                onPress={handleRemovePhoto}
              >
                <Text style={styles.photoOptionIcon}>🗑️</Text>
                <Text style={[styles.photoOptionText, { color: '#E57373' }]}>Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.photoOptionCancel, { backgroundColor: themeColors.border }]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={[styles.photoOptionCancelText, { color: themeColors.text }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  editBadgeText: {
    fontSize: 10,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  partnerName: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 22,
    marginRight: Spacing.md,
    width: 30,
    textAlign: 'center',
  },
  settingLabel: {
    fontSize: FontSizes.md,
  },
  settingHint: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
  chevron: {
    fontSize: 20,
    color: '#CCC',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  appName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  appVersion: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: FontSizes.md,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: Spacing.lg,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.xs,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  themeSelected: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  nicknameHint: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  nicknameInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  nicknameSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  // Pairing Code Styles
  codeSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  codeSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  codeSectionHint: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  codeDisplay: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  codeButtonText: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  connectedSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  coupledAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heartContainer: {
    marginHorizontal: -10,
    zIndex: 1,
  },
  heartEmoji: {
    fontSize: 28,
  },
  connectedEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  connectedTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  connectedHint: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  // Join Modal Styles
  joinHint: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  joinCodeInput: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    letterSpacing: 8,
    marginBottom: Spacing.lg,
  },
  joinButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  joinNote: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Photo Options Modal Styles
  photoModalContainer: {
    flex: 1,
  },
  photoModalHeader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  photoModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  photoModalContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  photoOptionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  photoOptionText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  photoOptionCancel: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  photoOptionCancelText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
});