# 🤖 VirBot v3

**Ultra Gelişmiş, Türkçe & Çok Fonksiyonlu 7/24 Aktif Discord Botu**

Discord.js v14 | Node.js | MongoDB | Gemini AI | Express Keep-Alive

---

## 🌟 Öne Çıkan Özellikler

- 🤖 **Gemini AI Sohbet Entegrasyonu:** Botu etiketleyerek (`@VirBot`) veya özel yapay zeka kanalında doğrudan akıllı, esprili ve doğal Türkçe sohbet imkanı.
- 🔊 **Geçici Ses Kanalları (Join-to-Create):** Belirlenen kategori altında otomatik "➕ Kanal Oluştur" odası açar, odaya girenlere özel geçici oda oluşturur ve oda boşaldığında otomatik siler (`/ses-sistemi-kur` ve `v!ses-sistemi kur`).
- 🎉 **Sade Çekiliş Sistemi (Beta):** `🎉 Çekiliş (Beta)` formatında, tek tıkla `🎉 Katıl (sayı)` ve `⏹️ Bitir` butonları, dinamik katılımcı sayacı ve MongoDB kalıcılığı.
- 🛡️ **Gelişmiş Auto-Mod & Güvenlik:**
  - **Yasaklı Kelime Filtresi:** Türkçe/Azerbaycan karakterlerine (`ç, ğ, ı, ö, ş, ü, ə`) ve kelime sınırlarına duyarlı, masum kelimeleri engellemeyen akıllı küfür filtresi.
  - **Spam / Flood / Caps Lock ve Reklam Koruması.**
  - **Honeypot:** Gizli bot tuzağı kanalıyla sunucuya giren spam botlarını anında banlama.
- ⚔️ **RPG & Ekonomi:** Avlanma (`/hunt`), hayvanat bahçesi/envanter (`/zoo`), market (`/market`), düello (`/battle`), kumar (`/slots`, `/coinflip`), günlük ödül (`/daily`) ve bakiye transferi.
- 🌟 **Seviye Sistemi:** Mesaj attıkça XP kazanma, seviye kartı (`v!rank`), sunucu sıralaması (`v!leaderboard`) ve özel arka plan ayarlama.
- 🎫 **Destek (Ticket) & Doğrulama (Verify):** Butonlu ticket sistemi ve rol verme doğrulaması.
- 🚪 **Gelişmiş Giriş-Çıkış (Canvas):** Sunucuya katılanlar ve ayrılanlar için özel neon detaylı, avatar halkalı ve üye sıralamalı modern resimli Hoş Geldin & Görüşmek Üzere kartları (`v!giris` / `/giris`).

---

## 📋 Komut Listesi (Ön ek: `v!` veya `/`)

### 🤖 Yapay Zeka (Gemini AI)
| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `@VirBot <mesaj>` | - | Botu etiketleyerek istediğiniz soruyu sorun, yapay zeka anında yanıtlasın. |
| `v!ai-kanal #kanal` | `/ai-kanal` | Tüm mesajların Gemini AI tarafından yanıtlanacağı özel sohbet kanalı ayarlar. |

### 🔊 Geçici Ses Kanalları
| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `v!ses-sistemi kur <Kategori>` | `/ses-sistemi-kur` | Belirtilen **Kategori** altında geçici ses sistemi kurar. |

### 🎉 Çekiliş Sistemi (Beta)
| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `v!cekilis-baslat <süre> <kazanan> <ödül>` | `/cekilis-baslat` | Sadeleştirilmiş Beta çekilişi başlatır *(Örn: `v!cekilis-baslat 30m 1 Discord Nitro`)*. |
| `v!reroll <mesajID>` | - | Çekiliş için yeni bir kazanan belirler. |

### 🛡️ Güvenlik, Auto-Mod & Kurulum
| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `v!log #kanal` | `/log` | Sunucu denetim kayıtları için log kanalını ayarlar. |
| `v!giris #kanal` | `/giris` | Giriş ve çıkış (resimli karşılama & veda paneli) kanalını ayarlar. |
| `v!honeypot-kur #kanal` | - | Spam botlarını yakalayıp banlayan tuzak kanalı kurar. |
| `v!verify-kur @rol [#kanal]` | `/verify-kur` | Butonlu üye doğrulama panelini kurar. |

### 🔨 Moderasyon (Prefix & Slash `/` Destekli)
| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `v!ban @üye [sebep]` | `/ban` | Belirtilen kullanıcıyı sunucudan yasaklar. |
| `v!unban <KullanıcıID>` | `/unban` | Yasaklanan kullanıcının yasağını kaldırır. |
| `v!kick @üye [sebep]` | `/kick` | Belirtilen kullanıcıyı sunucudan atar. |
| `v!mute @üye [süre] [sebep]` | `/mute` | Kullanıcıyı susturur (timeout). |
| `v!unmute @üye` | `/unmute` | Kullanıcının susturmasını kaldırır. |
| `v!warn @üye [sebep]` | `/warn` | Kullanıcıyı resmi olarak uyarır ve loglar. |
| `v!sil <1-100>` | `/sil` | Belirtilen miktarda mesajı toplu siler. |
| `v!yavas-mod <saniye>` | `/yavas-mod` | Kanalda yavaş mod bekleme süresini ayarlar. |
| `v!kilit [#kanal]` | `/kilit` | Kanalı mesaj gönderimine kilitler. |
| `v!kilit-ac [#kanal]` | `/kilit-ac` | Kilitli kanalı mesaj gönderimine açar. |
| `v!nuke` | `/nuke` | Kanalı tamamen sıfırlayıp baştan oluşturur. |

### ⚔️ RPG, Ekonomi & Seviye (Prefix & Slash `/` Destekli)
> **Not:** Avlanırken (`hunt`) rastgele eşya/zırh düşürme kaldırılmış; tüm zırh ve silahlar doğrudan **Market** üzerinden en az 500 coin karşılığında satın alınacak şekilde dengelenmiştir.

| Komut | Slash | Açıklama |
| :--- | :--- | :--- |
| `v!market [satın-al <id>]` | `/market` | Silah ve zırh mağazasını listeler veya eşya satın alır (Minimum 500 Coin). |
| `v!hunt` | `/hunt` | Vahşi doğada avlanıp hayvan ve coin toplar. |
| `v!zoo` | `/zoo` | Yakalanan hayvanları, kuşanılan eşyaları ve envanteri listeler. |
| `v!sell <tür\|all>` | `/sell` | Yakalanan hayvanları satarak para kazanır. |
| `v!battle @üye` | `/battle` | Başka bir kullanıcı ile bahisli düello yapar. |
| `v!cash [@üye]` | `/cash` | Güncel cüzdan bakiyesini ve banka durumunu gösterir. |
| `v!daily` | `/daily` | 24 saatte bir günlük nakit ödülünü alır. |
| `v!give @üye <miktar>` | `/give` | Başka bir kullanıcıya para transfer eder. |
| `v!equip <silah\|zırh>` | `/equip` | Envanterdeki silah veya zırhı kuşanır. |
| `v!slots <miktar>` | `/slots` | Slot makinesinde şansını dener. |
| `v!coinflip <miktar> <tahmin>` | `/coinflip` | Yazı-tura atarak bahis oynar. |
| `v!rank [@üye]` | - | Kullanıcının seviye kartını gösterir. |
| `v!leaderboard` | - | Sunucudaki en yüksek XP ve seviye sıralamasını listeler. |
| `v!background-set <url>` | - | Seviye kartı için özel arka plan belirler. |

### 🎫 Destek & Eğlence
| Komut | Açıklama |
| :--- | :--- |
| `v!cal <link/şarkı>` / `/cal` | Ses kanalında müzik çalar (Spotify & YouTube entegrasyonlu). |
| `v!dur` / `/dur` | Müziği durdurur, kuyruğu temizler ve kanaldan ayrılır. |
| `v!atla` / `/atla` | Sıradaki şarkıya geçer. |
| `v!kuyruk` / `/kuyruk` | Mevcut çalma listesini görüntüler. |
| `v!mesajid` / `/mesajid` | Yanıtlanan mesajın veya son mesajın Discord ID'sini verir. |
| `v!kullanici-id [@üye]` / `/kullanici-id` | Kullanıcının Discord ID ve hesap bilgilerini gösterir. |
| `v!ticket-kur` / `/ticket-kur` | Butonlu destek bileti (ticket) panelini gönderir. |
| `v!kelime-kur #kanal` / `/kelime-kur` | Son harften kelime türetme oyun kanalını ayarlar. |
| `v!haber #kanal` / `/haber` | DonanımHaber teknoloji haberleri akışını bağlar. |
| `v!rss-ekle <url> #kanal` / `/rss-ekle` | Özel bir RSS haber kaynağını sunucuya ekler. |
| `v!sayackur #kanal <hedef>` / `/sayackur` | Giriş-çıkış sayaç hedefini belirler. |
| `v!sayac-sifirla` / `/sayac-sifirla` | Sayaç sistemini sıfırlar. |
| `v!yardim` / `/yardim` | Genel yardım ve komut menüsünü görüntüler. |

---

## ☁️ Render.com Optimizasyonu ve 7/24 Dağıtım

VirBot, Render.com üzerinde sorunsuz 7/24 çalışacak şekilde optimize edilmiştir:
- **Otomatik Health Check**: `/health`, `/healthz` ve `/ping` endpointleri ile servis izleme.
- **7/24 Keep-Alive (Self-Ping)**: `RENDER_EXTERNAL_URL` tanımlandığında bot kendini 10 dakikada bir pingleyerek Render ücretsiz paketindeki uyku modunu engeller.
- **Kusursuz Kapatma (Graceful Shutdown)**: `SIGTERM` ve `SIGINT` sinyalleri yakalanarak MongoDB ve Discord oturumları port çakışması olmadan güvenle sonlandırılır.
- **Tek Tıkla Kurulum**: `render.yaml` dosyası repository kökünde hazır bulunmaktadır.

---

## 🚀 Kurulum ve Çalıştırma

### 1. Projeyi Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/muhemmed0634/Virbot.git
cd Virbot
npm install
```

### 2. Çevresel Değişkenleri (`.env`) Ayarlayın
Proje kök dizininde `.env` dosyasını oluşturun:
```bash
cp .env.example .env
```

`.env` dosyasını açıp gerekli anahtarları girin:
```env
# Discord Bot
DISCORD_TOKEN=your_bot_token_here
PREFIX=v!

# MongoDB Bağlantısı
MONGO_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/virbot?retryWrites=true&w=majority

# Gemini Yapay Zeka
GEMINI_API_KEY=your_gemini_api_key_here

# Express / Keep-Alive Dashboard
PORT=3000
SESSION_SECRET=virbot-secret-key
```

### 3. Discord Developer Portal İzinleri
1. [Discord Developer Portal](https://discord.com/developers/applications) sayfasına gidin ve botunuzu seçin.
2. **Bot** sekmesi altındaki **Privileged Gateway Intents** kısmında şunları açın:
   - ✅ `Presence Intent`
   - ✅ `Server Members Intent`
   - ✅ `Message Content Intent`

### 4. Botu Başlatın
```bash
# Üretim modu:
npm start

# Geliştirme (otomatik yeniden başlatma) modu:
npm run dev
```

---

## 📁 Proje Dizin Yapısı

```
VirBot/
├── index.js                     # Ana giriş noktası ve bot istemcisi
├── keep_alive.js                # Express web sunucusu (Uptime / Dashboard)
├── karaliste.txt                # Yasaklı kelimeler veritabanı (Türkçe / Azerbaycan)
├── package.json                 # Bağımlılıklar ve scriptler
├── .env.example                 # Örnek çevre değişkenleri
│
├── commands/                    # Bot komutları
│   ├── ai/                      # Yapay zeka kanalı
│   ├── counter/                 # Sayaç sistemi
│   ├── fun/                     # Kelime oyunu vb.
│   ├── general/                 # v!yardim
│   ├── giveaway/                # v!cekilis-baslat, v!reroll (Beta)
│   ├── level/                   # v!rank, v!leaderboard
│   ├── log/                     # v!log
│   ├── mod/                     # v!ban, v!unban, v!mute, v!warn
│   ├── news/                    # v!haber, v!rss-ekle
│   ├── rpg/                     # v!hunt, v!zoo, v!battle, v!slots...
│   ├── security/                # v!honeypot
│   ├── ticket/                  # v!ticket-kur
│   ├── verify/                  # v!verify-kur
│   ├── voice/                   # v!ses-sistemi-kur ve /ses-sistemi-kur
│   └── welcome/                 # v!giris ve /giris
│
├── config/
│   └── config.js                # Renkler, roller ve sabitler
│
├── database/
│   ├── mongoose.js              # MongoDB bağlantı yöneticisi
│   └── models/                  # Mongoose Şemaları (Guild, User, Giveaway, Ticket)
│
├── events/                      # Discord olay dinleyicileri
│   ├── ready.js                 # Hazır olma, slash komut kaydı, çekiliş yükleme
│   ├── messageCreate.js         # Auto-mod, XP, Bot AI etiketleme, komut çalıştırma
│   ├── messageUpdate.js         # Düzenlenen mesajlarda auto-mod denetimi
│   ├── interactionCreate.js     # Slash komutları, çekiliş, ticket, ses butonları
│   └── voiceStateUpdate.js      # Geçici ses odası oluşturma ve silme
│
└── modules/                     # Çekirdek mantık modülleri
    ├── ai/geminiManager.js      # Gemini 3.6 Flash entegrasyonu
    ├── data/dataManager.js      # Hibrit MongoDB + In-Memory önbellek
    ├── giveaway/giveawayManager.js # Sade Beta çekiliş motoru
    ├── security/antiSpam.js     # Gelişmiş token & boundary küfür süzgeci
    └── logger/logManager.js     # Sunucu loglama yardımcısı
```

---

## 📄 Lisans

Bu proje [GPL](LICENSE) lisansı ile lisanslanmıştır. © 2026 VirBot.
