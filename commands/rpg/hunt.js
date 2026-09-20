// ==========================================
//  VirBot — v!hunt Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { hunt, nadirRenk, nadirYildiz } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'hunt',
  aciklama: 'Ormana gidip hayvan avlar. (30sn bekleme süresi)',
  alternatifler: ['av', 'avlan'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const sonuc = await hunt(mesaj.author.id, mesaj.guild.id);

    if (sonuc.hata) {
      return mesaj.reply(`❌ ${sonuc.hata}`);
    }

    const { hayvan, coinKazanc, ekipman, toplamZoo } = sonuc;

    const embed = new EmbedBuilder()
      .setTitle(`🏹 ${mesaj.author.username} Avlandı!`)
      .setDescription(
        `Ormanın derinliklerinde dolaşırken karşına **${hayvan.isim}** çıktı!\n` +
        `Başarıyla yakalayıp hayvanat bahçene ekledin.\n\n` +
        `**Nadirliği:** ${nadirYildiz(hayvan.nadir)} ${hayvan.nadir}\n` +
        `**Kazancın:** 🪙 ${coinKazanc} Coin\n` +
        `**Zoo Toplamı:** ${toplamZoo} hayvan`
      )
      .setColor(nadirRenk(hayvan.nadir));

    if (ekipman) {
      embed.addFields({
        name: '🎉 Sürpriz Eşya Düşürdün!',
        value: `**${ekipman.isim}** (Güç: +${ekipman.guc})\nBu eşya otomatik olarak kuşanılarak gücüne eklendi!`,
      });
    }

    await mesaj.reply({ embeds: [embed] });
  },
};
