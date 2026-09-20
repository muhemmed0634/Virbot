// ==========================================
//  VirBot — v!cash Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kullaniciGetir } = require('../../modules/data/dataManager');

module.exports = {
  isim: 'cash',
  aciklama: 'Coin bakiyeni gösterir.',
  alternatifler: ['para', 'bakiye', 'coin'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first() || mesaj.member;
    if (hedef.user.bot) return;

    const kullanici = await kullaniciGetir(hedef.id, mesaj.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(`💳 Bakiye Sorgusu`)
      .setDescription(`**${hedef.user.username}** adlı kullanıcının bakiyesi:`)
      .addFields({ name: '🪙 Coin', value: `${kullanici.coins.toLocaleString('tr-TR')} Coin`, inline: true })
      .setColor(RENKLER.RPG)
      .setThumbnail(hedef.user.displayAvatarURL());

    await mesaj.reply({ embeds: [embed] });
  },
};
