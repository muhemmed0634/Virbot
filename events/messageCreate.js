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

    // 2. Anti-Spam / Caps / Karaliste (Yetkililer hariç)
    if (!yetkiliMi(mesaj.member)) {
      const ihlal = mesajKontrol(mesaj);
      if (ihlal) {
        if (mesaj.deletable) await mesaj.delete().catch(() => {});
        const uyari = await mesaj.channel.send(`<@${mesaj.author.id}>, ${ihlalMetni(ihlal)}`);
        setTimeout(() => uyari.delete().catch(() => {}), 5000);
        return;
      }
    }

    const ayarlar = ayarGetir(mesaj.guild.id);

    // 3. XP Sistemi
    if (ayarlar?.sayacHedef || true) { // Şimdilik hep aktif
      const xpSonuc = await xpEkle(mesaj.member, client);
      if (xpSonuc && xpSonuc.levelAtladi) {
        mesaj.channel.send({ embeds: [xpSonuc.embed] }).catch(() => {});
      }
    }

    // 4. AI Kanalı Kontrolü
    if (ayarlar?.aiKanalId === mesaj.channelId) {
      if (!mesaj.content.startsWith(PREFIX)) { // Komut değilse AI'a yolla
        return await geminiYanit(mesaj, mesaj.content);
      }
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

    // Yetki kontrolü (Admin komutları)
    if (komut.adminGerekli && !yetkiliMi(mesaj.member)) {
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
