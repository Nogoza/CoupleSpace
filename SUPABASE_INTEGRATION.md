# 🚀 CoupleSpace - Supabase Entegrasyon Rehberi

Bu rehber, CoupleSpace uygulamanızı Supabase ile tam entegre hale getirmek için adım adım talimatlar içerir.

---

## 📋 Adım 1: Supabase Projesi Oluşturma

### 1.1 Supabase'e Kaydol
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### 1.2 Yeni Proje Oluştur
1. Dashboard'da "New Project" butonuna tıklayın
2. Organizasyon seçin (kişisel veya ekip)
3. Proje ayarları:
   - **Name:** `couplespace` (veya istediğiniz bir isim)
   - **Database Password:** Güçlü bir şifre belirleyin (bunu not alın!)
   - **Region:** Size en yakın bölgeyi seçin (örn: Frankfurt - eu-central-1)
4. "Create new project" butonuna tıklayın
5. Projenin oluşturulmasını bekleyin (~2 dakika)

---

## 📋 Adım 2: Veritabanı Şemasını Oluşturma

### 2.1 SQL Editor'ü Açın
1. Sol menüden **SQL Editor** seçin
2. "New query" butonuna tıklayın

### 2.2 Şemayı Çalıştırın
1. Projenizdeki `supabase/schema.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. **Run** butonuna tıklayın
4. "Success. No rows returned" mesajını görmelisiniz

### 2.3 Tabloları Doğrulayın
1. Sol menüden **Table Editor** seçin
2. Aşağıdaki tabloların oluştuğunu kontrol edin:
   - ✅ users
   - ✅ couples
   - ✅ messages
   - ✅ message_reactions
   - ✅ journal_entries
   - ✅ love_pings
   - ✅ couple_todos
   - ✅ date_plans
   - ✅ memories
   - ✅ mood_checkins
   - ✅ user_settings
   - ✅ streaks

---

## 📋 Adım 3: API Anahtarlarını Alma

### 3.1 API Ayarlarına Gidin
1. Sol menüden **Project Settings** (dişli ikonu) seçin
2. **API** sekmesine tıklayın

### 3.2 Anahtarları Kopyalayın
Şu değerleri not alın:
- **Project URL:** `https://xxxxx.supabase.co`
- **anon public key:** `eyJhbGci...` ile başlayan uzun anahtar

---

## 📋 Adım 4: Uygulamada API Anahtarlarını Yapılandırma

### 4.1 .env Dosyasını Düzenleyin
Projenizin kök dizinindeki `.env` dosyasını açın ve değerleri güncelleyin:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**ÖNEMLİ:** Gerçek değerlerinizi buraya yapıştırın!

### 4.2 Uygulamayı Yeniden Başlatın
```bash
# Expo'yu durdurun (Ctrl+C) ve yeniden başlatın
npx expo start -c
```
`-c` flag'i önbelleği temizler ve yeni env değişkenlerini yükler.

---

## 📋 Adım 5: Authentication Ayarları

### 5.1 Email Authentication'ı Etkinleştirin
1. Sol menüden **Authentication** seçin
2. **Providers** sekmesine gidin
3. **Email** provider'ın aktif olduğundan emin olun

### 5.2 Email Onayını Devre Dışı Bırakın (Geliştirme için)
1. **Authentication** > **Settings** 
2. **Email Auth** bölümünde:
   - **Confirm email:** KAPALI (geliştirme için)
   - Production'da AÇIK bırakın

### 5.3 Site URL Ayarı
1. **URL Configuration** bölümünde:
   - **Site URL:** `exp://localhost:8081` (geliştirme için)

---

## 📋 Adım 6: Row Level Security (RLS) Kontrolü

### 6.1 RLS Politikalarını Doğrulayın
1. **Table Editor** > herhangi bir tablo seçin
2. **RLS Policies** butonuna tıklayın
3. Politikaların ekli olduğunu doğrulayın

### 6.2 Eksik Politika Varsa
Schema.sql dosyasındaki RLS politikaları otomatik eklenir. Eğer eksik varsa:
1. SQL Editor'da ilgili policy komutlarını çalıştırın

---

## 📋 Adım 7: Realtime'ı Etkinleştirin

### 7.1 Realtime Ayarları
1. **Database** > **Replication** seçin
2. `messages` ve `love_pings` tablolarının **Source** olarak işaretlendiğinden emin olun

---

## 📋 Adım 8: Uygulamayı Test Etme

### 8.1 İlk Kullanıcıyı Oluşturun
1. Uygulamayı açın
2. Onboarding'i tamamlayın (email + isim girin)
3. Hesap oluşturulacak

### 8.2 Eşleşme Kodunu Test Edin
**Cihaz 1 (veya Emulator 1):**
1. Ayarlar > Eşleşme > "Kod Oluştur"
2. 6 haneli kodu not alın

**Cihaz 2 (veya Emulator 2):**
1. Farklı email ile giriş yapın
2. Ayarlar > Eşleşme > "Koda Katıl"
3. Kodu girin ve bağlanın

### 8.3 Mesajlaşmayı Test Edin
1. Her iki cihazda Chat sekmesine gidin
2. Mesaj gönderin
3. Karşı tarafta anlık görünmeli!

---

## 🔧 Sorun Giderme

### "Invalid API Key" Hatası
- `.env` dosyasındaki anahtarları kontrol edin
- Expo'yu `-c` flag'i ile yeniden başlatın

### "User not found" Hatası
- Email onayının kapalı olduğundan emin olun (geliştirme için)
- Users tablosunda trigger'ın çalıştığını kontrol edin

### Mesajlar Gelmiyor (Realtime)
- Replication ayarlarını kontrol edin
- RLS politikalarını doğrulayın

### "Permission denied" Hatası
- RLS politikalarının doğru eklendiğinden emin olun
- Kullanıcının doğru authenticate olduğunu kontrol edin

---

## 📱 Production İçin Ek Adımlar

### 1. Email Onayını Etkinleştirin
- Authentication > Settings > Confirm email: AÇIK

### 2. Rate Limiting
- Project Settings > API > Rate limiting ayarlarını yapın

### 3. Yedekleme
- Project Settings > Database > Backups'ı etkinleştirin

### 4. Custom Domain (Opsiyonel)
- Project Settings > Custom Domains

---

## ✅ Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] Schema.sql çalıştırıldı
- [ ] API anahtarları .env dosyasına eklendi
- [ ] Email auth etkinleştirildi
- [ ] Email onayı devre dışı bırakıldı (dev için)
- [ ] Expo yeniden başlatıldı (-c flag ile)
- [ ] İlk kullanıcı oluşturuldu
- [ ] Eşleşme kodu test edildi
- [ ] Mesajlaşma test edildi

---

## 🎉 Tebrikler!

Supabase entegrasyonu tamamlandı! Artık:
- ✅ Farklı cihazlardan giriş yapılabilir
- ✅ Eşleşme kodları veritabanında saklanır
- ✅ Mesajlar anlık olarak senkronize olur
- ✅ Tüm veriler bulutta güvende

Sorularınız için: [Supabase Docs](https://supabase.com/docs)
