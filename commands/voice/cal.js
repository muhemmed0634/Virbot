// ==========================================
//  VirBot v5 — v!cal / /cal Komutu (Düzeltildi)
//  YouTube + Spotify Müzik Oynatma
// ==========================================
'use strict';

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { RENKLER } = require('../../config/config');
const {
  muzikOynat, kurukuGetir, urlTurTespit,
} = require('../../modules/music/muzikManager');

const slashData = new SlashCommandBuilder()
  .setName('cal')
  .setDescription('🎵 Ses kanalında müzik çalar (YouTube & Spotify destekli).')
  .addStringOption(opt =>
    opt
      .setName('sorgu')
      .setDescription('YouTube linki, Spotify linki veya şarkı adı')
      .setRequired(true)
  );

async function calIslem(voiceChannel, metinKanali, guildId, sorgu, isteyenAd) {
  if (!voiceChannel) {
    return { hata: '❌ Bir **ses kanalında** olmanız gerekiyor!' };
  }

  if (!voiceChannel.joinable) {
    return { hata: '❌ Bota ses kanalına katılma izni yok! Kanal limitli veya boş olabilir.' };
  }

  // Bot zaten başka bir kanaldaysa uyar
  const durum = kurukuGetir(guildId);
  if (durum && durum.baglanti) {
    const botKanali = voiceChannel.guild.members.me?.voice?.channel;
    if (botKanali && botKanali.id !== voiceChannel.id) {
      return { hata: `❌ Bot şu an **${botKanali.name}** kanalında! O kanalda olun veya önce \`v!dur\` kullanın.` };
    }
  }

  const tur = urlTurTespit(sorgu);
  const isSpotify = tur.startsWith('spotify');

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

  // ─── Prefix ──────────────────────────────────────────────
  async calistir(client, mesaj, args) {
    if (args.length === 0) {
      return mesaj.reply(
        '❌ Kullanım: `v!cal <YouTube / Spotify / Şarkı Adı>`\n\n' +
        '**Örnekler:**\n' +
        '• `v!cal Never Gonna Give You Up`\n' +
        '• `v!cal https://www.youtube.com/watch?v=dQw4w9WgXcQ`\n\n' +
        '**Kontrol:** `v!dur` · `v!atla` · `v!duraklat` · `v!devam` · `v!np` · `v!kuyruk` · `v!loop` · `v!karistir` · `v!ses <0-100>`'
      );
    }

    const voiceChannel = mesaj.member?.voice?.channel;
    const sorgu = args.join(' ');

    const sonuc = await calIslem(
      voiceChannel, mesaj.channel, mesaj.guild.id,
      sorgu, mesaj.member?.displayName || mesaj.author.username
    );

    if (sonuc.hata) return mesaj.reply(sonuc.hata);
  },

  // ─── Slash ───────────────────────────────────────────────
  async slashCalistir(client, interaction) {
    const sorgu = interaction.options.getString('sorgu');
    const voiceChannel = interaction.member?.voice?.channel;

    await interaction.deferReply();

    const sonuc = await calIslem(
      voiceChannel, interaction.channel, interaction.guildId,
      sorgu, interaction.member?.displayName || interaction.user.username
    );

    if (sonuc.hata) return interaction.editReply({ content: sonuc.hata });
    await interaction.editReply({ content: `🔍 **${sorgu}** aranıyor...` });
  },
};
