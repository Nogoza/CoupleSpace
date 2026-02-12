# CoupleSpace - Supabase Kurulum Rehberi

## 🚀 Adım 1: Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın
4. "New Project" butonuna tıklayın
5. Proje bilgilerini doldurun:
   - **Name**: CoupleSpace (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre belirleyin (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin (örn: Frankfurt)
6. "Create new project" butonuna tıklayın
7. Projenin oluşturulmasını bekleyin (~2 dakika)

## 🗄️ Adım 2: Database Şemasını Yükleme

1. Supabase Dashboard'da sol menüden **SQL Editor** seçin
2. "New Query" butonuna tıklayın
3. `supabase/schema.sql` dosyasının içeriğini kopyalayıp yapıştırın
4. **Run** butonuna tıklayın
5. Tüm tabloların oluşturulduğunu kontrol edin (Table Editor'dan bakabilirsiniz)

## 🔑 Adım 3: API Anahtarlarını Alma

1. Sol menüden **Settings > API** bölümüne gidin
2. Şu değerleri kopyalayın:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## ⚙️ Adım 4: Projeyi Yapılandırma

1. Proje kök dizininde `.env` dosyası oluşturun:

```bash
cp .env.example .env
```

2. `.env` dosyasını düzenleyin:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

## 🔐 Adım 5: Authentication Ayarları (Opsiyonel)

### Email/Password Auth

1. **Authentication > Providers** bölümüne gidin
2. "Email" provider'ın etkin olduğundan emin olun
3. İsterseniz "Confirm email" özelliğini kapatabilirsiniz (test için)

### Site URL Ayarı

1. **Authentication > URL Configuration** bölümüne gidin
2. Site URL olarak `exp://localhost:8081` ekleyin (development için)

## 📱 Adım 6: Uygulamayı Çalıştırma

```bash
npx expo start
```

## 🔄 Realtime (Canlı Chat için)

Realtime özelliği schema.sql'de zaten aktif edildi. Mesajlar ve Love Ping'ler anlık olarak senkronize edilecek.

## 📊 Database Yapısı

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı profilleri |
| `couples` | Çift eşleştirmeleri |
| `messages` | Chat mesajları |
| `message_reactions` | Mesaj reaksiyonları |
| `journal_entries` | Günlük kayıtları |
| `love_pings` | Love ping bildirimleri |
| `couple_todos` | Yapılacaklar listesi |
| `date_plans` | Randevu planları |
| `memories` | Anı kutusu |
| `mood_checkins` | Duygu durumu check-in'leri |
| `user_settings` | Kullanıcı ayarları |
| `streaks` | Günlük yazma serisi |

## 🛡️ Row Level Security (RLS)

Tüm tablolarda RLS aktif. Kullanıcılar sadece:
- Kendi profillerini görebilir/düzenleyebilir
- Eşleştirildikleri çiftin verilerine erişebilir
- Kendi journal entry'lerini ve partner'ın paylaşılmış entry'lerini görebilir

## 🐛 Sorun Giderme

### "Invalid API key" hatası
- `.env` dosyasındaki anahtarları kontrol edin
- Expo'yu yeniden başlatın: `npx expo start -c`

### Tablolar görünmüyor
- SQL Editor'da schema.sql'i tekrar çalıştırın
- Hata mesajlarını kontrol edin

### Auth çalışmıyor
- Authentication > Providers'da Email'in aktif olduğunu kontrol edin
- URL Configuration'ı kontrol edin
