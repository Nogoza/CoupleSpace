// ============================================
// CoupleSpace - Storage Utility (Mock Database)
// ============================================

import {
    Couple,
    CoupleTodo,
    DatePlan,
    JournalEntry,
    LovePing,
    Memory,
    Message,
    MoodCheckIn,
    ThemeType,
    User,
    UserSettings,
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// UUID generator using expo-crypto
const generateUUID = (): string => {
  return Crypto.randomUUID();
};

// Storage Keys
const KEYS = {
  USER: 'couplespace_user',
  COUPLE: 'couplespace_couple',
  PARTNER: 'couplespace_partner',
  MESSAGES: 'couplespace_messages',
  JOURNAL_ENTRIES: 'couplespace_journal',
  LOVE_PINGS: 'couplespace_pings',
  TODOS: 'couplespace_todos',
  DATE_PLANS: 'couplespace_dates',
  MEMORIES: 'couplespace_memories',
  MOOD_CHECKINS: 'couplespace_checkins',
  SETTINGS: 'couplespace_settings',
  STREAK: 'couplespace_streak',
};

// ==================== USER ====================
export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const createUser = async (email: string, displayName: string): Promise<User> => {
  const user: User = {
    id: generateUUID(),
    email,
    displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await saveUser(user);
  return user;
};

// ==================== COUPLE ====================
export const generatePairingCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createCouple = async (userId: string): Promise<Couple> => {
  const couple: Couple = {
    id: generateUUID(),
    pairingCode: generatePairingCode(),
    user1Id: userId,
    user2Id: null,
    theme: 'softPink',
    isActive: true,
    createdAt: new Date(),
  };
  await AsyncStorage.setItem(KEYS.COUPLE, JSON.stringify(couple));
  return couple;
};

export const getCouple = async (): Promise<Couple | null> => {
  const data = await AsyncStorage.getItem(KEYS.COUPLE);
  return data ? JSON.parse(data) : null;
};

export const saveCouple = async (couple: Couple): Promise<void> => {
  await AsyncStorage.setItem(KEYS.COUPLE, JSON.stringify(couple));
};

export const joinCouple = async (pairingCode: string, userId: string): Promise<Couple | null> => {
  // Simülasyon için - gerçek uygulamada backend'den çekilir
  const couple = await getCouple();
  if (couple && couple.pairingCode === pairingCode && !couple.user2Id) {
    couple.user2Id = userId;
    couple.connectedAt = new Date();
    await saveCouple(couple);
    return couple;
  }
  return null;
};

export const updateCoupleTheme = async (theme: ThemeType): Promise<void> => {
  const couple = await getCouple();
  if (couple) {
    couple.theme = theme;
    await saveCouple(couple);
  }
};

// ==================== PARTNER ====================
export const savePartner = async (partner: User): Promise<void> => {
  await AsyncStorage.setItem(KEYS.PARTNER, JSON.stringify(partner));
};

export const getPartner = async (): Promise<User | null> => {
  const data = await AsyncStorage.getItem(KEYS.PARTNER);
  return data ? JSON.parse(data) : null;
};

// ==================== MESSAGES ====================
export const getMessages = async (coupleId: string): Promise<Message[]> => {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES);
  const messages: Message[] = data ? JSON.parse(data) : [];
  return messages.filter(m => m.coupleId === coupleId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export const saveMessage = async (message: Message): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES);
  const messages: Message[] = data ? JSON.parse(data) : [];
  messages.push(message);
  await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
};

export const createMessage = async (
  coupleId: string,
  senderId: string,
  content: string,
  messageType: Message['messageType'] = 'text'
): Promise<Message> => {
  const message: Message = {
    id: generateUUID(),
    coupleId,
    senderId,
    content,
    messageType,
    reactions: [],
    isRead: false,
    createdAt: new Date(),
  };
  await saveMessage(message);
  return message;
};

export const addReaction = async (messageId: string, userId: string, emoji: string): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES);
  const messages: Message[] = data ? JSON.parse(data) : [];
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    messages[index].reactions.push({ userId, emoji, createdAt: new Date() });
    await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  }
};

// ==================== JOURNAL ====================
export const getJournalEntries = async (coupleId: string): Promise<JournalEntry[]> => {
  const data = await AsyncStorage.getItem(KEYS.JOURNAL_ENTRIES);
  const entries: JournalEntry[] = data ? JSON.parse(data) : [];
  return entries.filter(e => e.coupleId === coupleId);
};

export const getJournalEntriesByDate = async (
  coupleId: string,
  date: string
): Promise<JournalEntry[]> => {
  const entries = await getJournalEntries(coupleId);
  return entries.filter(e => e.date === date);
};

export const getJournalEntriesByUser = async (
  coupleId: string,
  userId: string
): Promise<JournalEntry[]> => {
  const entries = await getJournalEntries(coupleId);
  return entries.filter(e => e.userId === userId);
};

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.JOURNAL_ENTRIES);
  const entries: JournalEntry[] = data ? JSON.parse(data) : [];
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  if (existingIndex !== -1) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  await AsyncStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
};

export const createJournalEntry = async (
  coupleId: string,
  userId: string,
  date: string,
  content: string,
  mood: JournalEntry['mood'],
  tags: string[] = [],
  privacy: JournalEntry['privacy'] = 'private'
): Promise<JournalEntry> => {
  const entry: JournalEntry = {
    id: generateUUID(),
    coupleId,
    userId,
    date,
    content,
    mood,
    tags,
    privacy,
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await saveJournalEntry(entry);
  return entry;
};

export const updateJournalPrivacy = async (
  entryId: string,
  privacy: JournalEntry['privacy']
): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.JOURNAL_ENTRIES);
  const entries: JournalEntry[] = data ? JSON.parse(data) : [];
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    entries[index].privacy = privacy;
    entries[index].updatedAt = new Date();
    if (privacy === 'shared' || privacy === 'common') {
      entries[index].sharedAt = new Date();
    }
    await AsyncStorage.setItem(KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  }
};

export const searchJournalEntries = async (
  coupleId: string,
  query: string
): Promise<JournalEntry[]> => {
  const entries = await getJournalEntries(coupleId);
  const lowerQuery = query.toLowerCase();
  return entries.filter(
    e => e.content.toLowerCase().includes(lowerQuery) ||
    e.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
};

// ==================== STREAK ====================
interface StreakData {
  coupleId: string;
  currentStreak: number;
  lastEntryDate: string;
  longestStreak: number;
}

export const getStreak = async (coupleId: string): Promise<StreakData> => {
  const data = await AsyncStorage.getItem(KEYS.STREAK);
  const streaks: Record<string, StreakData> = data ? JSON.parse(data) : {};
  return streaks[coupleId] || {
    coupleId,
    currentStreak: 0,
    lastEntryDate: '',
    longestStreak: 0,
  };
};

export const updateStreak = async (coupleId: string, date: string): Promise<StreakData> => {
  const data = await AsyncStorage.getItem(KEYS.STREAK);
  const streaks: Record<string, StreakData> = data ? JSON.parse(data) : {};
  const current = streaks[coupleId] || {
    coupleId,
    currentStreak: 0,
    lastEntryDate: '',
    longestStreak: 0,
  };

  const today = new Date(date);
  const lastDate = current.lastEntryDate ? new Date(current.lastEntryDate) : null;

  if (lastDate) {
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current.currentStreak += 1;
    } else if (diffDays > 1) {
      current.currentStreak = 1;
    }
  } else {
    current.currentStreak = 1;
  }

  current.lastEntryDate = date;
  if (current.currentStreak > current.longestStreak) {
    current.longestStreak = current.currentStreak;
  }

  streaks[coupleId] = current;
  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streaks));
  return current;
};

// ==================== LOVE PING ====================
export const sendLovePing = async (
  coupleId: string,
  senderId: string,
  note?: string
): Promise<LovePing> => {
  const ping: LovePing = {
    id: generateUUID(),
    coupleId,
    senderId,
    note,
    createdAt: new Date(),
  };
  const data = await AsyncStorage.getItem(KEYS.LOVE_PINGS);
  const pings: LovePing[] = data ? JSON.parse(data) : [];
  pings.push(ping);
  await AsyncStorage.setItem(KEYS.LOVE_PINGS, JSON.stringify(pings));
  return ping;
};

export const getLovePings = async (coupleId: string): Promise<LovePing[]> => {
  const data = await AsyncStorage.getItem(KEYS.LOVE_PINGS);
  const pings: LovePing[] = data ? JSON.parse(data) : [];
  return pings.filter(p => p.coupleId === coupleId);
};

// ==================== COUPLE TO-DO ====================
export const getTodos = async (coupleId: string): Promise<CoupleTodo[]> => {
  const data = await AsyncStorage.getItem(KEYS.TODOS);
  const todos: CoupleTodo[] = data ? JSON.parse(data) : [];
  return todos.filter(t => t.coupleId === coupleId);
};

export const saveTodo = async (todo: CoupleTodo): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.TODOS);
  const todos: CoupleTodo[] = data ? JSON.parse(data) : [];
  const existingIndex = todos.findIndex(t => t.id === todo.id);
  if (existingIndex !== -1) {
    todos[existingIndex] = todo;
  } else {
    todos.push(todo);
  }
  await AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
};

export const createTodo = async (
  coupleId: string,
  createdBy: string,
  title: string,
  category: CoupleTodo['category'],
  description?: string
): Promise<CoupleTodo> => {
  const todo: CoupleTodo = {
    id: generateUUID(),
    coupleId,
    title,
    description,
    category,
    isCompleted: false,
    createdBy,
    createdAt: new Date(),
  };
  await saveTodo(todo);
  return todo;
};

export const completeTodo = async (todoId: string, userId: string): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.TODOS);
  const todos: CoupleTodo[] = data ? JSON.parse(data) : [];
  const index = todos.findIndex(t => t.id === todoId);
  if (index !== -1) {
    todos[index].isCompleted = true;
    todos[index].completedAt = new Date();
    todos[index].completedBy = userId;
    await AsyncStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
  }
};

// ==================== DATE PLANS ====================
export const getDatePlans = async (coupleId: string): Promise<DatePlan[]> => {
  const data = await AsyncStorage.getItem(KEYS.DATE_PLANS);
  const plans: DatePlan[] = data ? JSON.parse(data) : [];
  return plans.filter(p => p.coupleId === coupleId);
};

export const saveDatePlan = async (plan: DatePlan): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.DATE_PLANS);
  const plans: DatePlan[] = data ? JSON.parse(data) : [];
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  if (existingIndex !== -1) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  await AsyncStorage.setItem(KEYS.DATE_PLANS, JSON.stringify(plans));
};

export const createDatePlan = async (
  coupleId: string,
  createdBy: string,
  title: string,
  date: Date,
  time?: string,
  location?: string,
  notes?: string
): Promise<DatePlan> => {
  const plan: DatePlan = {
    id: generateUUID(),
    coupleId,
    title,
    date,
    time,
    location,
    notes,
    createdBy,
    isConfirmed: false,
    createdAt: new Date(),
  };
  await saveDatePlan(plan);
  return plan;
};

// ==================== MEMORY BOX ====================
export const getMemories = async (coupleId: string): Promise<Memory[]> => {
  const data = await AsyncStorage.getItem(KEYS.MEMORIES);
  const memories: Memory[] = data ? JSON.parse(data) : [];
  return memories.filter(m => m.coupleId === coupleId);
};

export const saveMemory = async (memory: Memory): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.MEMORIES);
  const memories: Memory[] = data ? JSON.parse(data) : [];
  memories.push(memory);
  await AsyncStorage.setItem(KEYS.MEMORIES, JSON.stringify(memories));
};

export const createMemory = async (
  coupleId: string,
  createdBy: string,
  title: string,
  category: Memory['category'],
  date: Date,
  description?: string,
  imageUrl?: string
): Promise<Memory> => {
  const memory: Memory = {
    id: generateUUID(),
    coupleId,
    title,
    description,
    category,
    imageUrl,
    date,
    createdBy,
    createdAt: new Date(),
  };
  await saveMemory(memory);
  return memory;
};

// ==================== MOOD CHECK-IN ====================
export const getMoodCheckIns = async (coupleId: string): Promise<MoodCheckIn[]> => {
  const data = await AsyncStorage.getItem(KEYS.MOOD_CHECKINS);
  const checkIns: MoodCheckIn[] = data ? JSON.parse(data) : [];
  return checkIns.filter(c => c.coupleId === coupleId);
};

export const saveMoodCheckIn = async (checkIn: MoodCheckIn): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.MOOD_CHECKINS);
  const checkIns: MoodCheckIn[] = data ? JSON.parse(data) : [];
  checkIns.push(checkIn);
  await AsyncStorage.setItem(KEYS.MOOD_CHECKINS, JSON.stringify(checkIns));
};

export const createMoodCheckIn = async (
  coupleId: string,
  userId: string,
  mood: MoodCheckIn['mood'],
  note?: string
): Promise<MoodCheckIn> => {
  const checkIn: MoodCheckIn = {
    id: generateUUID(),
    coupleId,
    userId,
    mood,
    note,
    createdAt: new Date(),
  };
  await saveMoodCheckIn(checkIn);
  return checkIn;
};

// ==================== SETTINGS ====================
export const getSettings = async (userId?: string): Promise<UserSettings | null> => {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!data) return null;
  
  const settings: Record<string, UserSettings> = JSON.parse(data);
  
  // Eğer userId varsa, o kullanıcının ayarlarını getir
  if (userId) {
    return settings[userId] || null;
  }
  
  // Yoksa ilk ayarı döndür
  const keys = Object.keys(settings);
  return keys.length > 0 ? settings[keys[0]] : null;
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  const allSettings: Record<string, UserSettings> = data ? JSON.parse(data) : {};
  allSettings[settings.userId] = settings;
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(allSettings));
};

// ==================== CLEAR ALL DATA ====================
export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};

// ==================== DISCONNECT COUPLE ====================
export const disconnectCouple = async (archive: boolean = false): Promise<void> => {
  if (!archive) {
    // Tam silme
    await AsyncStorage.multiRemove([
      KEYS.COUPLE,
      KEYS.PARTNER,
      KEYS.MESSAGES,
      KEYS.JOURNAL_ENTRIES,
      KEYS.LOVE_PINGS,
      KEYS.TODOS,
      KEYS.DATE_PLANS,
      KEYS.MEMORIES,
      KEYS.MOOD_CHECKINS,
      KEYS.STREAK,
    ]);
  } else {
    // Arşivleme - couple'ı inaktif yap
    const couple = await getCouple();
    if (couple) {
      couple.isActive = false;
      await saveCouple(couple);
    }
  }
};
