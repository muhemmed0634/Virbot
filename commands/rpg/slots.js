// ==========================================
//  VirBot — v!slots Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { slots } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'slots',
  aciklama: 'Slot makinesi oynarsın.',
  alternatifler: ['slot', 'kumar'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);

    if (isNaN(bahis) || bahis <= 0) {
      return mesaj.reply('❌ Ne kadar oynamak istediğini yaz: `v!slots <bahis>`');
    }

    const sonuc = await slots(mesaj.author.id, mesaj.guild.id, bahis);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Makinesi')
      .setDescription(
        `**[ ${sonuc.s1} | ${sonuc.s2} | ${sonuc.s3} ]**\n\n` +
        `${sonuc.mesaj}\n\n` +
        `**Bahis:** ${sonuc.bahis} Coin\n` +
        `**Kazanılan:** ${sonuc.kazanc} Coin\n` +
        `**Yeni Bakiye:** ${sonuc.yeniCoin} Coin`
      )
      .setColor(sonuc.kazanc > 0 ? RENKLER.BASARI : RENKLER.HATA);

    await mesaj.reply({ embeds: [embed] });
  },
};
