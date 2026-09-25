// ==========================================
//  VirBot — v!slots / /slots Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { slots } = require('../../modules/rpg/rpgManager');

const slashData = new SlashCommandBuilder()
  .setName('slots')
  .setDescription('Slot makinesinde şansını denersin.')
  .addIntegerOption(opt =>
    opt
      .setName('bahis')
      .setDescription('Oynamak istediğin coin miktarı')
      .setMinValue(1)
      .setRequired(true)
  );

async function slotOyna(userId, guildId, bahis) {
  const sonuc = await slots(userId, guildId, bahis);
  if (sonuc.hata) return { hata: sonuc.hata };

  const embed = new EmbedBuilder()
    .setTitle('🎰 Slot Makinesi')
    .setDescription(
      `**[ ${sonuc.s1} | ${sonuc.s2} | ${sonuc.s3} ]**\n\n` +
      `${sonuc.mesaj}\n\n` +
      `• **Bahis:** ${sonuc.bahis} 🪙\n` +
      `• **Kazanılan:** ${sonuc.kazanc} 🪙\n` +
      `• **Yeni Bakiye:** ${sonuc.yeniCoin} 🪙`
    )
    .setColor(sonuc.kazanc > 0 ? RENKLER.BASARI : RENKLER.HATA);

  return { embed };
}

module.exports = {
  isim: 'slots',
  aciklama: 'Slot makinesi oynarsın.',
  alternatifler: ['slot', 'kumar'],
  adminGerekli: false,
  rpgKomutu: true,
  slashData,

  // ─── Prefix Komutu ───────────────────────────────────────
  async calistir(client, mesaj, args) {
    const bahis = parseInt(args[0]);
    if (isNaN(bahis) || bahis <= 0) {
      return mesaj.reply('❌ Ne kadar oynamak istediğini yaz: `v!slots <bahis>`');
    }

    const res = await slotOyna(mesaj.author.id, mesaj.guild.id, bahis);
    if (res.hata) return mesaj.reply(res.hata);
    await mesaj.reply({ embeds: [res.embed] });
  },

  // ─── Slash Komutu ────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const bahis = interaction.options.getInteger('bahis');
    const res = await slotOyna(interaction.user.id, interaction.guildId, bahis);
    if (res.hata) return interaction.reply({ content: res.hata, ephemeral: true });
    await interaction.reply({ embeds: [res.embed] });
  },
};
