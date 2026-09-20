// ==========================================
//  VirBot — v!level-sifirla Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'level-sifirla',
  aciklama: 'Belirtilen kullanıcının seviye verilerini sıfırlar.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    
    if (!hedef) {
      return mesaj.reply('❌ Lütfen bir kullanıcı etiketleyin. `v!level-sifirla @kullanıcı`');
    }

    await kullaniciGuncelle(hedef.id, mesaj.guild.id, {
      xp: 0,
      level: 0,
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Seviye Sıfırlandı')
      .setDescription(`${hedef} kullanıcısının XP ve seviyesi sıfırlandı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Seviye Sıfırlandı',
      `**Yetkili:** ${mesaj.author.tag}\n**Kullanıcı:** ${hedef.user.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
