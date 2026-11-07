// ==========================================
//  VirBot v2 — Merkezi Veri Yöneticisi
//  MongoDB (kalıcı) + In-Memory (hızlı) cache
// ==========================================
'use strict';

const Guild   = require('../../database/models/Guild');
const User    = require('../../database/models/User');
const Ticket  = require('../../database/models/Ticket');
const Giveaway = require('../../database/models/Giveaway');
const TempVoice = require('../../database/models/TempVoice');

// ─── In-Memory Cache'ler ───────────────────────────────────
const ticketCache    = new Map(); // kanalId → veri
const cekilisCache   = new Map(); // mesajId → veri
const ayarCache      = new Map(); // guildId → ayarlar
const spamCache      = new Map(); // userId → { mesajlar: [], mute: bool }
const xpCooldownMap  = new Map(); // `${userId}-${guildId}` → timestamp
const kelimeCache    = new Map(); // guildId → { kanalId, sonKelime, sonOyuncu }
const tempVoiceCache = new Map(); // kanalId → sahipId

// ──────────────────────────────────────────────────────────
// GUILD (MongoDB)
// ──────────────────────────────────────────────────────────
async function guildGetir(guildId) {
  const mevcut = await Guild.findOne({ guildId });
  if (mevcut) return mevcut;
  // Atomik upsert: eşzamanlı çağrılarda duplicate key (E11000) hatası oluşmaz
  return Guild.findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId } },
    { upsert: true, new: true }
  );
}

async function guildGuncelle(guildId, guncelleme) {
  const g = await Guild.findOneAndUpdate(
    { guildId },
    { $set: guncelleme },
    { upsert: true, new: true }
  );
  // Cache'i her zaman güncel belge ile yenile (yeni eklenen sunucular dahil)
  if (g) ayarCache.set(guildId, g.toObject());
  return g;
}

async function ayarlariYukle(guildId) {
  const g = await guildGetir(guildId);
  ayarCache.set(guildId, g.toObject());
  return g;
}

function ayarGetir(guildId) {
  return ayarCache.get(guildId) || null;
}

// ──────────────────────────────────────────────────────────
// USER (MongoDB)
// ──────────────────────────────────────────────────────────
async function kullaniciGetir(userId, guildId) {
  const mevcut = await User.findOne({ userId, guildId });
  if (mevcut) return mevcut;
  // Atomik upsert: aynı anda gelen iki mesajda duplicate key hatası oluşmaz
  return User.findOneAndUpdate(
    { userId, guildId },
    { $setOnInsert: { userId, guildId } },
    { upsert: true, new: true }
  );
}

/**
 * Coin bakiyesini atomik olarak değiştirir ($inc).
 * Negatif miktarda bakiye yetersizse hiçbir şey yapmaz ve null döner.
 * @param {string} userId
 * @param {string} guildId
 * @param {number} miktar - Eklenecek (+) veya düşülecek (-) coin
 * @param {Object} [ekstraSet] - Aynı işlemde $set edilecek alanlar
 * @param {Object} [ekstraFiltre] - Ek koşullar (örn. cooldown)
 * @returns {Promise<Document|null>} Güncel kullanıcı veya null
 */
async function coinDegistir(userId, guildId, miktar, ekstraSet = null, ekstraFiltre = null) {
  if (!Number.isFinite(miktar)) return null;
  await kullaniciGetir(userId, guildId); // Belge yoksa oluştur
  const filtre = { userId, guildId, ...(ekstraFiltre || {}) };
  if (miktar < 0) filtre.coins = { $gte: -miktar };
  const guncelleme = { $inc: { coins: miktar } };
  if (ekstraSet && Object.keys(ekstraSet).length > 0) guncelleme.$set = ekstraSet;
  return User.findOneAndUpdate(filtre, guncelleme, { new: true });
}

async function kullaniciGuncelle(userId, guildId, guncelleme) {
  return User.findOneAndUpdate(
    { userId, guildId },
    { $set: guncelleme },
    { upsert: true, new: true }
  );
}

/** Kullanıcının sunucudaki XP sırası (1'den başlar). */
async function siraGetir(guildId, xp) {
  return (await User.countDocuments({ guildId, xp: { $gt: xp || 0 } })) + 1;
}

/** Coin sıralaması. */
async function zenginlerGetir(guildId, limit = 10) {
  return User.find({ guildId, coins: { $gt: 0 } }).sort({ coins: -1 }).limit(limit).lean();
}

async function liderTabelaGetir(guildId, limit = 10) {
  return User.find({ guildId }).sort({ xp: -1 }).limit(limit).lean();
}

// ──────────────────────────────────────────────────────────
// TICKET (MongoDB + In-Memory) — bot yeniden başlasa da kapatılabilir
// ──────────────────────────────────────────────────────────
function ticketKaydet(kanalId, veri) {
  ticketCache.set(kanalId, veri);
  Ticket.findOneAndUpdate(
    { kanalId },
    { $set: {
      kanalId,
      guildId: veri.guildId,
      sahipId: veri.sahipId,
      sahipTag: veri.sahipTag,
      acik: true,
    } },
    { upsert: true }
  ).catch(err => console.error('[DATA] Ticket kaydetme hatası:', err.message));
}
async function ticketGetir(kanalId) {
  if (ticketCache.has(kanalId)) return ticketCache.get(kanalId);
  try {
    const kayit = await Ticket.findOne({ kanalId, acik: true }).lean();
    if (!kayit) return null;
    const veri = { ...kayit, acilisTarihi: kayit.createdAt ? new Date(kayit.createdAt).getTime() : Date.now() };
    ticketCache.set(kanalId, veri);
    return veri;
  } catch (_) {
    return null;
  }
}
function ticketSil(kanalId) {
  ticketCache.delete(kanalId);
  Ticket.deleteOne({ kanalId }).catch(() => {});
}

// ──────────────────────────────────────────────────────────
// ÇEKİLİŞ (MongoDB + In-Memory)
// ──────────────────────────────────────────────────────────
function cekilisKaydet(mesajId, veri) {
  cekilisCache.set(mesajId, veri);
  // Değiştirilemez / otomatik alanları $set'ten çıkar (aksi halde güncelleme sessizce başarısız olur)
  const { _id, __v, createdAt, updatedAt, ...temizVeri } = veri; // eslint-disable-line no-unused-vars
  Giveaway.findOneAndUpdate({ mesajId }, { $set: temizVeri }, { upsert: true })
    .catch(err => console.error('[DATA] Çekiliş kaydetme hatası:', err.message));
}
function cekilisGetir(mesajId) {
  return cekilisCache.get(mesajId) || null;
}
// Önbellekte yoksa (örn. bitmiş çekiliş + restart) veritabanından getirir
async function cekilisGetirDB(mesajId) {
  const onbellek = cekilisCache.get(mesajId);
  if (onbellek) return onbellek;
  try {
    const kayit = await Giveaway.findOne({ mesajId }).lean();
    if (kayit) cekilisCache.set(mesajId, kayit);
    return kayit || null;
  } catch (_) {
    return null;
  }
}
function cekilisSil(mesajId) {
  cekilisCache.delete(mesajId);
  Giveaway.deleteOne({ mesajId }).catch(() => {});
}
function cekilisler() {
  return Object.fromEntries(cekilisCache);
}
async function cekilisleriYukle() {
  try {
    const kayitlar = await Giveaway.find({ bitti: false }).lean();
    for (const k of kayitlar) {
      cekilisCache.set(k.mesajId, k);
    }
    return kayitlar;
  } catch (err) {
    console.error('[DATA] Çekilişler yüklenirken hata:', err.message);
    return [];
  }
}

// ──────────────────────────────────────────────────────────
// SPAM (In-Memory)
// ──────────────────────────────────────────────────────────
function spamKayit(userId) {
  const now = Date.now();
  if (!spamCache.has(userId)) spamCache.set(userId, { mesajlar: [], muted: false });
  const veri = spamCache.get(userId);
  veri.mesajlar = veri.mesajlar.filter(t => now - t < 5000);
  veri.mesajlar.push(now);
  return veri;
}

function spamTemizle(userId) { spamCache.delete(userId); }

// ──────────────────────────────────────────────────────────
// XP COOLDOWN (In-Memory)
// ──────────────────────────────────────────────────────────
function xpCooldownKontrol(userId, guildId, cooldownMs) {
  const anahtar = `${userId}-${guildId}`;
  const son = xpCooldownMap.get(anahtar) || 0;
  if (Date.now() - son < cooldownMs) return false;
  xpCooldownMap.set(anahtar, Date.now());
  return true;
}

// ── 512MB RAM Koruma: Periyodik Önbellek Temizliği ───────────
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of xpCooldownMap.entries()) {
    if (now - time > 120000) xpCooldownMap.delete(key);
  }
  for (const [userId, veri] of spamCache.entries()) {
    if (!veri.mesajlar || veri.mesajlar.length === 0 || now - Math.max(...veri.mesajlar, 0) > 15000) {
      spamCache.delete(userId);
    }
  }
}, 10 * 60 * 1000).unref();

// ──────────────────────────────────────────────────────────
// KELİME OYUNU (In-Memory)
// ──────────────────────────────────────────────────────────
function kelimeOyunuGetir(guildId)         { return kelimeCache.get(guildId) || null; }
function kelimeOyunuKaydet(guildId, veri)  {
  kelimeCache.set(guildId, veri);
  // Kalıcı kayıt (restart sonrası oyun kaldığı yerden devam eder)
  Guild.findOneAndUpdate(
    { guildId },
    { $set: { kelimeKanalId: veri.kanalId, kelimeSonKelime: veri.sonKelime } },
    { upsert: true }
  ).catch(() => {});
}
function kelimeOyunuSil(guildId)           { kelimeCache.delete(guildId); }
// Ayarlardan kelime oyununu RAM'e yükler
function kelimeOyunuYukle(guildId) {
  const ayar = ayarCache.get(guildId);
  if (ayar?.kelimeKanalId) {
    kelimeCache.set(guildId, {
      kanalId: ayar.kelimeKanalId,
      sonKelime: ayar.kelimeSonKelime || 'elma',
      sonOyuncu: null,
    });
  }
}

// ──────────────────────────────────────────────────────────
// GEÇİCİ SES KANALLARI (MongoDB + In-Memory)
// ──────────────────────────────────────────────────────────
function tempVoiceKaydet(kanalId, sahipId, guildId = null) {
  tempVoiceCache.set(kanalId, sahipId);
  TempVoice.findOneAndUpdate(
    { kanalId },
    { $set: { kanalId, sahipId, guildId } },
    { upsert: true }
  ).catch(() => {});
}

function tempVoiceGetir(kanalId) {
  return tempVoiceCache.get(kanalId) || null;
}

function tempVoiceSil(kanalId) {
  tempVoiceCache.delete(kanalId);
  TempVoice.deleteOne({ kanalId }).catch(() => {});
}

function tempVoiceHepsi() {
  return tempVoiceCache;
}

async function tempVoiceYukle() {
  try {
    const kayitlar = await TempVoice.find({}).lean();
    for (const k of kayitlar) {
      tempVoiceCache.set(k.kanalId, k.sahipId);
    }
    console.log(`[SES] ${kayitlar.length} geçici ses kanalı önbelleğe yüklendi.`);
  } catch (err) {
    console.error('[SES] Geçici kanal yükleme hatası:', err.message);
  }
}


// ──────────────────────────────────────────────────────────
// RSS (MongoDB + In-Memory)
// ──────────────────────────────────────────────────────────
const rssCache = new Map(); // guildId → [{ url, kanalId, gonderilen: [] }]

function rssGetir(guildId) {
  if (guildId) return rssCache.get(guildId) || [];
  return Object.fromEntries(rssCache);
}

async function rssEkleDB(guildId, url, kanalId) {
  if (!rssCache.has(guildId)) rssCache.set(guildId, []);
  const kaynaklar = rssCache.get(guildId);
  const mevcut = kaynaklar.some(k => k.url === url && k.kanalId === kanalId);
  if (mevcut) return false;

  const yeni = { url, kanalId, gonderilen: [] };
  kaynaklar.push(yeni);
  rssCache.set(guildId, kaynaklar);

  await Guild.findOneAndUpdate(
    { guildId },
    { $push: { rssKaynaklar: yeni } },
    { upsert: true }
  ).catch(err => console.error('[DATA] RSS ekleme DB hatası:', err.message));

  return true;
}

async function rssKaydetDB(guildId, kaynaklar) {
  rssCache.set(guildId, kaynaklar);
  await Guild.findOneAndUpdate(
    { guildId },
    { $set: { rssKaynaklar: kaynaklar } },
    { upsert: true }
  ).catch(err => console.error('[DATA] RSS kaydet DB hatası:', err.message));
}

async function rssleriYukle() {
  try {
    const sunucular = await Guild.find({ 'rssKaynaklar.0': { $exists: true } }).lean();
    for (const g of sunucular) {
      if (g.rssKaynaklar && g.rssKaynaklar.length > 0) {
        rssCache.set(g.guildId, g.rssKaynaklar);
      }
    }
    console.log(`[RSS] ${rssCache.size} sunucunun RSS kaynakları yüklendi.`);
  } catch (err) {
    console.error('[RSS] Yükleme hatası:', err.message);
  }
}

// ──────────────────────────────────────────────────────────
// KANAL ID TAŞIMA (nuke vb. kanal yeniden oluşturulduğunda)
// ──────────────────────────────────────────────────────────
const KANAL_ALANLARI = [
  'logKanalId', 'girisKanalId', 'cikisKanalId', 'girisCikisKanalId', 'karsilamaKanalId',
  'vedasKanalId', 'ticketKanalId', 'verifyKanalId', 'kelimeKanalId', 'honeypotKanalId',
  'aiKanalId', 'xpKanalId', 'sayacKanalId',
];

/**
 * Sunucu ayarlarında eski kanal ID'sini yenisiyle değiştirir.
 * (Eskiden log kanalı "nuke" edilince tüm loglar sessizce kayboluyordu.)
 * @returns {Promise<string[]>} Güncellenen ayar alanları
 */
async function kanalIdTasi(guildId, eskiId, yeniId) {
  const ayar = ayarGetir(guildId) || (await guildGetir(guildId))?.toObject?.();
  if (!ayar) return [];

  const guncelleme = {};
  for (const alan of KANAL_ALANLARI) {
    if (ayar[alan] === eskiId) guncelleme[alan] = yeniId;
  }
  if (guncelleme.kelimeKanalId) {
    const k = kelimeCache.get(guildId);
    if (k) k.kanalId = yeniId;
  }
  if (Object.keys(guncelleme).length > 0) await guildGuncelle(guildId, guncelleme);

  // RSS kaynakları
  const kaynaklar = rssCache.get(guildId);
  if (kaynaklar?.some(k => k.kanalId === eskiId)) {
    for (const k of kaynaklar) if (k.kanalId === eskiId) k.kanalId = yeniId;
    await rssKaydetDB(guildId, kaynaklar);
    guncelleme.rssKaynaklar = yeniId;
  }

  return Object.keys(guncelleme);
}

module.exports = {
  // Guild
  guildGetir, guildGuncelle, ayarlariYukle, ayarGetir, kanalIdTasi,
  // User
  kullaniciGetir, kullaniciGuncelle, liderTabelaGetir, coinDegistir, siraGetir, zenginlerGetir,
  // Ticket
  ticketKaydet, ticketGetir, ticketSil,
  // Çekiliş
  cekilisKaydet, cekilisGetir, cekilisGetirDB, cekilisSil, cekilisler, cekilisleriYukle,
  // Spam
  spamKayit, spamTemizle,
  // XP
  xpCooldownKontrol,
  // Kelime Oyunu
  kelimeOyunuGetir, kelimeOyunuKaydet, kelimeOyunuSil, kelimeOyunuYukle,
  // Geçici Ses
  tempVoiceKaydet, tempVoiceGetir, tempVoiceSil, tempVoiceHepsi, tempVoiceYukle,
  // RSS
  rssGetir, rssEkleDB, rssKaydetDB, rssleriYukle,
};
