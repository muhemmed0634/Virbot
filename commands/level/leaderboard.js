// ==========================================
//  VirBot — v!leaderboard Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { liderTabelaGetir } = require('../../modules/data/dataManager');

const slashData = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Sunucunun en yüksek seviyeli üyelerini sıralar.');

async function leaderboardOlustur(guild) {
  const tablo = await liderTabelaGetir(guild.id, 10);
  if (!tablo || tablo.length === 0) {
    return { hata: '❌ Henüz kimse XP kazanmamış!' };
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${guild.name} — XP Liderlik Tablosu`)
    .setColor(RENKLER.LEVEL)
    .setThumbnail(guild.iconURL())
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
  return { embed };
}

module.exports = {
  isim: 'leaderboard',
  aciklama: 'Sunucunun en yüksek seviyeli üyelerini sıralar.',
  alternatifler: ['top', 'siralama'],
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const res = await leaderboardOlustur(mesaj.guild);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.channel.send({ embeds: [res.embed] });
  },

  async slashCalistir(client, interaction) {
    const res = await leaderboardOlustur(interaction.guild);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
