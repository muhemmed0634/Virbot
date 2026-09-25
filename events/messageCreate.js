// ==========================================
//  VirBot — Mesaj Oluşturma Olayı (v2)
//  Auto-Mod, XP, AI, WordGame, Honeypot
// ==========================================
'use strict';

const { PREFIX, RENKLER } = require('../config/config');
const { yetkiliMi, yetkiRed } = require('../modules/permissions/permCheck');
const { mesajKontrol, ihlalMetni } = require('../modules/security/antiSpam');
const { honeypotKontrol } = require('../modules/security/honeypotManager');
const { xpEkle } = require('../modules/level/levelManager');
const { geminiYanit } = require('../modules/ai/geminiManager');
const { ayarGetir, kelimeOyunuGetir, kelimeOyunuKaydet } = require('../modules/data/dataManager');

module.exports = {
  isim: 'messageCreate',

  async calistir(client, mesaj) {
    if (mesaj.author.bot) return;
    if (!mesaj.guild) return;

    // 1. Honeypot Kontrolü
    await honeypotKontrol(mesaj, client);

    const ayarlar = ayarGetir(mesaj.guild.id);

    // 2. Anti-Spam / Caps / Karaliste (Yetkililer hariç)
    if (!yetkiliMi(mesaj.member)) {
      const ihlal = mesajKontrol(mesaj, ayarlar);
      if (ihlal) {
        if (mesaj.deletable) await mesaj.delete().catch(() => {});
        const uyari = await mesaj.channel.send(`<@${mesaj.author.id}>, ${ihlalMetni(ihlal)}`);
        setTimeout(() => uyari.delete().catch(() => {}), 5000);
        return;
      }
    }

    // 3. XP Sistemi
    if (ayarlar?.sayacHedef || true) {
      const xpSonuc = await xpEkle(mesaj.member, client);
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
      const kelime = mesaj.content.trim().toLowerCase();
      
      // Sadece kelimeleri kabul et (boşluk veya özel karakter varsa yoksay)
      if (/^[a-zçğıöşü]+$/.test(kelime)) {
        if (kelimeVeri.sonOyuncu === mesaj.author.id) {
          await mesaj.delete().catch(() => {});
          const m = await mesaj.channel.send('❌ Üst üste iki kelime yazamazsın!');
          setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }

        const sonHarf = kelimeVeri.sonKelime.slice(-1);
        if (!kelime.startsWith(sonHarf)) {
          await mesaj.delete().catch(() => {});
          const m = await mesaj.channel.send(`❌ Kelime **"${sonHarf}"** harfiyle başlamalı! (Son kelime: **${kelimeVeri.sonKelime}**)`);
          setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }

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

    // Yetki kontrolü:
    // 1. Admin gerektiren komutlar → sadece yetkililer
    // 2. Admin gerektirmeyen komutlar → sadece RPG komutu ise herkes, değilse sadece yetkililer
    if (komut.adminGerekli && !yetkiliMi(mesaj.member)) {
      return yetkiRed(mesaj, true);
    }

    if (!komut.adminGerekli && !komut.rpgKomutu && !yetkiliMi(mesaj.member)) {
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
