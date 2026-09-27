'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

async function installYtdlp() {
  // 1. Sistemde yt-dlp zaten mevcut mu kontrol et
  try {
    const which = execSync('which yt-dlp 2>/dev/null').toString().trim();
    if (which && fs.existsSync(which)) {
      console.log(`[yt-dlp] Sistemde mevcut binary bulundu: ${which}`);
      return;
    }
  } catch (_) {}

  const binDir = path.join(__dirname, '..', 'bin');
  const target = path.join(binDir, 'yt-dlp');

  if (fs.existsSync(target)) {
    try {
      fs.chmodSync(target, 0o755);
      console.log(`[yt-dlp] Mevcut bin/yt-dlp doğrulandı: ${target}`);
      return;
    } catch (_) {}
  }

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log('[yt-dlp] Render / Sunucu için bağımsız yt-dlp binary indiriliyor...');

  const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`İndirme başarısız (HTTP ${res.statusCode})`));
        }
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              fs.chmodSync(dest, 0o755);
            } catch (_) {}
            resolve();
          });
        });
        fileStream.on('error', (err) => {
          try { fs.unlinkSync(dest); } catch (_) {}
          reject(err);
        });
      }).on('error', reject);
    });
  };

  try {
    await downloadFile('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', target);
    console.log(`[yt-dlp] ✅ yt-dlp başarıyla indirildi ve yetkilendirildi: ${target}`);
  } catch (err) {
    console.warn(`[yt-dlp] Doğrudan indirme uyarısı (${err.message}). pip ile deneniyor...`);
    try {
      execSync('python3 -m pip install -U yt-dlp --break-system-packages || pip install -U yt-dlp || true', { stdio: 'inherit' });
      console.log('[yt-dlp] ✅ pip ile yt-dlp kuruldu.');
    } catch (pipErr) {
      console.warn('[yt-dlp] pip uyarısı:', pipErr.message);
    }
  }
}

installYtdlp().catch(err => {
  console.error('[yt-dlp] Kurulum script hatası:', err.message);
});
