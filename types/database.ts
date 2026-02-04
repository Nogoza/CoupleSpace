// ============================================
// CoupleSpace - Database Types (Supabase)
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          nickname: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name: string;
          nickname?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          pairing_code: string;
          user1_id: string;
          user2_id: string | null;
          anniversary_date: string | null;
          theme: string;
          is_active: boolean;
          created_at: string;
          connected_at: string | null;
        };
        Insert: {
          id?: string;
          pairing_code: string;
          user1_id: string;
          user2_id?: string | null;
          anniversary_date?: string | null;
          theme?: string;
          is_active?: boolean;
          created_at?: string;
          connected_at?: string | null;
        };
        Update: {
          pairing_code?: string;
          user1_id?: string;
          user2_id?: string | null;
          anniversary_date?: string | null;
          theme?: string;
          is_active?: boolean;
          connected_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'quickMessage' | 'lovePing';
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'quickMessage' | 'lovePing';
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          message_type?: 'text' | 'image' | 'quickMessage' | 'lovePing';
          is_read?: boolean;
        };
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          emoji?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          date: string;
          content: string;
          mood: string;
          tags: string[];
          privacy: 'private' | 'shared' | 'common';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          date: string;
          content: string;
          mood: string;
          tags?: string[];
          privacy?: 'private' | 'shared' | 'common';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          mood?: string;
          tags?: string[];
          privacy?: 'private' | 'shared' | 'common';
          updated_at?: string;
        };
      };
      love_pings: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string | null;
        };
      };
      couple_todos: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: string;
          is_completed: boolean;
          completed_by: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          category?: string;
          is_completed?: boolean;
          completed_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          is_completed?: boolean;
          completed_by?: string | null;
          completed_at?: string | null;
        };
      };
      date_plans: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          date: string;
          time: string | null;
          location: string | null;
          notes: string | null;
          status: 'planned' | 'completed' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          date: string;
          time?: string | null;
          location?: string | null;
          notes?: string | null;
          status?: 'planned' | 'completed' | 'cancelled';
          created_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          time?: string | null;
          location?: string | null;
          notes?: string | null;
          status?: 'planned' | 'completed' | 'cancelled';
        };
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: string;
          image_url: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          date?: string;
        };
      };
      mood_checkins: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          mood: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          mood: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          mood?: string;
          note?: string | null;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          notifications_enabled: boolean;
          lock_screen_privacy: boolean;
          daily_reminder: boolean;
          reminder_time: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notifications_enabled?: boolean;
          lock_screen_privacy?: boolean;
          daily_reminder?: boolean;
          reminder_time?: string | null;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          notifications_enabled?: boolean;
          lock_screen_privacy?: boolean;
          daily_reminder?: boolean;
          reminder_time?: string | null;
          language?: string;
          updated_at?: string;
        };
      };
      streaks: {
        Row: {
          couple_id: string;
          current_streak: number;
          longest_streak: number;
          last_entry_date: string | null;
          updated_at: string;
        };
        Insert: {
          couple_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_entry_date?: string | null;
          updated_at?: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_entry_date?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
