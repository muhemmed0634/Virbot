// ==========================================
//  VirBot — Müzik Yöneticisi
//  YouTube + Spotify Link → YouTube Arama
//  play-dl + @discordjs/voice
// ==========================================
'use strict';

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const play = require('play-dl');
const https = require('https');

// ─── Sunucu Bazlı Kuyruk Haritası ─────────────────────────────
// guildId → { kuyruk: [...], oynatici, baglanti, mevcutParca }
const sunucuKuyrugu = new Map();

// ─── Spotify oEmbed Metadata (API key gerektirmez) ────────────
function spotifyMetaGetir(url) {
  return new Promise((resolve) => {
    const apiUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    https.get(apiUrl, { headers: { 'User-Agent': 'VirBot/3.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (_) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// ─── URL Tür Tespiti ───────────────────────────────────────────
function urlTurTespit(url) {
  if (!url) return 'arama';
  if (url.includes('spotify.com/track/')) return 'spotify_track';
  if (url.includes('spotify.com/playlist/')) return 'spotify_playlist';
  if (url.includes('spotify.com/album/')) return 'spotify_album';
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return 'youtube';
  return 'arama';
}

// ─── YouTube URL veya Arama Sorgusu ile Stream Hazırla ────────
async function streamHazirla(sorgu) {
  try {
    let ytUrl = sorgu;

    if (!sorgu.startsWith('http')) {
      // Arama yap
      const sonuclar = await play.search(sorgu, { limit: 1 });
      if (!sonuclar || sonuclar.length === 0) return null;
      ytUrl = sonuclar[0].url;
    }

    const tur = play.yt_validate(ytUrl);
    if (tur !== 'video') {
      // Geçerli YT videosu değilse, arama yap
      const sonuclar = await play.search(sorgu, { limit: 1 });
      if (!sonuclar || sonuclar.length === 0) return null;
      ytUrl = sonuclar[0].url;
    }

    const bilgi = await play.video_info(ytUrl);
    const title = bilgi.video_details.title;
    const duration = bilgi.video_details.durationInSec;
    const thumbnail = bilgi.video_details.thumbnails?.[0]?.url;

    const streamData = await play.stream(ytUrl, { quality: 2 });
    const kaynak = createAudioResource(streamData.stream, {
      inputType: streamData.type,
      inlineVolume: true,
    });
    kaynak.volume?.setVolume(0.8);

    return { kaynak, title, url: ytUrl, duration, thumbnail };
  } catch (hata) {
    console.error('[MÜZİK STREAM HATA]', hata.message);
    return null;
  }
}

// ─── Sıradaki Parçayı Oynat ────────────────────────────────────
async function sonrakiCal(guildId, metin_kanali) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return;

  if (durum.kuyruk.length === 0) {
    durum.mevcutParca = null;
    // 5 dakika sonra bağlantıyı kes
    setTimeout(() => {
      const d = sunucuKuyrugu.get(guildId);
      if (d && d.kuyruk.length === 0 && d.baglanti) {
        d.baglanti.destroy();
        sunucuKuyrugu.delete(guildId);
      }
    }, 5 * 60 * 1000);
    return;
  }

  const parca = durum.kuyruk.shift();
  durum.mevcutParca = parca;

  try {
    const streamVerisi = await streamHazirla(parca.sorgu);
    if (!streamVerisi) {
      if (metin_kanali) metin_kanali.send(`❌ **${parca.baslik || 'Parça'}** yüklenemedi, atlanıyor...`).catch(() => {});
      return sonrakiCal(guildId, metin_kanali);
    }

    durum.oynatici.play(streamVerisi.kaynak);

    if (metin_kanali) {
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle('🎵 Şimdi Çalıyor')
        .setDescription(`**[${streamVerisi.title}](${streamVerisi.url})**`)
        .addFields(
          { name: '⏱️ Süre', value: sureFOrmatlA(streamVerisi.duration), inline: true },
          { name: '📋 Kuyruktaki', value: `${durum.kuyruk.length} parça`, inline: true },
        )
        .setColor(0x1DB954) // Spotify Yeşil
        .setThumbnail(streamVerisi.thumbnail || null)
        .setFooter({ text: `İsteyen: ${parca.isteyenAd}` })
        .setTimestamp();
      metin_kanali.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (hata) {
    console.error('[MÜZİK ÇALMA HATA]', hata.message);
    if (metin_kanali) metin_kanali.send('❌ Parça çalınırken bir hata oluştu.').catch(() => {});
  }
}

function sureFOrmatlA(saniye) {
  if (!saniye) return '?';
  const dk = Math.floor(saniye / 60);
  const sn = saniye % 60;
  return `${dk}:${String(sn).padStart(2, '0')}`;
}

// ─── Ana Oynatma Fonksiyonu ────────────────────────────────────
async function muzikOynat(guildId, voiceChannel, metinKanali, sorgu, isteyenAd, isSpotify = false) {
  try {
    let sorguListesi = [];

    if (isSpotify) {
      const spTur = play.sp_validate(sorgu);

      if (spTur === 'track') {
        const meta = await spotifyMetaGetir(sorgu);
        const title = meta?.title || sorgu;
        sorguListesi.push({ sorgu: title, baslik: title, isteyenAd });
      } else if (spTur === 'playlist' || spTur === 'album') {
        // Spotify playlist/albüm için oEmbed tam metadata sağlamaz
        // Kullanıcıya bildir, parça adını arama yaparak oynat
        const meta = await spotifyMetaGetir(sorgu);
        const title = meta?.title || sorgu;
        sorguListesi.push({ sorgu: title, baslik: title, isteyenAd });
        if (metinKanali) {
          metinKanali.send(`ℹ️ Spotify playlist/albümü kısmi olarak desteklenir. **${title}** aranıyor...`).catch(() => {});
        }
      } else {
        if (metinKanali) metinKanali.send('❌ Geçersiz Spotify linki.').catch(() => {});
        return;
      }
    } else {
      sorguListesi.push({ sorgu, baslik: sorgu, isteyenAd });
    }

    // Mevcut kuyruk durumu
    let durum = sunucuKuyrugu.get(guildId);

    if (!durum) {
      // Yeni bağlantı oluştur
      const baglanti = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      const oynatici = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
      });

      baglanti.subscribe(oynatici);

      durum = {
        kuyruk: [],
        oynatici,
        baglanti,
        mevcutParca: null,
        metinKanali,
      };

      sunucuKuyrugu.set(guildId, durum);

      // Bağlantı kopunca temizle
      baglanti.on(VoiceConnectionStatus.Destroyed, () => {
        sunucuKuyrugu.delete(guildId);
      });

      // Parça bitince sıradakini çal
      oynatici.on(AudioPlayerStatus.Idle, () => {
        sonrakiCal(guildId, durum.metinKanali);
      });

      // Hata yönetimi
      oynatici.on('error', (hata) => {
        console.error('[OYNATICI HATA]', hata.message);
        sonrakiCal(guildId, durum.metinKanali);
      });

      // Bağlantı hazır olana dek bekle
      await entersState(baglanti, VoiceConnectionStatus.Ready, 10_000);
    }

    // Kuyruğa ekle
    durum.kuyruk.push(...sorguListesi);
    durum.metinKanali = metinKanali;

    // Eğer şu an çalmıyorsa başlat
    if (durum.oynatici.state.status === AudioPlayerStatus.Idle) {
      await sonrakiCal(guildId, metinKanali);
    } else {
      if (metinKanali) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setTitle('📋 Kuyruğa Eklendi')
          .setDescription(`**${sorguListesi[0].baslik}** kuyruğa eklendi.`)
          .addFields({ name: '📊 Sıra', value: `${durum.kuyruk.length}. parça`, inline: true })
          .setColor(0x1DB954)
          .setTimestamp();
        metinKanali.send({ embeds: [embed] }).catch(() => {});
      }
    }

    return true;
  } catch (hata) {
    console.error('[MÜZİK OYNAT HATA]', hata.message);
    return false;
  }
}

function muzikDurdur(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  durum.oynatici.stop(true);
  durum.kuyruk = [];
  durum.mevcutParca = null;
  durum.baglanti.destroy();
  sunucuKuyrugu.delete(guildId);
  return true;
}

function muzikAtla(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  durum.oynatici.stop(); // Idle tetikler → sonrakiCal çağrılır
  return true;
}

function muzikDuraklat(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  durum.oynatici.pause();
  return true;
}

function muzikDevamEt(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  durum.oynatici.unpause();
  return true;
}

function kurukuGetir(guildId) {
  return sunucuKuyrugu.get(guildId);
}

module.exports = {
  muzikOynat,
  muzikDurdur,
  muzikAtla,
  muzikDuraklat,
  muzikDevamEt,
  kurukuGetir,
  sureFOrmatlA,
  urlTurTespit,
};
