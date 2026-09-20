// ==========================================
//  VirBot — v!leaderboard Komutu
// ==========================================
'use strict';

const { EmbedBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { liderTabelaGetir } = require('../../modules/data/dataManager');

module.exports = {
  isim: 'leaderboard',
  aciklama: 'Sunucunun en yüksek seviyeli üyelerini sıralar.',
  alternatifler: ['top', 'siralama'],
  adminGerekli: false,

  async calistir(client, mesaj, args) {
    const tablo = await liderTabelaGetir(mesaj.guild.id, 10);
    
    if (!tablo || tablo.length === 0) {
      return mesaj.reply('❌ Henüz kimse XP kazanmamış!');
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${mesaj.guild.name} — XP Liderlik Tablosu`)
      .setColor(RENKLER.LEVEL)
      .setThumbnail(mesaj.guild.iconURL())
      .setTimestamp();

    let liste = '';
    for (let i = 0; i < tablo.length; i++) {
      const u = tablo[i];
      let madalya = '🏅';
      if (i === 0) madalya = '🥇';
      if (i === 1) madalya = '🥈';
      if (i === 2) madalya = '🥉';

      liste += `**${i + 1}.** ${madalya} <@${u.userId}> — **Lvl ${u.level}** (${u.xp.toLocaleString('tr-TR')} XP)\n`;
    }

    embed.setDescription(liste);
    await mesaj.channel.send({ embeds: [embed] });
  },
};
