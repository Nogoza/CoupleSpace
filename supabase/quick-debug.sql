-- ============================================
-- CoupleSpace - Hızlı Debug ve Düzeltme SQL
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Önce tabloların var olup olmadığını kontrol edin
-- Bu sorgu hata verirse, schema.sql dosyasını çalıştırmanız gerekir
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'couples'
) AS couples_table_exists;

-- 2. Auth'daki kullanıcıları public.users tablosuna ekle (EKSİK OLANLAR)
-- Bu, trigger çalışmadan önce kayıt olan kullanıcıları düzeltir
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

-- 3. Trigger'ı yeniden oluştur (ileride kayıt olanlar için)
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

-- 4. RLS'yi GEÇİCİ OLARAK DEVRE DIŞI BIRAK (DEBUG İÇİN)
-- Eşleşme çalışmazsa, RLS sorunu olabilir
ALTER TABLE public.couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks DISABLE ROW LEVEL SECURITY;

-- 5. Kullanıcıları ve couple'ları kontrol et
SELECT 'USERS TABLE:' as info;
SELECT id, email, display_name FROM public.users;

SELECT 'AUTH USERS:' as info;
SELECT id, email FROM auth.users;

SELECT 'COUPLES TABLE:' as info;
SELECT id, pairing_code, user1_id, user2_id, is_active FROM public.couples;

-- 6. Test: Elle bir couple oluştur (SADECE DEBUG İÇİN)
-- Bunu kullanmak için önce bir kullanıcının ID'sini yukarıdan alın
-- ve aşağıdaki YOUR_USER_ID yerine yazın
-- INSERT INTO public.couples (pairing_code, user1_id, is_active)
-- VALUES ('TEST01', 'YOUR_USER_ID', true);
