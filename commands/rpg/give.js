// ==========================================
//  VirBot — v!give Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { give } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'give',
  aciklama: 'Başka birine coin gönderirsin.',
  alternatifler: ['gonder', 'pay'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const hedef = mesaj.mentions.members.first();
    const miktar = parseInt(args[1]);

    if (!hedef || isNaN(miktar)) {
      return mesaj.reply('❌ Kullanım: `v!give @kullanıcı <miktar>`');
    }
    if (hedef.user.bot) return mesaj.reply('❌ Botlara para gönderemezsin.');
    if (hedef.id === mesaj.author.id) return mesaj.reply('❌ Kendine para gönderemezsin.');

    const sonuc = await give(mesaj.author.id, hedef.id, mesaj.guild.id, miktar);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }

    const embed = new EmbedBuilder()
      .setTitle('💸 Para Transferi')
      .setDescription(`Başarıyla ${hedef} kullanıcısına **${sonuc.miktar} Coin** gönderdin.`)
      .addFields(
        { name: 'Senin Bakiyen', value: `${sonuc.gonderenCoin} Coin`, inline: true },
        { name: 'Alıcının Bakiyesi', value: `${sonuc.hedefCoin} Coin`, inline: true }
      )
      .setColor(RENKLER.BASARI);

    await mesaj.reply({ embeds: [embed] });
  },
};
