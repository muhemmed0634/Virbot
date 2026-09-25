// ==========================================
//  VirBot — v!reroll Komutu (Beta)
//  Çekiliş için yeni kazanan seçer
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { yenidenCek } = require('../../modules/giveaway/giveawayManager');
const { yetkiliMi, yetkiRed } = require('../../modules/permissions/permCheck');

const slashData = new SlashCommandBuilder()
  .setName('reroll')
  .setDescription('Belirtilen çekiliş için yeni kazanan seçer.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(opt =>
    opt
      .setName('mesaj-id')
      .setDescription('Çekiliş mesajının ID\'si')
      .setRequired(true)
  );

module.exports = {
  isim: 'reroll',
  aciklama: 'Belirtilen çekiliş için yeni kazanan seçer.',
  alternatifler: ['yenidencek', 'cekilis-yenile', 'giveaway-reroll'],
  kullanim: 'v!reroll [mesaj_id]',
  adminGerekli: true,
  slashData,

  async calistir(client, mesaj, args) {
    const mesajId = args[0];

    if (!mesajId) {
      const embed = new EmbedBuilder()
        .setDescription('❌ Lütfen bir çekiliş mesaj ID\'si girin!\n**Kullanım:** `v!reroll [mesaj_id]`')
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }

    const sonuc = await yenidenCek(client, mesajId, mesaj.guild.id);

    if (!sonuc.basari) {
      const embed = new EmbedBuilder()
        .setDescription(`❌ ${sonuc.mesaj}`)
        .setColor(RENKLER.HATA);
      return mesaj.reply({ embeds: [embed] });
    }
  },

  async slashCalistir(client, interaction) {
    if (!yetkiliMi(interaction.member)) {
      return yetkiRed(interaction);
    }

    const mesajId = interaction.options.getString('mesaj-id');
    const sonuc = await yenidenCek(client, mesajId, interaction.guild.id);

    if (!sonuc.basari) {
      return interaction.reply({ content: `❌ ${sonuc.mesaj}`, ephemeral: true });
    }

    await interaction.reply({ content: `✅ Çekiliş için yeni kazanan(lar) belirlendi!`, ephemeral: true });
  },
};
