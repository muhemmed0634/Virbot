// ==========================================
//  VirBot — v!zoo Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { zoo, nadirYildiz } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'zoo',
  aciklama: 'Hayvanat bahçeni ve envanterini gösterir.',
  alternatifler: ['envanter', 'inv'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const veri = await zoo(mesaj.author.id, mesaj.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(`🦁 ${mesaj.author.username}'ın Hayvanat Bahçesi`)
      .setColor(RENKLER.RPG)
      .setThumbnail(mesaj.author.displayAvatarURL());

    let hayvanListesi = '';
    if (veri.zoo.length === 0) {
      hayvanListesi = 'Hayvanat bahçen tamamen boş. `v!hunt` yazarak ava çık!';
    } else {
      veri.zoo.forEach((h, i) => {
        hayvanListesi += `**${i + 1}.** ${h.isim} — ${nadirYildiz(h.nadir)} (${h.nadir})\n`;
      });
    }

    embed.addFields(
      { name: '🐾 Hayvanlar', value: hayvanListesi.slice(0, 1024) },
      { name: '🪙 Bakiye', value: `**${veri.coins.toLocaleString('tr-TR')}** Coin`, inline: true },
      { name: '🗡️ Silah', value: veri.silah ? `${veri.silah.isim} (+${veri.silah.guc})` : 'Yok', inline: true },
      { name: '🛡️ Zırh', value: veri.zirh ? `${veri.zirh.isim} (+${veri.zirh.guc})` : 'Yok', inline: true },
    );

    await mesaj.reply({ embeds: [embed] });
  },
};
