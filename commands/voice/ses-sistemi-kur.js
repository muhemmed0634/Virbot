// ==========================================
//  VirBot — v!ses-sistemi-kur Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'ses-sistemi-kur',
  aciklama: 'Geçici (Join-to-Create) ses kanalı sistemini kurar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const kanal = mesaj.mentions.channels.first() || mesaj.guild.channels.cache.get(args[0]);
    
    if (!kanal || kanal.type !== 2) { // 2 = GuildVoice
      return mesaj.reply('❌ Lütfen bir **Ses Kanalı** etiketleyin veya ID girin. `v!ses-sistemi-kur <KanalID>`');
    }

    await guildGuncelle(mesaj.guild.id, {
      sesKategoriId: kanal.parentId,
      sesOlusturKanalId: kanal.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🔊 Ses Sistemi Kuruldu')
      .setDescription(
        `Geçici ses kanalı sistemi başarıyla ayarlandı!\n\n` +
        `Kullanıcılar **${kanal.name}** kanalına girdiklerinde, ` +
        `otomatik olarak onlara özel bir ses kanalı açılacak.`
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔊 Ses Sistemi Kuruldu',
      `**Yetkili:** ${mesaj.author.tag}\n**Oluşturucu Kanal:** ${kanal.name}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
