# 🔧 CoupleSpace - Supabase Kurulum Kontrol Listesi

## Supabase Dashboard'da yapmanız gerekenler:

### 1️⃣ Database Tabloları Oluştur
**SQL Editor'da çalıştır:** `supabase/schema.sql`

Bu dosya tüm tabloları oluşturur:
- users
- couples
- messages
- message_reactions
- journal_entries
- love_pings
- couple_todos
- date_plans
- memories
- streaks
- user_settings
- mood_checkins

### 2️⃣ RLS Politikalarını Ayarla
**SQL Editor'da çalıştır:** `supabase/quick-fix-rls.sql`

Bu dosya Row Level Security politikalarını ayarlar ve authenticated kullanıcıların veritabanına erişmesini sağlar.

### 3️⃣ Trigger ve Fonksiyonları Ekle
**SQL Editor'da çalıştır:** `supabase/additional-setup.sql`

Bu dosya:
- Yeni kullanıcı kaydolunca otomatik profil oluşturma trigger'ı
- Streak güncelleme fonksiyonu
- Realtime ayarları

### 4️⃣ Realtime'ı Etkinleştir
Supabase Dashboard > Database > Replication bölümünde şu tabloları etkinleştirin:
- couples
- messages
- love_pings

---

## ⚠️ Sık Karşılaşılan Sorunlar

### "Eşleşme kodu çalışmıyor"
1. `couples` tablosu oluşturulmuş mu? ✓
2. RLS politikaları ayarlanmış mı? ✓
3. `users` tablosunda kullanıcı kaydı var mı? ✓

### "Kullanıcı bulunamadı"
`additional-setup.sql` çalıştırılmamış olabilir. Bu dosyadaki trigger, auth.users'a kayıt olduğunda otomatik olarak public.users'a da kayıt ekler.

### Tabloları kontrol etmek için SQL:
```sql
-- Kullanıcıları kontrol et
SELECT * FROM public.users;

-- Couple'ları kontrol et
SELECT * FROM public.couples;

-- Auth kullanıcılarını kontrol et
SELECT id, email FROM auth.users;
```

---

## 🧪 Test Senaryosu

1. **Kullanıcı 1:** Kayıt ol → Ayarlar → "Kod Oluştur"
2. Kodu kopyala (örn: ABC123)
3. **Kullanıcı 2:** (farklı cihaz/tarayıcı) Kayıt ol → Ayarlar → "Koda Katıl" → Kodu gir
4. Her iki tarafta da eşleşme görünmeli

---

## 📋 Hızlı Debug SQL

Supabase SQL Editor'da çalıştırın:

```sql
-- Tüm kullanıcıları gör
SELECT * FROM public.users;

-- Tüm couple'ları gör
SELECT * FROM public.couples;

-- Aktif ve bekleyen couple'lar (henüz eşleşmemiş)
SELECT * FROM public.couples WHERE user2_id IS NULL AND is_active = true;

-- Tamamlanmış eşleşmeler
SELECT 
  c.id,
  c.pairing_code,
  u1.email as user1_email,
  u2.email as user2_email,
  c.created_at
FROM public.couples c
LEFT JOIN public.users u1 ON c.user1_id = u1.id
LEFT JOIN public.users u2 ON c.user2_id = u2.id
WHERE c.user2_id IS NOT NULL;
```
