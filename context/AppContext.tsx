// ============================================
// CoupleSpace - App Context
// ============================================

import { DEFAULT_THEME, ThemeColors } from '@/constants/couple-theme';
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
import * as Storage from '@/utils/storage';
import * as Crypto from 'expo-crypto';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// ==================== CONTEXT TYPES ====================
interface AppContextType {
  // Auth & User
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;

  // Couple & Partner
  couple: Couple | null;
  partner: User | null;
  isPaired: boolean;
  createCouple: () => Promise<string>;
  joinCouple: (code: string) => Promise<boolean>;
  disconnectCouple: (archive: boolean) => Promise<void>;

  // Theme
  theme: ThemeType;
  themeColors: typeof ThemeColors.softPink;
  setTheme: (theme: ThemeType) => Promise<void>;
  changeTheme: (theme: ThemeType) => Promise<void>;

  // Settings
  settings: UserSettings | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

  // Messages
  messages: Message[];
  sendMessage: (content: string, type?: Message['messageType']) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  refreshMessages: () => Promise<void>;

  // Journal
  journalEntries: JournalEntry[];
  createJournalEntry: (
    date: string,
    content: string,
    mood: JournalEntry['mood'],
    tags?: string[],
    privacy?: JournalEntry['privacy']
  ) => Promise<JournalEntry>;
  updateJournalPrivacy: (entryId: string, privacy: JournalEntry['privacy']) => Promise<void>;
  refreshJournal: () => Promise<void>;
  streak: { current: number; longest: number };

  // Love Ping
  sendLovePing: (note?: string) => Promise<void>;
  lovePings: LovePing[];

  // Todos
  todos: CoupleTodo[];
  createTodo: (
    title: string,
    category: CoupleTodo['category'],
    description?: string
  ) => Promise<void>;
  completeTodo: (todoId: string) => Promise<void>;
  refreshTodos: () => Promise<void>;

  // Date Plans
  datePlans: DatePlan[];
  createDatePlan: (
    title: string,
    date: Date,
    time?: string,
    location?: string,
    notes?: string
  ) => Promise<void>;
  refreshDatePlans: () => Promise<void>;

  // Memories
  memories: Memory[];
  createMemory: (
    title: string,
    category: Memory['category'],
    date: Date,
    description?: string,
    imageUrl?: string
  ) => Promise<void>;
  refreshMemories: () => Promise<void>;

  // Mood Check-in
  moodCheckIns: MoodCheckIn[];
  createMoodCheckIn: (mood: MoodCheckIn['mood'], note?: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==================== PROVIDER ====================
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [theme, setThemeState] = useState<ThemeType>(DEFAULT_THEME);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<CoupleTodo[]>([]);
  const [datePlans, setDatePlans] = useState<DatePlan[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [lovePings, setLovePings] = useState<LovePing[]>([]);
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckIn[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isPaired = !!couple?.user2Id;
  const themeColors = ThemeColors[theme];

  // Initialize on mount
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const savedUser = await Storage.getUser();
      const savedCouple = await Storage.getCouple();
      const savedPartner = await Storage.getPartner();

      if (savedUser) {
        setUser(savedUser);
      }
      if (savedCouple) {
        setCouple(savedCouple);
        setThemeState(savedCouple.theme);
        await loadCoupleData(savedCouple.id);
      }
      if (savedPartner) {
        setPartner(savedPartner);
      }

      // Load settings
      const savedSettings = await Storage.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCoupleData = async (coupleId: string) => {
    const [msgs, entries, todoList, plans, mems, pings, checkIns, streakData] = await Promise.all([
      Storage.getMessages(coupleId),
      Storage.getJournalEntries(coupleId),
      Storage.getTodos(coupleId),
      Storage.getDatePlans(coupleId),
      Storage.getMemories(coupleId),
      Storage.getLovePings(coupleId),
      Storage.getMoodCheckIns(coupleId),
      Storage.getStreak(coupleId),
    ]);

    setMessages(msgs);
    setJournalEntries(entries);
    setTodos(todoList);
    setDatePlans(plans);
    setMemories(mems);
    setLovePings(pings);
    setMoodCheckIns(checkIns);
    setStreak({ current: streakData.currentStreak, longest: streakData.longestStreak });
  };

  // ==================== AUTH ====================
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Yerel mod: şifre kontrolü yok, sadece email ile kullanıcı bul/oluştur
      const existingUser = await Storage.getUser();
      if (existingUser && existingUser.email === email) {
        setUser(existingUser);
        return { error: null };
      }
      // Yeni kullanıcı oluştur (şifre yerel modda kullanılmıyor)
      const newUser = await Storage.createUser(email, email.split('@')[0]);
      setUser(newUser);
      return { error: null };
    } catch (error) {
      return { error: 'Giriş yapılırken bir hata oluştu' };
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: string | null }> => {
    try {
      const newUser = await Storage.createUser(email, displayName);
      setUser(newUser);
      return { error: null };
    } catch (error) {
      return { error: 'Kayıt olurken bir hata oluştu' };
    }
  };

  const logout = async () => {
    await Storage.clearAllData();
    setUser(null);
    setCouple(null);
    setPartner(null);
    setMessages([]);
    setJournalEntries([]);
    setTodos([]);
    setDatePlans([]);
    setMemories([]);
    setLovePings([]);
    setMoodCheckIns([]);
  };

  // ==================== COUPLE ====================
  const createCoupleHandler = async (): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    const newCouple = await Storage.createCouple(user.id);
    setCouple(newCouple);
    return newCouple.pairingCode;
  };

  const joinCoupleHandler = async (code: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Önce mevcut couple'ı kontrol et
      const existingCouple = await Storage.getCouple();
      
      // Eğer kullanıcının kendisi zaten bir couple oluşturmuşsa ve kod eşleşiyorsa
      if (existingCouple && existingCouple.pairingCode.toUpperCase() === code.toUpperCase()) {
        // Aynı kullanıcı kendi koduna katılamaz
        if (existingCouple.user1Id === user.id) {
          console.log('Cannot join your own code');
          return false;
        }
        
        // Zaten birisi katılmışsa
        if (existingCouple.user2Id) {
          console.log('Code already used');
          return false;
        }
        
        // Partner olarak bağlan
        existingCouple.user2Id = user.id;
        existingCouple.connectedAt = new Date();
        await Storage.saveCouple(existingCouple);
        setCouple(existingCouple);
        
        // Simüle edilmiş partner oluştur (kod sahibi)
        const simulatedPartner: User = {
          id: existingCouple.user1Id,
          email: 'partner@example.com',
          displayName: 'Sevgilim 💕',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await Storage.savePartner(simulatedPartner);
        setPartner(simulatedPartner);
        
        await loadCoupleData(existingCouple.id);
        return true;
      }
      
      // Demo/Test modu: Herhangi bir 6 haneli kodu kabul et ve yeni bir couple oluştur
      // Bu gerçek uygulamada Supabase'den kod doğrulaması yapılacak
      if (code.length === 6) {
        // Yeni bir couple oluştur ve bu kullanıcıyı user2 olarak ekle
        const newCouple: Couple = {
          id: Crypto.randomUUID(),
          pairingCode: code.toUpperCase(),
          user1Id: Crypto.randomUUID(), // Simüle edilen partner ID
          user2Id: user.id,
          theme: 'softPink',
          isActive: true,
          createdAt: new Date(),
          connectedAt: new Date(),
        };
        
        await Storage.saveCouple(newCouple);
        setCouple(newCouple);
        
        // Simüle edilmiş partner oluştur
        const simulatedPartner: User = {
          id: newCouple.user1Id,
          email: 'partner@example.com',
          displayName: 'Sevgilim 💕',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await Storage.savePartner(simulatedPartner);
        setPartner(simulatedPartner);
        
        await loadCoupleData(newCouple.id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Join couple error:', error);
      return false;
    }
  };

  const disconnectCoupleHandler = async (archive: boolean) => {
    await Storage.disconnectCouple(archive);
    setCouple(null);
    setPartner(null);
    setMessages([]);
    setJournalEntries([]);
    setTodos([]);
    setDatePlans([]);
    setMemories([]);
    setLovePings([]);
    setMoodCheckIns([]);
  };

  // ==================== THEME ====================
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await Storage.updateCoupleTheme(newTheme);
  };

  const changeTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await Storage.updateCoupleTheme(newTheme);
  };

  // ==================== SETTINGS ====================
  const updateSettings = async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates } as UserSettings;
    setSettings(newSettings);
    await Storage.saveSettings(newSettings);
  };

  // ==================== MESSAGES ====================
  const sendMessage = async (content: string, type: Message['messageType'] = 'text') => {
    if (!couple || !user) return;
    const message = await Storage.createMessage(couple.id, user.id, content, type);
    setMessages(prev => [...prev, message]);
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    await Storage.addReaction(messageId, user.id, emoji);
    await refreshMessages();
  };

  const refreshMessages = async () => {
    if (!couple) return;
    const msgs = await Storage.getMessages(couple.id);
    setMessages(msgs);
  };

  // ==================== JOURNAL ====================
  const createJournalEntryHandler = async (
    date: string,
    content: string,
    mood: JournalEntry['mood'],
    tags: string[] = [],
    privacy: JournalEntry['privacy'] = 'private'
  ): Promise<JournalEntry> => {
    if (!couple || !user) throw new Error('Not authenticated');
    const entry = await Storage.createJournalEntry(
      couple.id,
      user.id,
      date,
      content,
      mood,
      tags,
      privacy
    );
    setJournalEntries(prev => [...prev, entry]);
    
    // Streak güncelle
    const newStreak = await Storage.updateStreak(couple.id, date);
    setStreak({ current: newStreak.currentStreak, longest: newStreak.longestStreak });
    
    return entry;
  };

  const updateJournalPrivacy = async (entryId: string, privacy: JournalEntry['privacy']) => {
    await Storage.updateJournalPrivacy(entryId, privacy);
    await refreshJournal();
  };

  const refreshJournal = async () => {
    if (!couple) return;
    const entries = await Storage.getJournalEntries(couple.id);
    setJournalEntries(entries);
  };

  // ==================== LOVE PING ====================
  const sendLovePingHandler = async (note?: string) => {
    if (!couple || !user) return;
    const ping = await Storage.sendLovePing(couple.id, user.id, note);
    setLovePings(prev => [...prev, ping]);
  };

  // ==================== TODOS ====================
  const createTodoHandler = async (
    title: string,
    category: CoupleTodo['category'],
    description?: string
  ) => {
    if (!couple || !user) return;
    const todo = await Storage.createTodo(couple.id, user.id, title, category, description);
    setTodos(prev => [...prev, todo]);
  };

  const completeTodoHandler = async (todoId: string) => {
    if (!user) return;
    await Storage.completeTodo(todoId, user.id);
    await refreshTodos();
  };

  const refreshTodos = async () => {
    if (!couple) return;
    const todoList = await Storage.getTodos(couple.id);
    setTodos(todoList);
  };

  // ==================== DATE PLANS ====================
  const createDatePlanHandler = async (
    title: string,
    date: Date,
    time?: string,
    location?: string,
    notes?: string
  ) => {
    if (!couple || !user) return;
    const plan = await Storage.createDatePlan(couple.id, user.id, title, date, time, location, notes);
    setDatePlans(prev => [...prev, plan]);
  };

  const refreshDatePlans = async () => {
    if (!couple) return;
    const plans = await Storage.getDatePlans(couple.id);
    setDatePlans(plans);
  };

  // ==================== MEMORIES ====================
  const createMemoryHandler = async (
    title: string,
    category: Memory['category'],
    date: Date,
    description?: string,
    imageUrl?: string
  ) => {
    if (!couple || !user) return;
    const memory = await Storage.createMemory(
      couple.id,
      user.id,
      title,
      category,
      date,
      description,
      imageUrl
    );
    setMemories(prev => [...prev, memory]);
  };

  const refreshMemories = async () => {
    if (!couple) return;
    const mems = await Storage.getMemories(couple.id);
    setMemories(mems);
  };

  // ==================== MOOD CHECK-IN ====================
  const createMoodCheckInHandler = async (mood: MoodCheckIn['mood'], note?: string) => {
    if (!couple || !user) return;
    const checkIn = await Storage.createMoodCheckIn(couple.id, user.id, mood, note);
    setMoodCheckIns(prev => [...prev, checkIn]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signUp,
        logout,
        couple,
        partner,
        isPaired,
        createCouple: createCoupleHandler,
        joinCouple: joinCoupleHandler,
        disconnectCouple: disconnectCoupleHandler,
        theme,
        themeColors,
        setTheme,
        changeTheme,
        settings,
        updateSettings,
        messages,
        sendMessage,
        addReaction,
        refreshMessages,
        journalEntries,
        createJournalEntry: createJournalEntryHandler,
        updateJournalPrivacy,
        refreshJournal,
        streak,
        sendLovePing: sendLovePingHandler,
        lovePings,
        todos,
        createTodo: createTodoHandler,
        completeTodo: completeTodoHandler,
        refreshTodos,
        datePlans,
        createDatePlan: createDatePlanHandler,
        refreshDatePlans,
        memories,
        createMemory: createMemoryHandler,
        refreshMemories,
        moodCheckIns,
        createMoodCheckIn: createMoodCheckInHandler,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ==================== HOOK ====================
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
