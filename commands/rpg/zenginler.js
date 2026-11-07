// ==========================================
//  VirBot — v!zenginler / /zenginler Komutu
//  Sunucunun en zengin üyeleri (coin sıralaması)
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { zenginlerGetir, kullaniciGetir } = require('../../modules/data/dataManager');
const User = require('../../database/models/User');

const slashData = new SlashCommandBuilder()
  .setName('zenginler')
  .setDescription('Sunucunun en zengin 10 üyesini (coin) gösterir.');

async function zenginlerEmbed(guild, userId) {
  const tablo = await zenginlerGetir(guild.id, 10);
  if (!tablo.length) return { hata: '❌ Henüz kimsenin coini yok! `/daily` ile başla.' };

  const madalyalar = ['🥇', '🥈', '🥉'];
  const liste = tablo
    .map((u, i) => `**${i + 1}.** ${madalyalar[i] || '💰'} <@${u.userId}> — **${u.coins.toLocaleString('tr-TR')}** 🪙`)
    .join('\n');

  // Komutu kullananın sırası
  const ben = await kullaniciGetir(userId, guild.id);
  const benimSiram = (await User.countDocuments({ guildId: guild.id, coins: { $gt: ben.coins || 0 } })) + 1;

  return {
    embed: new EmbedBuilder()
      .setTitle(`💰 ${guild.name} — En Zenginler`)
      .setDescription(liste)
      .setColor(RENKLER.RPG)
      .setThumbnail(guild.iconURL())
      .setFooter({ text: `Senin sıran: #${benimSiram} • Bakiyen: ${(ben.coins || 0).toLocaleString('tr-TR')} 🪙` })
      .setTimestamp(),
  };
}

module.exports = {
  isim: 'zenginler',
  aciklama: 'Sunucunun en zengin üyelerini sıralar.',
  alternatifler: ['zengin', 'topcoin', 'coin-top', 'richest'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  async calistir(client, mesaj) {
    const res = await zenginlerEmbed(mesaj.guild, mesaj.author.id);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed], allowedMentions: { parse: [] } });
  },

  async slashCalistir(client, interaction) {
    const res = await zenginlerEmbed(interaction.guild, interaction.user.id);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed], allowedMentions: { parse: [] } });
  },
};
