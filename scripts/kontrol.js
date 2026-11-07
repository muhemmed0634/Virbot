// ==========================================
//  VirBot — Statik Kontrol (npm test)
//  Discord / MongoDB bağlantısı OLMADAN çalışır:
//   1. Tüm .js dosyalarının sözdizimini kontrol eder
//   2. Tüm komut ve olay dosyalarını yükler
//   3. Slash komut tanımlarını doğrular, isim çakışmalarını yakalar
// ==========================================
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const KOK = path.join(__dirname, '..');
let hataSayisi = 0;
const hata = (mesaj) => { hataSayisi++; console.error(`❌ ${mesaj}`); };

// 1. Sözdizimi
function jsDosyalari(klasor) {
  const sonuc = [];
  for (const ad of fs.readdirSync(klasor)) {
    if (ad === 'node_modules' || ad.startsWith('.')) continue;
    const yol = path.join(klasor, ad);
    if (fs.statSync(yol).isDirectory()) sonuc.push(...jsDosyalari(yol));
    else if (ad.endsWith('.js')) sonuc.push(yol);
  }
  return sonuc;
}

const dosyalar = jsDosyalari(KOK);
for (const dosya of dosyalar) {
  try {
    execFileSync(process.execPath, ['--check', dosya], { stdio: 'pipe' });
  } catch (err) {
    hata(`Sözdizimi hatası: ${path.relative(KOK, dosya)}\n${err.stderr?.toString()}`);
  }
}
console.log(`✅ ${dosyalar.length} dosyanın sözdizimi kontrol edildi.`);

// 2 & 3. Komutlar
const isimler = new Map();
const slashIsimleri = new Map();
const komutKlasoru = path.join(KOK, 'commands');
for (const kategori of fs.readdirSync(komutKlasoru)) {
  const kategoriYolu = path.join(komutKlasoru, kategori);
  if (!fs.statSync(kategoriYolu).isDirectory()) continue;
  for (const ad of fs.readdirSync(kategoriYolu).filter(f => f.endsWith('.js'))) {
    const goreli = `${kategori}/${ad}`;
    let komut;
    try {
      komut = require(path.join(kategoriYolu, ad));
    } catch (err) {
      hata(`${goreli} yüklenemedi: ${err.message}`);
      continue;
    }
    if (!komut.isim || typeof komut.calistir !== 'function') {
      hata(`${goreli}: 'isim' veya 'calistir' eksik`);
      continue;
    }
    for (const isim of [komut.isim, ...(komut.alternatifler || [])]) {
      if (isimler.has(isim)) hata(`Komut adı çakışması: "${isim}" → ${isimler.get(isim)} ve ${goreli}`);
      isimler.set(isim, goreli);
    }
    if (komut.slashData) {
      try {
        const json = komut.slashData.toJSON ? komut.slashData.toJSON() : komut.slashData;
        if (slashIsimleri.has(json.name)) hata(`Slash adı çakışması: /${json.name}`);
        slashIsimleri.set(json.name, goreli);
        if (typeof komut.slashCalistir !== 'function') hata(`${goreli}: slashData var ama slashCalistir yok`);
      } catch (err) {
        hata(`${goreli}: geçersiz slash tanımı — ${err.message}`);
      }
    }
  }
}
console.log(`✅ ${isimler.size} komut adı, ${slashIsimleri.size} slash komutu doğrulandı.`);

// Olaylar
const olayKlasoru = path.join(KOK, 'events');
for (const ad of fs.readdirSync(olayKlasoru).filter(f => f.endsWith('.js'))) {
  try {
    const olay = require(path.join(olayKlasoru, ad));
    if (!olay.isim || typeof olay.calistir !== 'function') hata(`events/${ad}: 'isim' veya 'calistir' eksik`);
  } catch (err) {
    hata(`events/${ad} yüklenemedi: ${err.message}`);
  }
}

if (hataSayisi > 0) {
  console.error(`\n${hataSayisi} hata bulundu.`);
  process.exit(1);
}
console.log('\n🎉 Tüm kontroller başarılı.');
process.exit(0);
