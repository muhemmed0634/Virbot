# 🤖 VirBot

**Çok fonksiyonlu, Türkçe, 7/24 aktif Discord botu**

Discord.js v14 | Node.js | Express Keep-Alive

---

## ✨ Özellikler

| Modül | Komut | Açıklama |
|-------|-------|----------|
| 🎉 Çekiliş | `!cekilis` / `!reroll` | İnteraktif çekiliş ve yeniden çekiliş |
| 🎫 Ticket | `!ticket-kur #kanal` | Destek talebi sistemi + transcript |
| 📰 Haber | `!haber #kanal` | DonanımHaber RSS akışı |
| 📡 RSS | `!rss-ekle [URL] #kanal` | Özel RSS kaynağı ekleme |
| 📋 Log | `!log #kanal` | Log kanalı ayarlama |
| 🔰 Otomatik | — | NOT VERIFIED rol temizleme |

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. `.env` Dosyasını Oluştur
```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
DISCORD_TOKEN=your_bot_token_here
PREFIX=!v
```

### 3. Discord Developer Portal Ayarları
1. [Discord Developer Portal](https://discord.com/developers/applications) → Uygulamanı seç
2. **Bot** sekmesi → **Privileged Gateway Intents** bölümünde şunları etkinleştir:
   - ✅ `SERVER MEMBERS INTENT`
   - ✅ `MESSAGE CONTENT INTENT`

### 4. Botu Başlat
```bash
npm start
# veya geliştirme modunda:
npm run dev
```

---

## ☁️ Cloud Deploy (Render.com)

### Adım 1 — GitHub'a Yükle
```bash
git init
git add .
git commit -m "VirBot ilk sürüm"
git remote add origin https://github.com/KULLANICI_ADI/virbot.git
git push -u origin main
```

### Adım 2 — Render.com'da Deploy
1. [render.com](https://render.com) → **New** → **Web Service**
2. GitHub reponuzu bağlayın
3. Ayarlar:
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment Variables** bölümüne ekleyin:
   - `DISCORD_TOKEN` = Bot tokenınız
   - `PREFIX` = `!`
5. **Create Web Service** butonuna tıklayın

### Adım 3 — Railway.app Alternatifi
1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Environment Variables ekleyin
3. Railway otomatik olarak `npm start` komutunu çalıştırır

---

## ⏰ UptimeRobot (Bot Uykuya Geçmesin)

Render ücretsiz planında botlar 15 dakika hareketsizlikten sonra uyur.  
UptimeRobot her 5 dakikada bir HTTP isteği göndererek botu uyanık tutar.

1. [uptimerobot.com](https://uptimerobot.com) → Ücretsiz hesap aç
2. **Add New Monitor** → **HTTP(s)**
3. Ayarlar:
   - **Friendly Name:** VirBot
   - **URL:** `https://your-app-name.onrender.com/ping`
   - **Monitoring Interval:** `5 minutes`
4. **Create Monitor** butonuna tıklayın ✅

---

## 📁 Klasör Yapısı

```
VirBot/
├── index.js              # Ana dosya
├── keep_alive.js         # Express keep-alive
├── package.json
├── .env.example
├── .gitignore
├── virbot.png            # Bot logosu
│
├── config/
│   └── config.js         # Merkezi ayarlar
│
├── data/                 # JSON veri dosyaları
│   ├── giveaways.json
│   ├── tickets.json
│   ├── rss.json
│   └── settings.json
│
├── handlers/             # Otomatik yükleyiciler
│   ├── commandHandler.js
│   └── eventHandler.js
│
├── commands/             # Komutlar
│   ├── giveaway/
│   │   ├── cekilis.js
│   │   └── reroll.js
│   ├── ticket/
│   │   └── ticket-kur.js
│   ├── news/
│   │   ├── haber.js
│   │   └── rss-ekle.js
│   └── log/
│       └── log.js
│
├── events/               # Discord olayları
│   ├── ready.js
│   ├── messageCreate.js
│   ├── interactionCreate.js
│   └── guildMemberUpdate.js
│
└── modules/              # Çekirdek mantık
    ├── data/dataManager.js
    ├── giveaway/giveawayManager.js
    ├── ticket/ticketManager.js
    ├── news/rssPoller.js
    └── logger/logManager.js
```

---

## 🛡️ İzinler

Bot sunucuya eklenirken şu izinler gereklidir:
- `Manage Channels` — Ticket kanalı açma/kapama
- `Manage Roles` — NOT VERIFIED rol kaldırma
- `Send Messages` / `Embed Links` — Mesaj gönderme
- `Read Message History` — Transcript için
- `Manage Guild` (isteğe bağlı) — Davet bilgisi okuma

**Bot davet linki formatı:**
```
https://discord.com/api/oauth2/authorize?client_id=BOT_ID&permissions=268717056&scope=bot%20applications.commands
```

---

## 📄 Lisans

MIT © VirBot
