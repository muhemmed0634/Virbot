// ==========================================
//  VirBot v2 — Merkezi Yapılandırma
// ==========================================
'use strict';

module.exports = {
  // ─── Bot ───────────────────────────────────────────────────
  PREFIX: process.env.PREFIX || 'v!',
  BOT_ADI: 'VirBot',

  // ─── Yetkili Roller ────────────────────────────────────────
  YETKILI_ROLLER: ['Admin', 'Kurucu'],

  // ─── Embed Renkleri ────────────────────────────────────────
  RENKLER: {
    BIRINCIL:  0x5865F2,
    BASARI:    0x57F287,
    HATA:      0xED4245,
    UYARI:     0xFEE75C,
    BILGI:     0x00B0F4,
    CEKİLİŞ:  0xF47FFF,
    TICKET:    0x00B0F4,
    HABER:     0xFF8C00,
    RPG:       0xFFAA00,
    GUVENLIK:  0xFF0040,
    LEVEL:     0x00FFD4,
    AI:        0xA259FF,
  },

  // ─── Canvas ────────────────────────────────────────────────
  CANVAS: {
    GENISLIK: 800,
    YUKSEKLIK: 300,
    AVATAR_BOYUTU: 130,
    AVATAR_X: 80,
    AVATAR_Y: 85,
    CERCEVE_RENGI_1: '#FF6B00',
    CERCEVE_RENGI_2: '#00FF88',
  },

  // ─── Level Sistemi ─────────────────────────────────────────
  LEVEL: {
    MIN_XP: 15,
    MAX_XP: 25,
    COOLDOWN_MS: 60 * 1000, // 60 saniye
    XP_CARPAN: (level) => Math.floor(100 * Math.pow(1.5, level)),
  },

  // ─── Anti-Alt ─────────────────────────────────────────────
  ANTI_ALT: {
    MIN_GUN: 14,
    KARANTINA_ROL: 'Karantina',
  },

  // ─── Spam Koruması ─────────────────────────────────────────
  SPAM: {
    MESAJ_SINIRI: 5,
    ARALIK_MS: 5000,
    CAPS_YUZDE: 70,
  },

  // ─── RPG ───────────────────────────────────────────────────
  RPG: {
    DAILY_COIN: 250,
    DAILY_COOLDOWN: 24 * 60 * 60 * 1000,
    HAYVANLAR: {
      COMMON:    ['🐀 Fare', '🐇 Tavşan', '🦔 Kirpi', '🐸 Kurbağa', '🐢 Kaplumbağa'],
      UNCOMMON:  ['🦊 Tilki', '🦝 Rakun', '🦦 Su Samuru', '🦡 Porsuk'],
      RARE:      ['🐺 Kurt', '🦌 Geyik', '🦈 Köpekbalığı', '🦅 Kartal'],
      EPIC:      ['🐉 Ejderha', '🦁 Aslan', '🐯 Kaplan', '🦊 Ateş Tilkisi'],
      LEGENDARY: ['🔱 Mitolojik Ejder', '⚡ Gök Boğası', '🌑 Karanlık Kaplan'],
    },
    HAYVAN_SANSLARI: { COMMON: 55, UNCOMMON: 25, RARE: 13, EPIC: 5, LEGENDARY: 2 },
    HAYVAN_BONUS: { COMMON: 1, UNCOMMON: 3, RARE: 8, EPIC: 20, LEGENDARY: 50 },
  },

  // ─── RSS ───────────────────────────────────────────────────
  VARSAYILAN_RSS: 'https://www.donanimhaber.com/rss/tum/',
  RSS_ARALIK: 10 * 60 * 1000,

  // ─── Collector Zaman Aşımı ─────────────────────────────────
  COLLECTOR_ZAMAN: 2 * 60 * 1000,

  // ─── Ticket ────────────────────────────────────────────────
  TICKET_KANAL_ADI: (ad) => `ticket-${ad.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`,
};
