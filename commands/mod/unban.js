// ==========================================
//  VirBot — v!unban Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');

module.exports = {
  isim: 'unban',
  aciklama: 'Bir kullanıcının yasağını kaldırır.',
  adminGerekli: true,

  async calistir(client, mesaj, args) {
    const userId = args[0];
    if (!userId) return mesaj.reply('❌ Kullanıcı ID girin. `v!unban <userId> [sebep]`');

    const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await mesaj.guild.members.unban(userId, `${mesaj.author.tag}: ${sebep}`).catch(() => {
      return mesaj.reply('❌ Kullanıcı yasaklı değil ya da ID hatalı.');
    });

    const embed = new EmbedBuilder()
      .setTitle('✅ Yasak Kaldırıldı')
      .addFields(
        { name: 'Kullanıcı ID', value: userId, inline: true },
        { name: 'Yetkili', value: mesaj.author.tag, inline: true },
        { name: 'Sebep', value: sebep },
      )
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '✅ Unban — Yasak Kaldırıldı',
      `**Kullanıcı ID:** ${userId}\n**Yetkili:** ${mesaj.author.tag}\n**Sebep:** ${sebep}`,
      RENKLER.BASARI,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },
};
