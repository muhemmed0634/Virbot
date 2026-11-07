// ==========================================
//  VirBot v2 — Honeypot Yöneticisi
//  Sahte davet kanalı ile bot/spam tespiti
// ==========================================
'use strict';

const { logEmbed, logGonder } = require('../logger/logManager');
const { guildGetir } = require('../data/dataManager');
const { RENKLER } = require('../../config/config');
const { yetkiliMi } = require('../permissions/permCheck');

// honeypotKanalId Set'i — botun takip ettiği tuzak kanalları
const honeypotKanallari = new Set();
// guildId → kanalId (kanal değiştirildiğinde eskisi takipten çıkarılır)
const sunucuHoneypot = new Map();

/**
 * Honeypot kanal ID'sini kaydet.
 * @param {string} kanalId
 * @param {string} [guildId]
 */
function honeypotEkle(kanalId, guildId = null) {
  if (guildId) {
    const eski = sunucuHoneypot.get(guildId);
    if (eski && eski !== kanalId) honeypotKanallari.delete(eski);
    sunucuHoneypot.set(guildId, kanalId);
  }
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
    if (!member) return false;
    // Yöneticiler / sunucu sahibi tuzağa takılmaz
    if (yetkiliMi(member)) return false;

    // Mesajı sil
    await mesaj.delete().catch(() => {});

    // DM uyarısı (kick'ten ÖNCE — atıldıktan sonra ortak sunucu kalmadığı için DM gitmeyebilir)
    await mesaj.author.send(
      `🍯 **${mesaj.guild.name}** sunucusunda bir tuzak kanala mesaj gönderdiğiniz tespit edildi ve sunucudan çıkarıldınız.`
    ).catch(() => {});

    // Kullanıcıyı kickle
    await member.kick('VirBot — Honeypot: Tuzak kanalına mesaj gönderildi').catch(() => {});

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
    return true;

  } catch (hata) {
    console.error('[HONEYPOT] Hata:', hata.message);
  }
  return false;
}

/**
 * Guild ayarlarından kayıtlı honeypot kanalını yükler.
 * @param {string} guildId
 */
async function honeypotYukle(guildId) {
  const ayarlar = await guildGetir(guildId);
  if (ayarlar?.honeypotKanalId) {
    honeypotEkle(ayarlar.honeypotKanalId, guildId);
  }
}

module.exports = { honeypotEkle, honeypotKontrol, honeypotYukle, honeypotKanallari };
