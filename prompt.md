Discord.js v14 ve Node.js kullanarak "virbot" adlı ultra gelişmiş, ErenSi bot tarzında, OwO RPG mekaniklerine sahip, Web Dashboard entegreli ve tam kapsamlı (Full Production-Ready) bir Discord botunun tam çalışır kodunu hazırla.

Bot, Render veya Railway gibi PaaS platformlarında 7/24 kesintisiz çalışmaya tam uygun olmalıdır (Express keep-alive/Dashboard sunucusu ve MongoDB entegrasyonu ile).

Botta Moderasyon, Kurulum ve Yönetim yetkileri KESİNLİKLE sadece `@Admin` ve `@Kurucu` rollerine sahip kullanıcılara verilmelidir. Normal kullanıcılar bu komutları kesinlikle kullanamamalıdır. Bot prefix'i `v!` olmalıdır.

Botta bulunması gereken TÜM MODÜLLER VE İŞLEVLER:

--- 1. YETKİ VE İZİNLER KONTROLÜ (GÜVENLİK) ---
1. Bütün moderasyon, kurulum ve yönetim komutları (`v!ban`, `v!unban`, `v!mute`, `v!unmute`, `v!warn`, `v!honeypot-kur`, `v!sayackur`, `v!ticket-kur`, `v!giriş` vb.) sadece `@Admin` veya `@Kurucu` rolüne sahip üyeler tarafından çalıştırılabilir.
2. Normal kullanıcılar bu komutları denediğinde mesaj silinir ve bot kullanıcıya özel (ephemeral) "❌ Bu komutu kullanmak için yetkiniz bulunmamaktadır! Yalnızca @Admin ve @Kurucu rolleri kullanabilir." uyarısı verir.

--- 2. TİKET (DESTEK TALEBİ) SİSTEMİ (BUTTONLU VE MODAL'LI) ---
Komut: `v!ticket-kur #kanal` (Sadece @Admin ve @Kurucu)
1. Yetkili komutu yazdığında belirtilen kanala şık bir Embed mesajı atılır ve altına "📩 Destek Talebi Aç" düğmesi eklenir.
2. Düğmeye basıldığında Modal açılır. Form gönderildikten sonra gizli kanal (`ticket-kullanıcıadı`) açılır.
3. Kanalda "🔒 Bileti Kapat" düğmesi yer alır. Basıldığında sohbet geçmişi (transcript/log) Log kanalına gönderilir ve kanal silinir.

--- 3. GÖRSEL HOŞ GELDİN VE ARAMIZDAN AYRILDI (ErenSi Canvas) ---
Komut: `v!giriş #kanal` (Sadece @Admin ve @Kurucu)
1. Sunucuya katılan veya ayrılan üyeler için ErenSi tarzı Canvas görsel kart oluşturulup kanala gönderilir.
2. Arka plan siyah/koyu siber temalı; kullanıcının avatarı yuvarlak, etrafı turuncu/yeşil parlayan çerçeveli, "Hoş Geldin [KullanıcıAdı]!" yazısı ve üye sırası ("#1.250") yer almalıdır.

--- 4. DİNAMİK SAYAÇ VE AUTO-NEXT TARGET SİSTEMİ ---
Komutlar: `v!sayackur [hedef_sayı] #kanal` ve `v!sayac-sıfırla` (Sadece @Admin ve @Kurucu)
1. Katılan/ayrılan üyelerde sayaç kanalına bilgilendirme mesajı atılır.
2. Hedefe ulaşıldığında otomatik olarak yeni hedef belirlenir (Örn: 1000 bittiğinde otomatik 1100 yapar).

--- 5. FULL SECURITY: ANTI-RAID, WEBHOOK GUARD ---
1. Webhook & Mass-Kick Guard: İzinsiz yaratılan Webhook'ları siler, 10 saniyede 3'ten fazla üye atan yetkililerin yetkisini anında alır.

--- 6. FULL HONEYPOT (BOT TUZAĞI) SİSTEMİ ---
Komut: `v!honeypot-kur` (Sadece @Admin ve @Kurucu)
1. Gizli Honeypot kanalı oluşturulur. Bu kanala mesaj atan HER HANGİ BİR KULLANICI / SELF-BOT anında kalıcı olarak BANLANIR ve mesajları silinir.

--- 7. YASAKLI SÖZLER (KARALİSTE.TXT), SPAM VƏ CAPSLOCK KORUMASI ---
1. `karaliste.txt` dosyasındaki kelimeleri yazanların mesajı silinir, kullanıcının DM kutusuna uyarı gönderilir.
2. Spam/Flood, Capslock (%70+) ve Reklam Linkleri otomatik silinir.

--- 8. ADVANCED OWO RPG, HUNT, GAMBLE VƏ TRADE SİSTEMİ ---
Komutlar: `v!hunt`, `v!zoo`, `v!sell`, `v!battle`, `v!cash`, `v!daily`, `v!equip`, `v!give`, `v!slots`, `v!coinflip`
1. `v!hunt`: Avcılığa çıkar, farklı nadirlikte hayvanlar ve ekipman parçaları düşürür.
2. `v!zoo` & `v!sell`: Hayvanat bahçesini görüntüler veya hayvanları satarak coin kazanır.
3. `v!battle @kullanıcı`: Ekipman ve hayvan bonuslarıyla PVP savaşı yaptırır.
4. `v!give @kullanıcı [miktar/hayvan]`: Kullanıcılar arası güvenli transfer sağlar.
5. `v!slots` & `v!coinflip`: Coin ile şans oyunları oynatır.

--- 9. GEMINI AI CHATBOT KANALI ---
Komut: `v!ai-kanal #kanal` (Sadece @Admin ve @Kurucu)
1. Etiketlenen kanala yazılan her mesaja bot Gemini API entegrasyonu ile akıllı, doğal ve eğlenceli Türkçe cevaplar verir.

--- 10. CANVAS RANK CARD VƏ CUSTOM BACKGROUNDS ---
Komutlar: `v!rank`, `v!leaderboard`, `v!background-set [URL]`
1. `v!rank` yazıldığında kullanıcının avatarı, seviyesi, XP barı ve özel seçtiği arka plan görseliyle ErenSi usulü Canvas kart üretilir.

--- 11. BUTTONLU MÜZİK SİSTEMİ & 24/7 VOICE ---
Komutlar: `v!play [şarkı/link]`, `v!skip`, `v!stop`, `v!queue`, `v!lyrics`
1. `v!play` çalıştırıldığında kanala kontrol paneli düğmeleri olan (⏸️, ▶️, ⏭️, ⏹️) Embed gönderilir. Bot 24/7 ses kanalında kalabilir.

--- 12. WEB DASHBOARD & OAUTH2 ---
1. Express.js sunucusu `/dashboard` rotasında basit bir Discord OAuth2 yönetim paneli sunar. Botun durumunu, ping değerini ve aktif sunucularını gösterir.

--- 13. KELİME TÜRETME OYUNU VE ŞARTLI İNTERAKTİF ÇEKİLİŞ ---
1. `v!kelime-kur #kanal`: Son harfle başlayan kelime türetme oyunu çalıştırır.
2. `v!cekilis-baslat [süre] [kazanan_sayısı] [ödül]`: Şartlı çekiliş başlatır.

--- 14. GEÇİCİ SES KANALLARI (JOIN-TO-CREATE) ---
Komut: `v!ses-sistemi-kur` (Sadece @Admin ve @Kurucu)
1. "➕ Kanal Oluştur" ses kanalına girildiğinde kişiye özel geçici kanal açar (`🔊 [Kullanıcı]'nın Odası`), oda boşalınca kanalı siler.

--- 15. SERVER STATS, REACTION ROLE VƏ VERIFY ---
1. `v!verify-kur #kanal`: Düğmeye basıldığında "Üye" rolü verir, "NOT VERIFIED" rolünü kaldırır.
2. Otomatik güncellenen sunucu üye sayısı kanalları.

--- 16. CLOUD DEPLOY VE LOG SİSTEMİ ---
1. Express keep-alive / dashboard sunucu kodu ve MongoDB bağlantısı tam entegre edilmelidir.
2. Log kanalına silinen mesajlar, banlar, ticket'lar, honeypot, anti-alt yakalamaları, nuke engellemeleri ve seviye olayları kaydedilir.

Logo olarak virbot.png kullanılmalı, kod yapısı son derece temiz, modüler ve Türkçe/Azerbaycan dil arabirimine uygun olmalıdır.