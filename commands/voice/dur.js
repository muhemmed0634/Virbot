// ==========================================
//  VirBot — v!dur / /dur Komutu
//  Müziği durdurur ve kanaldan ayrılır
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { muzikDurdur, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('dur')
  .setDescription('Çalan müziği durdurur, kuyruğu temizler ve ses kanalından ayrılır.');

module.exports = {
  isim: 'dur',
  alternatifler: ['stop', 'ayril', 'kapat'],
  aciklama: 'Müziği durdurur ve ses kanalından ayrılır.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  // ─── Prefix Komutu ─────────────────────────────────────────
  async calistir(client, mesaj, args) {
    const sesKanali = mesaj.member?.voice?.channel;
    if (!sesKanali) {
      return mesaj.reply('❌ Bir ses kanalında olmanız gerekiyor!');
    }

    const durum = kurukuGetir(mesaj.guild.id);
    if (!durum) {
      return mesaj.reply('❌ Şu anda çalan bir müzik yok.');
    }

    muzikDurdur(mesaj.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⏹️ Müzik Durduruldu')
      .setDescription('Müzik durduruldu, kuyruk temizlendi ve ses kanalından ayrıldım.')
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu ──────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const sesKanali = interaction.member?.voice?.channel;
    if (!sesKanali) {
      return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
    }

    const durum = kurukuGetir(interaction.guild.id);
    if (!durum) {
      return interaction.reply({ content: '❌ Şu anda çalan bir müzik yok.', ephemeral: true });
    }

    muzikDurdur(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⏹️ Müzik Durduruldu')
      .setDescription('Müzik durduruldu, kuyruk temizlendi ve ses kanalından ayrıldım.')
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
