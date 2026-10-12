// ==========================================
//  VirBot v6 — /jail-kur / v!jail-kur Komutu
//  CEZALI rolü + jail kanalı oluşturur
// ==========================================
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { jailKur } = require('../../modules/security/jailManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('jail-kur')
  .setDescription('Jail sistemini kurar: CEZALI rolü ve jail kanalı oluşturur.');

module.exports = {
  isim: 'jail-kur',
  aciklama: 'Jail sistemini kurar.',
  alternatifler: [],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const msg = await mesaj.reply('⏳ Jail sistemi kuruluyor...');
    try {
      const { cezaliRol, jailKanal } = await jailKur(mesaj.guild, client);
      const embed = new EmbedBuilder()
        .setTitle('✅ Jail Sistemi Kuruldu')
        .setDescription(
          `**CEZALI Rolü:** ${cezaliRol}\n` +
          `**Jail Kanalı:** ${jailKanal}\n\n` +
          `> Artık \`v!jail-at @kullanici\` komutuyla kullanıcıları hapise atabilirsiniz.`
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp()
        .setFooter({ text: 'VirBot v6' });
      await msg.edit({ content: null, embeds: [embed] });
    } catch (err) {
      await msg.edit(`❌ Jail sistemi kurulurken hata oluştu: ${err.message}`);
    }
  },

  async slashCalistir(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const { cezaliRol, jailKanal } = await jailKur(interaction.guild, client);
      const embed = new EmbedBuilder()
        .setTitle('✅ Jail Sistemi Kuruldu')
        .setDescription(
          `**CEZALI Rolü:** ${cezaliRol}\n` +
          `**Jail Kanalı:** ${jailKanal}\n\n` +
          `> Artık \`/jail-at\` komutuyla kullanıcıları hapise atabilirsiniz.`
        )
        .setColor(RENKLER.BASARI)
        .setTimestamp()
        .setFooter({ text: 'VirBot v6' });
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Jail sistemi kurulurken hata oluştu: ${err.message}`);
    }
  },
};
