// ============================================
// CoupleSpace - Type Definitions
// ============================================

// ==================== USER ====================
export interface User {
  id: string;
  email: string;
  displayName: string;
  name?: string; // Alias for displayName
  nickname?: string; // Partner'ın verdiği takma isim
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== COUPLE ====================
export interface Couple {
  id: string;
  pairingCode: string;
  user1Id: string;
  user2Id: string | null;
  anniversaryDate?: Date;
  theme: ThemeType;
  isActive: boolean;
  createdAt: Date;
  connectedAt?: Date;
  nicknames?: Record<string, string>; // userId -> nickname
}

export type ThemeType = 'softPink' | 'lavender' | 'nightBlue' | 'mintGreen' | 'peach';

// ==================== MESSAGES ====================
export interface Message {
  id: string;
  coupleId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'file' | 'sticker' | 'quickMessage' | 'lovePing';
  mediaUrl?: string; // Görsel, ses, dosya URL'i
  fileName?: string; // Dosya adı
  fileSize?: number; // Dosya boyutu (bytes)
  mediaDuration?: number; // Ses süresi (saniye)
  reactions: MessageReaction[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// Sticker listesi
export const Stickers = [
  '❤️', '😍', '🥰', '💕', '💖', '💗', '💘', '💝',
  '😘', '😚', '🤗', '🥺', '😊', '🙈', '💋', '🌹',
  '🦋', '✨', '🌙', '⭐', '🌈', '🍀', '🎀', '🧸',
] as const;

export type StickerType = typeof Stickers[number];

export type QuickMessageType =
  | 'seniSeviyorum'
  | 'gununNasilGecti'
  | 'sendenBirSeyIstiyorum'
  | 'ozledim'
  | 'iyiGeceler'
  | 'gunaydın';

export const QuickMessages: Record<QuickMessageType, string> = {
  seniSeviyorum: 'Seni seviyorum ❤️',
  gununNasilGecti: 'Günün nasıl geçti? 🌸',
  sendenBirSeyIstiyorum: 'Bugün senden bir şey istiyorum... 💭',
  ozledim: 'Seni özledim 🥺',
  iyiGeceler: 'İyi geceler, tatlı rüyalar 🌙',
  gunaydın: 'Günaydın aşkım ☀️',
};

// ==================== JOURNAL ====================
export type MoodType =
  | 'mutlu'
  | 'sakin'
  | 'ozledim'
  | 'stresli'
  | 'romantik'
  | 'heyecanli'
  | 'yorgun'
  | 'minnettar'
  | 'kizgin'
  | 'uzgun';

export const MoodEmojis: Record<MoodType, string> = {
  mutlu: '😊',
  sakin: '😌',
  ozledim: '🥺',
  stresli: '😰',
  romantik: '🥰',
  heyecanli: '🤩',
  yorgun: '😴',
  minnettar: '🙏',
  kizgin: '😤',
  uzgun: '😢',
};

export const MoodColors: Record<MoodType, string> = {
  mutlu: '#FFD93D',
  sakin: '#A8E6CF',
  ozledim: '#FFB6C1',
  stresli: '#FF6B6B',
  romantik: '#FF69B4',
  heyecanli: '#FF8C00',
  yorgun: '#B8B8D1',
  minnettar: '#DDA0DD',
  kizgin: '#FF4500',
  uzgun: '#87CEEB',
};

export type JournalPrivacy = 'private' | 'shared' | 'common';

export interface JournalEntry {
  id: string;
  coupleId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: MoodType;
  tags: string[];
  privacy: JournalPrivacy;
  sharedAt?: Date;
  attachments: JournalAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalAttachment {
  id: string;
  type: 'image';
  url: string;
  caption?: string;
}

export interface DayPage {
  date: string;
  myEntries: JournalEntry[];
  partnerEntries: JournalEntry[]; // Sadece shared/common olanlar
  commonEntries: JournalEntry[];
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  moodDistribution: Record<MoodType, number>;
  topTags: { tag: string; count: number }[];
  totalEntries: number;
  sharedMoments: number;
  streak: number;
}

// ==================== JOURNAL PROMPTS ====================
export const JournalPrompts = [
  'Bugün partnerimde en çok neyi sevdim?',
  'Bugün beni ne mutlu etti?',
  'Bugün senden bir ricam var mı?',
  'Bugün için minnettar olduğum 3 şey...',
  'Bugün birlikte yaptığımız en güzel şey...',
  'Yarın birlikte yapmak istediğim bir şey...',
];

export const PopularTags = [
  '#dateNight',
  '#kavga',
  '#özlem',
  '#gülmeKrizi',
  '#romantik',
  '#sürpriz',
  '#yemek',
  '#film',
  '#seyahat',
  '#evde',
  '#ilkler',
  '#özür',
];

// ==================== LOVE PING ====================
export interface LovePing {
  id: string;
  coupleId: string;
  senderId: string;
  note?: string;
  createdAt: Date;
  seenAt?: Date;
}

// ==================== COUPLE TO-DO ====================
export interface CoupleTodo {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  category: TodoCategory;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  createdBy: string;
  createdAt: Date;
}

export type TodoCategory =
  | 'film'
  | 'restaurant'
  | 'travel'
  | 'activity'
  | 'gift'
  | 'other';

export const TodoCategoryEmojis: Record<TodoCategory, string> = {
  film: '🎬',
  restaurant: '🍽️',
  travel: '✈️',
  activity: '🎯',
  gift: '🎁',
  other: '📝',
};

// ==================== DATE PLANNER ====================
export interface DatePlan {
  id: string;
  coupleId: string;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  notes?: string;
  createdBy: string;
  isConfirmed: boolean;
  createdAt: Date;
}

// ==================== MEMORY BOX ====================
export interface Memory {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  category: MemoryCategory;
  customCategory?: string; // Özel kategori adı (category === 'custom' ise)
  imageUrl?: string; // Eski uyumluluk için
  imageUrls?: string[]; // Çoklu fotoğraf desteği
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export type MemoryCategory =
  | 'ilkBulusma'
  | 'enKomikAn'
  | 'seyahat'
  | 'ozelGun'
  | 'surpriz'
  | 'diger'
  | 'custom'; // Özel kategori

export const MemoryCategoryLabels: Record<MemoryCategory, string> = {
  ilkBulusma: 'İlk Buluşma 💕',
  enKomikAn: 'En Komik An 😂',
  seyahat: 'Seyahat 🌍',
  ozelGun: 'Özel Gün 🎉',
  surpriz: 'Sürpriz 🎁',
  diger: 'Diğer 📸',
  custom: 'Özel 🏷️',
};

// ==================== MOOD CHECK-IN ====================
export interface MoodCheckIn {
  id: string;
  coupleId: string;
  userId: string;
  mood: MoodType;
  note?: string;
  supportMessageSent?: boolean;
  createdAt: Date;
}

// ==================== SETTINGS ====================
export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  notifications?: boolean;
  lockScreenPrivacy: boolean; // Kilit ekranında içerik gösterme
  dailyReminder: boolean;
  reminderTime?: string; // HH:mm format
  language: 'tr' | 'en';
  lovePingNotifications?: boolean;
  dateReminders?: boolean;
  readReceipts?: boolean;
}

// ==================== NAVIGATION ====================
export type RootStackParamList = {
  '(onboarding)': undefined;
  '(tabs)': undefined;
  'modal': undefined;
};

// ==================== APP STATE ====================
export interface AppState {
  user: User | null;
  couple: Couple | null;
  partner: User | null;
  isAuthenticated: boolean;
  isPaired: boolean;
}
