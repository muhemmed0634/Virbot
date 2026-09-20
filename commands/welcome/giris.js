// ==========================================
//  VirBot — v!giris Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'giris',
  aciklama: 'Giriş-çıkış bildirim kanalını ayarlar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();
    
    if (!kanal) {
      return mesaj.reply('❌ Lütfen bir kanal etiketleyin. `v!giris #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { girisKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('🚪 Giriş-Çıkış Sistemi Ayarlandı')
      .setDescription(`Yeni üyeler için resimli (Canvas) karşılama mesajları artık ${kanal} kanalına gönderilecek.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🚪 Giriş Kanalı Ayarlandı',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
