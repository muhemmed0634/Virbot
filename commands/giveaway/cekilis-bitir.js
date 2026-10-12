// ==========================================
//  VirBot v6 — v!cekilis-bitir / /cekilis-bitir
//  Devam eden çekilişi anında sonlandırır
// ==========================================
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { cekilisiBitir } = require('../../modules/giveaway/giveawayManager');
const { RENKLER } = require('../../config/config');

const slashData = new SlashCommandBuilder()
  .setName('cekilis-bitir')
  .setDescription('Devam eden çekilişi erken sonlandırır.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(opt =>
    opt.setName('mesaj-id').setDescription('Çekiliş mesajının ID\'si').setRequired(true)
  );

module.exports = {
  isim: 'cekilis-bitir',
  aciklama: 'Devam eden çekilişi sonlandırır. Örnek: v!cekilis-bitir <mesajId>',
  alternatifler: ['cekilisbitir', 'giveaway-end'],
  adminGerekli: true,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    const mesajId = args[0];
    if (!mesajId) {
      return mesaj.reply('❌ Lütfen sonlandırılacak çekiliş mesaj ID\'sini girin! `v!cekilis-bitir <mesajId>`');
    }

    try {
      await cekilisiBitir(client, mesajId);
      const embed = new EmbedBuilder()
        .setTitle('✅ Çekiliş Sonlandırıldı')
        .setDescription(`\`${mesajId}\` ID'li çekiliş başarıyla sonlandırıldı ve kazananlar belirlendi.`)
        .setColor(RENKLER.BASARI)
        .setFooter({ text: 'VirBot v6 Çekiliş Sistemi' });
      await mesaj.reply({ embeds: [embed] });
    } catch (err) {
      await mesaj.reply(`❌ Çekiliş sonlandırılamadı: ${err.message}`);
    }
  },

  async slashCalistir(client, interaction) {
    const mesajId = interaction.options.getString('mesaj-id');
    await interaction.deferReply({ ephemeral: true });

    try {
      await cekilisiBitir(client, mesajId);
      const embed = new EmbedBuilder()
        .setTitle('✅ Çekiliş Sonlandırıldı')
        .setDescription(`\`${mesajId}\` ID'li çekiliş başarıyla sonlandırıldı ve kazananlar belirlendi.`)
        .setColor(RENKLER.BASARI)
        .setFooter({ text: 'VirBot v6 Çekiliş Sistemi' });
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Çekiliş sonlandırılamadı: ${err.message}`);
    }
  },
};
