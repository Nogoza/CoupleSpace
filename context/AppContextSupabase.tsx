// ============================================
// CoupleSpace - App Context (Supabase Entegrasyonlu)
// ============================================

import { DEFAULT_THEME, ThemeColors } from '@/constants/couple-theme';
import {
  AuthService,
  CoupleService,
  DatePlanService,
  JournalService,
  LovePingService,
  MemoryService,
  MessageService,
  SettingsService,
  StorageService,
  TodoService,
} from '@/services/supabase-service';
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
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// ==================== CONTEXT TYPES ====================
interface AppContextType {
  // Auth & User
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateProfilePhoto: (imageUri: string) => Promise<{ error: string | null }>;
  removeProfilePhoto: () => Promise<{ error: string | null }>;

  // Couple & Partner
  couple: Couple | null;
  partner: User | null;
  isPaired: boolean;
  createCouple: () => Promise<string>;
  joinCouple: (code: string) => Promise<boolean>;
  disconnectCouple: (deleteData?: boolean) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;

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
  sendMediaMessage: (
    type: 'image' | 'audio' | 'file',
    uri: string,
    options?: { fileName?: string; fileSize?: number; duration?: number; mimeType?: string }
  ) => Promise<void>;
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
  ) => Promise<JournalEntry | null>;
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
    imageUrl?: string,
    customCategory?: string,
    imageUrls?: string[]
  ) => Promise<void>;
  refreshMemories: () => Promise<void>;

  // Mood
  moodCheckIns: MoodCheckIn[];
  addMoodCheckIn: (mood: MoodCheckIn['mood'], note?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// ==================== APP PROVIDER ====================
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [themeState, setThemeState] = useState<ThemeType>(DEFAULT_THEME);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<CoupleTodo[]>([]);
  const [datePlans, setDatePlans] = useState<DatePlan[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [lovePings, setLovePings] = useState<LovePing[]>([]);
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckIn[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  // Realtime subscriptions
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);

  // Computed
  const themeColors = ThemeColors[themeState];
  const isAuthenticated = !!user;
  const isPaired = !!couple?.user2Id;

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    initializeApp();

    // Auth state listener
    const { data: authListener } = AuthService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await loadUserData(authUser.id);
      } else {
        resetState();
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
      // Cleanup realtime subscriptions
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, []);

  const initializeApp = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.id);
      }
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // Couple bilgilerini yükle
      const userCouple = await CoupleService.getUserCouple(userId);
      if (userCouple) {
        setCouple(userCouple);
        setThemeState(userCouple.theme || DEFAULT_THEME);

        // Partner bilgilerini yükle
        const userPartner = await CoupleService.getPartner(userCouple, userId);
        setPartner(userPartner);

        // Couple verilerini yükle
        await loadCoupleData(userCouple.id, userId);

        // Realtime subscriptions'ı kur
        setupRealtimeSubscriptions(userCouple.id);
      }

      // Kullanıcı ayarlarını yükle
      const userSettings = await SettingsService.getSettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const loadCoupleData = async (coupleId: string, userId: string) => {
    try {
      const [msgs, entries, todoList, plans, mems, pings, streakData] = await Promise.all([
        MessageService.getMessages(coupleId),
        JournalService.getEntries(coupleId, userId),
        TodoService.getTodos(coupleId),
        DatePlanService.getPlans(coupleId),
        MemoryService.getMemories(coupleId),
        LovePingService.getPings(coupleId),
        JournalService.getStreak(coupleId),
      ]);

      setMessages(msgs);
      setJournalEntries(entries);
      setTodos(todoList);
      setDatePlans(plans);
      setMemories(mems);
      setLovePings(pings);
      setStreak(streakData);
    } catch (error) {
      console.error('Load couple data error:', error);
    }
  };

  const setupRealtimeSubscriptions = (coupleId: string) => {
    // Önceki subscription'ları temizle
    subscriptions.forEach((sub) => sub.unsubscribe());

    const newSubscriptions: RealtimeChannel[] = [];

    // Couple değişikliklerini dinle (partner katıldığında güncelleme için)
    const coupleSub = CoupleService.subscribeToCouple(coupleId, async (updatedCouple) => {
      console.log('Couple updated via realtime:', updatedCouple);
      setCouple(updatedCouple);

      // Eğer user2Id yeni eklendiyse (partner katıldı), partner bilgilerini yükle
      if (updatedCouple.user2Id && user) {
        const partnerData = await CoupleService.getPartner(updatedCouple, user.id);
        if (partnerData) {
          console.log('Partner joined:', partnerData);
          setPartner(partnerData);
        }
      }
    });
    newSubscriptions.push(coupleSub);

    // Mesaj subscription
    const msgSub = MessageService.subscribeToMessages(coupleId, (newMessage) => {
      setMessages((prev) => {
        // Duplicate kontrolü
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });
    newSubscriptions.push(msgSub);

    // Love ping subscription
    const pingSub = LovePingService.subscribeToLovePings(coupleId, (newPing) => {
      setLovePings((prev) => [newPing, ...prev]);
    });
    newSubscriptions.push(pingSub);

    setSubscriptions(newSubscriptions);
  };

  const resetState = () => {
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
    setStreak({ current: 0, longest: 0 });
    setThemeState(DEFAULT_THEME);
    setSettings(null);
  };

  // ==================== AUTH ====================
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { user: authUser, error } = await AuthService.signIn(email, password);
    if (authUser) {
      setUser(authUser);
      await loadUserData(authUser.id);
    }
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ error: string | null }> => {
    const { user: authUser, error } = await AuthService.signUp(email, password, displayName);
    if (authUser) {
      setUser(authUser);
    }
    return { error };
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      // Önce subscriptions'ları temizle
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.log('Subscription cleanup error:', e);
        }
      });
      setSubscriptions([]);

      // Supabase'den çıkış yap
      const { error } = await AuthService.signOut();
      if (error) {
        console.error('SignOut error:', error);
      }

      // State'i sıfırla
      resetState();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Hata olsa bile state'i sıfırla
      resetState();
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    await AuthService.updateProfile(user.id, updates);
    setUser({ ...user, ...updates });
  };

  const updateProfilePhoto = async (imageUri: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Kullanıcı bulunamadı' };

    try {
      // Fotoğrafı Storage'a yükle
      const { url, error: uploadError } = await StorageService.uploadAvatar(user.id, imageUri);
      if (uploadError || !url) {
        return { error: uploadError || 'Fotoğraf yüklenemedi' };
      }

      // Kullanıcı profilini güncelle
      await AuthService.updateProfile(user.id, { avatarUrl: url });
      setUser({ ...user, avatarUrl: url });

      return { error: null };
    } catch (err) {
      console.error('updateProfilePhoto error:', err);
      return { error: err instanceof Error ? err.message : 'Fotoğraf güncellenirken hata oluştu' };
    }
  };

  const removeProfilePhoto = async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Kullanıcı bulunamadı' };

    try {
      // Storage'dan sil
      const { error: deleteError } = await StorageService.deleteAvatar(user.id);
      if (deleteError) {
        console.log('Delete warning:', deleteError);
      }

      // Kullanıcı profilini güncelle
      await AuthService.updateProfile(user.id, { avatarUrl: undefined });
      setUser({ ...user, avatarUrl: undefined });

      return { error: null };
    } catch (err) {
      console.error('removeProfilePhoto error:', err);
      return { error: err instanceof Error ? err.message : 'Fotoğraf silinirken hata oluştu' };
    }
  };

  // ==================== COUPLE ====================
  const createCoupleHandler = async (): Promise<string> => {
    if (!user) {
      console.error('createCoupleHandler: User not logged in');
      throw new Error('Önce giriş yapmalısınız');
    }

    console.log('Creating couple for user:', user.id);
    const { couple: newCouple, error } = await CoupleService.createCouple(user.id);

    if (error) {
      console.error('createCoupleHandler error:', error);
      throw new Error(error);
    }

    if (!newCouple) {
      console.error('createCoupleHandler: No couple returned');
      throw new Error('Eşleşme kodu oluşturulamadı');
    }

    console.log('Couple created successfully:', newCouple);
    setCouple(newCouple);

    // Realtime subscription'ı başlat - partner katıldığında güncellenecek
    setupRealtimeSubscriptions(newCouple.id);

    return newCouple.pairingCode;
  };

  const joinCoupleHandler = async (code: string): Promise<boolean> => {
    if (!user) return false;
    const { couple: joinedCouple, partner: joinedPartner, error } = await CoupleService.joinCouple(
      code,
      user.id
    );
    if (error || !joinedCouple) {
      console.error('Join couple error:', error);
      return false;
    }
    setCouple(joinedCouple);
    setPartner(joinedPartner);
    await loadCoupleData(joinedCouple.id, user.id);
    setupRealtimeSubscriptions(joinedCouple.id);
    return true;
  };

  const disconnectCoupleHandler = async (deleteData: boolean = false) => {
    if (!couple) {
      console.log('No couple to disconnect');
      return;
    }

    try {
      console.log('Disconnecting couple:', couple.id);

      // Subscriptions'ları temizle
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.log('Subscription cleanup error:', e);
        }
      });
      setSubscriptions([]);

      // Supabase'de couple'ı deaktive et
      const { error } = await CoupleService.disconnect(couple.id);
      if (error) {
        console.error('Disconnect error:', error);
      }

      // Local state'i temizle
      setCouple(null);
      setPartner(null);
      setMessages([]);
      setJournalEntries([]);
      setTodos([]);
      setDatePlans([]);
      setMemories([]);
      setLovePings([]);
      setMoodCheckIns([]);

      console.log('Disconnect successful');
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  };

  const updateNickname = async (newNickname: string) => {
    if (!user || !couple) return;
    // Nickname'i couple tablosunda güncelle
    const updatedNicknames = {
      ...couple.nicknames,
      [user.id]: newNickname,
    };
    await CoupleService.updateNicknames(couple.id, updatedNicknames);
    setCouple({ ...couple, nicknames: updatedNicknames });
  };

  // ==================== THEME ====================
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (couple) {
      await CoupleService.updateTheme(couple.id, newTheme);
    }
  };

  // ==================== SETTINGS ====================
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...updates } as UserSettings;
    setSettings(newSettings);
    await SettingsService.updateSettings(user.id, updates);
  };

  // ==================== MESSAGES ====================
  const sendMessage = async (content: string, type: Message['messageType'] = 'text') => {
    if (!couple || !user) {
      console.error('sendMessage: No couple or user', { couple: !!couple, user: !!user });
      return;
    }
    console.log('Sending message:', { coupleId: couple.id, userId: user.id, content: content.substring(0, 20) });
    const { message, error } = await MessageService.sendMessage(couple.id, user.id, content, type);
    if (error) {
      console.error('sendMessage error:', error);
      return;
    }
    if (message) {
      console.log('Message sent successfully:', message.id);
      // Realtime zaten ekleyecek, ama hemen göstermek için
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  };

  const sendMediaMessage = async (
    type: 'image' | 'audio' | 'file',
    uri: string,
    options?: { fileName?: string; fileSize?: number; duration?: number; mimeType?: string }
  ) => {
    if (!couple || !user) {
      console.error('sendMediaMessage: No couple or user');
      return;
    }

    // Dynamically import storage service to avoid circular deps
    const { uploadImage, uploadAudio, uploadFile } = await import('@/services/storage-service');

    let mediaUrl: string | null = null;
    let uploadError: string | null = null;

    // Upload based on type
    if (type === 'image') {
      const result = await uploadImage(uri, couple.id);
      mediaUrl = result.url;
      uploadError = result.error;
    } else if (type === 'audio') {
      const result = await uploadAudio(uri, couple.id);
      mediaUrl = result.url;
      uploadError = result.error;
    } else if (type === 'file') {
      const result = await uploadFile(uri, couple.id, options?.mimeType);
      mediaUrl = result.url;
      uploadError = result.error;
    }

    if (uploadError || !mediaUrl) {
      console.error('Media upload error:', uploadError);
      return;
    }

    // Send message with media
    const content = type === 'image' ? '📷 Görsel' : type === 'audio' ? '🎤 Sesli mesaj' : `📄 ${options?.fileName || 'Dosya'}`;
    const { message, error } = await MessageService.sendMessage(
      couple.id,
      user.id,
      content,
      type,
      {
        mediaUrl,
        fileName: options?.fileName,
        fileSize: options?.fileSize,
        mediaDuration: options?.duration,
      }
    );

    if (error) {
      console.error('sendMediaMessage error:', error);
      return;
    }
    if (message) {
      console.log('Media message sent successfully:', message.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    await MessageService.addReaction(messageId, user.id, emoji);
    // Mesajları yenile
    if (couple) {
      const updatedMessages = await MessageService.getMessages(couple.id);
      setMessages(updatedMessages);
    }
  };

  const refreshMessages = async () => {
    if (!couple) return;
    const msgs = await MessageService.getMessages(couple.id);
    setMessages(msgs);
  };

  // ==================== JOURNAL ====================
  const createJournalEntry = async (
    date: string,
    content: string,
    mood: JournalEntry['mood'],
    tags: string[] = [],
    privacy: JournalEntry['privacy'] = 'private'
  ): Promise<JournalEntry | null> => {
    if (!couple || !user) {
      console.error('createJournalEntry: No couple or user', { couple: !!couple, user: !!user });
      return null;
    }
    console.log('Creating journal entry:', { coupleId: couple.id, userId: user.id, date });
    const { entry, error } = await JournalService.createEntry(
      couple.id,
      user.id,
      date,
      content,
      mood,
      tags,
      privacy
    );
    if (error) {
      console.error('createJournalEntry error:', error);
      return null;
    }
    if (entry) {
      console.log('Journal entry created successfully:', entry.id);
      setJournalEntries((prev) => [entry, ...prev]);
      // Streak'i güncelle
      const newStreak = await JournalService.getStreak(couple.id);
      setStreak(newStreak);
    }
    return entry;
  };

  const updateJournalPrivacy = async (entryId: string, privacy: JournalEntry['privacy']) => {
    await JournalService.updatePrivacy(entryId, privacy);
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, privacy } : e))
    );
  };

  const refreshJournal = async () => {
    if (!couple || !user) return;
    const entries = await JournalService.getEntries(couple.id, user.id);
    setJournalEntries(entries);
    const newStreak = await JournalService.getStreak(couple.id);
    setStreak(newStreak);
  };

  // ==================== LOVE PING ====================
  const sendLovePing = async (note?: string) => {
    if (!couple || !user) {
      console.error('sendLovePing: No couple or user', { couple: !!couple, user: !!user });
      return;
    }
    console.log('Sending love ping:', { coupleId: couple.id, userId: user.id });
    const { error } = await LovePingService.sendPing(couple.id, user.id, note);
    if (error) {
      console.error('sendLovePing error:', error);
    } else {
      console.log('Love ping sent successfully');
    }
    // Realtime güncelleyecek
  };

  // ==================== TODOS ====================
  const createTodo = async (
    title: string,
    category: CoupleTodo['category'],
    description?: string
  ) => {
    if (!couple || !user) return;
    const { todo } = await TodoService.createTodo(couple.id, user.id, title, category, description);
    if (todo) {
      setTodos((prev) => [todo, ...prev]);
    }
  };

  const completeTodo = async (todoId: string) => {
    if (!user) return;
    await TodoService.completeTodo(todoId, user.id);
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, isCompleted: true, completedBy: user.id, completedAt: new Date() }
          : t
      )
    );
  };

  const refreshTodos = async () => {
    if (!couple) return;
    const todoList = await TodoService.getTodos(couple.id);
    setTodos(todoList);
  };

  // ==================== DATE PLANS ====================
  const createDatePlan = async (
    title: string,
    date: Date,
    time?: string,
    location?: string,
    notes?: string
  ) => {
    if (!couple || !user) return;
    const { plan } = await DatePlanService.createPlan(
      couple.id,
      user.id,
      title,
      date,
      time,
      location,
      notes
    );
    if (plan) {
      setDatePlans((prev) => [...prev, plan].sort((a, b) => a.date.getTime() - b.date.getTime()));
    }
  };

  const refreshDatePlans = async () => {
    if (!couple) return;
    const plans = await DatePlanService.getPlans(couple.id);
    setDatePlans(plans);
  };

  // ==================== MEMORIES ====================
  const createMemory = async (
    title: string,
    category: Memory['category'],
    date: Date,
    description?: string,
    imageUrl?: string,
    customCategory?: string,
    imageUrls?: string[]
  ) => {
    if (!couple || !user) return;

    // Fotoğrafları yükle
    let uploadedUrls: string[] = [];
    if (imageUrls && imageUrls.length > 0) {
      const { urls, error } = await StorageService.uploadMemoryPhotos(couple.id, imageUrls);
      if (!error && urls.length > 0) {
        uploadedUrls = urls;
      }
    }

    const { memory } = await MemoryService.createMemory(
      couple.id,
      user.id,
      title,
      category,
      date,
      description,
      imageUrl || (uploadedUrls.length > 0 ? uploadedUrls[0] : undefined),
      customCategory,
      uploadedUrls.length > 0 ? uploadedUrls : undefined
    );
    if (memory) {
      setMemories((prev) => [memory, ...prev]);
    }
  };

  const refreshMemories = async () => {
    if (!couple) return;
    const mems = await MemoryService.getMemories(couple.id);
    setMemories(mems);
  };

  // ==================== MOOD ====================
  const addMoodCheckIn = async (mood: MoodCheckIn['mood'], note?: string) => {
    // TODO: Implement mood check-in service
    const newCheckIn: MoodCheckIn = {
      id: Date.now().toString(),
      coupleId: couple?.id || '',
      userId: user?.id || '',
      mood,
      note,
      createdAt: new Date(),
    };
    setMoodCheckIns((prev) => [newCheckIn, ...prev]);
  };

  // ==================== CONTEXT VALUE ====================
  const value: AppContextType = {
    // Auth
    user,
    isAuthenticated,
    isLoading,
    login,
    signUp,
    logout,
    updateProfilePhoto,
    removeProfilePhoto,
    updateProfile,

    // Couple
    couple,
    partner,
    isPaired,
    createCouple: createCoupleHandler,
    joinCouple: joinCoupleHandler,
    disconnectCouple: disconnectCoupleHandler,
    updateNickname,

    // Theme
    theme: themeState,
    themeColors,
    setTheme,
    changeTheme: setTheme, // alias

    // Settings
    settings,
    updateSettings,

    // Messages
    messages,
    sendMessage,
    sendMediaMessage,
    addReaction,
    refreshMessages,

    // Journal
    journalEntries,
    createJournalEntry,
    updateJournalPrivacy,
    refreshJournal,
    streak,

    // Love Ping
    sendLovePing,
    lovePings,

    // Todos
    todos,
    createTodo,
    completeTodo,
    refreshTodos,

    // Date Plans
    datePlans,
    createDatePlan,
    refreshDatePlans,

    // Memories
    memories,
    createMemory,
    refreshMemories,

    // Mood
    moodCheckIns,
    addMoodCheckIn,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
