-- ============================================
-- CoupleSpace - TÜM RLS POLİTİKALARI DÜZELTMESİ
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- Tüm etkileşim sorunlarını çözer (mesaj, journal, love ping vs.)

-- ========== 1. TÜM RLS'Yİ DEVRE DIŞI BIRAK ==========
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

-- ========== 2. TÜM ESKİ POLİTİKALARI SİL ==========
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ========== 3. RLS'Yİ ETKİNLEŞTİR ==========
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

-- ========== 4. USERS TABLOSU ==========
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ========== 5. COUPLES TABLOSU ==========
-- Herkes couple'ları görebilir (pairing code ile arama için)
CREATE POLICY "couples_select" ON public.couples FOR SELECT TO authenticated USING (true);
-- Authenticated user couple oluşturabilir
CREATE POLICY "couples_insert" ON public.couples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user1_id);
-- Couple üyeleri güncelleyebilir
CREATE POLICY "couples_update" ON public.couples FOR UPDATE TO authenticated 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ========== 6. MESSAGES TABLOSU ==========
-- Couple üyeleri mesajları görebilir
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
-- Couple üyeleri mesaj gönderebilir
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = sender_id AND
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
-- Mesaj sahibi güncelleyebilir
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated 
  USING (auth.uid() = sender_id);
-- Mesaj sahibi silebilir
CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated 
  USING (auth.uid() = sender_id);

-- ========== 7. MESSAGE_REACTIONS TABLOSU ==========
CREATE POLICY "reactions_select" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ========== 8. JOURNAL_ENTRIES TABLOSU ==========
CREATE POLICY "journal_select" ON public.journal_entries FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "journal_insert" ON public.journal_entries FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "journal_update" ON public.journal_entries FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "journal_delete" ON public.journal_entries FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ========== 9. LOVE_PINGS TABLOSU ==========
CREATE POLICY "pings_select" ON public.love_pings FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "pings_insert" ON public.love_pings FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = sender_id AND
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "pings_update" ON public.love_pings FOR UPDATE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 10. COUPLE_TODOS TABLOSU ==========
CREATE POLICY "todos_select" ON public.couple_todos FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "todos_insert" ON public.couple_todos FOR INSERT TO authenticated 
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "todos_update" ON public.couple_todos FOR UPDATE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "todos_delete" ON public.couple_todos FOR DELETE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 11. DATE_PLANS TABLOSU ==========
CREATE POLICY "dates_select" ON public.date_plans FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "dates_insert" ON public.date_plans FOR INSERT TO authenticated 
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "dates_update" ON public.date_plans FOR UPDATE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "dates_delete" ON public.date_plans FOR DELETE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 12. MEMORIES TABLOSU ==========
CREATE POLICY "memories_select" ON public.memories FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "memories_insert" ON public.memories FOR INSERT TO authenticated 
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "memories_update" ON public.memories FOR UPDATE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "memories_delete" ON public.memories FOR DELETE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 13. STREAKS TABLOSU ==========
CREATE POLICY "streaks_select" ON public.streaks FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "streaks_insert" ON public.streaks FOR INSERT TO authenticated 
  WITH CHECK (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "streaks_update" ON public.streaks FOR UPDATE TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 14. USER_SETTINGS TABLOSU ==========
CREATE POLICY "settings_select" ON public.user_settings FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
CREATE POLICY "settings_insert" ON public.user_settings FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update" ON public.user_settings FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- ========== 15. MOOD_CHECKINS TABLOSU ==========
CREATE POLICY "mood_select" ON public.mood_checkins FOR SELECT TO authenticated 
  USING (
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
CREATE POLICY "mood_insert" ON public.mood_checkins FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND
    couple_id IN (
      SELECT id FROM public.couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- ========== 16. REALTIME'I ETKİNLEŞTİR ==========
-- Supabase Realtime için tablolarda publication ayarla
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.messages,
  public.love_pings,
  public.couples,
  public.journal_entries,
  public.couple_todos,
  public.mood_checkins;

-- ========== 17. DOĞRULAMA ==========
SELECT 'RLS POLİTİKALARI BAŞARIYLA OLUŞTURULDU!' as status;

-- Tablo ve politika sayılarını göster
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
