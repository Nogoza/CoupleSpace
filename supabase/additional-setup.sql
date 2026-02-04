-- ============================================
-- CoupleSpace - Supabase Ek Ayarlar
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Yeni kullanıcı kaydolunca otomatik profil oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur (varsa önce sil)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Streak güncelleme fonksiyonu
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

-- 3. RLS (Row Level Security) Politikaları
-- Users tablosu
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Couples tablosu
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view couples by pairing code" ON public.couples;
CREATE POLICY "Anyone can view couples by pairing code" ON public.couples
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create couples" ON public.couples;
CREATE POLICY "Authenticated users can create couples" ON public.couples
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

DROP POLICY IF EXISTS "Couple members can update" ON public.couples;
CREATE POLICY "Couple members can update" ON public.couples
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages tablosu
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view messages" ON public.messages;
CREATE POLICY "Couple members can view messages" ON public.messages
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Couple members can send messages" ON public.messages;
CREATE POLICY "Couple members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Journal Entries tablosu
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view journal entries" ON public.journal_entries;
CREATE POLICY "Users can view journal entries" ON public.journal_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (privacy IN ('shared', 'common') AND couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create journal entries" ON public.journal_entries;
CREATE POLICY "Users can create journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (user_id = auth.uid());

-- Love Pings tablosu
ALTER TABLE public.love_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view love pings" ON public.love_pings;
CREATE POLICY "Couple members can view love pings" ON public.love_pings
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Couple members can send love pings" ON public.love_pings;
CREATE POLICY "Couple members can send love pings" ON public.love_pings
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Couple Todos tablosu
ALTER TABLE public.couple_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage todos" ON public.couple_todos;
CREATE POLICY "Couple members can manage todos" ON public.couple_todos
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Date Plans tablosu
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage date plans" ON public.date_plans;
CREATE POLICY "Couple members can manage date plans" ON public.date_plans
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Memories tablosu
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage memories" ON public.memories;
CREATE POLICY "Couple members can manage memories" ON public.memories
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Streaks tablosu
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can view streaks" ON public.streaks;
CREATE POLICY "Couple members can view streaks" ON public.streaks
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- User Settings tablosu
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (user_id = auth.uid());

-- Message Reactions tablosu
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage reactions" ON public.message_reactions;
CREATE POLICY "Couple members can manage reactions" ON public.message_reactions
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      JOIN public.couples c ON m.couple_id = c.id
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  );

-- Mood Check-ins tablosu
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couple members can manage mood checkins" ON public.mood_checkins;
CREATE POLICY "Couple members can manage mood checkins" ON public.mood_checkins
  FOR ALL USING (
    couple_id IN (
      SELECT id FROM public.couples 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- 4. Realtime'ı etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.love_pings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;

-- Tamamlandı!
SELECT 'Ek ayarlar başarıyla uygulandı!' as result;
