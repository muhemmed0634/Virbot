// ==========================================
//  VirBot — v!sell / /sell Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { sell } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('sell')
  .setDescription('Hayvanat bahçendeki hayvanları satıp coin kazanırsın.')
  .addStringOption(opt =>
    opt
      .setName('hedef')
      .setDescription('Satılacak hayvan numarası veya "hepsi" (Örn: 1, 2, hepsi)')
      .setRequired(true)
  );

async function hayvanSat(userId, guildId, hedef) {
  const sonuc = await sell(userId, guildId, hedef.toLowerCase());
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle('💰 Hayvan(lar) Satıldı!')
    .setColor(RENKLER.RPG);

  if (hedef === 'all' || hedef === 'hepsi') {
    embed.setDescription(`Hayvanat bahçendeki tüm hayvanları satarak **${sonuc.kazanc} 🪙 Coin** kazandın!\nSatılan hayvan sayısı: **${sonuc.satilan}**`);
  } else {
    embed.setDescription(`**${sonuc.hayvanAdi}** satıldı ve **${sonuc.kazanc} 🪙 Coin** kazandın!`);
  }

  return { embed };
}

module.exports = {
  isim: 'sell',
  aciklama: 'Hayvanat bahçendeki hayvanları satarsın. (Kullanım: v!sell 1 veya v!sell hepsi)',
  alternatifler: ['sat'],
  adminGerekli: false,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const hedef = args[0]?.toLowerCase();
    if (!hedef) {
      return mesaj.reply('❌ Kullanım: `v!sell <HayvanNo|hepsi>`\nNumara için `v!zoo` ile hayvanlarına bak.');
    }

    const res = await hayvanSat(mesaj.author.id, mesaj.guild.id, hedef);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const hedef = interaction.options.getString('hedef').trim();
    const res = await hayvanSat(interaction.user.id, interaction.guildId, hedef);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
