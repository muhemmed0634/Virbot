// ==========================================
//  VirBot v2 — Merkezi Veri Yöneticisi
//  MongoDB (kalıcı) + In-Memory (hızlı) cache
// ==========================================
'use strict';

const Guild   = require('../../database/models/Guild');
const User    = require('../../database/models/User');
const Backup  = require('../../database/models/Backup');
const Ticket  = require('../../database/models/Ticket');
const Giveaway = require('../../database/models/Giveaway');

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
  let g = await Guild.findOne({ guildId });
  if (!g) g = await Guild.create({ guildId });
  return g;
}

async function guildGuncelle(guildId, guncelleme) {
  const g = await Guild.findOneAndUpdate(
    { guildId },
    { $set: guncelleme },
    { upsert: true, new: true }
  );
  // Cache'i güncelle
  if (ayarCache.has(guildId)) {
    ayarCache.set(guildId, { ...ayarCache.get(guildId), ...guncelleme });
  }
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
  let u = await User.findOne({ userId, guildId });
  if (!u) u = await User.create({ userId, guildId });
  return u;
}

async function kullaniciGuncelle(userId, guildId, guncelleme) {
  return User.findOneAndUpdate(
    { userId, guildId },
    { $set: guncelleme },
    { upsert: true, new: true }
  );
}

async function liderTabelaGetir(guildId, limit = 10) {
  return User.find({ guildId }).sort({ xp: -1 }).limit(limit).lean();
}

// ──────────────────────────────────────────────────────────
// TICKET (In-Memory)
// ──────────────────────────────────────────────────────────
function ticketKaydet(kanalId, veri) { ticketCache.set(kanalId, veri); }
function ticketGetir(kanalId)        { return ticketCache.get(kanalId) || null; }
function ticketSil(kanalId)          { ticketCache.delete(kanalId); }

// ──────────────────────────────────────────────────────────
// ÇEKİLİŞ (MongoDB + In-Memory)
// ──────────────────────────────────────────────────────────
function cekilisKaydet(mesajId, veri) {
  cekilisCache.set(mesajId, veri);
  Giveaway.findOneAndUpdate({ mesajId }, { $set: veri }, { upsert: true }).catch(() => {});
}
function cekilisGetir(mesajId) {
  return cekilisCache.get(mesajId) || null;
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

// ──────────────────────────────────────────────────────────
// KELİME OYUNU (In-Memory)
// ──────────────────────────────────────────────────────────
function kelimeOyunuGetir(guildId)         { return kelimeCache.get(guildId) || null; }
function kelimeOyunuKaydet(guildId, veri)  { kelimeCache.set(guildId, veri); }
function kelimeOyunuSil(guildId)           { kelimeCache.delete(guildId); }

// ──────────────────────────────────────────────────────────
// GEÇİCİ SES KANALLARI (In-Memory)
// ──────────────────────────────────────────────────────────
function tempVoiceKaydet(kanalId, sahipId) { tempVoiceCache.set(kanalId, sahipId); }
function tempVoiceGetir(kanalId)           { return tempVoiceCache.get(kanalId) || null; }
function tempVoiceSil(kanalId)             { tempVoiceCache.delete(kanalId); }
function tempVoiceHepsi()                  { return tempVoiceCache; }

// ──────────────────────────────────────────────────────────
// BACKUP (MongoDB)
// ──────────────────────────────────────────────────────────
async function backupKaydet(guildId, veri) {
  return Backup.findOneAndUpdate(
    { guildId },
    { $set: { guildId, veri, tarih: new Date() } },
    { upsert: true, new: true }
  );
}

async function backupGetir(guildId) {
  return Backup.findOne({ guildId });
}

module.exports = {
  // Guild
  guildGetir, guildGuncelle, ayarlariYukle, ayarGetir,
  // User
  kullaniciGetir, kullaniciGuncelle, liderTabelaGetir,
  // Ticket
  ticketKaydet, ticketGetir, ticketSil,
  // Çekiliş
  cekilisKaydet, cekilisGetir, cekilisSil, cekilisler, cekilisleriYukle,
  // Spam
  spamKayit, spamTemizle,
  // XP
  xpCooldownKontrol,
  // Kelime Oyunu
  kelimeOyunuGetir, kelimeOyunuKaydet, kelimeOyunuSil,
  // Geçici Ses
  tempVoiceKaydet, tempVoiceGetir, tempVoiceSil, tempVoiceHepsi,
  // Backup
  backupKaydet, backupGetir,
};
