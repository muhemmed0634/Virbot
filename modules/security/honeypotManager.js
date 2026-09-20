// ==========================================
//  VirBot v2 — Honeypot Yöneticisi
//  Sahte davet kanalı ile bot/spam tespiti
// ==========================================
'use strict';

const { logEmbed, logGonder } = require('../logger/logManager');
const { guildGetir } = require('../data/dataManager');
const { RENKLER } = require('../../config/config');

// honeypotKanalId Set'i — botun takip ettiği tuzak kanalları
const honeypotKanallari = new Set();

/**
 * Honeypot kanal ID'sini kaydet.
 * @param {string} kanalId
 */
function honeypotEkle(kanalId) {
  honeypotKanallari.add(kanalId);
}

/**
 * Honeypot kanalına mesaj atan kişiyi kontrol eder.
 * @param {Message} mesaj
 * @param {Client} client
 */
async function honeypotKontrol(mesaj, client) {
  if (!honeypotKanallari.has(mesaj.channelId)) return;
  if (mesaj.author.bot) return;

  try {
    const member = mesaj.member || await mesaj.guild.members.fetch(mesaj.author.id).catch(() => null);
    if (!member) return;

    // Mesajı sil
    await mesaj.delete().catch(() => {});

    // Kullanıcıyı kickle
    await member.kick('VirBot — Honeypot: Tuzak kanalına mesaj gönderildi').catch(() => {});

    // DM uyarısı
    await mesaj.author.send(
      `🍯 **${mesaj.guild.name}** sunucusunda bir tuzak kanala mesaj gönderdiğiniz tespit edildi ve sunucudan çıkarıldınız.`
    ).catch(() => {});

    // Log
    const embed = logEmbed(
      '🍯 Honeypot — Şüpheli Kullanıcı Tespit Edildi',
      `**Kullanıcı:** ${mesaj.author.tag} (<@${mesaj.author.id}>)\n` +
      `**Kanal:** <#${mesaj.channelId}>\n` +
      `**Mesaj:** ${mesaj.content.slice(0, 200)}\n` +
      `**İşlem:** Sunucudan çıkarıldı`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, mesaj.guild.id, embed);

  } catch (hata) {
    console.error('[HONEYPOT] Hata:', hata.message);
  }
}

/**
 * Guild ayarlarından kayıtlı honeypot kanalını yükler.
 * @param {string} guildId
 */
async function honeypotYukle(guildId) {
  const ayarlar = await guildGetir(guildId);
  if (ayarlar?.honeypotKanalId) {
    honeypotKanallari.add(ayarlar.honeypotKanalId);
  }
}

module.exports = { honeypotEkle, honeypotKontrol, honeypotYukle, honeypotKanallari };
