# 🤖 VirBot v2

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
  - **Anti-Alt:** Yeni açılmış şüpheli hesapları engelleme.
  - **Yedekleme:** Sunucu rollerini ve kanallarını tek komutla yedekleme ve geri yükleme.
- ⚔️ **RPG & Ekonomi:** Avlanma (`v!hunt`), hayvanat bahçesi/envanter (`v!zoo`), düello (`v!battle`), kumar (`v!slots`, `v!coinflip`), günlük ödül (`v!daily`) ve bakiye transferi.
- 🌟 **Seviye Sistemi:** Mesaj attıkça XP kazanma, seviye kartı (`v!rank`), sunucu sıralaması (`v!leaderboard`) ve özel arka plan ayarlama.
- 🎫 **Destek (Ticket) & Doğrulama (Verify):** Butonlu ticket sistemi ve rol verme doğrulaması.

---

## 📋 Komut Listesi (Ön ek: `v!`)

### 🤖 Yapay Zeka (Gemini AI)
| Komut | Açıklama |
| :--- | :--- |
| `@VirBot <mesaj>` | Botu etiketleyerek istediğiniz soruyu sorun, yapay zeka anında yanıtlasın. |
| `v!ai-kanal #kanal` | Tüm mesajların Gemini AI tarafından yanıtlanacağı özel sohbet kanalı ayarlar. |

### 🔊 Geçici Ses Kanalları
| Komut | Açıklama |
| :--- | :--- |
| `/ses-sistemi-kur` *(Slash)* | Belirtilen **Kategori** altında geçici ses sistemi kurar. |
| `v!ses-sistemi kur <Kategori>` | Kategori ID veya adı girerek ses sistemini kurar. |

### 🎉 Çekiliş Sistemi (Beta)
| Komut | Açıklama |
| :--- | :--- |
| `v!cekilis-baslat <süre> <kazanan> <ödül>` | Sadeleştirilmiş Beta çekilişi başlatır *(Örn: `v!cekilis-baslat 30m 1 Discord Nitro`)*. |
| `v!reroll <mesajID>` | Çekiliş için yeni bir kazanan belirler. |

### 🛡️ Güvenlik, Auto-Mod & Kurulum
| Komut | Açıklama |
| :--- | :--- |
| `v!log #kanal` | Sunucu denetim kayıtları için log kanalını ayarlar. |
| `v!honeypot-kur #kanal` | Spam botlarını yakalayıp banlayan tuzak kanalı kurar. |
| `v!anti-alt-kur [aç/kapat]` | Yeni açılan şüpheli hesapların girişini engeller. |
| `v!verify-kur @rol #kanal` | Butonlu üye doğrulama panelini kurar. |
| `v!backup-al` | Sunucu kanallarını ve rollerini veritabanına yedekler. |
| `v!backup-restore` | Alınan en son sunucu yedeğini geri yükler. |

### 🔨 Moderasyon
| Komut | Açıklama |
| :--- | :--- |
| `v!ban @üye [sebep]` | Belirtilen kullanıcıyı sunucudan yasaklar. |
| `v!unban <KullanıcıID>` | Yasaklanan kullanıcının yasağını kaldırır. |
| `v!mute @üye [sebep]` | Kullanıcıyı susturur (timeout). |
| `v!unmute @üye` | Kullanıcının susturmasını kaldırır. |
| `v!warn @üye [sebep]` | Kullanıcıyı resmi olarak uyarır ve loglar. |

### ⚔️ RPG, Ekonomi & Seviye
| Komut | Açıklama |
| :--- | :--- |
| `v!hunt` | Vahşi doğada avlanıp hayvan yakalar. |
| `v!zoo` | Yakalanan hayvanları ve envanteri listeler. |
| `v!sell <tür\|all>` | Yakalanan hayvanları satarak para kazanır. |
| `v!battle @üye` | Başka bir kullanıcı ile bahisli düello yapar. |
| `v!cash` | Güncel cüzdan bakiyesini gösterir. |
| `v!daily` | 24 saatte bir günlük nakit ödülünü alır. |
| `v!give @üye <miktar>` | Başka bir kullanıcıya para transfer eder. |
| `v!slots <miktar>` | Slot makinesinde şansını dener. |
| `v!coinflip <miktar> <yazı\|tura>` | Yazı-tura atarak bahis oynar. |
| `v!rank [@üye]` | Kullanıcının seviye kartını gösterir. |
| `v!leaderboard` | Sunucudaki en yüksek XP ve seviye sıralamasını listeler. |
| `v!background-set <resim_url>` | Seviye kartı için özel arka plan belirler. |

### 🎫 Destek & Eğlence
| Komut | Açıklama |
| :--- | :--- |
| `v!ticket-kur` | Butonlu destek bileti (ticket) panelini gönderir. |
| `v!kelime-kur #kanal` | Son harften kelime türetme oyun kanalını ayarlar. |
| `v!haber #kanal` | DonanımHaber teknoloji haberleri akışını bağlar. |
| `v!rss-ekle <url> #kanal` | Özel bir RSS haber kaynağını sunucuya ekler. |
| `v!sayackur #kanal <hedef>` | Giriş-çıkış sayaç hedefini belirler. |
| `v!yardim` | Genel yardım ve komut menüsünü görüntüler. |

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
│   ├── security/                # v!backup, v!honeypot, v!anti-alt
│   ├── ticket/                  # v!ticket-kur
│   ├── verify/                  # v!verify-kur
│   ├── voice/                   # v!ses-sistemi-kur ve /ses-sistemi-kur
│   └── welcome/                 # v!giris
│
├── config/
│   └── config.js                # Renkler, roller ve sabitler
│
├── database/
│   ├── mongoose.js              # MongoDB bağlantı yöneticisi
│   └── models/                  # Mongoose Şemaları (Guild, User, Giveaway, Backup, Ticket)
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
