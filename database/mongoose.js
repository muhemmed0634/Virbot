// ==========================================
//  VirBot v2 — MongoDB Bağlantısı
// ==========================================
'use strict';

const mongoose = require('mongoose');

let baglanti = null;

async function mongoBaslat() {
  if (baglanti) return baglanti;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[MONGO] ❌ MONGO_URI .env dosyasında tanımlı değil!');
    process.exit(1);
  }

  try {
    baglanti = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[MONGO] ✅ MongoDB bağlantısı başarılı.');
    return baglanti;
  } catch (hata) {
    console.error('[MONGO] ❌ Bağlantı hatası:', hata.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MONGO] ⚠️ Bağlantı kesildi, yeniden bağlanılıyor...');
});

module.exports = { mongoBaslat };
