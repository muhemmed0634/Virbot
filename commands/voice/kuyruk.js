// ==========================================
//  VirBot — v!kuyruk / /kuyruk Komutu
//  Mevcut müzik çalma sırasını görüntüler
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const { kurukuGetir } = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('kuyruk')
  .setDescription('Mevcut müzik çalma sırasını görüntüler.');

module.exports = {
  isim: 'kuyruk',
  alternatifler: ['queue', 'sira', 'liste'],
  aciklama: 'Müzik kuyruğunu gösterir.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  // ─── Prefix Komutu ─────────────────────────────────────────
  async calistir(client, mesaj, args) {
    const durum = kurukuGetir(mesaj.guild.id);
    if (!durum || (!durum.mevcutParca && durum.kuyruk.length === 0)) {
      return mesaj.reply('❌ Şu anda kuyrukta şarkı bulunmuyor.');
    }

    const embed = kuyrukEmbedOlustur(durum);
    await mesaj.reply({ embeds: [embed] });
  },

  // ─── Slash Komutu ──────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const durum = kurukuGetir(interaction.guild.id);
    if (!durum || (!durum.mevcutParca && durum.kuyruk.length === 0)) {
      return interaction.reply({ content: '❌ Şu anda kuyrukta şarkı bulunmuyor.', ephemeral: true });
    }

    const embed = kuyrukEmbedOlustur(durum);
    await interaction.reply({ embeds: [embed] });
  },
};

function kuyrukEmbedOlustur(durum) {
  const embed = new EmbedBuilder()
    .setTitle('🎶 Müzik Kuyruğu')
    .setColor(0x1DB954)
    .setTimestamp();

  if (durum.mevcutParca) {
    embed.addFields({
      name: '▶️ Şimdi Çalıyor',
      value: `**${durum.mevcutParca.baslik}** (İsteyen: ${durum.mevcutParca.isteyenAd})`,
      inline: false,
    });
  }

  if (durum.kuyruk.length > 0) {
    const liste = durum.kuyruk
      .slice(0, 10)
      .map((p, i) => `\`${i + 1}.\` **${p.baslik}** (İsteyen: ${p.isteyenAd})`)
      .join('\n');

    embed.addFields({
      name: `📋 Sıradakiler (${durum.kuyruk.length} parça)`,
      value: liste + (durum.kuyruk.length > 10 ? `\n... ve ${durum.kuyruk.length - 10} parça daha` : ''),
      inline: false,
    });
  } else {
    embed.addFields({
      name: '📋 Sıradakiler',
      value: 'Sırada başka şarkı yok.',
      inline: false,
    });
  }

  return embed;
}
