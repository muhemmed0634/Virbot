// ==========================================
//  VirBot — v!unmute Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'unmute',
  aciklama: 'Bir kullanıcının susturmasını kaldırır.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    if (!hedef) return mesaj.reply('❌ Bir kullanıcı etiketleyin. `v!unmute @kullanıcı`');

    await hedef.timeout(null, `${mesaj.author.tag}: Mute kaldırıldı`).catch(e => {
      return mesaj.reply(`❌ Timeout kaldırılamadı: ${e.message}`);
    });

    const embed = new EmbedBuilder()
      .setTitle('🔊 Susturma Kaldırıldı')
      .setDescription(`${hedef}'nın susturması kaldırıldı.`)
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🔊 Unmute — Susturma Kaldırıldı',
      `**Kullanıcı:** ${hedef.user.tag}\n**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
