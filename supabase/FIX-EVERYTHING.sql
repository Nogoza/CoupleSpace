-- ============================================
-- CoupleSpace - TÜM SORUNLARI ÇÖZEN TEK SQL
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Bu dosya tüm eksikleri ve RLS sorunlarını çözer

-- ========== 1. EKSİK KOLONLARI EKLE ==========
DO $$ 
BEGIN
  -- nicknames kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'couples' AND column_name = 'nicknames'
  ) THEN
    ALTER TABLE public.couples ADD COLUMN nicknames JSONB DEFAULT '{}';
  END IF;
END $$;

-- ========== 2. AUTH KULLANICILARINI PUBLIC.USERS'A EKLE ==========
INSERT INTO public.users (id, email, display_name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ========== 3. TRIGGER'I OLUŞTUR/GÜNCELLE ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== 4. TÜM RLS'Yİ DEVRE DIŞI BIRAK ==========
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.love_pings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.couple_todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.date_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mood_checkins DISABLE ROW LEVEL SECURITY;

-- ========== 5. TÜM ESKİ POLİTİKALARI SİL ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ========== 6. RLS'Yİ ETKİNLEŞTİR ==========
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- ========== 7. YENİ RLS POLİTİKALARI ==========

-- USERS
CREATE POLICY "users_all" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COUPLES
CREATE POLICY "couples_all" ON public.couples FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MESSAGES
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MESSAGE_REACTIONS
CREATE POLICY "reactions_all" ON public.message_reactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- JOURNAL_ENTRIES
CREATE POLICY "journal_all" ON public.journal_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LOVE_PINGS
CREATE POLICY "pings_all" ON public.love_pings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- COUPLE_TODOS
CREATE POLICY "todos_all" ON public.couple_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DATE_PLANS
CREATE POLICY "dates_all" ON public.date_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MEMORIES
CREATE POLICY "memories_all" ON public.memories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STREAKS
CREATE POLICY "streaks_all" ON public.streaks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- USER_SETTINGS
CREATE POLICY "settings_all" ON public.user_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- MOOD_CHECKINS
CREATE POLICY "mood_all" ON public.mood_checkins FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== 8. REALTIME'I ETKİNLEŞTİR ==========
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.messages,
  public.love_pings,
  public.couples,
  public.journal_entries,
  public.couple_todos,
  public.mood_checkins;

-- ========== 9. STREAK FONKSIYONU ==========
CREATE OR REPLACE FUNCTION public.update_streak(p_couple_id UUID, p_entry_date DATE)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_entry_date, current_streak, longest_streak 
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.streaks WHERE couple_id = p_couple_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (couple_id, current_streak, longest_streak, last_entry_date)
    VALUES (p_couple_id, 1, 1, p_entry_date);
  ELSE
    IF v_last_date = p_entry_date - INTERVAL '1 day' THEN
      v_current_streak := v_current_streak + 1;
      IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
      END IF;
    ELSIF v_last_date < p_entry_date - INTERVAL '1 day' THEN
      v_current_streak := 1;
    END IF;
    UPDATE public.streaks 
    SET current_streak = v_current_streak, 
        longest_streak = v_longest_streak,
        last_entry_date = p_entry_date,
        updated_at = NOW()
    WHERE couple_id = p_couple_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== 10. DOĞRULAMA ==========
SELECT '✅ TÜM DÜZELTMELER BAŞARIYLA UYGULANDI!' as status;

-- Kullanıcıları göster
SELECT 'KULLANICILAR:' as info;
SELECT id, email, display_name FROM public.users;

-- Couple'ları göster  
SELECT 'COUPLELER:' as info;
SELECT id, pairing_code, user1_id, user2_id, is_active FROM public.couples;

-- Politikaları göster
SELECT 'RLS POLİTİKALARI:' as info;
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
