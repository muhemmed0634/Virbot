// ==========================================
//  VirBot v2 — Log Yöneticisi
//  Tüm log embed'lerini tek kanaldan yönetir
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

  if (alanlar.length > 0) embed.addFields(alanlar);
  return embed;
}

/**
 * Sunucunun log kanalına embed gönderir.
 */
async function logGonder(client, guildId, embed) {
  try {
    const ayarlar = await guildGetir(guildId);
    if (!ayarlar?.logKanalId) return;

    const kanal = await client.channels.fetch(ayarlar.logKanalId).catch(() => null);
    if (!kanal) return;

    await kanal.send({ embeds: [embed] });
  } catch (hata) {
    console.error('[LOG] Gönderme hatası:', hata.message);
  }
}

/**
 * Dosya ekli log gönderir (transcript vb.).
 */
async function logDosyaGonder(client, guildId, embed, dosyalar) {
  try {
    const ayarlar = await guildGetir(guildId);
    if (!ayarlar?.logKanalId) return;

    const kanal = await client.channels.fetch(ayarlar.logKanalId).catch(() => null);
    if (!kanal) return;

    await kanal.send({ embeds: [embed], files: dosyalar });
  } catch (hata) {
    console.error('[LOG] Dosya gönderme hatası:', hata.message);
  }
}

module.exports = { logEmbed, logGonder, logDosyaGonder };
