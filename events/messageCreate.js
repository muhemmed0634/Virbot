// ==========================================
//  VirBot v6 — Mesaj Oluşturma Olayı
//  Auto-Mod, XP, AI, WordGame, Honeypot
// ==========================================
'use strict';

const { PREFIX, RENKLER } = require('../config/config');
const { yetkiliMi, yetkiRed, erisimVarMi } = require('../modules/permissions/permCheck');
const { mesajKontrol, ihlalMetni, ihlalKaydet, OTOMATIK_MUTE_MS } = require('../modules/security/antiSpam');

// Kullanıcı başına son uyarı zamanı (uyarı mesajı spam'ini önler)
const sonUyarilar = new Map();
// Kelime oyununda son kullanılan kelimeler (tekrar engeli) → guildId → Set
const kullanilanKelimeler = new Map();
const KELIME_HAFIZA = 200;

setInterval(() => {
  const simdi = Date.now();
  for (const [k, t] of sonUyarilar) if (simdi - t > 60_000) sonUyarilar.delete(k);
}, 5 * 60_000).unref();
const { honeypotKontrol } = require('../modules/security/honeypotManager');
const { xpEkle } = require('../modules/level/levelManager');
const { geminiYanit } = require('../modules/ai/geminiManager');
const { ayarGetir, kelimeOyunuGetir, kelimeOyunuKaydet } = require('../modules/data/dataManager');

module.exports = {
  isim: 'messageCreate',

  async calistir(client, mesaj) {
    if (mesaj.author.bot) return;
    if (!mesaj.guild) return;

    // 1. Honeypot Kontrolü (yakalandıysa mesaj silindi, kullanıcı atıldı → devam etme)
    if (await honeypotKontrol(mesaj, client)) return;

    // Üye bilgisi önbellekte yoksa getir (partial mesajlar)
    if (!mesaj.member) {
      await mesaj.guild.members.fetch(mesaj.author.id).catch(() => null);
      if (!mesaj.member) return;
    }

    const ayarlar = ayarGetir(mesaj.guild.id);

    // 2. Anti-Spam / Caps / Karaliste (Yetkililer hariç)
    if (!yetkiliMi(mesaj.member)) {
      const ihlal = mesajKontrol(mesaj, ayarlar);
      if (ihlal) {
        if (mesaj.deletable) await mesaj.delete().catch(() => {});

        // Uyarı mesajı kullanıcı başına 5 sn'de bir (yoksa spam'e karşı bot da spam yapıyordu)
        const uyariAnahtari = `${mesaj.guild.id}-${mesaj.author.id}`;
        if (Date.now() - (sonUyarilar.get(uyariAnahtari) || 0) > 5000) {
          sonUyarilar.set(uyariAnahtari, Date.now());
          const uyari = await mesaj.channel.send({
            content: `<@${mesaj.author.id}>, ${ihlalMetni(ihlal)}`,
            allowedMentions: { users: [mesaj.author.id] },
          }).catch(() => null);
          if (uyari) setTimeout(() => uyari.delete().catch(() => {}), 5000);
        }

        // Kısa sürede tekrarlayan ihlal → otomatik 5 dk susturma
        let otomatikMute = false;
        if (ihlalKaydet(mesaj.guild.id, mesaj.author.id) && mesaj.member.moderatable) {
          otomatikMute = await mesaj.member
            .timeout(OTOMATIK_MUTE_MS, `VirBot AutoMod — 1 dakikada tekrarlanan ihlal (${ihlal})`)
            .then(() => true)
            .catch(() => false);
          if (otomatikMute) {
            mesaj.channel.send(`🔇 <@${mesaj.author.id}> tekrarlanan kural ihlalleri nedeniyle **5 dakika** susturuldu.`)
              .then(m => setTimeout(() => m.delete().catch(() => {}), 10_000))
              .catch(() => {});
          }
        }

        // Küfür / Karaliste ve AutoMod İhlal Logu
        const { logEmbed, logGonder } = require('../modules/logger/logManager');
        const baslik = ihlal === 'karaliste' ? '🤬 Küfür / Yasaklı Kelime Engellendi' : `🛡️ AutoMod İhlali: ${ihlal.toUpperCase()}`;
        const logEmb = logEmbed(
          baslik,
          `**Kullanıcı:** ${mesaj.author.tag} (<@${mesaj.author.id}>)\n` +
          `**ID:** \`${mesaj.author.id}\`\n` +
          `**Kanal:** <#${mesaj.channelId}>\n` +
          `**İhlal Türü:** \`${ihlal}\`\n` +
          (otomatikMute ? `**Ek İşlem:** 🔇 5 dakika otomatik susturma\n` : '') +
          `**Mesaj İçeriği:**\n\`\`\`${mesaj.content.replace(/```/g, 'ˋˋˋ').slice(0, 500)}\`\`\``,
          RENKLER.HATA
        );
        await logGonder(client, mesaj.guild.id, logEmb);
        return;
      }
    }

    // 3. XP Sistemi
    {
      const xpSonuc = await xpEkle(mesaj.member, client).catch(err => {
        console.error('[XP] Hata:', err.message);
        return null;
      });
      if (xpSonuc && xpSonuc.levelAtladi) {
        let hedefKanal = mesaj.channel;
        if (ayarlar?.xpKanalId) {
          const ozelKanal = mesaj.guild.channels.cache.get(ayarlar.xpKanalId);
          if (ozelKanal && ozelKanal.isTextBased()) {
            hedefKanal = ozelKanal;
          }
        }
        hedefKanal.send({ embeds: [xpSonuc.embed] }).catch(() => {});
      }
    }

    // 4. Bot Etiketi veya AI Kanalı Kontrolü (Gemini AI)
    const botEtiketlendi = client.user && mesaj.mentions.has(client.user) && !mesaj.mentions.everyone;
    const aiKanali = ayarlar?.aiKanalId === mesaj.channelId;

    if ((botEtiketlendi || aiKanali) && !mesaj.content.startsWith(PREFIX)) {
      // Mesajdan bot etiketini temizle
      const temizIcerik = mesaj.content
        .replace(new RegExp(`<@!?${client.user?.id}>`, 'g'), '')
        .trim();

      if (!temizIcerik && botEtiketlendi) {
        return mesaj.reply(
          `👋 Merhaba <@${mesaj.author.id}>! Benim adım **VirBot**.\n` +
          `Ön ekim: \`${PREFIX}\` | Tüm komutlar için: \`${PREFIX}yardim\`\n` +
          `Benimle sohbet etmek için mesajında benden bahsedip istediğini sorabilirsin!`
        );
      }

      return await geminiYanit(mesaj, temizIcerik || mesaj.content);
    }

    // 5. Kelime Oyunu Kontrolü
    const kelimeVeri = kelimeOyunuGetir(mesaj.guild.id);
    if (kelimeVeri && kelimeVeri.kanalId === mesaj.channelId) {
      // Türkçe küçük harf dönüşümü (I → ı, İ → i)
      const kelime = mesaj.content.trim().toLocaleLowerCase('tr-TR');
      
      // Sadece kelimeleri kabul et (boşluk veya özel karakter varsa yoksay)
      if (/^[a-zçğıöşü]+$/.test(kelime)) {
        if (kelimeVeri.sonOyuncu === mesaj.author.id) {
          await mesaj.delete().catch(() => {});
          const m = await mesaj.channel.send('❌ Üst üste iki kelime yazamazsın!').catch(() => null);
          if (m) setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }

        // "ğ" ile başlayan Türkçe kelime yoktur → ğ ile biten kelimede bir önceki harf geçerli
        const sonKelime = kelimeVeri.sonKelime;
        const sonHarf = sonKelime.endsWith('ğ') && sonKelime.length > 1
          ? sonKelime.slice(-2, -1)
          : sonKelime.slice(-1);
        if (!kelime.startsWith(sonHarf)) {
          await mesaj.delete().catch(() => {});
          const m = await mesaj.channel.send(`❌ Kelime **"${sonHarf}"** harfiyle başlamalı! (Son kelime: **${kelimeVeri.sonKelime}**)`).catch(() => null);
          if (m) setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }

        if (kelime.length < 2) {
          await mesaj.delete().catch(() => {});
          return;
        }

        // Aynı kelime tekrar kullanılamaz (son 200 kelime hafızada)
        const hafizaAnahtari = `${mesaj.guild.id}-${kelimeVeri.kanalId}`;
        let hafiza = kullanilanKelimeler.get(hafizaAnahtari);
        // Yeni kurulan oyun ("elma" ile, henüz kimse oynamamış) → hafızayı sıfırla
        if (!hafiza || (!kelimeVeri.sonOyuncu && kelimeVeri.sonKelime === 'elma')) {
          hafiza = new Set([kelimeVeri.sonKelime]);
          kullanilanKelimeler.set(hafizaAnahtari, hafiza);
        }
        if (hafiza.has(kelime)) {
          await mesaj.delete().catch(() => {});
          const m = await mesaj.channel.send(`❌ **"${kelime}"** daha önce kullanıldı! Başka bir kelime dene.`).catch(() => null);
          if (m) setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }
        hafiza.add(kelime);
        if (hafiza.size > KELIME_HAFIZA) hafiza.delete(hafiza.values().next().value);

        // Doğru kelime
        kelimeOyunuKaydet(mesaj.guild.id, {
          kanalId: mesaj.channelId,
          sonKelime: kelime,
          sonOyuncu: mesaj.author.id
        });
        await mesaj.react('✅').catch(() => {});
      }
      if (!mesaj.content.startsWith(PREFIX)) return; // Kelime değil ama prefix de değilse bir şey yapma
    }

    // 6. Komut Çalıştırma
    if (!mesaj.content.startsWith(PREFIX)) return;

    const args = mesaj.content.slice(PREFIX.length).trim().split(/\s+/);
    const komutAdi = args.shift().toLowerCase();

    const komut = client.komutlar.get(komutAdi);
    if (!komut) return;

    // Yetki kontrolü: Normal kullanıcılar yalnızca RPG komutlarını kullanabilir
    if (!erisimVarMi(komut, mesaj.member)) {
      return yetkiRed(mesaj, true);
    }

    try {
      await komut.calistir(client, mesaj, args);
    } catch (hata) {
      console.error(`[KOMUT HATASI] ${komutAdi}:`, hata);
      mesaj.reply('❌ Komut çalıştırılırken bir hata oluştu.').catch(() => {});
    }
  },
};
