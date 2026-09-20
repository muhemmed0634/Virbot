// ==========================================
//  VirBot v2 — Anti-Spam / Caps / Karaliste
// ==========================================
'use strict';

const fs   = require('fs');
const path = require('path');
const { SPAM } = require('../../config/config');
const { spamKayit } = require('../data/dataManager');

// ─── Karaliste Yükle ───────────────────────────────────────
let karaliste = [];
try {
  const dosya = fs.readFileSync(path.join(__dirname, '..', '..', 'karaliste.txt'), 'utf8');
  karaliste = dosya.split('\n').map(k => k.trim().toLowerCase()).filter(Boolean);
  console.log(`[KARALİSTE] ${karaliste.length} kelime yüklendi.`);
} catch (_) {
  console.warn('[KARALİSTE] karaliste.txt okunamadı.');
}

// ─── Reklam Regex ─────────────────────────────────────────
const reklamRegex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+/i;

/**
 * Mesajı spam/caps/karaliste/reklam açısından kontrol eder.
 * @returns {null | 'spam' | 'caps' | 'karaliste' | 'reklam'}
 */
function mesajKontrol(mesaj) {
  const icerik = mesaj.content;

  // ── Karaliste ────────────────────────────────────────────
  const kucuk = icerik.toLowerCase();
  for (const kelime of karaliste) {
    if (kucuk.includes(kelime)) return 'karaliste';
  }

  // ── Reklam Linki ─────────────────────────────────────────
  if (reklamRegex.test(icerik)) return 'reklam';

  // ── Caps Lock (%70+) ─────────────────────────────────────
  const harfler = icerik.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '');
  if (harfler.length >= 8) {
    const buyukHarfler = harfler.replace(/[^A-ZĞÜŞİÖÇ]/g, '');
    const oran = buyukHarfler.length / harfler.length;
    if (oran >= SPAM.CAPS_YUZDE / 100) return 'caps';
  }

  // ── Spam / Flood ─────────────────────────────────────────
  const veri = spamKayit(mesaj.author.id);
  if (veri.mesajlar.length >= SPAM.MESAJ_SINIRI) return 'spam';

  return null;
}

/**
 * İhlal türüne göre Türkçe uyarı metni döner.
 */
function ihlalMetni(tur) {
  const metinler = {
    spam     : '🚫 **Spam/Flood tespit edildi!** Lütfen mesajlarınızı yavaşlatın.',
    caps     : '🔤 **Aşırı büyük harf kullanımı!** Lütfen normal yazın.',
    karaliste: '🤬 **Yasaklı kelime kullandınız!** Bu mesaj kaldırıldı.',
    reklam   : '📢 **Reklam bağlantısı tespit edildi!** Sunucu davet linkleri yasaktır.',
  };
  return metinler[tur] || '⚠️ Mesajınız kaldırıldı.';
}

module.exports = { mesajKontrol, ihlalMetni, karaliste };
