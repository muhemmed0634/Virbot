// ==========================================
//  VirBot v5 — v!temizle-kuyruk / /temizle-kuyruk Komutu
//  Müzik Kuyruğunu Temizler (Çalan parçayı durdurmaz)
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { muzikKuyrukTemizle, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('kuyruk-temizle')
  .setDescription('🗑️ Müzik kuyruğundaki tüm parçaları temizler.');

module.exports = {
  isim: 'kuyruk-temizle',
  alternatifler: ['temizle-kuyruk', 'clearqueue', 'clearkuyruk'],
  aciklama: 'Müzik kuyruğunu boşaltır.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const sesKanal = mesaj.member?.voice?.channel;
    if (!sesKanal) {
      return mesaj.reply('❌ Bir ses kanalında olmanız gerekiyor!');
    }

    const sayi = muzikKuyrukTemizle(mesaj.guild.id);
    if (sayi === 0) {
      return mesaj.reply('ℹ️ Zaten kuyrukta bekleyen parça yok.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Kuyruk Temizlendi')
      .setDescription(`Kuyruktaki **${sayi}** parça listeden çıkarıldı. Şu an çalan parça devam ediyor.`)
      .setColor(0xED4245)
      .setTimestamp();

    return mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const sesKanal = interaction.member?.voice?.channel;
    if (!sesKanal) {
      return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
    }

    const sayi = muzikKuyrukTemizle(interaction.guildId);
    if (sayi === 0) {
      return interaction.reply({ content: 'ℹ️ Zaten kuyrukta bekleyen parça yok.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Kuyruk Temizlendi')
      .setDescription(`Kuyruktaki **${sayi}** parça listeden çıkarıldı. Şu an çalan parça devam ediyor.`)
      .setColor(0xED4245)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
