// ==========================================
//  VirBot — v!honeypot-kur Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { honeypotEkle, honeypotKanallari } = require('../../modules/security/honeypotManager');

module.exports = {
  isim: 'honeypot-kur',
  aciklama: 'Spam/botları yakalamak için tuzak (honeypot) kanal belirler.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();

    if (!kanal) {
      return mesaj.reply('❌ Lütfen bir kanal etiketleyin. Kullanım: `v!honeypot-kur #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { honeypotKanalId: kanal.id });
    honeypotEkle(kanal.id); // Ram'e ekle

    const embed = new EmbedBuilder()
      .setTitle('🍯 Honeypot Sistemi Kuruldu')
      .setDescription(
        `Tuzak kanal başarıyla ${kanal} olarak ayarlandı.\n\n` +
        `⚠️ Lütfen bu kanalı **herkese açık ama görünmez (read messages: false)** yapın.\n` +
        `Bu kanala mesaj gönderen kullanıcılar otomatik olarak sunucudan atılacaktır.`
      )
      .setColor(RENKLER.GUVENLIK)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🍯 Honeypot Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Tuzak Kanal:** ${kanal}`,
      RENKLER.GUVENLIK,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
