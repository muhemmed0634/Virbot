// ==========================================
//  VirBot v5 — v!karistir / /karistir Komutu
//  Müzik Kuyruğunu Rastgele Karıştırır
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { muzikKaristir, kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('karistir')
  .setDescription('🔀 Mevcut müzik kuyruğunu rastgele karıştırır.');

module.exports = {
  isim: 'karistir',
  alternatifler: ['shuffle', 'mix'],
  aciklama: 'Müzik kuyruğunu karıştırır.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const sesKanal = mesaj.member?.voice?.channel;
    if (!sesKanal) {
      return mesaj.reply('❌ Bir ses kanalında olmanız gerekiyor!');
    }

    const sayi = muzikKaristir(mesaj.guild.id);
    if (sayi <= 1) {
      return mesaj.reply('❌ Kuyrukta karıştırılacak en az 2 parça olmalıdır!');
    }

    const embed = new EmbedBuilder()
      .setTitle('🔀 Kuyruk Karıştırıldı')
      .setDescription(`Kuyruktaki **${sayi}** parça rastgele sıralandı!`)
      .setColor(0x5865F2)
      .setTimestamp();

    return mesaj.reply({ embeds: [embed] });
  },

  async slashCalistir(client, interaction) {
    const sesKanal = interaction.member?.voice?.channel;
    if (!sesKanal) {
      return interaction.reply({ content: '❌ Bir ses kanalında olmanız gerekiyor!', ephemeral: true });
    }

    const sayi = muzikKaristir(interaction.guildId);
    if (sayi <= 1) {
      return interaction.reply({ content: '❌ Kuyrukta karıştırılacak en az 2 parça olmalıdır!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔀 Kuyruk Karıştırıldı')
      .setDescription(`Kuyruktaki **${sayi}** parça rastgele sıralandı!`)
      .setColor(0x5865F2)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
