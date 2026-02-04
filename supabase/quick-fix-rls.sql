-- ============================================
-- HIZLI DÜZELTME: RLS Politikalarını Basitleştir
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Couples tablosu için basit RLS
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Anyone can view couples by pairing code" ON public.couples;
DROP POLICY IF EXISTS "Authenticated users can create couples" ON public.couples;
DROP POLICY IF EXISTS "Couple members can update" ON public.couples;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.couples;

-- Tek bir kapsamlı politika oluştur - authenticated kullanıcılar her şeyi yapabilir
CREATE POLICY "Enable all for authenticated users" ON public.couples
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users tablosu için basit RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.users;

CREATE POLICY "Enable all for authenticated users" ON public.users
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Streaks tablosu için basit RLS
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view streaks" ON public.streaks;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.streaks;

CREATE POLICY "Enable all for authenticated users" ON public.streaks
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Messages tablosu
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.messages;
CREATE POLICY "Enable all for authenticated users" ON public.messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Journal Entries tablosu
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.journal_entries;
CREATE POLICY "Enable all for authenticated users" ON public.journal_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Love Pings tablosu
ALTER TABLE public.love_pings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.love_pings;
CREATE POLICY "Enable all for authenticated users" ON public.love_pings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Couple Todos tablosu
ALTER TABLE public.couple_todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.couple_todos;
CREATE POLICY "Enable all for authenticated users" ON public.couple_todos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Date Plans tablosu
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.date_plans;
CREATE POLICY "Enable all for authenticated users" ON public.date_plans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Memories tablosu
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.memories;
CREATE POLICY "Enable all for authenticated users" ON public.memories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Settings tablosu
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.user_settings;
CREATE POLICY "Enable all for authenticated users" ON public.user_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Message Reactions tablosu
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.message_reactions;
CREATE POLICY "Enable all for authenticated users" ON public.message_reactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Mood Check-ins tablosu
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.mood_checkins;
CREATE POLICY "Enable all for authenticated users" ON public.mood_checkins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME AYARLARI
-- ============================================
-- Couples tablosunu realtime'a ekle (partner katıldığında bildirim için)
DO $$
BEGIN
  -- Önce mevcut olup olmadığını kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'couples'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'love_pings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.love_pings;
  END IF;
END $$;

SELECT 'RLS politikaları ve Realtime ayarları tamamlandı!' as result;
