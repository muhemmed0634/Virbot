// ==========================================
//  VirBot v5 — v!loop / /loop Komutu
//  Mevcut kuyruğu tekrarla
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { muzikLoop, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('🔁 Kuyruk döngü modunu açar/kapatır.');

module.exports = {
  isim: 'loop',
  alternatifler: ['tekrar', 'repeat'],
  aciklama: '🔁 Loop modunu açar/kapatır.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    if (!mesaj.member?.voice?.channel) {
      return mesaj.reply('❌ Bir ses kanalında olmanız gerekiyor!');
    }
    const durum = kurukuGetir(mesaj.guild.id);
    if (!durum) return mesaj.reply('❌ Şu an çalan bir müzik yok.');

    const yeniDurum = muzikLoop(mesaj.guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`🔁 Loop Modu: ${yeniDurum ? '✅ Açıldı' : '❌ Kapatıldı'}`)
      .setDescription(yeniDurum ? 'Kuyruk sürekli tekrarlanacak.' : 'Kuyruk tek seferlik oynanacak.')
      .setColor(yeniDurum ? RENKLER.BASARI : RENKLER.BILGI)
      .setTimestamp();
    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    if (!interaction.member?.voice?.channel) {
      return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
    }
    const durum = kurukuGetir(interaction.guildId);
    if (!durum) return interaction.reply({ content: '❌ Şu an çalan bir müzik yok.', ephemeral: true });

    const yeniDurum = muzikLoop(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle(`🔁 Loop Modu: ${yeniDurum ? '✅ Açıldı' : '❌ Kapatıldı'}`)
      .setDescription(yeniDurum ? 'Kuyruk sürekli tekrarlanacak.' : 'Kuyruk tek seferlik oynanacak.')
      .setColor(yeniDurum ? RENKLER.BASARI : RENKLER.BILGI)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
