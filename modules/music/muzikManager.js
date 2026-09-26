// ==========================================
//  VirBot v5 — Müzik Yöneticisi (Düzeltildi)
//  YouTube + Spotify Link → YouTube Arama
//  play-dl + @discordjs/voice
//
//  Düzeltmeler:
//  - Kuyruk başlığı artık sorgu değil, gerçek YouTube başlığı
//  - VoiceConnectionStatus.Disconnected → otomatik yeniden bağlanma veya temizlik
//  - entersState timeout → crash yerine güvenli hata
//  - Boş kanala katılımda crash fix
//  - ses kanalında bot yoksa play komutu engelleme
//  - tekrar (loop) modu eklendi
//  - ses seviyesi kontrolü eklendi
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
// guildId → { kuyruk, oynatici, baglanti, mevcutParca, metinKanali, loop, ses }
const sunucuKuyrugu = new Map();

// ─── Spotify oEmbed Metadata ─────────────────────────────────
function spotifyMetaGetir(url) {
  return new Promise((resolve) => {
    const apiUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    https.get(apiUrl, { headers: { 'User-Agent': 'VirBot/5.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (_) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

// ─── URL Tür Tespiti ──────────────────────────────────────────
function urlTurTespit(url) {
  if (!url) return 'arama';
  if (url.includes('spotify.com/track/'))    return 'spotify_track';
  if (url.includes('spotify.com/playlist/')) return 'spotify_playlist';
  if (url.includes('spotify.com/album/'))    return 'spotify_album';
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return 'youtube';
  return 'arama';
}

// ─── Süre Formatı ────────────────────────────────────────────
function sureFOrmatlA(saniye) {
  if (!saniye || isNaN(saniye)) return '?';
  const sa = Math.floor(saniye / 3600);
  const dk = Math.floor((saniye % 3600) / 60);
  const sn = Math.floor(saniye % 60);
  if (sa > 0) return `${sa}:${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
  return `${dk}:${String(sn).padStart(2, '0')}`;
}

// ─── YouTube Arama & Stream Hazırla ──────────────────────────
async function streamHazirla(sorgu) {
  try {
    let ytUrl = sorgu;
    let title = sorgu;
    let duration = 0;
    let thumbnail = null;

    if (!sorgu.startsWith('http')) {
      // Arama yap
      const sonuclar = await play.search(sorgu, { limit: 1 });
      if (!sonuclar || sonuclar.length === 0) return null;
      ytUrl     = sonuclar[0].url;
      title     = sonuclar[0].title;
      duration  = sonuclar[0].durationInSec;
      thumbnail = sonuclar[0].thumbnails?.[0]?.url;
    } else {
      // URL geçerliliği kontrol et
      const tur = play.yt_validate(ytUrl);
      if (tur !== 'video') {
        // Geçerli video değilse arama yap
        const sonuclar = await play.search(sorgu, { limit: 1 });
        if (!sonuclar || sonuclar.length === 0) return null;
        ytUrl     = sonuclar[0].url;
        title     = sonuclar[0].title;
        duration  = sonuclar[0].durationInSec;
        thumbnail = sonuclar[0].thumbnails?.[0]?.url;
      } else {
        // URL'den bilgi al
        const bilgi  = await play.video_info(ytUrl);
        title     = bilgi.video_details.title || sorgu;
        duration  = bilgi.video_details.durationInSec || 0;
        thumbnail = bilgi.video_details.thumbnails?.[0]?.url || null;
      }
    }

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

// ─── Şimdi Çalıyor Embed ─────────────────────────────────────
function simdiCaliyorEmbed(streamVerisi, parca, kuyrukUzunluk, loop) {
  const { EmbedBuilder } = require('discord.js');
  return new EmbedBuilder()
    .setTitle('🎵 Şimdi Çalıyor')
    .setDescription(`**[${streamVerisi.title}](${streamVerisi.url})**`)
    .addFields(
      { name: '⏱️ Süre',       value: sureFOrmatlA(streamVerisi.duration), inline: true },
      { name: '📋 Kuyruk',      value: `${kuyrukUzunluk} parça`, inline: true },
      { name: '🔁 Loop',        value: loop ? '✅ Açık' : '❌ Kapalı', inline: true },
    )
    .setColor(0x1DB954)
    .setThumbnail(streamVerisi.thumbnail || null)
    .setFooter({ text: `İsteyen: ${parca.isteyenAd}` })
    .setTimestamp();
}

// ─── Sıradaki Parçayı Oynat ──────────────────────────────────
async function sonrakiCal(guildId, metinKanali) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return;

  // Loop modu: mevcut parçayı kuyruğun sonuna ekle
  if (durum.loop && durum.mevcutParca) {
    durum.kuyruk.push({ ...durum.mevcutParca });
  }

  if (durum.kuyruk.length === 0) {
    durum.mevcutParca = null;
    // 5 dakika boşta kalırsa bağlantıyı kes
    setTimeout(() => {
      const d = sunucuKuyrugu.get(guildId);
      if (d && d.kuyruk.length === 0 && !d.mevcutParca && d.baglanti) {
        try { d.baglanti.destroy(); } catch (_) {}
        sunucuKuyrugu.delete(guildId);
        if (metinKanali) {
          metinKanali.send('🎵 Kuyruk bitti, 5 dakika sonra ses kanalından ayrıldım.').catch(() => {});
        }
      }
    }, 5 * 60 * 1000);
    return;
  }

  const parca = durum.kuyruk.shift();
  durum.mevcutParca = parca;

  try {
    const streamVerisi = await streamHazirla(parca.sorgu);
    if (!streamVerisi) {
      const kanal = metinKanali || durum.metinKanali;
      if (kanal) kanal.send(`❌ **${parca.baslik || 'Parça'}** yüklenemedi, atlanıyor...`).catch(() => {});
      return sonrakiCal(guildId, metinKanali);
    }

    // Gerçek başlığı kaydet (ilerideki loop için)
    parca.baslik   = streamVerisi.title;
    parca.gercekUrl = streamVerisi.url;
    durum.mevcutParca = parca;

    // Ses seviyesi uygula
    const seviye = (durum.ses || 80) / 100;
    streamVerisi.kaynak.volume?.setVolume(seviye);

    durum.oynatici.play(streamVerisi.kaynak);

    const kanal = metinKanali || durum.metinKanali;
    if (kanal) {
      const embed = simdiCaliyorEmbed(streamVerisi, parca, durum.kuyruk.length, durum.loop);
      kanal.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (hata) {
    console.error('[MÜZİK ÇALMA HATA]', hata.message);
    const kanal = metinKanali || durum.metinKanali;
    if (kanal) kanal.send(`❌ Parça çalınırken hata oluştu: ${hata.message}`).catch(() => {});
    // Sıradakine geç
    setTimeout(() => sonrakiCal(guildId, metinKanali), 1000);
  }
}

// ─── Ana Oynatma Fonksiyonu ───────────────────────────────────
async function muzikOynat(guildId, voiceChannel, metinKanali, sorgu, isteyenAd, isSpotify = false) {
  try {
    let sorguListesi = [];

    if (isSpotify) {
      const spTur = play.sp_validate(sorgu);
      if (spTur === 'track' || spTur === 'playlist' || spTur === 'album') {
        const meta  = await spotifyMetaGetir(sorgu);
        const title = meta?.title || sorgu;
        sorguListesi.push({ sorgu: title, baslik: title, isteyenAd });
        if ((spTur === 'playlist' || spTur === 'album') && metinKanali) {
          metinKanali.send(`ℹ️ Spotify playlist/albümü kısmi desteklenir. **${title}** aranıyor...`).catch(() => {});
        }
      } else {
        if (metinKanali) metinKanali.send('❌ Geçersiz Spotify linki.').catch(() => {});
        return false;
      }
    } else {
      sorguListesi.push({ sorgu, baslik: sorgu, isteyenAd });
    }

    let durum = sunucuKuyrugu.get(guildId);

    if (!durum) {
      // Yeni bağlantı oluştur
      const baglanti = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      // Bağlantı hazır olana dek bekle (timeout: 15 saniye)
      try {
        await entersState(baglanti, VoiceConnectionStatus.Ready, 15_000);
      } catch {
        baglanti.destroy();
        if (metinKanali) metinKanali.send('❌ Ses kanalına bağlanılamadı! Yetkim var mı?').catch(() => {});
        return false;
      }

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
        loop: false,
        ses: 80,
      };

      sunucuKuyrugu.set(guildId, durum);

      // Bağlantı olayları
      baglanti.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          // 5 saniye içinde yeniden bağlanmayı dene
          await Promise.race([
            entersState(baglanti, VoiceConnectionStatus.Signalling, 5_000),
            entersState(baglanti, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Yeniden bağlandı
        } catch {
          // Bağlanamadı, temizle
          try { baglanti.destroy(); } catch (_) {}
          sunucuKuyrugu.delete(guildId);
        }
      });

      baglanti.on(VoiceConnectionStatus.Destroyed, () => {
        sunucuKuyrugu.delete(guildId);
      });

      // Parça bitince sıradakini çal
      oynatici.on(AudioPlayerStatus.Idle, () => {
        const d = sunucuKuyrugu.get(guildId);
        if (d) sonrakiCal(guildId, d.metinKanali);
      });

      // Oynatıcı hatası
      oynatici.on('error', (hata) => {
        console.error('[OYNATICI HATA]', hata.message);
        const d = sunucuKuyrugu.get(guildId);
        if (d) setTimeout(() => sonrakiCal(guildId, d.metinKanali), 1000);
      });
    }

    // Kuyruğa ekle
    durum.kuyruk.push(...sorguListesi);
    durum.metinKanali = metinKanali;

    // Çalmıyorsa başlat
    if (durum.oynatici.state.status === AudioPlayerStatus.Idle) {
      await sonrakiCal(guildId, metinKanali);
    } else {
      if (metinKanali) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
          .setTitle('📋 Kuyruğa Eklendi')
          .setDescription(`🔍 **${sorguListesi[0].baslik}** kuyruğa ekleniyor...`)
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

// ─── Kontrol Fonksiyonları ────────────────────────────────────
function muzikDurdur(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  durum.loop = false;
  durum.kuyruk = [];
  durum.mevcutParca = null;
  try {
    durum.oynatici.stop(true);
    durum.baglanti.destroy();
  } catch (_) {}
  sunucuKuyrugu.delete(guildId);
  return true;
}

function muzikAtla(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  // Loop modunda bile atlamak için geçici olarak loop'u kapat
  const eskiLoop = durum.loop;
  durum.loop = false;
  durum.oynatici.stop(); // Idle tetikler → sonrakiCal çağrılır
  durum.loop = eskiLoop;
  return true;
}

function muzikDuraklat(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  if (durum.oynatici.state.status !== AudioPlayerStatus.Playing) return false;
  durum.oynatici.pause();
  return true;
}

function muzikDevamEt(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  if (durum.oynatici.state.status !== AudioPlayerStatus.Paused) return false;
  durum.oynatici.unpause();
  return true;
}

// ─── Loop Modu ───────────────────────────────────────────────
function muzikLoop(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return null;
  durum.loop = !durum.loop;
  return durum.loop;
}

// ─── Ses Seviyesi ────────────────────────────────────────────
function muzikSes(guildId, seviye) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  const normalSeviye = Math.max(0, Math.min(100, seviye)) / 100;
  durum.ses = seviye;
  // Mevcut kaynak varsa uygula
  try {
    const kaynak = durum.oynatici.state.resource;
    if (kaynak?.volume) kaynak.volume.setVolume(normalSeviye);
  } catch (_) {}
  return true;
}

function kurukuGetir(guildId) {
  return sunucuKuyrugu.get(guildId) || null;
}

module.exports = {
  muzikOynat,
  muzikDurdur,
  muzikAtla,
  muzikDuraklat,
  muzikDevamEt,
  muzikLoop,
  muzikSes,
  kurukuGetir,
  sureFOrmatlA,
  urlTurTespit,
};
