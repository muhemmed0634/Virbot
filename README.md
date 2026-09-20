# 🤖 virbot - Gelişmiş Discord Botu

**virbot**, Discord sunucunuz için çekiliş (giveaway) yönetimi, otomatik haber akışı (RSS), destek talebi (ticket) sistemi, otomatik rol temizleme ve detaylı loglama özelliklerini tek bir çatıda toplayan gelişmiş bir Discord.js v14 botudur.

Render, Railway gibi bulut platformlarında **7/24 kesintisiz (keep-alive)** çalışacak şekilde optimize edilmiştir.

---

## 🚀 Özellikler

### 🎉 1. İnteraktif & Şartlı Çekiliş Sistemi
- **Soru-Cevap Kurulumu:** `!cekilis` veya `/cekilis` komutuyla bot size adım adım sorular sorarak çekilişi oluşturur.
- **Minimum Davet (Invite) Şartı:** Çekilişe katılabilmek için kullanıcıların sunucudaki davet sayısı kontrol edilir.
- **Rol & Hesap Yaşı Şartı:** Belirli bir role sahip olma veya hesabın minimum yaşı (örn: 7 günlük hesap) gibi şartlar eklenebilir.
- **Yeniden Çekme:** `!reroll [mesaj_id]` komutuyla şartları sağlayanlar arasından anında yeni kazanan seçilir.

### 📰 2. DonanımHaber & RSS Haber Akışı
- **Otomatik Haber Paylaşımı:** `!haber #kanal` komutuyla DonanımHaber ve diğer teknoloji/oyun sitelerinin RSS akışları kanala bağlanır.
- **Tıkanma & Tekrar Önleyici:** Daha önce paylaşılan haberler veritabanında saklanır ve tekrar gönderilmez.

### 🎫 3. Ticket (Destek Talebi) Sistemi
- **Butonlu Destek Oluşturma:** `!ticket-kur #kanal` komutuyla şık bir destek paneli kurulur.
- **Özel Destek Kanalları:** Kullanıcı butona bastığında yalnızca yetkililerin ve kullanıcının görebileceği özel bir kanal açılır.
- **Transkript & Kapatma:** Bilet kapatıldığında tüm konuşma geçmişi (log) kaydedilerek Log kanalına gönderilir.

### 🔄 4. Otomatik Rol Temizleme (Auto Unverify Remover)
- Sunucu üyelerinin rolleri anlık izlenir (`guildMemberUpdate`).
- Bir kullanıcıda **aynı anda** hem `NOT VERIFIED` hem de `Üye` rolü varsa, bot otomatik olarak `NOT VERIFIED` rolünü kaldırır.

### 📜 5. Gelişmiş Log Sistemi
- `!log #kanal` komutu ile tüm bot aktiviteleri (çekiliş sonuçları, açılan/kapatılan ticket'lar, otomatik alınan roller ve sistem hataları) belirlediğiniz kanala aktarılır.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js** v16.x veya üzeri
- **MongoDB** bağlantı adresi (MongoDB Atlas önerilir)
- **Discord Bot Token** (Discord Developer Portal üzerinden)

### Local (Kendi Bilgisayarınızda) Çalıştırma

1. Projeyi klonlayın veya indirin:
   ```bash
   git clone [https://github.com/kullanici-adiniz/virbot.git](https://github.com/kullanici-adiniz/virbot.git)
   cd virbot
