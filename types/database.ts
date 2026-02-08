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
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          pairing_code: string;
          user1_id: string;
          user2_id: string | null;
          anniversary_date: string | null;
          theme: string;
          nicknames: Json | null;
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
          nicknames?: Json | null;
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
          nicknames?: Json | null;
          is_active?: boolean;
          connected_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "couples_user1_id_fkey";
            columns: ["user1_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couples_user2_id_fkey";
            columns: ["user2_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'audio' | 'file' | 'sticker' | 'quickMessage' | 'lovePing';
          media_url: string | null;
          file_name: string | null;
          file_size: number | null;
          media_duration: number | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'audio' | 'file' | 'sticker' | 'quickMessage' | 'lovePing';
          media_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          media_duration?: number | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          message_type?: 'text' | 'image' | 'audio' | 'file' | 'sticker' | 'quickMessage' | 'lovePing';
          media_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          media_duration?: number | null;
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "messages_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "journal_entries_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "love_pings_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "love_pings_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "couple_todos_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "couple_todos_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "date_plans_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "date_plans_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: string;
          custom_category: string | null;
          image_url: string | null;
          image_urls: string[] | null;
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
          custom_category?: string | null;
          image_url?: string | null;
          image_urls?: string[] | null;
          date: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          custom_category?: string | null;
          image_url?: string | null;
          image_urls?: string[] | null;
          date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "mood_checkins_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mood_checkins_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      streaks: {
        Row: {
          id: string;
          couple_id: string;
          current_streak: number;
          longest_streak: number;
          last_entry_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
        Relationships: [
          {
            foreignKeyName: "streaks_couple_id_fkey";
            columns: ["couple_id"];
            referencedRelation: "couples";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_streak: {
        Args: {
          p_couple_id: string;
          p_entry_date: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
