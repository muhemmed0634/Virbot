// ==========================================
//  VirBot — v!atla / /atla Komutu
//  Çalan şarkıyı atlar ve sıradakine geçer
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { muzikAtla, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('atla')
  .setDescription('Çalmakta olan şarkıyı atlayarak sıradakine geçer.');

module.exports = {
  isim: 'atla',
  alternatifler: ['skip', 'gec', 'next'],
  aciklama: 'Çalan şarkıyı atlar.',
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
    if (!durum || !durum.mevcutParca) {
      return mesaj.reply('❌ Şu anda çalan bir müzik yok.');
    }

    const atlanan = durum.mevcutParca?.baslik || 'Mevcut parça';
    muzikAtla(mesaj.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⏭️ Şarkı Atlandı')
      .setDescription(`**${atlanan}** atlandı. Sıradaki parçaya geçiliyor...`)
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
    if (!durum || !durum.mevcutParca) {
      return interaction.reply({ content: '❌ Şu anda çalan bir müzik yok.', ephemeral: true });
    }

    const atlanan = durum.mevcutParca?.baslik || 'Mevcut parça';
    muzikAtla(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('⏭️ Şarkı Atlandı')
      .setDescription(`**${atlanan}** atlandı. Sıradaki parçaya geçiliyor...`)
      .setColor(RENKLER.BILGI)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
