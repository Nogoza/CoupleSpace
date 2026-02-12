// ============================================
// CoupleSpace - Modern Settings Screen
// ============================================

import { Card } from '@/components/ui/Card';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { BorderRadius, FontSizes, FontWeights, Shadows, Spacing, Themes } from '@/constants/couple-theme';
import { useApp } from '@/context/AppContextSupabase';
import { ThemeType } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ThemePreview = {
  softPink: { name: 'Pembe Rüya', emoji: '🌸' },
  lavender: { name: 'Lavanta', emoji: '💜' },
  nightBlue: { name: 'Gece Mavisi', emoji: '🌙' },
  mintGreen: { name: 'Nane Yeşili', emoji: '🌿' },
  peach: { name: 'Şeftali', emoji: '🍑' },
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handlePickImage = async (useCamera: boolean = false) => {
    setShowPhotoOptions(false);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
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
        }
      }
    } catch (error) {
      setIsUploadingPhoto(false);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoOptions(false);
    Alert.alert('Fotoğrafı Kaldır', 'Profil fotoğrafınızı kaldırmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır', style: 'destructive',
        onPress: async () => {
          setIsUploadingPhoto(true);
          const { error } = await removeProfilePhoto();
          setIsUploadingPhoto(false);
          if (error) Alert.alert('Hata', error);
          else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    await Haptics.selectionAsync();
    await updateSettings({ [key]: value });
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await createCouple();
      setPairingCode(code);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `Kod oluşturulurken hata: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (pairingCode) {
      await Clipboard.setStringAsync(pairingCode);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Kopyalandı', 'Kod panoya kopyalandı!');
    }
  };

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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Bağlanırken bir hata oluştu.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert('💔 Bağlantıyı Kes', 'Partnerinizle bağlantınızı kesmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Bağlantıyı Kes', style: 'destructive',
        onPress: async () => {
          try {
            await disconnectCouple(false);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert('Hata', 'Bağlantı kesilirken bir hata oluştu.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(onboarding)');
          } catch (error) {
            Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
          }
        },
      },
    ]);
  };

  const relationshipDays = couple?.createdAt
    ? differenceInDays(new Date(), new Date(couple.createdAt))
    : 0;

  // ============ SETTING ROW COMPONENT ============
  const SettingRow = ({
    icon,
    label,
    hint,
    onPress,
    right,
    destructive = false,
    showBorder = false,
  }: {
    icon: string;
    label: string;
    hint?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    destructive?: boolean;
    showBorder?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.6 : 1}
      style={[styles.settingRow, showBorder && { borderTopWidth: 1, borderTopColor: themeColors.borderLight }]}
    >
      <View style={[styles.settingIconBg, { backgroundColor: destructive ? '#FEE2E2' : themeColors.primaryLight }]}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: destructive ? '#EF4444' : themeColors.text }]}>
          {label}
        </Text>
        {hint && (
          <Text style={[styles.settingHint, { color: themeColors.textTertiary }]}>{hint}</Text>
        )}
      </View>
      {right || (onPress && <Text style={[styles.chevron, { color: themeColors.textTertiary }]}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.background]}
            style={styles.profileGradient}
          >
            <TouchableOpacity
              onPress={() => setShowPhotoOptions(true)}
              disabled={isUploadingPhoto}
              style={styles.avatarContainer}
            >
              {isUploadingPhoto ? (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
                  <ActivityIndicator color={themeColors.primary} />
                </View>
              ) : (
                <ProfileAvatar user={user} size={80} showRing ringColor={themeColors.primary} />
              )}
              <View style={[styles.editBadge, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.editBadgeText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.profileName, { color: themeColors.text }]}>
              {user?.displayName || user?.name || 'Kullanıcı'}
            </Text>
            {partner && (
              <Text style={[styles.partnerName, { color: themeColors.textSecondary }]}>
                ❤️ {partner.displayName || partner.name} ile
              </Text>
            )}
            {couple && (
              <View style={styles.statsRow}>
                <View style={[styles.statChip, { backgroundColor: themeColors.surface, ...Shadows.small }]}>
                  <Text style={[styles.statValue, { color: themeColors.primaryDark }]}>{relationshipDays}</Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>gün</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: themeColors.surface, ...Shadows.small }]}>
                  <Text style={[styles.statValue, { color: themeColors.primaryDark }]}>
                    {format(new Date(couple.createdAt), 'd MMM', { locale: tr })}
                  </Text>
                  <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>başlangıç</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={styles.body}>
          {/* Pairing Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>EŞLEŞİME</Text>
            <Card variant="elevated">
              {!partner ? (
                <>
                  {pairingCode || couple?.pairingCode ? (
                    <View style={styles.codeSection}>
                      <Text style={[styles.codeSectionTitle, { color: themeColors.text }]}>Eşleşme Kodunuz</Text>
                      <Text style={[styles.codeSectionHint, { color: themeColors.textSecondary }]}>Bu kodu partnerinizle paylaşın</Text>
                      <View style={[styles.codeDisplay, { backgroundColor: themeColors.primaryLight }]}>
                        <Text style={[styles.codeText, { color: themeColors.primaryDark }]}>
                          {pairingCode || couple?.pairingCode}
                        </Text>
                      </View>
                      <View style={styles.codeActions}>
                        <TouchableOpacity style={[styles.codeButton, { backgroundColor: themeColors.primary }]} onPress={handleCopyCode}>
                          <Text style={styles.codeButtonText}>📋 Kopyala</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.codeButton, { backgroundColor: themeColors.accent }]} onPress={handleShareCode}>
                          <Text style={styles.codeButtonText}>📤 Paylaş</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <SettingRow icon="🔑" label={isGenerating ? 'Oluşturuluyor...' : 'Kod Oluştur'} hint="Partnerinizin size bağlanması için" onPress={handleGenerateCode} />
                  )}
                  <SettingRow icon="💕" label="Koda Katıl" hint="Partnerinizin kodunu girin" onPress={() => setShowJoinModal(true)} showBorder />
                </>
              ) : (
                <View style={styles.connectedSection}>
                  <View style={styles.coupledAvatars}>
                    <ProfileAvatar user={user} size={52} showBorder borderColor={themeColors.primary} />
                    <View style={[styles.heartBadge, { backgroundColor: themeColors.primaryLight }]}>
                      <Text style={{ fontSize: 18 }}>💕</Text>
                    </View>
                    <ProfileAvatar user={partner} size={52} showBorder borderColor={themeColors.primary} />
                  </View>
                  <Text style={[styles.connectedTitle, { color: themeColors.text }]}>Bağlısınız!</Text>
                  <Text style={[styles.connectedHint, { color: themeColors.textSecondary }]}>
                    {partner.displayName || partner.name} ile eşleşmiş durumdasınız
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Appearance */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>GÖRÜNÜM</Text>
            <Card variant="elevated">
              <SettingRow
                icon={ThemePreview[theme].emoji}
                label="Tema"
                onPress={() => setShowThemePicker(true)}
                right={
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{ThemePreview[theme].name}</Text>
                    <Text style={[styles.chevron, { color: themeColors.textTertiary }]}>›</Text>
                  </View>
                }
              />
            </Card>
          </Animated.View>

          {/* Notifications */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>BİLDİRİMLER</Text>
            <Card variant="elevated">
              <SettingRow icon="💌" label="Mesaj Bildirimleri" right={
                <Switch value={settings?.notifications ?? true} onValueChange={(v) => handleToggleSetting('notifications', v)}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }} thumbColor={settings?.notifications ? themeColors.primary : '#f4f3f4'} />
              } />
              <SettingRow icon="💕" label="Love Ping Bildirimleri" showBorder right={
                <Switch value={settings?.lovePingNotifications ?? true} onValueChange={(v) => handleToggleSetting('lovePingNotifications', v)}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }} thumbColor={settings?.lovePingNotifications ? themeColors.primary : '#f4f3f4'} />
              } />
              <SettingRow icon="📅" label="Randevu Hatırlatmaları" showBorder right={
                <Switch value={settings?.dateReminders ?? true} onValueChange={(v) => handleToggleSetting('dateReminders', v)}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }} thumbColor={settings?.dateReminders ? themeColors.primary : '#f4f3f4'} />
              } />
            </Card>
          </Animated.View>

          {/* Privacy */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>GİZLİLİK</Text>
            <Card variant="elevated">
              <SettingRow icon="🔐" label="Kilit Ekranı Önizleme" hint="Mesaj içeriğini gizle" right={
                <Switch value={settings?.lockScreenPrivacy ?? false} onValueChange={(v) => handleToggleSetting('lockScreenPrivacy', v)}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }} thumbColor={settings?.lockScreenPrivacy ? themeColors.primary : '#f4f3f4'} />
              } />
              <SettingRow icon="👀" label="Okundu Bilgisi" hint="Mesajları okuduğunu göster" showBorder right={
                <Switch value={settings?.readReceipts ?? true} onValueChange={(v) => handleToggleSetting('readReceipts', v)}
                  trackColor={{ false: themeColors.border, true: themeColors.primary + '40' }} thumbColor={settings?.readReceipts ? themeColors.primary : '#f4f3f4'} />
              } />
            </Card>
          </Animated.View>

          {/* Account */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>HESAP</Text>
            <Card variant="elevated">
              <SettingRow icon="💝" label="Takma Adım" onPress={() => setShowNicknameModal(true)}
                right={
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: themeColors.textSecondary }]}>{nickname || 'Belirle'}</Text>
                    <Text style={[styles.chevron, { color: themeColors.textTertiary }]}>›</Text>
                  </View>
                }
              />
              {partner && (
                <SettingRow icon="💔" label="Bağlantıyı Kes" onPress={handleDisconnect} destructive showBorder />
              )}
              <SettingRow icon="🚪" label="Çıkış Yap" onPress={handleLogout} destructive showBorder />
            </Card>
          </Animated.View>

          {/* App Info */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.appInfo}>
            <Text style={[styles.appName, { color: themeColors.primary }]}>CoupleSpace</Text>
            <Text style={[styles.appVersion, { color: themeColors.textTertiary }]}>v1.0.0 • Made with ❤️</Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowThemePicker(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowThemePicker(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>Kapat</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Tema Seç</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {(Object.keys(ThemePreview) as ThemeType[]).map((themeKey, index) => {
              const themeData = Themes[themeKey];
              const preview = ThemePreview[themeKey];
              const isSelected = theme === themeKey;
              return (
                <Animated.View key={themeKey} entering={FadeInRight.delay(index * 80).duration(300)}>
                  <TouchableOpacity onPress={() => handleThemeChange(themeKey)}
                    style={[styles.themeOption, { backgroundColor: themeData.surface, borderColor: isSelected ? themeData.primary : themeData.borderLight, borderWidth: isSelected ? 2 : 1 }]}>
                    <View style={styles.themePreview}>
                      {[themeData.primary, themeData.secondary, themeData.accent].map((c, i) => (
                        <View key={i} style={[styles.colorDot, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, { color: themeData.text }]}>{preview.emoji} {preview.name}</Text>
                      {isSelected && <Text style={[styles.themeSelected, { color: themeData.primary }]}>✓ Seçili</Text>}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Nickname Modal */}
      <Modal visible={showNicknameModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowNicknameModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowNicknameModal(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Takma Adın</Text>
            <TouchableOpacity onPress={async () => {
              if (nickname.trim()) {
                await updateNickname(nickname.trim());
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            <TextInput value={nickname} onChangeText={setNickname} placeholder="Örn: Aşkım, Tatlım, Canım..."
              placeholderTextColor={themeColors.textTertiary}
              style={[styles.nicknameInput, { backgroundColor: themeColors.borderLight, color: themeColors.text, borderColor: themeColors.border }]} />
            <View style={styles.nicknameSuggestions}>
              {['Aşkım', 'Tatlım', 'Canım', 'Bebeğim', 'Güzelim', 'Hayatım'].map((s) => (
                <TouchableOpacity key={s} onPress={() => setNickname(s)}
                  style={[styles.suggestionChip, { backgroundColor: themeColors.primaryLight }]}>
                  <Text style={[styles.suggestionText, { color: themeColors.primaryDark }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Join Code Modal */}
      <Modal visible={showJoinModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowJoinModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Text style={[styles.modalCancel, { color: themeColors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Koda Katıl</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.modalContent}>
            <Text style={[styles.joinHint, { color: themeColors.textSecondary }]}>Partnerinizin size verdiği 6 haneli kodu girin</Text>
            <TextInput value={joinCode} onChangeText={setJoinCode} placeholder="XXXXXX" placeholderTextColor={themeColors.textTertiary}
              maxLength={6} autoCapitalize="characters"
              style={[styles.joinCodeInput, { backgroundColor: themeColors.borderLight, color: themeColors.primaryDark, borderColor: themeColors.primary }]} />
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: joinCode.length === 6 ? themeColors.primary : themeColors.border, opacity: joinCode.length === 6 && !isJoining ? 1 : 0.6 }]}
              onPress={handleJoinWithCode} disabled={joinCode.length !== 6 || isJoining}>
              <Text style={styles.joinButtonText}>{isJoining ? 'Bağlanılıyor...' : '💑 Bağlan'}</Text>
            </TouchableOpacity>
            <Text style={[styles.joinNote, { color: themeColors.textTertiary }]}>Partneriniz önce kod oluşturmuş olmalıdır</Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Photo Options Modal */}
      <Modal visible={showPhotoOptions} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPhotoOptions(false)}>
        <SafeAreaView style={[styles.photoModalContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.photoModalHeader}>
            <View style={[styles.modalHandle, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.photoModalTitle, { color: themeColors.text }]}>Profil Fotoğrafı</Text>
          </View>
          <View style={styles.photoModalContent}>
            {[
              { icon: '🖼️', label: 'Galeriden Seç', onPress: () => handlePickImage(false), color: '#818CF8' },
              { icon: '📸', label: 'Kamera ile Çek', onPress: () => handlePickImage(true), color: '#F472B6' },
              ...(user?.avatarUrl ? [{ icon: '🗑️', label: 'Fotoğrafı Kaldır', onPress: handleRemovePhoto, color: '#EF4444' }] : []),
            ].map((item) => (
              <TouchableOpacity key={item.label} style={[styles.photoOption, { backgroundColor: themeColors.surface }]} onPress={item.onPress}>
                <View style={[styles.photoOptionIconBg, { backgroundColor: item.color + '15' }]}>
                  <Text style={styles.photoOptionIcon}>{item.icon}</Text>
                </View>
                <Text style={[styles.photoOptionText, { color: item.color === '#EF4444' ? '#EF4444' : themeColors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.photoOptionCancel, { backgroundColor: themeColors.borderLight }]} onPress={() => setShowPhotoOptions(false)}>
              <Text style={[styles.photoOptionCancelText, { color: themeColors.text }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  profileGradient: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute', bottom: 2, right: -4,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF',
    ...Shadows.small,
  },
  editBadgeText: { fontSize: 12 },
  profileName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, marginBottom: 4, letterSpacing: -0.2 },
  partnerName: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  statChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, alignItems: 'center', minWidth: 80,
  },
  statValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.extrabold },
  statLabel: { fontSize: FontSizes.xs, marginTop: 2, fontWeight: FontWeights.medium },
  body: { paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: FontSizes.xs, fontWeight: FontWeights.bold,
    letterSpacing: 1.2, marginBottom: Spacing.sm, marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm + 2, gap: Spacing.sm + 2,
  },
  settingIconBg: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  settingIcon: { fontSize: 18 },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.medium },
  settingHint: { fontSize: FontSizes.xs, marginTop: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { fontSize: FontSizes.sm },
  chevron: { fontSize: 22, fontWeight: FontWeights.light },
  appInfo: { alignItems: 'center', marginTop: Spacing.xl, paddingVertical: Spacing.lg },
  appName: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, letterSpacing: -0.3 },
  appVersion: { fontSize: FontSizes.xs, marginTop: Spacing.xs },
  // Modals
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalCancel: { fontSize: FontSizes.md, fontWeight: FontWeights.medium },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  modalSave: { fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  modalContent: { padding: Spacing.lg },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  themeOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderRadius: BorderRadius.xl, marginBottom: Spacing.sm,
  },
  themePreview: { flexDirection: 'row', marginRight: Spacing.lg, gap: Spacing.xs },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  themeInfo: { flex: 1 },
  themeName: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  themeSelected: { fontSize: FontSizes.sm, marginTop: 4, fontWeight: FontWeights.medium },
  nicknameHint: { fontSize: FontSizes.md, marginBottom: Spacing.lg, textAlign: 'center', lineHeight: 22 },
  nicknameInput: {
    borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSizes.lg,
    textAlign: 'center', borderWidth: 1, marginBottom: Spacing.lg,
  },
  nicknameSuggestions: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm,
  },
  suggestionChip: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full,
  },
  suggestionText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  // Pairing
  codeSection: { alignItems: 'center', paddingVertical: Spacing.md },
  codeSectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, marginBottom: Spacing.xs },
  codeSectionHint: { fontSize: FontSizes.sm, marginBottom: Spacing.md },
  codeDisplay: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
  codeText: { fontSize: 28, fontWeight: FontWeights.extrabold, letterSpacing: 8, fontFamily: 'monospace' },
  codeActions: { flexDirection: 'row', gap: Spacing.sm },
  codeButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full,
  },
  codeButtonText: { color: '#FFF', fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  connectedSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  coupledAvatars: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  heartBadge: {
    marginHorizontal: -8, zIndex: 1, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  connectedTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, marginBottom: Spacing.xs },
  connectedHint: { fontSize: FontSizes.sm, textAlign: 'center' },
  // Join
  joinHint: { fontSize: FontSizes.md, marginBottom: Spacing.lg, textAlign: 'center', lineHeight: 22 },
  joinCodeInput: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg, fontSize: 28,
    fontWeight: FontWeights.extrabold, textAlign: 'center', borderWidth: 2,
    letterSpacing: 8, marginBottom: Spacing.lg,
  },
  joinButton: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full, alignItems: 'center', marginBottom: Spacing.md,
    ...Shadows.colored('#F472B6'),
  },
  joinButtonText: { color: '#FFF', fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  joinNote: { fontSize: FontSizes.xs, textAlign: 'center', fontStyle: 'italic' },
  // Photo Modal
  photoModalContainer: { flex: 1 },
  photoModalHeader: { paddingVertical: Spacing.md, alignItems: 'center' },
  photoModalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  photoModalContent: { padding: Spacing.lg, gap: Spacing.sm },
  photoOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.xl, gap: Spacing.md,
  },
  photoOptionIconBg: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  photoOptionIcon: { fontSize: 22 },
  photoOptionText: { fontSize: FontSizes.md, fontWeight: FontWeights.medium },
  photoOptionCancel: {
    alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.xl, marginTop: Spacing.sm,
  },
  photoOptionCancelText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
});
