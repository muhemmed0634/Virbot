// ==========================================
//  VirBot v2 — Sunucu Backup Yöneticisi
//  Rolleri, kanalları ve ayarları yedekler
// ==========================================
'use strict';

const { backupKaydet, backupGetir } = require('../data/dataManager');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

/**
 * Sunucu yedeği alır ve MongoDB'ye kaydeder.
 * @param {Guild} guild
 * @returns {Object} yedek verisi
 */
async function backupAl(guild) {
  const roller = guild.roles.cache
    .filter(r => !r.managed && r.id !== guild.roles.everyone.id)
    .map(r => ({
      isim  : r.name,
      renk  : r.color,
      izinler: r.permissions.toArray(),
      konumlama: r.position,
      mentionEdilebilir: r.mentionable,
      hoist : r.hoist,
    }))
    .sort((a, b) => b.konumlama - a.konumlama);

  const kategoriler = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildCategory)
    .map(c => ({
      isim  : c.name,
      tür   : 'kategori',
      konum : c.position,
      izinler: c.permissionOverwrites.cache.map(po => ({
        id    : po.id,
        allow : po.allow.toArray(),
        deny  : po.deny.toArray(),
        tip   : po.type,
      })),
    }));

  const kanallar = guild.channels.cache
    .filter(c => c.type !== ChannelType.GuildCategory)
    .map(c => ({
      isim  : c.name,
      tür   : c.type,
      konum : c.position,
      konu  : c.topic || null,
      kategoriIsim: c.parent?.name || null,
      yavasMod    : c.rateLimitPerUser || 0,
      izinler: c.permissionOverwrites.cache.map(po => ({
        id    : po.id,
        allow : po.allow.toArray(),
        deny  : po.deny.toArray(),
        tip   : po.type,
      })),
    }));

  const veri = {
    guildAdi  : guild.name,
    tarih     : new Date(),
    roller,
    kategoriler,
    kanallar,
    uyeSayisi : guild.memberCount,
  };

  await backupKaydet(guild.id, veri);
  return veri;
}

/**
 * Son yedeği getirir.
 * @param {string} guildId
 */
async function backupGetirSon(guildId) {
  return backupGetir(guildId);
}

/**
 * Yedeği geri yükler — sadece rolleri ve kanalları oluşturur.
 * Mevcut roller/kanallar silinmez (güvenlik).
 * @param {Guild} guild
 * @param {Object} yedekVeri
 */
async function backupGeriYukle(guild, yedekVeri) {
  const sonuc = { roller: 0, kanallar: 0, hatalar: [] };

  // Rolleri oluştur
  for (const rol of yedekVeri.roller) {
    const mevcutRol = guild.roles.cache.find(r => r.name === rol.isim);
    if (mevcutRol) continue; // Zaten var

    try {
      await guild.roles.create({
        name        : rol.isim,
        color       : rol.renk,
        hoist       : rol.hoist,
        mentionable : rol.mentionEdilebilir,
        reason      : 'VirBot — Backup geri yükleme',
      });
      sonuc.roller++;
    } catch (hata) {
      sonuc.hatalar.push(`Rol (${rol.isim}): ${hata.message}`);
    }
  }

  // Kategorileri oluştur
  for (const kat of yedekVeri.kategoriler) {
    const mevcut = guild.channels.cache.find(c => c.name === kat.isim && c.type === ChannelType.GuildCategory);
    if (mevcut) continue;

    try {
      await guild.channels.create({
        name  : kat.isim,
        type  : ChannelType.GuildCategory,
        reason: 'VirBot — Backup geri yükleme',
      });
      sonuc.kanallar++;
    } catch (hata) {
      sonuc.hatalar.push(`Kategori (${kat.isim}): ${hata.message}`);
    }
  }

  // Metin kanallarını oluştur
  for (const kanal of yedekVeri.kanallar) {
    if (kanal.tür !== ChannelType.GuildText && kanal.tür !== ChannelType.GuildVoice) continue;
    const mevcut = guild.channels.cache.find(c => c.name === kanal.isim);
    if (mevcut) continue;

    try {
      const ust = kanal.kategoriIsim
        ? guild.channels.cache.find(c => c.name === kanal.kategoriIsim && c.type === ChannelType.GuildCategory)
        : null;

      await guild.channels.create({
        name  : kanal.isim,
        type  : kanal.tür,
        topic : kanal.konu || undefined,
        parent: ust?.id || undefined,
        reason: 'VirBot — Backup geri yükleme',
      });
      sonuc.kanallar++;
    } catch (hata) {
      sonuc.hatalar.push(`Kanal (${kanal.isim}): ${hata.message}`);
    }
  }

  return sonuc;
}

module.exports = { backupAl, backupGetirSon, backupGeriYukle };
