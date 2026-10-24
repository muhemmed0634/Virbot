# 🤖 VirBot v6

<p align="center">
  <img width="300" height="300" alt="VirBot v6 Logo" src="virbot.png" />
  <br>
  <b>Ultra Gelişmiş, Tam Kapsamlı, 7/24 Aktif Türkçe & Azerbaycan Discord Botu</b><br>
  <i>VirDormit Tarafından Geliştirilmiştir</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/S%C3%BCr%C3%BCm-VirBot%20v6-5865F2?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Discord.js-v14.16-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Gemini%20Flash%20%26%20Flash--Lite-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Veritaban%C4%B1-MongoDB%20Atlas-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Geli%C5%9Ftirici-VirDormit-ff6b00?style=for-the-badge" />
</p>

---

## 📑 İçindekiler
1. [Neden VirBot v6 Kullanmalısınız?](#-neden-virbot-v6-kullanmal%C4%B1s%C4%B1n%C4%B1z)
2. [Sunucunuz İçin Başka Hangi Botlar Gerekli?](#-sunucunuz-i%C3%A7in-ba%C5%9Fka-hangi-botlar-gerekli)
3. [Yapay Zeka (Gemini Flash & Flash-Lite) Mimarisi](#-yapay-zeka-gemini-flash--flash-lite-mimarisi)
4. [VirBot'u AI ve Dashboard ile Özelleştirme Rehberi](#-virbotu-ai-ve-dashboard-ile-%C3%B6zelle%C5%9Ftirme-rehberi)
5. [Yetki ve İzin Politikası](#-yetki-ve-%C4%B0zin-politikas%C4%B1)
6. [Tüm Komutlar ve Sistemler](#-t%C3%BCm-komutlar-ve-sistemler)
   - [JAIL (Hapis) & Ceza Sistemi](#-jail-hapis--ceza-sistemi)
   - [Auto-Rol & Disboard Otomatik Bump Sistemi](#-auto-rol--disboard-otomatik-bump-sistemi)
   - [AutoMod & Güvenlik Korumaları](#-automod--g%C3%BCvenlik-korumalar%C4%B1)
   - [Moderasyon Komutları](#-moderasyon-komutlar%C4%B1)
   - [RPG, Ekonomi & Dinamik Kumar Sistemi](#-rpg-ekonomi--dinamik-kumar-sistemi)
   - [Çekiliş & Seviye (Level Rol Ödülleri)](#-cekili%C5%9F--seviye-level-rol-%C3%B6d%C3%BClleri)
   - [Sistem İzleme & Araçlar (Ping, Htop)](#-sistem-%C4%B0zleme--ara%C3%A7lar)
7. [Web Kontrol Paneli (Dashboard)](#-web-kontrol-paneli-dashboard)
8. [Kurulum ve Çalıştırma](#-kurulum-ve-%C3%A7al%C4%B1%C5%9Ft%C4%B1rma)

---

## 🌟 Neden VirBot v6 Kullanmalısınız?

Modern Discord sunucularının en büyük problemi onlarca farklı bot ekleyerek sunucuyu bot çöplüğüne çevirmektir. Biri seviye için, biri karşılama için, biri moderasyon, biri ticket, biri çekiliş için eklenen botlar hem güvenlik açığı yaratır hem de sunucu izinlerini karmaşıklaştırır.

**VirBot v6**, **VirDormit** tarafından tek bir çatı altında sunucunun tüm ihtiyaçlarını profesyonelce karşılamak üzere tasarlanmıştır:
- **Tek Bot, Sıfır Karmaşa:** Moderasyon, Karşılama (Canvas), Destek Talebi (Ticket), Güvenlik (Anti-Raid/Alt/Honeypot), Çekiliş, Seviye, Otomatik Disboard Bump ve RPG ekonomi sistemlerini tek başına yürütür.
- **Ultra Optimize Bellek Tüketimi:** Render.com 512MB RAM limitlerinde dahi şişmeden, logları sistem belleğinde biriktirmeden doğrudan Discord kanallarına aktararak çalışır.
- **İki Yönlü Komut Arayüzü:** Her bir komut hem klasik prefix (`v!`) hem de modern Discord eğik çizgi (`/`) Slash desteğine sahiptir.
- **Güçlü Hapis (JAIL) Sistemi:** Cezalı üyeleri izole eder, eski rollerini veritabanında saklar, sunucudan çıkıp girseler dahi hapis cezasını sürdürür (Anti-Jail).

---

## 🎧 Sunucunuz İçin Başka Hangi Botlar Gerekli?

> 📌 **Önemli Bilgilendirme:**  
> VirBot v6, güvenlikten ekonomiye ve otomatik moderasyona kadar sunucunun tüm temel ve ileri seviye gereksinimlerini eksiksiz karşılar.  
> Bu sebeple, **sunucunuza VirBot v6 ekledikten sonra ihtiyaç duyacağınız TEK bot bağımsız bir Müzik Oynatma Botudur.** Başka hiçbir ekstra moderasyon, karşılama veya yönetim botu eklemenize gerek yoktur.

---

## 🧠 Yapay Zeka (Gemini Flash & Flash-Lite) Mimarisi

VirBot v6, Google DeepMind'ın en yeni ve en optimize yapay zeka modelleri olan **Gemini Flash** ve **Gemini Flash-Lite** modellerini kullanır (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`).

### Neden Yalnızca Flash ve Flash-Lite?
1. **Ultra Düşük Gecikme:** Discord sohbetlerinde anlık, akıcı ve bekletmeyen yanıtlar verir.
2. **Kusursuz Türkçe & Azerbaycan Dili:** Bölgesel deyimleri, mizahı ve Discord kültürünü doğal şekilde kavrar.
3. **VirDormit Sistem İmzası:** Botun sistem talimatlarında VirDormit tarafından geliştirildiği açıkça tanımlanmıştır.

---

## 🎨 VirBot'u AI ve Dashboard ile Özelleştirme Rehberi

VirBot v6'nın kişiliğini, hitap tarzını ve sunucuya özel kurallarını tek bir tıkla özelleştirebilirsiniz!

### 1. Web Kontrol Panelinden Özelleştirme
1. Tarayıcınızdan `http://localhost:3000/dashboard` adresine gidin.
2. Yönetici olduğunuz sunucuyu seçin.
3. **✨ Botu Kişiselleştirme & Karakter Ayarı** paneline inin.
4. `aiOzelPrompt` kutusuna istediğiniz karakter talimatını girin ve **Değişiklikleri Kaydet** butonuna basın.

### 2. AI'a Hangi Prompt'ları Vermelisiniz? (Hazır Prompt Şablonları)

VirBot v6'yı sunucunuzun konseptine uyarlamak için Dashboard'daki Özel Prompt kutusuna aşağıdaki şablonlardan birini kopyalayabilirsiniz:

#### 🎭 Esprili & Samimi Oyun Topluluğu Karakteri
```text
Sen bizim oyun sunucumuzun en neşeli üyesisin. Oyuncularla şakalaş, popüler oyun terimlerini (GG, AFK, clutch, carry vb.) yerinde kullan. Cevaplarını kısa, eğlenceli ve bol emojili tut. Asla sıkıcı kurumsal cevaplar verme.
```

#### 🛡️ Resmi & Sert Siber Güvenlik Danışmanı
```text
Sen siber güvenlik ve sunucu düzeni konusunda uzmanlaşmış ciddi bir asistansın. Kullanıcılara teknik, saygılı, net ve güven verici bir tonla yanıt ver. Gereksiz lakayıtlıktan kaçın ve daima kuralları hatırlat.
```

#### 🌸 Anime & Eğlenceli Topluluk Maskotu
```text
Sen sevimli, enerjik ve yardımsever bir anime karakterisin! Cümlelerinde tatlı ünlemler kullan, üyelere motive edici sözler söyle ve her zaman pozitif ol.
```

---

## 🔒 Yetki ve İzin Politikası

VirBot v6'da güvenlik her şeyden önce gelir:
- **Normal Üyeler:** Yalnızca **RPG & Şans Oyunları** (`v!hunt`, `v!zoo`, `v!sell`, `v!market`, `v!daily`, `v!slots`, `v!coinflip`, `v!blackjack`, `v!cash`, `v!give`) ve Yardım/Rank komutlarına erişebilir.
- **Yöneticiler:** Yalnızca Discord rol ayarlarında **Yönetici (Administrator)** onay işareti (tick) açık olan üyeler diğer tüm sistem, kurulum ve moderasyon komutlarını çalıştırabilir.

---

## 🛠️ Tüm Komutlar ve Sistemler

### 🔒 JAIL (Hapis) & Ceza Sistemi
| Komut | Slash | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `v!jail-kur` | `/jail-kur` | Yönetici | `CEZALI` rolü ve izole `#jail` kanalını otomatik oluşturup izinleri yapılandırır. |
| `v!jail-at @üye [sebep]` | `/jail-at` | Yönetici | Kullanıcının tüm rollerini alır, veritabanına kaydeder ve `CEZALI` rolü verir. |
| `v!jail-kurtar @üye` | `/jail-kurtar` | Yönetici | Kullanıcıyı cezadan çıkarır, daha önce alınan tüm eski rollerini eksiksiz iade eder. |
| *Anti-Jail (Otomatik)* | — | Sistem | Hapse atılan biri sunucudan çıkıp tekrar girse dahi `CEZALI` rolü otomatik geri verilir. |

### 🚀 Auto-Rol Sistemi
| Komut | Slash | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `v!auto-rol @rol` | `/auto-rol` | Yönetici | Sunucuya yeni katılan tüm üyelere otomatik atanacak rolü belirler. |

### 🛡️ AutoMod & Güvenlik Korumaları
| Sistem | Özellik | Açıklama |
| :--- | :--- | :--- |
| **Küfür & Karaliste** | Aktif | Türkçe ve Azerbaycan küfürlerini engeller, mesajı silip ID'li detaylı log oluşturur. |
| **Anti-Alt (Yeni Hesap)** | Doğrudan Kick | Minimum yaştan küçük şüpheli yeni hesapları karantinaya almadan **doğrudan sunucudan atar (Kick)**. |
| **Anti-Raid (Toplu Giriş)** | Otomatik Kick | 8 saniye içinde 5'ten fazla giriş yapıldığında baskını algılar, gelenleri anında atar ve yöneticiyi uyarır. |
| **Honeypot** | Bot Tuzağı | Gizli tuzak kanalına mesaj atan spam botlarını anında sunucudan atar. |
| **Anti-Spam & Anti-Caps** | Filtreleme | Hızlı mesaj selini ve büyük harf spamini siler. |

### 🔨 Moderasyon Komutları
| Komut | Slash | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `v!ban @üye [sebep]` | `/ban` | Yönetici | Kullanıcıyı sunucudan yasaklar. DM bildirimi gönderir ve log kanalına ID'siyle yazar. |
| `v!unban <ID>` | `/unban` | Yönetici | Belirtilen ID'ye sahip üyenin yasağını kaldırır. |
| `v!kick @üye [sebep]` | `/kick` | Yönetici | Kullanıcıyı sunucudan atar. |
| `v!mute @üye [süre] [sebep]`| `/mute` | Yönetici | Kullanıcıyı süreli susturur (Timeout). |
| `v!unmute @üye` | `/unmute` | Yönetici | Kullanıcının susturmasını kaldırır. |
| `v!warn @üye [sebep]` | `/warn` | Yönetici | Resmi uyarı verir. |
| `v!sil <sayı>` | `/sil` | Yönetici | Belirtilen sayıda mesajı toplu siler (1-100). |
| `v!kilit` / `v!kilit-ac` | `/kilit` / `/kilit-ac`| Yönetici | Kanalı mesaj gönderimine kilitler veya kilidi açar. |
| `v!yavas-mod <sn>` | `/yavas-mod` | Yönetici | Kanal yavaş modunu saniye cinsinden ayarlar. |
| `v!nuke` | `/nuke` | Yönetici | Kanalı klonlayıp eskisini silerek tertemiz baştan açar. |
| `v!mesaj [#kanal] <metin>` | `/mesaj` | Yönetici | Bota istenen kanalda mesaj yazdırır. |
| `v!basvuru [#kanal]` | `/basvuru` | Yönetici | Butonlu ve modal pencereli interaktif yetkili başvuru paneli gönderir. |

### ⚔️ RPG, Ekonomi & Dinamik Kumar Sistemi
| Komut | Slash | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `v!hunt` | `/hunt` | Herkes | Vahşi doğada hayvan avlayarak coin ve hayvan kartı toplar. |
| `v!zoo` | `/zoo` | Herkes | Yakalanan hayvan koleksiyonunu ve pasif bonusları görüntüler. |
| `v!sell [isim]` | `/sell` | Herkes | Avlanan hayvanları satarak coin kasasını doldurur. |
| `v!market` | `/market` | Herkes | Zırh ve silah dükkanından teçhizat satın alır. |
| `v!equip <eşya>` | `/equip` | Herkes | Satın alınan eşyaları kuşanır. |
| `v!daily` | `/daily` | Herkes | Günlük coin ödülünü alır. **Aynı takvim gününde 1 kez alınabilir, her gece yarısı otomatik sıfırlanır.** |
| `v!cash` | `/cash` | Herkes | Cüzdan ve bakiye durumunu görüntüler. |
| `v!give @üye <miktar>` | `/give` | Herkes | Başka bir üyeye coin transfer eder. |
| `v!slots <bahis>` | `/slots` | Herkes | **Dinamik Zorluk:** Günün ilk 5 oyununda orta zorluk, 5. oyundan sonra artan zorluk seviyesi! Gece yarısı sıfırlanır. |
| `v!coinflip <bahis> <yazı\|tura>` | `/coinflip` | Herkes | Yazı-tura bahis oyunu (Dinamik günlük zorluk çarpanı). |
| `v!blackjack <bahis>` | `/blackjack` | Herkes | İnteraktif butonlu (Kart Çek, Kal, İki Katı) 21 oyunu. |

### 🎁 Çekiliş & Seviye (Level Rol Ödülleri)
- **Çekiliş Yetkisi:** `v!cekilis-baslat`, `v!cekilis-bitir` ve `v!reroll` komutları yalnızca rolünde **Yönetici** izni açık olan üyeler tarafından kullanılabilir.
- **Otomatik Level Rol Ödülleri:** Üyeler mesaj attıkça XP kazanır. Belirli seviyelere ulaştıklarında roller otomatik verilir (sunucuda yoksa bot tarafından oluşturulur):
  - **15. Seviye:** `Orta` Rolü 🔵
  - **35. Seviye:** `Old` Rolü 🟣
  - **89+. Seviye:** `Efsane` Rolü 🟡

### 📊 Sistem İzleme & Araçlar
| Komut | Slash | Yetki | Açıklama |
| :--- | :--- | :--- | :--- |
| `v!ping` | `/ping` | Yönetici | WebSocket ve API mesaj gecikme sürelerini görüntüler. |
| `v!htop` | `/htop` | Yönetici | Linux htop tarzı CPU modeli, çekirdek sayısı, RAM kullanımı, Heap, Uptime ve yük grafiğini görüntüler. |
| `v!rank` | `/rank` | Herkes | Modern Canvas neon seviye kartını gösterir. |
| `v!leaderboard` | `/leaderboard` | Herkes | Sunucu XP liderlik sıralamasını listeler. |
| `v!yardim` / `v!help` | `/yardim` | Herkes | Tüm sistem ve komut rehberini gösterir. |

---

## 🌐 Web Kontrol Paneli (Dashboard)

VirBot v6, bağımsız Express web arayüzüne sahiptir:
- **Yönetici Sunucu Filtresi:** Yalnızca giriş yapan kullanıcının yönetici olduğu sunucular seçim listesinde listelenir.
- **Canlı AutoMod Anahtarları:** Anti-Spam, Anti-Caps, Karaliste, Anti-Alt ve Anti-Raid tek tıkla açılıp kapatılabilir.
- **Kanal & Rol Seçimleri:** Giriş-çıkış, log, AI kanalı, bump kanalı ve auto-rol dropdown menülerden seçilerek kaydedilir.
- **Anlık Kayıt:** Değişiklikler anında MongoDB'ye ve çalışan botun önbelleğine işlenir.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18.0 veya üzeri
- MongoDB veritabanı (Atlas veya yerel)
- Discord Bot Token & Google Gemini API Key

### Adım 1: Depoyu Klonlayın ve Bağımlılıkları Yükleyin
```bash
# 1. Depoyu klonlayın
git clone https://github.com/muhemmed0634/Virbot.git
cd Virbot

# 2. Bağımlılıkları yükleyin
npm install
```

### Adım 2: Discord Bot Oluşturun ve Token Alın
1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" butonuna tıklayarak yeni bir uygulama oluşturun
3. Sol menüden **Bot** sekmesine gidin ve "Add Bot" butonuna tıklayın
4. **TOKEN** bölümünden botunuzun tokenini kopyalayın (bu tokeni `.env` dosyasına ekleyeceksiniz)
5. Aşağıdaki **Bot İzinlerini** aktif edin:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### Adım 3: Botu Sunucunuza Davet Edin
1. Sol menüden **OAuth2** → **URL Generator** sekmesine gidin
2. **SCOPES** bölümünde şunları seçin:
   - ✅ `bot`
   - ✅ `applications.commands`
3. **BOT PERMISSIONS** bölümünde şunları seçin:
   - ✅ Administrator (Yönetici) - *Tüm özelliklerin çalışması için önerilir*
   
   **Veya manuel izinler vermek isterseniz:**
   - ✅ Manage Roles (Rolleri Yönet)
   - ✅ Manage Channels (Kanalları Yönet)
   - ✅ Kick Members (Üyeleri At)
   - ✅ Ban Members (Üyeleri Yasakla)
   - ✅ Manage Messages (Mesajları Yönet)
   - ✅ Read Messages / View Channels (Mesajları Oku / Kanalları Görüntüle)
   - ✅ Send Messages (Mesaj Gönder)
   - ✅ Embed Links (Bağlantı Göm)
   - ✅ Attach Files (Dosya Ekle)
   - ✅ Read Message History (Mesaj Geçmişini Oku)
   - ✅ Add Reactions (Tepki Ekle)
   - ✅ Use Slash Commands (Slash Komutlarını Kullan)
   - ✅ Moderate Members (Üyeleri Yönet - Timeout için)

4. Sayfanın altında oluşan **davet linkini** kopyalayın ve tarayıcınızda açıp botu sunucunuza ekleyin

### Adım 4: MongoDB Veritabanı Kurun
#### Seçenek A: MongoDB Atlas (Bulut - Önerilen)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)'a ücretsiz kayıt olun
2. Yeni bir **Free Cluster** oluşturun
3. **Database Access** bölümünden yeni bir kullanıcı oluşturun (kullanıcı adı ve şifre)
4. **Network Access** bölümünden IP adresinizi ekleyin (veya `0.0.0.0/0` ile herkese açın)
5. **Connect** butonuna tıklayın ve **Connect your application** seçeneğini seçin
6. Connection string'i kopyalayın (örnek: `mongodb+srv://kullanici:<password>@cluster0.xxxxx.mongodb.net/virbot`)

#### Seçenek B: Yerel MongoDB
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# MacOS
brew install mongodb-community

# Servisi başlat
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # MacOS
```

### Adım 5: Google Gemini API Key Alın
1. [Google AI Studio](https://aistudio.google.com/app/apikey)'ya gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. Oluşturulan API Key'i kopyalayın

### Adım 6: Ortam Değişkenlerini Yapılandırın
```bash
# .env.example dosyasını .env olarak kopyalayın
cp .env.example .env

# .env dosyasını bir metin editörüyle açın
nano .env   # veya vi, vim, code vb.
```

**`.env` dosyasını şu şekilde doldurun:**
```env
# Discord Bot Token (Adım 2'de aldığınız token)
DISCORD_TOKEN=buraya_discord_bot_tokeninizi_yapiştirin

# MongoDB Bağlantı URL'si (Adım 4'te aldığınız connection string)
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster0.xxxxx.mongodb.net/virbot

# Google Gemini API Key (Adım 5'te aldığınız key)
GEMINI_API_KEY=buraya_gemini_api_keyinizi_yapiştirin

# Bot Geliştirici ID'niz (Discord kullanıcı ID'niz - opsiyonel)
DEVELOPER_ID=discord_kullanici_idniz

# Dashboard Port (varsayılan: 3000)
PORT=3000
```

> **💡 İpucu:** Discord kullanıcı ID'nizi öğrenmek için Discord'da Geliştirici Modunu açın (Ayarlar → Gelişmiş → Geliştirici Modu), ardından profilinize sağ tıklayıp "Kimliği Kopyala" seçeneğine tıklayın.

### Adım 7: Botu Başlatın
```bash
# Botu çalıştırın
npm start

# Alternatif: PM2 ile arka planda çalıştırın (production için önerilir)
npm install -g pm2
pm2 start index.js --name "VirBot-v6"
pm2 save
pm2 startup
```

### Adım 8: Sunucunuza Eklemeniz Gereken Diğer Botlar
VirBot v6 **moderasyon, karşılama, seviye, çekiliş, güvenlik, ticket, RPG/ekonomi** ve tüm yönetim sistemlerini tek başına yönetir. 

**Sunucunuza sadece şu botu eklemeniz yeterlidir:**
- 🎵 **Müzik Botu:** Müzik çalmak için (örn: Groovy, Rythm, Hydra, FredBoat vb.)

**Başka hiçbir bot eklemenize gerek yoktur!** VirBot v6 diğer tüm işlevleri karşılar.

### Kurulum Tamamlandı! 🎉
Botunuz artık çalışıyor! Sunucunuzda `v!yardim` veya `/yardim` yazarak tüm komutları görebilirsiniz.

---

<p align="center">
  <b>VirBot v6</b> — Gururla <b>VirDormit</b> Tarafından Geliştirilmiştir.
</p>
