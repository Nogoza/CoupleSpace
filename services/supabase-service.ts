// ============================================
// CoupleSpace - Supabase Service Layer
// ============================================

import { supabase } from '@/lib/supabase';
import {
  Couple,
  CoupleTodo,
  DatePlan,
  JournalEntry,
  LovePing,
  Memory,
  Message,
  ThemeType,
  User,
  UserSettings
} from '@/types';

// ==================== AUTH SERVICE ====================
export const AuthService = {
  // Kayıt ol
  async signUp(email: string, password: string, displayName: string): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Kullanıcı oluşturulamadı' };

    // Kullanıcı profili otomatik olarak trigger ile oluşturulacak
    // Ancak güvenli olmak için kontrol edelim
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: profile ? mapUserFromDB(profile) : {
        id: data.user.id,
        email: data.user.email!,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      error: null,
    };
  },

  // Giriş yap
  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Giriş yapılamadı' };

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: profile ? mapUserFromDB(profile) : null,
      error: profile ? null : 'Profil bulunamadı',
    };
  },

  // Çıkış yap
  async signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  },

  // Mevcut kullanıcıyı al
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile ? mapUserFromDB(profile) : null;
  },

  // Oturum durumunu dinle
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        callback(profile ? mapUserFromDB(profile) : null);
      } else {
        callback(null);
      }
    });
  },

  // Profili güncelle
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('users')
      .update({
        display_name: updates.displayName,
        nickname: updates.nickname,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error: error?.message || null };
  },
};

// ==================== COUPLE SERVICE ====================
export const CoupleService = {
  // Eşleşme kodu oluştur
  generatePairingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışıklık yaratabilecek karakterler çıkarıldı (0,O,1,I)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Yeni couple oluştur
  async createCouple(userId: string): Promise<{ couple: Couple | null; error: string | null }> {
    try {
      console.log('Creating couple for user:', userId);

      // Önce kullanıcının zaten bir couple'da olup olmadığını kontrol et
      const existingCouple = await this.getUserCouple(userId);
      if (existingCouple) {
        console.log('User already has a couple:', existingCouple);
        // Eğer existing couple'ın pairing code'u varsa ve user2 yoksa, onu döndür
        if (existingCouple.pairingCode && !existingCouple.user2Id) {
          return { couple: existingCouple, error: null };
        }
        return { couple: existingCouple, error: null };
      }

      const pairingCode = this.generatePairingCode();
      console.log('Generated pairing code:', pairingCode);

      const { data, error } = await supabase
        .from('couples')
        .insert({
          pairing_code: pairingCode,
          user1_id: userId,
          theme: 'softPink',
          is_active: true,
        })
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Couple creation error:', error);
        return { couple: null, error: error.message };
      }

      if (!data) {
        return { couple: null, error: 'Veri oluşturulamadı' };
      }

      // Streak tablosunu da oluştur
      const { error: streakError } = await supabase.from('streaks').insert({ couple_id: data.id });
      if (streakError) {
        console.log('Streak creation error (non-critical):', streakError);
      }

      const couple = mapCoupleFromDB(data);
      console.log('Couple created:', couple);
      return { couple, error: null };
    } catch (err) {
      console.error('Unexpected error in createCouple:', err);
      return { couple: null, error: err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu' };
    }
  },

  // Koda katıl
  async joinCouple(code: string, userId: string): Promise<{ couple: Couple | null; partner: User | null; error: string | null }> {
    // Kodu bul
    const { data: coupleData, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('pairing_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (findError || !coupleData) {
      return { couple: null, partner: null, error: 'Kod bulunamadı veya geçersiz' };
    }

    // Kendi koduna katılmayı engelle
    if (coupleData.user1_id === userId) {
      return { couple: null, partner: null, error: 'Kendi kodunuza katılamazsınız' };
    }

    // Zaten birisi katılmış mı?
    if (coupleData.user2_id) {
      return { couple: null, partner: null, error: 'Bu kod zaten kullanılmış' };
    }

    // Kullanıcının başka bir couple'da olup olmadığını kontrol et
    const existingCouple = await this.getUserCouple(userId);
    if (existingCouple) {
      return { couple: null, partner: null, error: 'Zaten bir eşleşmeniz var' };
    }

    // Katıl
    const { data: updatedCouple, error: updateError } = await supabase
      .from('couples')
      .update({
        user2_id: userId,
        connected_at: new Date().toISOString(),
      })
      .eq('id', coupleData.id)
      .select()
      .single();

    if (updateError) {
      return { couple: null, partner: null, error: updateError.message };
    }

    // Partner bilgilerini al
    const { data: partnerData } = await supabase
      .from('users')
      .select('*')
      .eq('id', coupleData.user1_id)
      .single();

    return {
      couple: mapCoupleFromDB(updatedCouple),
      partner: partnerData ? mapUserFromDB(partnerData) : null,
      error: null,
    };
  },

  // Kullanıcının couple'ını al
  async getUserCouple(userId: string): Promise<Couple | null> {
    try {
      console.log('Getting couple for user:', userId);

      // Önce user1 olarak kontrol et
      const { data: data1, error: error1 } = await supabase
        .from('couples')
        .select('*')
        .eq('is_active', true)
        .eq('user1_id', userId)
        .maybeSingle();

      if (error1) {
        console.log('Error checking user1:', error1);
      }

      if (data1) {
        console.log('Found couple as user1:', data1);
        return mapCoupleFromDB(data1);
      }

      // Sonra user2 olarak kontrol et
      const { data: data2, error: error2 } = await supabase
        .from('couples')
        .select('*')
        .eq('is_active', true)
        .eq('user2_id', userId)
        .maybeSingle();

      if (error2) {
        console.log('Error checking user2:', error2);
      }

      if (data2) {
        console.log('Found couple as user2:', data2);
        return mapCoupleFromDB(data2);
      }

      console.log('No couple found for user');
      return null;
    } catch (err) {
      console.error('Error in getUserCouple:', err);
      return null;
    }
  },

  // Partner bilgilerini al
  async getPartner(couple: Couple, currentUserId: string): Promise<User | null> {
    const partnerId = couple.user1Id === currentUserId ? couple.user2Id : couple.user1Id;
    if (!partnerId) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();

    return data ? mapUserFromDB(data) : null;
  },

  // Couple temayı güncelle
  async updateTheme(coupleId: string, theme: ThemeType): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('couples')
      .update({ theme })
      .eq('id', coupleId);

    return { error: error?.message || null };
  },

  // Nickname güncelle
  async updateNicknames(coupleId: string, nicknames: Record<string, string>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('couples')
      .update({ nicknames })
      .eq('id', coupleId);

    return { error: error?.message || null };
  },

  // Bağlantıyı kes
  async disconnect(coupleId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('couples')
      .update({ is_active: false })
      .eq('id', coupleId);

    return { error: error?.message || null };
  },

  // Couple değişikliklerini dinle (realtime)
  subscribeToCouple(coupleId: string, callback: (couple: Couple) => void) {
    return supabase
      .channel(`couple:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        (payload) => {
          if (payload.new) {
            callback(mapCoupleFromDB(payload.new as any));
          }
        }
      )
      .subscribe();
  },
};

// ==================== MESSAGE SERVICE ====================
export const MessageService = {
  // Mesajları al
  async getMessages(coupleId: string, limit = 50): Promise<Message[]> {
    const { data } = await supabase
      .from('messages')
      .select('*, reactions:message_reactions(*)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true })
      .limit(limit);

    return data ? data.map(mapMessageFromDB) : [];
  },

  // Mesaj gönder
  async sendMessage(
    coupleId: string,
    senderId: string,
    content: string,
    messageType: Message['messageType'] = 'text'
  ): Promise<{ message: Message | null; error: string | null }> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        couple_id: coupleId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    return {
      message: data ? mapMessageFromDB(data) : null,
      error: error?.message || null,
    };
  },

  // Mesaja reaksiyon ekle
  async addReaction(messageId: string, userId: string, emoji: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: userId,
        emoji,
      });

    return { error: error?.message || null };
  },

  // Mesajları okundu olarak işaretle
  async markAsRead(coupleId: string, userId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('couple_id', coupleId)
      .neq('sender_id', userId)
      .eq('is_read', false);
  },

  // Realtime mesaj dinle
  subscribeToMessages(coupleId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          callback(mapMessageFromDB(payload.new as any));
        }
      )
      .subscribe();
  },
};

// ==================== JOURNAL SERVICE ====================
export const JournalService = {
  // Günlük girişlerini al
  async getEntries(coupleId: string, userId: string): Promise<JournalEntry[]> {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('couple_id', coupleId)
      .or(`user_id.eq.${userId},privacy.in.(shared,common)`)
      .order('date', { ascending: false });

    return data ? data.map(mapJournalEntryFromDB) : [];
  },

  // Günlük girişi oluştur
  async createEntry(
    coupleId: string,
    userId: string,
    date: string,
    content: string,
    mood: JournalEntry['mood'],
    tags: string[] = [],
    privacy: JournalEntry['privacy'] = 'private'
  ): Promise<{ entry: JournalEntry | null; error: string | null }> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        date,
        content,
        mood,
        tags,
        privacy,
      })
      .select()
      .single();

    if (data) {
      // Streak'i güncelle
      await supabase.rpc('update_streak', { p_couple_id: coupleId, p_entry_date: date });
    }

    return {
      entry: data ? mapJournalEntryFromDB(data) : null,
      error: error?.message || null,
    };
  },

  // Gizliliği güncelle
  async updatePrivacy(entryId: string, privacy: JournalEntry['privacy']): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('journal_entries')
      .update({ privacy, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    return { error: error?.message || null };
  },

  // Streak bilgisini al
  async getStreak(coupleId: string): Promise<{ current: number; longest: number }> {
    const { data } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('couple_id', coupleId)
      .single();

    return {
      current: data?.current_streak || 0,
      longest: data?.longest_streak || 0,
    };
  },
};

// ==================== LOVE PING SERVICE ====================
export const LovePingService = {
  // Love ping gönder
  async sendPing(coupleId: string, senderId: string, note?: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('love_pings')
      .insert({
        couple_id: coupleId,
        sender_id: senderId,
        note,
      });

    return { error: error?.message || null };
  },

  // Love ping'leri al
  async getPings(coupleId: string, limit = 20): Promise<LovePing[]> {
    const { data } = await supabase
      .from('love_pings')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data ? data.map(mapLovePingFromDB) : [];
  },

  // Realtime love ping dinle
  subscribeToLovePings(coupleId: string, callback: (ping: LovePing) => void) {
    return supabase
      .channel(`lovepings:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'love_pings', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          callback(mapLovePingFromDB(payload.new as any));
        }
      )
      .subscribe();
  },
};

// ==================== TODO SERVICE ====================
export const TodoService = {
  // Todoları al
  async getTodos(coupleId: string): Promise<CoupleTodo[]> {
    const { data } = await supabase
      .from('couple_todos')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    return data ? data.map(mapTodoFromDB) : [];
  },

  // Todo oluştur
  async createTodo(
    coupleId: string,
    createdBy: string,
    title: string,
    category: CoupleTodo['category'],
    description?: string
  ): Promise<{ todo: CoupleTodo | null; error: string | null }> {
    const { data, error } = await supabase
      .from('couple_todos')
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title,
        description,
        category,
      })
      .select()
      .single();

    return {
      todo: data ? mapTodoFromDB(data) : null,
      error: error?.message || null,
    };
  },

  // Todo'yu tamamla
  async completeTodo(todoId: string, completedBy: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('couple_todos')
      .update({
        is_completed: true,
        completed_by: completedBy,
        completed_at: new Date().toISOString(),
      })
      .eq('id', todoId);

    return { error: error?.message || null };
  },
};

// ==================== DATE PLAN SERVICE ====================
export const DatePlanService = {
  // Date planlarını al
  async getPlans(coupleId: string): Promise<DatePlan[]> {
    const { data } = await supabase
      .from('date_plans')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: true });

    return data ? data.map(mapDatePlanFromDB) : [];
  },

  // Date plan oluştur
  async createPlan(
    coupleId: string,
    createdBy: string,
    title: string,
    date: Date,
    time?: string,
    location?: string,
    notes?: string
  ): Promise<{ plan: DatePlan | null; error: string | null }> {
    const { data, error } = await supabase
      .from('date_plans')
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title,
        date: date.toISOString().split('T')[0],
        time,
        location,
        notes,
      })
      .select()
      .single();

    return {
      plan: data ? mapDatePlanFromDB(data) : null,
      error: error?.message || null,
    };
  },
};

// ==================== MEMORY SERVICE ====================
export const MemoryService = {
  // Anıları al
  async getMemories(coupleId: string): Promise<Memory[]> {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: false });

    return data ? data.map(mapMemoryFromDB) : [];
  },

  // Anı oluştur
  async createMemory(
    coupleId: string,
    createdBy: string,
    title: string,
    category: Memory['category'],
    date: Date,
    description?: string,
    imageUrl?: string,
    customCategory?: string,
    imageUrls?: string[]
  ): Promise<{ memory: Memory | null; error: string | null }> {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        couple_id: coupleId,
        created_by: createdBy,
        title,
        category,
        date: date.toISOString().split('T')[0],
        description,
        image_url: imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null),
        custom_category: customCategory,
        image_urls: imageUrls,
      })
      .select()
      .single();

    return {
      memory: data ? {
        id: data.id,
        coupleId: data.couple_id,
        title: data.title,
        description: data.description,
        category: data.category,
        customCategory: data.custom_category,
        imageUrl: data.image_url,
        imageUrls: data.image_urls,
        date: new Date(data.date),
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
      } : null,
      error: error?.message || null,
    };
  },
};

// ==================== SETTINGS SERVICE ====================
export const SettingsService = {
  // Ayarları al
  async getSettings(userId: string): Promise<UserSettings | null> {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data ? mapSettingsFromDB(data) : null;
  },

  // Ayarları güncelle
  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        notifications_enabled: updates.notifications,
        lock_screen_privacy: updates.lockScreenPrivacy,
        daily_reminder: updates.dailyReminder,
        reminder_time: updates.reminderTime,
        language: updates.language,
        updated_at: new Date().toISOString(),
      });

    return { error: error?.message || null };
  },
};

// ==================== MAPPERS ====================
// Database formatından uygulama formatına dönüştürücüler

function mapUserFromDB(data: any): User {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    nickname: data.nickname,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapCoupleFromDB(data: any): Couple {
  return {
    id: data.id,
    pairingCode: data.pairing_code,
    user1Id: data.user1_id,
    user2Id: data.user2_id,
    anniversaryDate: data.anniversary_date ? new Date(data.anniversary_date) : undefined,
    theme: data.theme as ThemeType,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    connectedAt: data.connected_at ? new Date(data.connected_at) : undefined,
  };
}

function mapMessageFromDB(data: any): Message {
  return {
    id: data.id,
    coupleId: data.couple_id,
    senderId: data.sender_id,
    content: data.content,
    messageType: data.message_type,
    isRead: data.is_read,
    createdAt: new Date(data.created_at),
    reactions: data.reactions?.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      emoji: r.emoji,
    })) || [],
  };
}

function mapJournalEntryFromDB(data: any): JournalEntry {
  return {
    id: data.id,
    coupleId: data.couple_id,
    userId: data.user_id,
    date: data.date,
    content: data.content,
    mood: data.mood,
    tags: data.tags || [],
    privacy: data.privacy,
    attachments: [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapLovePingFromDB(data: any): LovePing {
  return {
    id: data.id,
    coupleId: data.couple_id,
    senderId: data.sender_id,
    note: data.note,
    createdAt: new Date(data.created_at),
  };
}

function mapTodoFromDB(data: any): CoupleTodo {
  return {
    id: data.id,
    coupleId: data.couple_id,
    createdBy: data.created_by,
    title: data.title,
    description: data.description,
    category: data.category,
    isCompleted: data.is_completed,
    completedBy: data.completed_by,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    createdAt: new Date(data.created_at),
  };
}

function mapDatePlanFromDB(data: any): DatePlan {
  return {
    id: data.id,
    coupleId: data.couple_id,
    createdBy: data.created_by,
    title: data.title,
    date: new Date(data.date),
    time: data.time,
    location: data.location,
    notes: data.notes,
    isConfirmed: data.status === 'completed',
    createdAt: new Date(data.created_at),
  };
}

function mapMemoryFromDB(data: any): Memory {
  return {
    id: data.id,
    coupleId: data.couple_id,
    createdBy: data.created_by,
    title: data.title,
    description: data.description,
    category: data.category,
    imageUrl: data.image_url,
    date: new Date(data.date),
    createdAt: new Date(data.created_at),
  };
}

function mapSettingsFromDB(data: any): UserSettings {
  return {
    userId: data.user_id,
    notificationsEnabled: data.notifications_enabled ?? true,
    notifications: data.notifications_enabled,
    lockScreenPrivacy: data.lock_screen_privacy ?? false,
    dailyReminder: data.daily_reminder ?? true,
    reminderTime: data.reminder_time,
    language: data.language ?? 'tr',
  };
}

// ==================== STORAGE SERVICE ====================
export const StorageService = {
  // Avatar yükle
  async uploadAvatar(userId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const fileName = `${userId}/avatar_${Date.now()}.jpg`;
      const contentType = 'image/jpeg';

      // Görüntüyü oku ve ArrayBuffer'a çevir
      let arrayBuffer: ArrayBuffer;

      if (imageUri.startsWith('data:')) {
        // Base64 formatında (web)
        const base64Data = imageUri.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // File URI formatında (native veya web file input)
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error('Dosya okunamadı');
        }
        arrayBuffer = await response.arrayBuffer();
      }

      // Önce eski avatarları sil
      await this.deleteAvatar(userId);

      // Yeni avatarı yükle - ArrayBuffer olarak
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { url: null, error: uploadError.message };
      }

      // Public URL al
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      console.error('Avatar upload error:', err);
      return { url: null, error: err instanceof Error ? err.message : 'Fotoğraf yüklenirken hata oluştu' };
    }
  },

  // Avatar sil
  async deleteAvatar(userId: string): Promise<{ error: string | null }> {
    try {
      // Kullanıcının klasöründeki tüm dosyaları listele
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (listError) {
        console.log('List error (may be empty):', listError);
        return { error: null }; // Klasör boş olabilir
      }

      if (files && files.length > 0) {
        const filesToDelete = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return { error: deleteError.message };
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Avatar delete error:', err);
      return { error: err instanceof Error ? err.message : 'Fotoğraf silinirken hata oluştu' };
    }
  },

  // Anı fotoğrafı yükle
  async uploadMemoryPhoto(coupleId: string, imageUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      const fileName = `${coupleId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const contentType = 'image/jpeg';

      // Görüntüyü oku ve ArrayBuffer'a çevir
      let arrayBuffer: ArrayBuffer;

      if (imageUri.startsWith('data:')) {
        // Base64 formatında (web)
        const base64Data = imageUri.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // File URI formatında (mobile)
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error('Dosya okunamadı');
        }
        arrayBuffer = await response.arrayBuffer();
      }

      // Fotoğrafı yükle
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Memory photo upload error:', uploadError);
        return { url: null, error: uploadError.message };
      }

      // Public URL al
      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      console.error('Memory photo upload error:', err);
      return { url: null, error: err instanceof Error ? err.message : 'Fotoğraf yüklenirken hata oluştu' };
    }
  },

  // Çoklu anı fotoğrafı yükle
  async uploadMemoryPhotos(coupleId: string, imageUris: string[]): Promise<{ urls: string[]; error: string | null }> {
    const urls: string[] = [];

    for (const uri of imageUris) {
      const { url, error } = await this.uploadMemoryPhoto(coupleId, uri);
      if (error) {
        return { urls: [], error };
      }
      if (url) {
        urls.push(url);
      }
    }

    return { urls, error: null };
  },
};
