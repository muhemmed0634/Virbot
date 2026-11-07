// ==========================================
//  VirBot v6 — /auto-rol / v!auto-rol Komutu
//  Sunucuya katılan herkese otomatik rol verir
// ==========================================
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { guildGuncelle } = require('../../modules/data/dataManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('auto-rol')
  .setDescription('Sunucuya katılanlara otomatik verilecek rolü ayarlar.')
  .addRoleOption(opt =>
    opt.setName('rol').setDescription('Otomatik verilecek rol (boş bırakırsan kaldırır)').setRequired(false)
  );

async function autoRolAyarla(guild, rol) {
  const rolId = rol ? rol.id : null;
  await guildGuncelle(guild.id, { autoRolId: rolId });
  return rolId;
}

module.exports = {
  isim: 'auto-rol',
  aciklama: 'Otomatik rol ayarlar.',
  alternatifler: ['autorole'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const rol = mesaj.mentions.roles?.first();
    if (!rol && args[0]) return mesaj.reply('❌ Geçerli bir rol etiketle! `v!auto-rol @Rol`');

    const rolId = await autoRolAyarla(mesaj.guild, rol);

    const embed = new EmbedBuilder()
      .setTitle('✅ Auto-Rol Ayarlandı')
      .setDescription(rolId
        ? `Sunucuya katılan herkese <@&${rolId}> rolü otomatik verilecek.`
        : '❌ Auto-Rol kaldırıldı.')
      .setColor(RENKLER.BASARI)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const rol = interaction.options.getRole('rol');
    const rolId = await autoRolAyarla(interaction.guild, rol);

    const embed = new EmbedBuilder()
      .setTitle('✅ Auto-Rol Ayarlandı')
      .setDescription(rolId
        ? `Sunucuya katılan herkese <@&${rolId}> rolü otomatik verilecek.`
        : '❌ Auto-Rol kaldırıldı.')
      .setColor(RENKLER.BASARI)
      .setTimestamp()
      .setFooter({ text: 'VirBot v6' });

    await interaction.reply({ embeds: [embed] });
  },
};
