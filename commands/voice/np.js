// ==========================================
//  VirBot v5 — v!np / /np (Now Playing)
//  Şu An Çalan Parça ve Dinamik İlerleme Çubuğu
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { kurukuGetir, sureFOrmatlA, ilerlemeCubugu, muzikKontrolButonlari } = require('../../modules/music/muzikManager');
const { AudioPlayerStatus } = require('@discordjs/voice');

const slashData = new SlashCommandBuilder()
  .setName('np')
  .setDescription('🎵 Şu anda çalan şarkıyı ve ilerleme durumunu gösterir.');

function npEmbedOlustur(durum) {
  if (!durum || !durum.mevcutParca) {
    return { hata: '❌ Şu anda çalan aktif bir müzik yok!' };
  }

  const parca = durum.mevcutParca;
  const toplamSn = parca.duration || 0;
  let gecenSn = 0;

  if (durum.baslangicZamani) {
    gecenSn = Math.floor((Date.now() - durum.baslangicZamani) / 1000);
    if (toplamSn > 0 && gecenSn > toplamSn) gecenSn = toplamSn;
  }

  const cubuk = ilerlemeCubugu(gecenSn, toplamSn, 15);
  const duraklatildi = durum.oynatici?.state?.status === AudioPlayerStatus.Paused;

  const embed = new EmbedBuilder()
    .setTitle(duraklatildi ? '⏸️ Şu Anda Duraklatıldı' : '🎵 Şu Anda Çalıyor')
    .setDescription(`**[${parca.baslik || 'Bilinmeyen Başlık'}](${parca.gercekUrl || 'https://youtube.com'})**\n\n\`${sureFOrmatlA(gecenSn)}\` ${cubuk} \`${sureFOrmatlA(toplamSn)}\``)
    .addFields(
      { name: '🔁 Loop',    value: durum.loop ? '`✅ Açık`' : '`❌ Kapalı`', inline: true },
      { name: '🔉 Ses',     value: `\`%${durum.ses || 80}\``,               inline: true },
      { name: '📋 Kuyruk',  value: `\`${durum.kuyruk.length} parça\``,      inline: true },
      { name: '👤 İsteyen', value: `\`${parca.isteyenAd || 'Anonim'}\``,    inline: true },
    )
    .setColor(duraklatildi ? 0xFEE75C : 0x1DB954)
    .setTimestamp();

  return { embed, components: muzikKontrolButonlari(durum.loop, duraklatildi) };
}

module.exports = {
  isim: 'np',
  alternatifler: ['calan', 'şarkı', 'nowplaying'],
  aciklama: 'Şu an çalan şarkıyı gösterir.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  async calistir(client, mesaj) {
    const durum = kurukuGetir(mesaj.guild.id);
    const sonuc = npEmbedOlustur(durum);
    if (sonuc.hata) return mesaj.reply(sonuc.hata);
    return mesaj.reply({ embeds: [sonuc.embed], components: sonuc.components });
  },

  async slashCalistir(client, interaction) {
    const durum = kurukuGetir(interaction.guildId);
    const sonuc = npEmbedOlustur(durum);
    if (sonuc.hata) return interaction.reply({ content: sonuc.hata, ephemeral: true });
    return interaction.reply({ embeds: [sonuc.embed], components: sonuc.components });
  },
};
