// ==========================================
//  VirBot v6 — Disboard Bump Yöneticisi
//  2 saatte bir otomatik bump hatırlatma ve tetikleme
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { guildGuncelle, guildGetir, ayarGetir } = require('../data/dataManager');
const Guild = require('../../database/models/Guild');

const BUMP_ARALIK_MS = 2 * 60 * 60 * 1000; // 2 saat
const aktifBumpIntervals = new Map();

/**
 * Belirtilen kanala bump mesajı gönderir.
 */
async function bumpGonder(kanal, isTest = false) {
  try {
    if (!kanal || !kanal.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(isTest ? '🚀 Disboard Bump Sistemi Aktif Edildi!' : '⏰ Disboard Bump Zamanı Geldi!')
      .setDescription(
        isTest
          ? `✅ **Bump kanalı başarıyla bağlandı!**\n\n` +
            `> Bu mesaj ilk kurulum testidir. Artık VirBot v6 her **2 saatte bir** bu kanalda otomatik bump bildirimi yapacak ve sunucunuzu Disboard listelerinde zirvede tutacaktır.\n\n` +
            `Şimdi test etmek için: </bump:302050872383242240> veya \`!d bump\` yazabilirsiniz!`
          : `📢 **Sunucumuzu zirveye taşıma vakti!**\n\n` +
            `> 2 saatlik Disboard bekleme süresi doldu! Sunucumuzun görünürlüğünü artırmak için lütfen aşağıdaki komutu kullanın:\n\n` +
            `👉 </bump:302050872383242240> veya \`!d bump\``
      )
      .setColor(isTest ? 0x57F287 : 0x5865F2)
      .setFooter({ text: 'VirBot v6 • Disboard Otomatik Bump Sistemi' })
      .setTimestamp();

    await kanal.send({
      content: isTest ? '🔔 Disboard Bump Sistemi Bağlandı!' : '@everyone ⏰ Disboard Bump Vakti!',
      embeds: [embed],
    });

    // Ayrıca prefix bazlı Disboard botu için metin gönder
    await kanal.send('!d bump').catch(() => {});
  } catch (err) {
    console.error('[BUMP GÖNDERME HATA]', err.message);
  }
}

/**
 * Sunucu için bump kanalını kaydeder ve 2 saatlik zamanlayıcıyı başlatır.
 */
async function bumpKanalAyarla(guildId, kanal, client) {
  await guildGuncelle(guildId, { bumpKanalId: kanal ? kanal.id : null });

  if (aktifBumpIntervals.has(guildId)) {
    clearInterval(aktifBumpIntervals.get(guildId));
    aktifBumpIntervals.delete(guildId);
  }

  if (kanal) {
    // Kurulum testi: anında 1 kez çalıştır
    await bumpGonder(kanal, true);

    // 2 saatlik döngü başlat
    const interval = setInterval(async () => {
      try {
        const gAyar = ayarGetir(guildId);
        if (!gAyar?.bumpKanalId) {
          clearInterval(interval);
          aktifBumpIntervals.delete(guildId);
          return;
        }
        const gKanal = client.channels.cache.get(gAyar.bumpKanalId) ||
                       await client.channels.fetch(gAyar.bumpKanalId).catch(() => null);
        if (gKanal) await bumpGonder(gKanal, false);
      } catch (e) {
        console.error('[BUMP INTERVAL HATA]', e.message);
      }
    }, BUMP_ARALIK_MS);

    aktifBumpIntervals.set(guildId, interval);
  }
}

/**
 * Bot başladığında kayıtlı tüm sunucuların bump zamanlayıcılarını yükler.
 */
async function bumpSisteminiBaslat(client) {
  try {
    const sunucular = await Guild.find({ bumpKanalId: { $ne: null } });
    for (const g of sunucular) {
      if (!g.bumpKanalId) continue;
      if (aktifBumpIntervals.has(g.guildId)) continue;

      const interval = setInterval(async () => {
        try {
          const gAyar = ayarGetir(g.guildId);
          if (!gAyar?.bumpKanalId) return;
          const kanal = client.channels.cache.get(gAyar.bumpKanalId) ||
                        await client.channels.fetch(gAyar.bumpKanalId).catch(() => null);
          if (kanal) await bumpGonder(kanal, false);
        } catch (_) {}
      }, BUMP_ARALIK_MS);

      aktifBumpIntervals.set(g.guildId, interval);
    }
    console.log(`[BUMP] ${aktifBumpIntervals.size} sunucu için 2 saatlik bump zamanlayıcısı aktif.`);
  } catch (err) {
    console.error('[BUMP BAŞLATMA HATA]', err.message);
  }
}

module.exports = { bumpKanalAyarla, bumpSisteminiBaslat, bumpGonder };
