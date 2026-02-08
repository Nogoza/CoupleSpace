-- ============================================
-- CoupleSpace - Messages Tablosu Güncelleme
-- Medya desteği için yeni kolonlar
-- ============================================

-- Yeni kolonları ekle
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS media_duration INTEGER;

-- message_type enum güncelleme (PostgreSQL için)
-- Not: Eğer enum zaten varsa, ALTER TYPE kullanılmalı
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'audio', 'file', 'sticker', 'quickMessage', 'lovePing');
    ELSE
        -- Yeni değerleri ekle
        ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'audio';
        ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'file';
        ALTER TYPE message_type_enum ADD VALUE IF NOT EXISTS 'sticker';
    END IF;
END
$$;

-- Eğer message_type text ise (enum değilse), değişiklik yapılmasına gerek yok
-- Supabase genellikle text kullanır ve application-level validation yapar

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_messages_media_url ON messages(media_url) WHERE media_url IS NOT NULL;
