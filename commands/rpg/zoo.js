// ==========================================
//  VirBot — v!zoo / /zoo Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { zoo, nadirYildiz } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('zoo')
  .setDescription('Hayvanat bahçeni, ekipmanlarını ve coin bakiyeni gösterir.');

async function zooEmbedOlustur(user, guildId) {
  const veri = await zoo(user.id, guildId);

  const embed = new EmbedBuilder()
    .setTitle(`🦁 ${user.username}'ın Hayvanat Bahçesi`)
    .setColor(RENKLER.RPG)
    .setThumbnail(user.displayAvatarURL());

  let hayvanListesi = '';
  if (veri.zoo.length === 0) {
    hayvanListesi = 'Hayvanat bahçen tamamen boş. `/hunt` yazarak ava çık!';
  } else {
    veri.zoo.forEach((h, i) => {
      hayvanListesi += `**${i + 1}.** ${h.isim} — ${nadirYildiz(h.nadir)} (${h.nadir})\n`;
    });
  }

  embed.addFields(
    { name: '🐾 Hayvanlar', value: hayvanListesi.slice(0, 1024) },
    { name: '🪙 Bakiye', value: `**${veri.coins.toLocaleString('tr-TR')}** Coin`, inline: true },
    { name: '🗡️ Silah', value: veri.silah ? `${veri.silah.isim} (+${veri.silah.guc})` : 'Yok (`/market`)', inline: true },
    { name: '🛡️ Zırh', value: veri.zirh ? `${veri.zirh.isim} (+${veri.zirh.guc})` : 'Yok (`/market`)', inline: true },
  );

  return embed;
}

module.exports = {
  isim: 'zoo',
  aciklama: 'Hayvanat bahçeni ve envanterini gösterir.',
  alternatifler: ['envanter', 'inv'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const embed = await zooEmbedOlustur(mesaj.author, mesaj.guild.id);
    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const embed = await zooEmbedOlustur(interaction.user, interaction.guildId);
    await interaction.reply({ embeds: [embed] });
  },
};
