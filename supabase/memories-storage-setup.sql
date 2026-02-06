-- =============================================
-- CoupleSpace - Memories Storage Setup
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Memories bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies

-- Herkes okuyabilir (public)
CREATE POLICY "Public read access for memories"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories');

-- Sadece couple üyeleri yükleyebilir
CREATE POLICY "Couple members can upload memory photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'memories' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM couples c
    WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
  )
);

-- Sadece couple üyeleri güncelleyebilir
CREATE POLICY "Couple members can update memory photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'memories' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM couples c
    WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
  )
);

-- Sadece couple üyeleri silebilir
CREATE POLICY "Couple members can delete memory photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'memories' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text FROM couples c
    WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
  )
);

-- =============================================
-- Memories Tablosu Güncellemesi
-- =============================================
-- Eğer memories tablonuz varsa bu komutları çalıştırın:

ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS custom_category TEXT,
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- İndeks ekleme (opsiyonel, performans için)
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date DESC);
