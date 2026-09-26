// ==========================================
//  VirBot v5 — Müzik Yöneticisi (Full Fix & Buttons)
//  yt-dlp Stream + play-dl Hızlı Metadata
//  @discordjs/voice + opusscript / @discordjs/opus
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
  StreamType,
} = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const play = require('play-dl');
const https = require('https');
const { spawn, execSync } = require('child_process');

// ─── Sunucu Bazlı Kuyruk Haritası ─────────────────────────────
// guildId → { kuyruk, oynatici, baglanti, mevcutParca, metinKanali, loop, ses, childProcess, baslangicZamani }
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
  if (!saniye || isNaN(saniye)) return '00:00';
  const sa = Math.floor(saniye / 3600);
  const dk = Math.floor((saniye % 3600) / 60);
  const sn = Math.floor(saniye % 60);
  if (sa > 0) return `${sa}:${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
  return `${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
}

// ─── İlerleme Çubuğu (Progress Bar) ──────────────────────────
function ilerlemeCubugu(gecenSn, toplamSn, uzunluk = 14) {
  if (!toplamSn || toplamSn <= 0) return '🔴 Canlı / Bilinmiyor';
  const oran = Math.min(1, Math.max(0, gecenSn / toplamSn));
  const dolu = Math.round(uzunluk * oran);
  const bos = Math.max(0, uzunluk - dolu);
  return '▬'.repeat(Math.max(0, dolu - 1)) + '🔘' + '▬'.repeat(bos);
}

// ─── İnteraktif Müzik Kontrol Butonları ──────────────────────
function muzikKontrolButonlari(loop = false, duraklatildi = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('muzik_toggle')
      .setEmoji(duraklatildi ? '▶️' : '⏸️')
      .setLabel(duraklatildi ? 'Davam' : 'Duraklat')
      .setStyle(duraklatildi ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('muzik_atla')
      .setEmoji('⏭️')
      .setLabel('Atla')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('muzik_loop')
      .setEmoji('🔁')
      .setLabel(loop ? 'Loop: Açıq' : 'Loop: Qapalı')
      .setStyle(loop ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('muzik_karistir')
      .setEmoji('🔀')
      .setLabel('Qarışdır')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('muzik_durdur')
      .setEmoji('⏹️')
      .setLabel('Dayandır')
      .setStyle(ButtonStyle.Danger),
  );
  return [row];
}

// ─── Güvenli yt-dlp Stream Oluşturucu ─────────────────────────
function ytdlpStreamOlustur(ytUrl) {
  const child = spawn('yt-dlp', [
    '-f', 'bestaudio/best',
    '-o', '-',
    '-q',
    '--no-playlist',
    '--no-warnings',
    ytUrl,
  ]);

  child.on('error', (err) => {
    console.error('[YT-DLP CHILD ERROR]', err.message);
  });

  const kaynak = createAudioResource(child.stdout, {
    inputType: StreamType.Arbitrary,
    inlineVolume: true,
  });

  return { kaynak, child };
}

// ─── YouTube Arama & Bilgi Çekme ──────────────────────────────
async function videoBilgiGetir(sorgu) {
  let ytUrl = sorgu;
  let title = sorgu;
  let duration = 0;
  let thumbnail = null;

  try {
    if (!sorgu.startsWith('http')) {
      // Hızlı arama
      const sonuclar = await play.search(sorgu, { limit: 1 }).catch(() => []);
      if (sonuclar && sonuclar.length > 0) {
        ytUrl     = sonuclar[0].url;
        title     = sonuclar[0].title;
        duration  = sonuclar[0].durationInSec || 0;
        thumbnail = sonuclar[0].thumbnails?.[0]?.url || null;
      } else {
        // yt-dlp arama yedeği
        const raw = execSync(`yt-dlp --print "%(title)s;;;%(webpage_url)s;;;%(duration)s;;;%(thumbnail)s" --no-warnings "ytsearch1:${sorgu.replace(/"/g, '\\"')}"`, { timeout: 10000 }).toString().trim();
        const parts = raw.split(';;;');
        if (parts.length >= 2) {
          title     = parts[0];
          ytUrl     = parts[1];
          duration  = parseInt(parts[2], 10) || 0;
          thumbnail = parts[3] || null;
        }
      }
    } else {
      // Doğrudan URL
      const info = await play.video_info(ytUrl).catch(() => null);
      if (info && info.video_details) {
        title     = info.video_details.title || sorgu;
        duration  = info.video_details.durationInSec || 0;
        thumbnail = info.video_details.thumbnails?.[0]?.url || null;
      } else {
        const raw = execSync(`yt-dlp --print "%(title)s;;;%(duration)s;;;%(thumbnail)s" --no-warnings "${ytUrl.replace(/"/g, '\\"')}"`, { timeout: 10000 }).toString().trim();
        const parts = raw.split(';;;');
        if (parts.length >= 1) {
          title     = parts[0] || sorgu;
          duration  = parseInt(parts[1], 10) || 0;
          thumbnail = parts[2] || null;
        }
      }
    }
    return { ytUrl, title, duration, thumbnail };
  } catch (err) {
    console.error('[VIDEO BILGI HATA]', err.message);
    return { ytUrl, title: sorgu, duration: 0, thumbnail: null };
  }
}

// ─── Stream Hazırla (yt-dlp + play-dl Fallback) ──────────────
async function streamHazirla(sorgu) {
  try {
    const meta = await videoBilgiGetir(sorgu);
    if (!meta || !meta.ytUrl) return null;

    // 1. Tercih: yt-dlp Arbitrary Stream
    try {
      const { kaynak, child } = ytdlpStreamOlustur(meta.ytUrl);
      return {
        kaynak,
        child,
        title: meta.title,
        url: meta.ytUrl,
        duration: meta.duration,
        thumbnail: meta.thumbnail,
      };
    } catch (e) {
      console.warn('[YT-DLP BAŞARISIZ, PLAY-DL DENENİYOR]', e.message);
    }

    // 2. Yedek: play-dl stream
    const streamData = await play.stream(meta.ytUrl, { quality: 2 });
    const kaynak = createAudioResource(streamData.stream, {
      inputType: streamData.type,
      inlineVolume: true,
    });
    return {
      kaynak,
      child: null,
      title: meta.title,
      url: meta.ytUrl,
      duration: meta.duration,
      thumbnail: meta.thumbnail,
    };
  } catch (hata) {
    console.error('[MÜZİK STREAM HATA]', hata.message);
    return null;
  }
}

// ─── Şimdi Çalıyor Embed ─────────────────────────────────────
function simdiCaliyorEmbed(streamVerisi, parca, kuyrukUzunluk, loop, ses = 80) {
  return new EmbedBuilder()
    .setTitle('🎵 İndi Oxunur')
    .setDescription(`**[${streamVerisi.title}](${streamVerisi.url})**`)
    .addFields(
      { name: '⏱️ Müddət',   value: `\`${sureFOrmatlA(streamVerisi.duration)}\``, inline: true },
      { name: '📋 Növbə',    value: `\`${kuyrukUzunluk} mahnı\``,                inline: true },
      { name: '🔁 Loop',     value: loop ? '`✅ Açıq`' : '`❌ Qapalı`',          inline: true },
      { name: '🔉 Səs',      value: `\`%${ses}\``,                               inline: true },
      { name: '👤 İstəyən',  value: `\`${parca.isteyenAd || 'Anonim'}\``,        inline: true },
    )
    .setColor(0x1DB954)
    .setThumbnail(streamVerisi.thumbnail || null)
    .setFooter({ text: 'Aşağıdakı düymələrlə mahnını idarə edə bilərsiniz 🎧' })
    .setTimestamp();
}

// ─── Sıradaki Parçayı Oynat ──────────────────────────────────
async function sonrakiCal(guildId, metinKanali) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return;

  // Əvvəlki prosesi təmizlə
  if (durum.childProcess) {
    try { durum.childProcess.kill('SIGKILL'); } catch (_) {}
    durum.childProcess = null;
  }

  // Loop modu: mevcut parçayı kuyruğun sonuna ekle
  if (durum.loop && durum.mevcutParca) {
    durum.kuyruk.push({ ...durum.mevcutParca });
  }

  if (durum.kuyruk.length === 0) {
    durum.mevcutParca = null;
    durum.baslangicZamani = null;
    // 5 dəqiqə boş qalarsa kanaldan ayrıl
    setTimeout(() => {
      const d = sunucuKuyrugu.get(guildId);
      if (d && d.kuyruk.length === 0 && !d.mevcutParca && d.baglanti) {
        try { d.baglanti.destroy(); } catch (_) {}
        sunucuKuyrugu.delete(guildId);
        if (metinKanali) {
          metinKanali.send('🎵 Növbə bitdi, səs kanalından ayrıldım.').catch(() => {});
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
      if (kanal) kanal.send(`❌ **${parca.baslik || 'Mahnı'}** yüklənə bilmədi, sıradakına keçilir...`).catch(() => {});
      return sonrakiCal(guildId, metinKanali);
    }

    parca.baslik    = streamVerisi.title;
    parca.gercekUrl = streamVerisi.url;
    parca.duration  = streamVerisi.duration;
    durum.mevcutParca = parca;
    durum.childProcess = streamVerisi.child;
    durum.baslangicZamani = Date.now();

    // Səs səviyyəsi
    const seviye = (durum.ses || 80) / 100;
    streamVerisi.kaynak.volume?.setVolume(seviye);

    durum.oynatici.play(streamVerisi.kaynak);

    const kanal = metinKanali || durum.metinKanali;
    if (kanal) {
      const embed = simdiCaliyorEmbed(streamVerisi, parca, durum.kuyruk.length, durum.loop, durum.ses);
      const components = muzikKontrolButonlari(durum.loop, false);
      kanal.send({ embeds: [embed], components }).catch(() => {});
    }
  } catch (hata) {
    console.error('[MÜZİK ÇALMA HATA]', hata.message);
    const kanal = metinKanali || durum.metinKanali;
    if (kanal) kanal.send(`❌ Mahnı oxunarkən xəta: ${hata.message}`).catch(() => {});
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
          metinKanali.send(`ℹ️ Spotify parçası tapıldı: **${title}**`).catch(() => {});
        }
      } else {
        if (metinKanali) metinKanali.send('❌ Yanlış Spotify linki.').catch(() => {});
        return false;
      }
    } else {
      sorguListesi.push({ sorgu, baslik: sorgu, isteyenAd });
    }

    let durum = sunucuKuyrugu.get(guildId);

    if (!durum) {
      const baglanti = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      try {
        await entersState(baglanti, VoiceConnectionStatus.Ready, 15_000);
      } catch {
        try { baglanti.destroy(); } catch (_) {}
        if (metinKanali) metinKanali.send('❌ Səs kanalına qoşulmaq alınmadı! Bot icazələrini yoxlayın.').catch(() => {});
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
        childProcess: null,
        baslangicZamani: null,
      };

      sunucuKuyrugu.set(guildId, durum);

      baglanti.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(baglanti, VoiceConnectionStatus.Signalling, 5_000),
            entersState(baglanti, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          if (durum.childProcess) {
            try { durum.childProcess.kill('SIGKILL'); } catch (_) {}
          }
          try { baglanti.destroy(); } catch (_) {}
          sunucuKuyrugu.delete(guildId);
        }
      });

      baglanti.on(VoiceConnectionStatus.Destroyed, () => {
        if (durum.childProcess) {
          try { durum.childProcess.kill('SIGKILL'); } catch (_) {}
        }
        sunucuKuyrugu.delete(guildId);
      });

      oynatici.on(AudioPlayerStatus.Idle, () => {
        const d = sunucuKuyrugu.get(guildId);
        if (d) sonrakiCal(guildId, d.metinKanali);
      });

      oynatici.on('error', (hata) => {
        console.error('[OYNATICI HATA]', hata.message);
        const d = sunucuKuyrugu.get(guildId);
        if (d) setTimeout(() => sonrakiCal(guildId, d.metinKanali), 1000);
      });
    }

    durum.kuyruk.push(...sorguListesi);
    durum.metinKanali = metinKanali;

    if (durum.oynatici.state.status === AudioPlayerStatus.Idle) {
      await sonrakiCal(guildId, metinKanali);
    } else {
      if (metinKanali) {
        const embed = new EmbedBuilder()
          .setTitle('📋 Növbəyə Əlavə Edildi')
          .setDescription(`🎶 **${sorguListesi[0].baslik}**`)
          .addFields({ name: '📊 Sıra', value: `\`${durum.kuyruk.length}. mahnı\``, inline: true })
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
  durum.baslangicZamani = null;
  if (durum.childProcess) {
    try { durum.childProcess.kill('SIGKILL'); } catch (_) {}
    durum.childProcess = null;
  }
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
  const eskiLoop = durum.loop;
  durum.loop = false;
  if (durum.childProcess) {
    try { durum.childProcess.kill('SIGKILL'); } catch (_) {}
    durum.childProcess = null;
  }
  durum.oynatici.stop();
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

function muzikLoop(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return null;
  durum.loop = !durum.loop;
  return durum.loop;
}

function muzikSes(guildId, seviye) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return false;
  const normalSeviye = Math.max(0, Math.min(100, seviye)) / 100;
  durum.ses = seviye;
  try {
    const kaynak = durum.oynatici.state.resource;
    if (kaynak?.volume) kaynak.volume.setVolume(normalSeviye);
  } catch (_) {}
  return true;
}

// ─── Kuyruğu Karıştır (Shuffle) ──────────────────────────────
function muzikKaristir(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum || durum.kuyruk.length <= 1) return 0;
  for (let i = durum.kuyruk.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [durum.kuyruk[i], durum.kuyruk[j]] = [durum.kuyruk[j], durum.kuyruk[i]];
  }
  return durum.kuyruk.length;
}

// ─── Kuyruğu Temizle ─────────────────────────────────────────
function muzikKuyrukTemizle(guildId) {
  const durum = sunucuKuyrugu.get(guildId);
  if (!durum) return 0;
  const sayi = durum.kuyruk.length;
  durum.kuyruk = [];
  return sayi;
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
  muzikKaristir,
  muzikKuyrukTemizle,
  kurukuGetir,
  sureFOrmatlA,
  ilerlemeCubugu,
  urlTurTespit,
  muzikKontrolButonlari,
};
