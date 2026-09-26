// ==========================================
//  VirBot v5 — v!ses / /ses Komutu
//  Müzik ses seviyesini ayarlar
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { muzikSes, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('ses')
  .setDescription('🔊 Müzik ses seviyesini ayarlar (0-100).')
  .addIntegerOption(opt =>
    opt
      .setName('seviye')
      .setDescription('Ses seviyesi (0 = sessiz, 100 = tam ses)')
      .setMinValue(0)
      .setMaxValue(100)
      .setRequired(true)
  );

module.exports = {
  isim: 'ses',
  alternatifler: ['volume', 'vol'],
  aciklama: '🔊 Müzik ses seviyesini ayarlar.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj, args) {
    if (!mesaj.member?.voice?.channel) {
      return mesaj.reply('❌ Bir ses kanalında olmanız gerekiyor!');
    }
    const durum = kurukuGetir(mesaj.guild.id);
    if (!durum) return mesaj.reply('❌ Şu an çalan bir müzik yok.');

    const seviye = parseInt(args[0]);
    if (isNaN(seviye) || seviye < 0 || seviye > 100) {
      return mesaj.reply('❌ Kullanım: `v!ses <0-100>`  Örnek: `v!ses 50`');
    }

    muzikSes(mesaj.guild.id, seviye);

    const emoji = seviye === 0 ? '🔇' : seviye < 33 ? '🔈' : seviye < 66 ? '🔉' : '🔊';
    const bar   = '█'.repeat(Math.floor(seviye / 10)) + '░'.repeat(10 - Math.floor(seviye / 10));

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Ses Seviyesi Ayarlandı`)
      .setDescription(`\`[${bar}]\` **${seviye}%**`)
      .setColor(RENKLER.BILGI)
      .setTimestamp();
    await mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    if (!interaction.member?.voice?.channel) {
      return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
    }
    const durum = kurukuGetir(interaction.guildId);
    if (!durum) return interaction.reply({ content: '❌ Şu an çalan bir müzik yok.', ephemeral: true });

    const seviye = interaction.options.getInteger('seviye');
    muzikSes(interaction.guildId, seviye);

    const emoji = seviye === 0 ? '🔇' : seviye < 33 ? '🔈' : seviye < 66 ? '🔉' : '🔊';
    const bar   = '█'.repeat(Math.floor(seviye / 10)) + '░'.repeat(10 - Math.floor(seviye / 10));

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Ses Seviyesi Ayarlandı`)
      .setDescription(`\`[${bar}]\` **${seviye}%**`)
      .setColor(RENKLER.BILGI)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
