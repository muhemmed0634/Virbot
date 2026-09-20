// ==========================================
//  VirBot — v!ai-kanal Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'ai-kanal',
  aciklama: 'Yapay zeka (Gemini AI) sohbet kanalını ayarlar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first();
    
    if (!kanal) {
      return mesaj.reply('❌ Lütfen bir kanal etiketleyin. `v!ai-kanal #kanal`');
    }

    await guildGuncelle(mesaj.guild.id, { aiKanalId: kanal.id });

    const embed = new EmbedBuilder()
      .setTitle('🤖 Yapay Zeka Kanalı Ayarlandı')
      .setDescription(`Artık ${kanal} kanalına atılan tüm mesajlar **Gemini AI** tarafından yanıtlanacak!`)
      .setColor(RENKLER.AI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🤖 AI Kanalı Ayarlandı',
      `**Yetkili:** ${mesaj.author.tag}\n**Kanal:** ${kanal}`,
      RENKLER.AI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
