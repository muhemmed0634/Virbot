Discord.js v14 ve Node.js kullanarak "virbot" adlı ultra gelişmiş, ErenSi bot tarzında, OwO RPG mekaniklerine sahip, Web Dashboard entegreli ve tam kapsamlı (Full Production-Ready) bir Discord botunun tam çalışır kodunu hazırla.

Bot, Render veya Railway gibi PaaS platformlarında 7/24 kesintisiz çalışmaya tam uygun olmalıdır (Express keep-alive/Dashboard sunucusu, `/health` ve `/healthz` endpointleri, self-ping uyuma engelleyicisi, graceful shutdown ve MongoDB entegrasyonu ile).

Botta Moderasyon, Kurulum ve Yönetim yetkileri KESİNLİKLE sadece `@Admin` ve `@Kurucu` rollerine sahip kullanıcılara verilmelidir. Normal kullanıcılar YALNIZCA RPG ve Ekonomi komutlarını çalıştırabilir. Bot prefix'i `v!` olup, TÜM komutlar hem prefix hem de Slash (`/`) komutu olarak çalışmalıdır.

Botta bulunması gereken TÜM MODÜLLER VE İŞLEVLER:

--- 1. YETKİ VE İZİNLER KONTROLÜ (GÜVENLİK) ---
1. Bütün moderasyon, kurulum, yönetim ve genel komutlar sadece `@Admin` veya `@Kurucu` rolüne sahip üyeler tarafından çalıştırılabilir.
2. Normal kullanıcılar YALNIZCA RPG komutlarını (`hunt`, `zoo`, `sell`, `market`, `equip`, `battle`, `slots`, `coinflip`, `daily`, `cash`, `give`) kullanabilir.
3. Normal kullanıcılar yetkisiz bir komut denediğinde bot kullanıcıya "❌ Bu komutu kullanmak için yetkiniz bulunmamaktadır! Yalnızca @Admin ve @Kurucu rolleri kullanabilir." uyarısı verir.

--- 2. TİKET (DESTEK TALEBİ) SİSTEMİ (BUTTONLU VE MODAL'LI) ---
Komut: `v!ticket-kur #kanal` / `/ticket-kur` (Sadece @Admin ve @Kurucu)
1. Yetkili komutu yazdığında belirtilen kanala şık bir Embed mesajı atılır ve altına "📩 Destek Talebi Aç" düğmesi eklenir.
2. Düğmeye basıldığında Modal açılır. Form gönderildikten sonra gizli kanal (`ticket-kullanıcıadı`) açılır.
3. Kanalda "🔒 Bileti Kapat" düğmesi yer alır. Basıldığında sohbet geçmişi (transcript/log) Log kanalına gönderilir ve kanal silinir.

--- 3. GÖRSEL HOŞ GELDİN VE ARAMIZDAN AYRILDI (ErenSi Canvas) ---
Komut: `v!giris #kanal` / `/giris` ve `v!giris-cikis #kanal` / `/giris-cikis` (Sadece @Admin ve @Kurucu)
1. Sunucuya katılan veya ayrılan üyeler için ErenSi tarzı Canvas görsel kart oluşturulup kanala gönderilir.
2. Arka plan siyah/koyu siber temalı; kullanıcının avatarı yuvarlak, etrafı parlak çerçeveli, "Hoş Geldin [KullanıcıAdı]!" yazısı ve üye sırası ("#1.250") yer almalıdır.

--- 4. DİNAMİK SAYAÇ VE SAYAÇ SIFIRLAMA SİSTEMİ ---
Komutlar: `v!sayackur [hedef_sayı] #kanal` / `/sayackur` ve `v!sayac-sifirla` / `/sayac-sifirla` (Sadece @Admin ve @Kurucu)
1. Katılan/ayrılan üyelerde sayaç kanalına bilgilendirme mesajı atılır.

--- 5. FULL SECURITY: ANTI-RAID, WEBHOOK GUARD, ANTI-ALT ---
1. Webhook & Mass-Kick Guard: İzinsiz yaratılan Webhook'ları siler, 10 saniyede 3'ten fazla üye atan yetkililerin yetkisini anında alır.
2. Anti-Alt Hesap Koruması: Çok yeni açılan şüpheli hesapları tespit edip karantinaya alır veya sunucudan uzaklaştırır.

--- 6. FULL HONEYPOT (BOT TUZAĞI) SİSTEMİ ---
Komut: `v!honeypot-kur #kanal` / `/honeypot-kur` (Sadece @Admin ve @Kurucu)
1. Gizli Honeypot kanalı oluşturulur. Bu kanala mesaj atan HER HANGİ BİR KULLANICI / SELF-BOT anında kalıcı olarak BANLANIR ve mesajları silinir.

--- 7. YASAKLI SÖZLER (KARALİSTE.TXT), SPAM VE KÜFÜR KORUMASI ---
1. `karaliste.txt` dosyasındaki kelimeleri (Türkçe & Azerbaycan küfür ve hakaretleri) yazanların mesajı silinir, uyarı loglanır.
2. Spam/Flood, Capslock (%70+) ve Reklam Linkleri otomatik engellenir.

--- 8. ADVANCED OWO RPG, HUNT, GAMBLE VE MARKET SİSTEMİ (HERKESE AÇIK) ---
Komutlar: `v!hunt`, `v!zoo`, `v!sell`, `v!battle`, `v!cash`, `v!daily`, `v!equip`, `v!give`, `v!slots`, `v!coinflip`, `v!market` (Tüm Slash destekli: `/hunt`, `/market` vb.)
1. `v!market` / `/market`: Minimum 500 coinlik Silahlar ve Zırhlar dükkanı.
2. `v!hunt`: Avcılığa çıkar, farklı nadirlikte hayvanlar yakalar ve coin kazanır.
3. `v!zoo` & `v!sell`: Hayvanat bahçesini görüntüler veya hayvanları satarak coin kazanır.
4. `v!battle @kullanıcı`: Ekipman ve hayvan bonuslarıyla PVP savaşı yaptırır.
5. `v!give @kullanıcı [miktar]`: Güvenli coin transferi sağlar.
6. `v!slots` & `v!coinflip`: Coin ile şans oyunları oynatır.

--- 9. GEMINI AI CHATBOT KANALI ---
Komut: `v!ai-kanal #kanal` / `/ai-kanal` (Sadece @Admin ve @Kurucu)
1. Etiketlenen kanala yazılan her mesaja bot Gemini API entegrasyonu ile akıllı, doğal ve eğlenceli Türkçe cevaplar verir. Bot etiketlendiğinde de yanıtlar.

--- 10. CANVAS RANK CARD, XP KANALI VE ARKA PLAN AYARLAMA ---
Komutlar: `v!rank` / `/rank`, `v!leaderboard` / `/leaderboard`, `v!background-set [URL]` / `/background-set`, `v!xp #kanal` / `/xp [kanal]`
1. `v!rank`: Kullanıcının avatarı, seviyesi, XP barı ve özel seçtiği arka plan görseliyle Canvas kart üretir.
2. `v!leaderboard`: Sunucunun XP sıralamasını görüntüler.
3. `v!xp #kanal` / `/xp kanal:#kanal`: Seviye atlama ve XP kutlama bildirimlerinin gönderileceği özel kanalı belirler (Sadece @Admin ve @Kurucu).

--- 11. SPOTIFY VE YOUTUBE MÜZİK SİSTEMİ ---
Komutlar: `v!cal [şarkı/link]` / `/cal`, `v!dur` / `/dur`, `v!atla` / `/atla`, `v!kuyruk` / `/kuyruk`
1. `play-dl` ve `@discordjs/voice` entegrasyonu.
2. Spotify şarkı linklerini oEmbed meta-verileriyle tespit eder ve ses kanalında çalar.
3. YouTube linki ve arama desteği, parça kuyruğu yönetimi, atlama ve durdurma işlevleri.

--- 12. WEB DASHBOARD, KEEP-ALIVE VE RENDER.COM OPTİMİZASYONU ---
1. Express.js sunucusu `/dashboard` rotasında Discord OAuth2 yönetim paneli sunar.
2. Render.com için `/health`, `/healthz` ve `/ping` endpointleri.
3. `RENDER_EXTERNAL_URL` ile 10 dakikada bir otomatik keep-alive self-ping (uyuma engelleyici).
4. `SIGTERM` ve `SIGINT` sinyalleri ile MongoDB ve Discord client oturumlarını güvenle kapatan Graceful Shutdown.
5. `render.yaml` ile tek tıkla dağıtım desteği.

--- 13. KELİME TÜRETME OYUNU VE BETA ÇEKİLİŞ ---
1. `v!kelime-kur #kanal` / `/kelime-kur`: Son harfle başlayan kelime türetme oyunu çalıştırır.
2. `v!cekilis-baslat` / `/cekilis-baslat` & `v!reroll` / `/reroll`: Çekiliş başlatma ve yeniden kazanan seçme.

--- 14. GEÇİCİ SES KANALLARI (JOIN-TO-CREATE) ---
Komut: `v!ses-sistemi-kur` / `/ses-sistemi-kur` (Sadece @Admin ve @Kurucu)
1. Ses kanalına girildiğinde kişiye özel geçici kanal açar, oda boşalınca kanalı siler.

--- 15. DOĞRULAMA (VERIFY) VE @NOT VERIFIED ROL KALDIRMA ---
Komut: `v!verify-kur @VerilecekRol [@AlınacakRol] [#kanal]` / `/verify-kur` (Sadece @Admin ve @Kurucu)
1. Doğrulama butonuna tıklandığında kullanıcıya üye rolü verilir.
2. Kullanıcının üzerindeki `@NOT VERIFIED`, `unverified`, `doğrulanmamış` rolü otomatik olarak kaldırılır.

--- 16. KULLANICI VE MESAJ ID ARAÇLARI ---
Komutlar:
1. `v!mesajid` / `/mesajid`: Yanıtlanan mesajın veya son mesajın Discord ID'sini, kanalını ve linkini gösterir.
2. `v!kullanici-id [@üye]` / `/kullanici-id`: Kullanıcının Discord ID'sini, kullanıcı adını ve hesap oluşturulma tarihini verir.

--- 17. TAM SLASH (/) KOMUT DESTEĞİ ---
1. Botun sahip olduğu 44 komutun tamamı hem `v!` prefixi hem de Discord Slash (`/`) komutları olarak tam desteklidir.
2. Bot hazır olduğunda tüm komutlar Discord API'ye otomatik kaydedilir.

Logo olarak virbot.png kullanılmalı, kod yapısı son derece temiz, modüler ve Türkçe/Azerbaycan dil arabirimine uygun olmalıdır.