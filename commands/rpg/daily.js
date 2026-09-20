// ==========================================
//  VirBot — v!daily Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { daily } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'daily',
  aciklama: 'Günlük ödülünü alırsın.',
  alternatifler: ['gunluk'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const sonuc = await daily(mesaj.author.id, mesaj.guild.id);

    if (sonuc.hata) {
      return mesaj.reply(`❌ ${sonuc.hata}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('🎁 Günlük Ödül')
      .setDescription(`Günlük ödülünü başarıyla aldın!\n\nKazanılan: **${sonuc.odul} Coin**\nYeni Bakiye: **${sonuc.yeniMiktar} Coin**`)
      .setColor(RENKLER.BASARI);

    await mesaj.reply({ embeds: [embed] });
  },
};
