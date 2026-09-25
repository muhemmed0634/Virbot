// ==========================================
//  VirBot — v!cal / /cal Komutu
//  YouTube + Spotify Müzik Oynatma
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const {
  muzikOynat, muzikDurdur, muzikAtla,
  muzikDuraklat, muzikDevamEt, kurukuGetir,
  sureFOrmatlA, urlTurTespit,
} = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('cal')
  .setDescription('Ses kanalında müzik çalar (YouTube & Spotify destekli).')
  .addStringOption(opt =>
    opt
      .setName('sorgu')
      .setDescription('YouTube linki, Spotify linki veya şarkı adı')
      .setRequired(true)
  );

async function calIslem(istek, voiceChannel, metinKanali, sorgu, isteyenAd) {
  if (!voiceChannel) {
    return { hata: '❌ Bir ses kanalında olmanız gerekiyor!' };
  }

  if (!voiceChannel.joinable) {
    return { hata: '❌ Bota ses kanalına katılma izni yok!' };
  }

  const tur = urlTurTespit(sorgu);
  const isSpotify = tur.startsWith('spotify');
  const guildId = voiceChannel.guild.id;

  const basarili = await muzikOynat(guildId, voiceChannel, metinKanali, sorgu, isteyenAd, isSpotify);

  if (!basarili) {
    return { hata: '❌ Parça yüklenirken bir sorun oluştu. Farklı bir sorgu deneyin.' };
  }

  return { basarili: true };
}

module.exports = {
  isim: 'cal',
  alternatifler: ['play', 'muzik', 'müzik', 'calar', 'çal'],
  aciklama: 'YouTube veya Spotify müzik çalar.',
  adminGerekli: false,
  rpgKomutu: false,
  slashData,

  // ─── Prefix Komutu (v!cal <sorgu>) ────────────────────────
  async calistir(client, mesaj, args) {
    if (args.length === 0) {
      return mesaj.reply(
        '❌ Kullanım: `v!cal <YouTube Linki / Spotify Linki / Şarkı Adı>`\n\n' +
        '**Örnekler:**\n' +
        '• `v!cal Never Gonna Give You Up`\n' +
        '• `v!cal https://www.youtube.com/watch?v=dQw4w9WgXcQ`\n' +
        '• `v!cal https://open.spotify.com/track/...`\n\n' +
        '**Kontrol komutları:** `v!dur` · `v!atla` · `v!duraklat` · `v!devam` · `v!kuyruk`'
      );
    }

    const voiceChannel = mesaj.member?.voice?.channel;
    const sorgu = args.join(' ');

    const sonuc = await calIslem(mesaj, voiceChannel, mesaj.channel, sorgu, mesaj.member?.displayName || mesaj.author.username);

    if (sonuc.hata) {
      return mesaj.reply(sonuc.hata);
    }
  },

  // ─── Slash Komutu (/cal) ───────────────────────────────────
  async slashCalistir(client, interaction) {
    const sorgu = interaction.options.getString('sorgu');
    const voiceChannel = interaction.member?.voice?.channel;

    await interaction.deferReply();

    const sonuc = await calIslem(interaction, voiceChannel, interaction.channel, sorgu, interaction.member?.displayName || interaction.user.username);

    if (sonuc.hata) {
      return interaction.editReply({ content: sonuc.hata });
    }

    await interaction.editReply({ content: `🎵 **${sorgu}** işleme alındı...` });
  },
};
