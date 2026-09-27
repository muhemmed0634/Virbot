// ==========================================
//  VirBot v2 — Log Yöneticisi
//  Tüm log embed'lerini tek kanaldan yönetir
//  Mesaj gönderildikten sonra sistemde asla tutulmaz
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { guildGetir }   = require('../data/dataManager');

/**
 * Şablon log embed oluşturur.
 */
function logEmbed(baslik, aciklama, renk = 0x5865F2, alanlar = []) {
  const embed = new EmbedBuilder()
    .setTitle(`📋 ${baslik}`)
    .setDescription(aciklama || '—')
    .setColor(renk)
    .setTimestamp()
    .setFooter({ text: 'VirBot Log Sistemi' });

  if (alanlar && alanlar.length > 0) embed.addFields(alanlar);
  return embed;
}

/**
 * Sunucunun log kanalına embed gönderir.
 * Mesaj gönderildikten sonra veriler sistemde (RAM, dosya, veritabanı) tutulmaz.
 */
async function logGonder(client, guildId, embed) {
  try {
    if (!client || !guildId || !embed) return;
    const ayarlar = await guildGetir(guildId);
    if (!ayarlar?.logKanalId) return;

    const kanal = client.channels.cache.get(ayarlar.logKanalId) ||
                  await client.channels.fetch(ayarlar.logKanalId).catch(() => null);
    if (!kanal || !kanal.isTextBased()) return;

    await kanal.send({ embeds: [embed] });
  } catch (hata) {
    console.error('[LOG] Gönderme hatası:', hata.message);
  } finally {
    // Mesaj gönderildikten sonra referansı temizle, sistemde tutma
    embed = null;
  }
}

/**
 * Dosya ekli log gönderir (transcript vb.).
 * Gönderildikten sonra sistemde tutulmaz.
 */
async function logDosyaGonder(client, guildId, embed, dosyalar) {
  try {
    if (!client || !guildId || !embed) return;
    const ayarlar = await guildGetir(guildId);
    if (!ayarlar?.logKanalId) return;

    const kanal = client.channels.cache.get(ayarlar.logKanalId) ||
                  await client.channels.fetch(ayarlar.logKanalId).catch(() => null);
    if (!kanal || !kanal.isTextBased()) return;

    await kanal.send({ embeds: [embed], files: dosyalar });
  } catch (hata) {
    console.error('[LOG] Dosya gönderme hatası:', hata.message);
  } finally {
    embed = null;
    dosyalar = null;
  }
}

module.exports = { logEmbed, logGonder, logDosyaGonder };

