-- ============================================
-- CoupleSpace - Eksik Kolonları Ekle
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Eğer tablolar zaten varsa ve nicknames kolonu eksikse

-- Couples tablosuna nicknames kolonu ekle (yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples' 
    AND column_name = 'nicknames'
  ) THEN
    ALTER TABLE public.couples ADD COLUMN nicknames JSONB DEFAULT '{}';
  END IF;
END $$;

-- Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'couples';
