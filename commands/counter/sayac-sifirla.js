// ==========================================
//  VirBot — v!sayac-sifirla Komutu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { logEmbed, logGonder } = require('../../modules/logger/logManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('sayac-sifirla')
  .setDescription('Sayaç sistemini kapatır ve sıfırlar.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

module.exports = {
  isim: 'sayac-sifirla',
  aciklama: 'Sayaç sistemini kapatır ve sıfırlar.',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    await guildGuncelle(mesaj.guild.id, {
      sayacKanalId: null,
      sayacHedef: 0
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Sayaç Sıfırlandı')
      .setDescription('Sayaç sistemi başarıyla kapatıldı ve veriler temizlendi.')
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await mesaj.channel.send({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Sayaç Kapatıldı',
      `**Yetkili:** ${mesaj.author.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, mesaj.guild.id, logEmb);
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    await guildGuncelle(interaction.guild.id, {
      sayacKanalId: null,
      sayacHedef: 0
    });

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Sayaç Sıfırlandı')
      .setDescription('Sayaç sistemi başarıyla kapatıldı ve veriler temizlendi.')
      .setColor(RENKLER.BASARI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logEmb = logEmbed(
      '🗑️ Sayaç Kapatıldı (Slash)',
      `**Yetkili:** ${interaction.user.tag}`,
      RENKLER.HATA,
    );
    await logGonder(client, interaction.guild.id, logEmb);
  },
};
