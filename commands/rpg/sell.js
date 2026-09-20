// ==========================================
//  VirBot — v!sell Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { sell } = require('../../modules/rpg/rpgManager');

module.exports = {
  isim: 'sell',
  aciklama: 'Hayvanat bahçendeki hayvanları satarsın. (Kullanım: v!sell 1 veya v!sell all)',
  alternatifler: ['sat'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const hedef = args[0]?.toLowerCase();
    
    if (!hedef) {
      return mesaj.reply('❌ Kullanım: `v!sell <HayvanNo|all>`\nNumara için `v!zoo` ile hayvanlarına bak.');
    }

    const sonuc = await sell(mesaj.author.id, mesaj.guild.id, hedef);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }

    const embed = new EmbedBuilder()
      .setTitle('💰 Hayvan(lar) Satıldı!')
      .setColor(RENKLER.RPG);

    if (hedef === 'all' || hedef === 'hepsi') {
      embed.setDescription(`Hayvanat bahçendeki tüm hayvanları satarak **${sonuc.kazanc} Coin** kazandın!\nSatılan hayvan sayısı: ${sonuc.satilan}`);
    } else {
      embed.setDescription(`**${sonuc.hayvanAdi}** hayvanını satarak **${sonuc.kazanc} Coin** kazandın!`);
    }

    await mesaj.reply({ embeds: [embed] });
  },
};
