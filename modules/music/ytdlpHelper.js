// ==========================================
//  VirBot — yt-dlp & FFmpeg Entegrasyon Yardımcısı
//  Render.com (512MB RAM) Optimize & Güvenli Stream
// ==========================================
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn, execFile, execSync } = require('child_process');
const { createAudioResource, StreamType } = require('@discordjs/voice');

// FFmpeg yolu ayarla
try {
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic) {
    const ffmpegPath = ffmpegStatic.path || ffmpegStatic;
    process.env.FFMPEG_PATH = ffmpegPath;
    const ffmpegDir = path.dirname(ffmpegPath);
    if (!process.env.PATH.includes(ffmpegDir)) {
      process.env.PATH = `${ffmpegDir}:${process.env.PATH}`;
    }
  }
} catch (_) {}

// PATH ortam değişkenine bin ve tmp dizinlerini ekle
const projeBin = path.join(__dirname, '..', '..', 'bin');
const extraPaths = [projeBin, '/tmp', `${process.env.HOME || ''}/.local/bin`, '/opt/render/.local/bin'];
for (const p of extraPaths) {
  if (p && !process.env.PATH.includes(p)) {
    process.env.PATH = `${p}:${process.env.PATH}`;
  }
}

/**
 * Mevcut en uygun yt-dlp ikili dosya yolunu döner.
 */
function getYtdlpYolu() {
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    return process.env.YTDLP_PATH;
  }

  const olasiYollar = [
    path.join(__dirname, '..', '..', 'bin', 'yt-dlp'),
    '/tmp/yt-dlp',
    path.join(process.env.HOME || '', '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
  ];

  for (const y of olasiYollar) {
    try {
      if (fs.existsSync(y)) {
        try { fs.chmodSync(y, 0o755); } catch (_) {}
        return y;
      }
    } catch (_) {}
  }

  // Sistem PATH'inde ara
  try {
    const which = execSync('which yt-dlp 2>/dev/null').toString().trim();
    if (which && fs.existsSync(which)) return which;
  } catch (_) {}

  return 'yt-dlp';
}

/**
 * yt-dlp komutunu güvenli bir zaman aşımı ile çalıştırır.
 */
function execYtdlp(args, timeout = 12000) {
  const binary = getYtdlpYolu();
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout, maxBuffer: 1024 * 1024 * 2 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

/**
 * Spotify oEmbed meta verisini çeker.
 */
function spotifyMetaGetir(url) {
  return new Promise((resolve) => {
    const apiUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const req = https.get(apiUrl, { headers: { 'User-Agent': 'VirBot/2.0' } }, (res) => {
      let veri = '';
      res.on('data', (c) => (veri += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(veri));
        } catch (_) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => {
      try { req.destroy(); } catch (_) {}
      resolve(null);
    });
  });
}

/**
 * YouTube / Spotify / Arama sorgusunun meta verilerini çeker.
 */
async function videoBilgiGetir(sorgu) {
  const binary = getYtdlpYolu();

  // Spotify bağlantısı tespiti
  if (sorgu.includes('spotify.com/')) {
    const meta = await spotifyMetaGetir(sorgu);
    if (meta && meta.title) {
      sorgu = `${meta.title} audio`;
    }
  }

  // YouTube Playlist tespiti
  const isPlaylist = (sorgu.includes('youtube.com/playlist') || sorgu.includes('list=')) && sorgu.startsWith('http');
  if (isPlaylist) {
    try {
      // 512MB RAM dostu: En fazla 25 parça al
      const raw = await execYtdlp([
        '--flat-playlist',
        '--playlist-end', '25',
        '--print', '%(title)s|||%(url)s|||%(duration)s',
        '--no-warnings',
        sorgu,
      ], 15000);

      const satirlar = raw.split('\n').filter(Boolean);
      const parcalar = [];

      for (const satir of satirlar) {
        const parts = satir.split('|||');
        const baslik = parts[0] || 'Bilinmeyen Parça';
        let ytUrl = parts[1] || '';
        if (ytUrl && !ytUrl.startsWith('http')) {
          ytUrl = `https://www.youtube.com/watch?v=${ytUrl}`;
        }
        const sure = parseInt(parts[2], 10) || 0;
        parcalar.push({ ytUrl, baslik, sure, thumbnail: null });
      }

      if (parcalar.length > 0) {
        return { isPlaylist: true, parcalar };
      }
    } catch (e) {
      console.warn('[YT-DLP] Playlist getirme hatası, tek parça olarak deneniyor:', e.message);
    }
  }

  // Tek video veya arama sorgusu
  const target = sorgu.startsWith('http') ? sorgu : `ytsearch1:${sorgu}`;

  try {
    const raw = await execYtdlp([
      '--print', '%(title)s|||%(webpage_url)s|||%(duration)s|||%(thumbnail)s',
      '--no-warnings',
      '--no-playlist',
      target,
    ], 12000);

    if (raw) {
      const parts = raw.split('|||');
      return {
        isPlaylist: false,
        baslik: parts[0] || sorgu,
        ytUrl: parts[1] || sorgu,
        sure: parseInt(parts[2], 10) || 0,
        thumbnail: parts[3] || null,
      };
    }
  } catch (err) {
    console.error('[YT-DLP] Meta veri alma hatası:', err.message);
  }

  return {
    isPlaylist: false,
    baslik: sorgu,
    ytUrl: sorgu,
    sure: 0,
    thumbnail: null,
  };
}

/**
 * yt-dlp ile düşük bellek tüketimli ses akışı (stream) oluşturur.
 */
function streamOlustur(ytUrl) {
  const binary = getYtdlpYolu();

  const child = spawn(binary, [
    '-f', 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    '--buffer-size', '16K',
    '-o', '-',
    ytUrl,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg && !msg.includes('Broken pipe')) {
      console.warn('[YT-DLP]', msg);
    }
  });

  child.on('error', (err) => {
    console.error('[YT-DLP Child Hata]:', err.message);
  });

  const kaynak = createAudioResource(child.stdout, {
    inputType: StreamType.Arbitrary,
    inlineVolume: true,
  });

  return { kaynak, child };
}

module.exports = {
  getYtdlpYolu,
  execYtdlp,
  videoBilgiGetir,
  streamOlustur,
  spotifyMetaGetir,
};
